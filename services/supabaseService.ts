
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, DriveSubmission, SubmissionStatus, VerificationResult, UserRole } from '../types';

const getEnv = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key] as string;
    if ((window as any).process?.env?.[key]) return (window as any).process.env[key];
    if ((import.meta as any).env?.[key]) return (import.meta as any).env[key];
  } catch (e) {}
  return "";
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://bfefblahvrgppmqfbuqb.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZWZibGFodnJncHBtcWZidXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTk3MTQsImV4cCI6MjA4MTU3NTcxNH0._8kBN-PtdIsYQGUV30QQ9KCbZjRWomIdvTYmKpZoF8c';

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));
export const supabase: SupabaseClient | null = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const SupabaseService = {
  signUp: async (email: string, password: string, fullName: string, phone: string, state: string, bankDetails: any, role: UserRole) => {
    if (!supabase) throw new Error("Database not connected");
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: fullName,
          phone: phone,
          state: state,
          role: role 
        } 
      }
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("already registered") || authError.status === 400) {
        throw new Error("EXISTS_IN_AUTH");
      }
      throw authError;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: fullName,
        email: email,
        phone: phone,
        state: state,
        bank_details: bankDetails || null,
        role: role,
        agreement_signed: false
      });
      if (profileError) console.warn("Deferred profile creation triggered.");
    }
    return authData.user;
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error("Database not connected");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  resetPassword: async (email: string) => {
    if (!supabase) throw new Error("Database not connected");
    // Ensure the redirect points back to the current application origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
    return true;
  },

  updateUserPassword: async (password: string) => {
    if (!supabase) throw new Error("Database not connected");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return true;
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    if (!supabase) throw new Error("Database not connected");
    
    const dbUpdates: any = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.bankDetails !== undefined) dbUpdates.bank_details = updates.bankDetails;

    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    if (error) throw error;

    await supabase.auth.updateUser({
      data: {
        full_name: updates.fullName,
        phone: updates.phone,
        state: updates.state
      }
    });
  },

  getProfile: async (userId: string): Promise<User> => {
    if (!supabase) throw new Error("Database not connected");
    
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;

    if (!data) {
      const { data: authResponse } = await supabase.auth.getUser();
      const user = authResponse?.user;
      if (user) {
        const fullName = user.user_metadata?.full_name || 'Agent Identity Pending';
        const role = user.user_metadata?.role || 'AGENT';
        
        const { data: repaired, error: repairErr } = await supabase.from('profiles').upsert({
          id: userId,
          full_name: fullName,
          email: user.email,
          phone: user.user_metadata?.phone || '',
          state: user.user_metadata?.state || 'N/A',
          role: role,
          agreement_signed: false
        }).select().single();

        if (!repairErr && repaired) {
          return {
            id: repaired.id,
            fullName: repaired.full_name,
            email: repaired.email,
            phone: repaired.phone,
            state: repaired.state || 'N/A',
            role: repaired.role,
            bankDetails: repaired.bank_details,
            agreementSigned: repaired.agreement_signed,
            agreementTimestamp: repaired.agreement_timestamp,
            agreementIp: repaired.agreement_ip,
            createdAt: repaired.created_at
          };
        }
      }
      throw new Error("PROFILE_MISSING");
    }

    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      state: data.state || 'N/A',
      role: data.role,
      bankDetails: data.bank_details,
      agreementSigned: data.agreement_signed,
      agreementTimestamp: data.agreement_timestamp,
      agreementIp: data.agreement_ip,
      createdAt: data.created_at
    };
  },

  getAllAgents: async (): Promise<User[]> => {
    if (!supabase) throw new Error("Database not connected");
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      fullName: d.full_name,
      email: d.email,
      phone: d.phone,
      state: d.state || 'N/A',
      role: d.role,
      bankDetails: d.bank_details,
      agreementSigned: d.agreement_signed,
      createdAt: d.created_at
    }));
  },

  signAgreement: async (userId: string, ip: string) => {
    if (!supabase) throw new Error("Database not connected");
    await supabase.from('profiles').update({ 
      agreement_signed: true, 
      agreement_timestamp: new Date().toISOString(), 
      agreement_ip: ip 
    }).eq('id', userId);
  },

  getSubmissions: async (role: string, userId: string): Promise<DriveSubmission[]> => {
    if (!supabase) throw new Error("Database not connected");
    let query = supabase.from('submissions').select('*').order('submission_date', { ascending: false });
    if (role === 'AGENT') query = query.eq('agent_id', userId);
    
    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(s => ({ 
      ...s, 
      agentId: s.agent_id, 
      agentName: s.agent_name, 
      propertyName: s.property_name, 
      propertyAddress: s.property_address, 
      stateLocation: s.state_location, 
      noOfUnits: s.no_of_units, 
      occupancyRate: s.occupancy_rate, 
      meteringType: s.metering_type, 
      landlordName: s.landlord_name, 
      managementType: s.management_type, 
      contactPhone: s.contact_phone, 
      interestLevel: s.interest_level, 
      featuresInterested: s.features_interested || [], 
      subscriptionType: s.subscription_type, 
      marketingChannels: s.marketing_channels || [], 
      estimatedCommission: s.estimated_commission, 
      submissionDate: s.submission_date 
    }));
  },

  createSubmission: async (submission: Partial<DriveSubmission>) => {
    if (!supabase) throw new Error("Database not connected");
    const { data, error } = await supabase.from('submissions').insert({
      agent_id: submission.agentId,
      agent_name: submission.agentName,
      property_name: submission.propertyName,
      property_address: submission.propertyAddress,
      state_location: submission.state_location,
      coordinates: submission.coordinates,
      property_photo: submission.propertyPhoto,
      property_category: submission.propertyCategory,
      property_type: submission.propertyType,
      no_of_units: submission.noOfUnits,
      occupancy_rate: submission.occupancyRate,
      metering_type: submission.meteringType,
      landlord_name: submission.landlordName,
      management_type: submission.managementType,
      contact_phone: submission.contactPhone,
      // Fix: Use correct property name interestLevel from DriveSubmission interface (fixes line 236 error)
      interest_level: submission.interestLevel,
      features_interested: submission.featuresInterested,
      subscription_type: submission.subscriptionType,
      marketing_channels: submission.marketingChannels,
      feedback: submission.feedback,
      estimated_commission: submission.estimatedCommission,
      status: 'PENDING'
    }).select().single();
    if (error) throw error;
    return data;
  },

  updateSubmission: async (id: string, status: SubmissionStatus, verification?: VerificationResult) => {
    if (!supabase) throw new Error("Database not connected");
    const updateData: any = { status };
    if (verification) updateData.verification = verification;
    const { error } = await supabase.from('submissions').update(updateData).eq('id', id);
    if (error) throw error;
  }
};
