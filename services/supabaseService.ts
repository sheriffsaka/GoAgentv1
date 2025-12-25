
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

/**
 * Helper to map DB snake_case submission to camelCase
 * Includes fallback for state_location to prevent null crashes
 */
const mapSubmission = (s: any): DriveSubmission => ({
  id: s.id,
  agentId: s.agent_id,
  agentName: s.agent_name || 'Unknown Agent',
  submissionDate: s.submission_date || s.created_at,
  status: s.status,
  agentStatus: s.agent_status || 'Freelance',
  propertyName: s.property_name || 'Unnamed Property',
  propertyAddress: s.property_address || 'No Address',
  stateLocation: s.state_location || 'Lagos', // Default fallback
  coordinates: s.coordinates,
  propertyPhoto: s.property_photo,
  propertyCategory: s.property_category || 'Residential',
  propertyType: s.property_type || 'Other',
  noOfUnits: s.no_of_units || 0,
  occupancyRate: s.occupancy_rate || 0,
  meteringType: s.metering_type || 'Standard',
  landlordName: s.landlord_name || 'N/A',
  managementType: s.management_type || 'Individual',
  contactPhone: s.contact_phone || 'N/A',
  interestLevel: s.interest_level || 'Low',
  featuresInterested: s.features_interested || [],
  subscriptionType: s.subscription_type || 'Standard',
  marketingChannels: s.marketing_channels || [],
  feedback: s.feedback || '',
  estimatedCommission: s.estimated_commission || 0,
  verification: s.verification
});

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

    if (authData?.user && authData?.session) {
      try {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          state: state,
          bank_details: bankDetails || null,
          role: role,
          agreement_signed: false
        });
      } catch (e) {
        console.warn("Deferred profile creation - record will be repaired on sync.");
      }
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
    const redirectUrl = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
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
    if (updates.bankDetails !== undefined) dbUpdates.bank_details = updates.bankDetails;
    if (updates.state !== undefined) dbUpdates.state = updates.state;

    const { error: dbError } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    if (dbError) {
      // If error is specifically about missing column, throw a readable message
      if (dbError.message.includes("column \"state\" does not exist")) {
        throw new Error("The 'state' field is missing in your database. Please run the provided SQL script in the Supabase Editor.");
      }
      throw dbError;
    }

    try {
      await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          phone: updates.phone,
          state: updates.state
        }
      });
    } catch (authErr) {
      console.warn("Auth metadata sync failed:", authErr);
    }
  },

  getProfile: async (userId: string): Promise<User> => {
    if (!supabase) throw new Error("Database not connected");
    
    // Explicitly select columns to check if they exist
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
    const user = authData?.user;

    // If profile record is missing from table, repair it
    if (!profile) {
      if (user) {
        const repairData = {
          id: userId,
          full_name: user.user_metadata?.full_name || 'Agent Identity Pending',
          email: user.email,
          phone: user.user_metadata?.phone || '',
          state: user.user_metadata?.state || 'Lagos',
          role: user.user_metadata?.role || 'AGENT',
          agreement_signed: false
        };

        const { data: repaired, error: repairErr } = await supabase.from('profiles').upsert(repairData).select().single();

        if (!repairErr && repaired) {
          return {
            id: repaired.id,
            fullName: String(repaired.full_name || ''),
            email: String(repaired.email || ''),
            phone: String(repaired.phone || ''),
            state: String(repaired.state || 'Lagos'),
            role: repaired.role,
            bankDetails: repaired.bank_details,
            agreementSigned: repaired.agreement_signed,
            agreementTimestamp: repaired.agreement_timestamp,
            agreementIp: repaired.agreement_ip,
            createdAt: repaired.created_at
          };
        } else {
          // Fallback to Auth metadata if table write fails (schema mismatch)
          return {
            id: userId,
            fullName: String(user.user_metadata?.full_name || 'Agent Identity Pending'),
            email: String(user.email || ''),
            phone: String(user.user_metadata?.phone || ''),
            state: String(user.user_metadata?.state || 'Lagos'),
            role: user.user_metadata?.role || 'AGENT',
            agreementSigned: false
          };
        }
      }
      throw new Error("PROFILE_UNRECOVERABLE");
    }

    return {
      id: profile.id,
      fullName: String(profile.full_name || ''),
      email: String(profile.email || ''),
      phone: String(profile.phone || ''),
      state: String(profile.state || 'Lagos'),
      role: profile.role,
      bankDetails: profile.bank_details,
      agreementSigned: profile.agreement_signed,
      agreementTimestamp: profile.agreement_timestamp,
      agreementIp: profile.agreement_ip,
      createdAt: profile.created_at
    };
  },

  getAllAgents: async (): Promise<User[]> => {
    if (!supabase) throw new Error("Database not connected");
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(d => ({
      id: d.id,
      fullName: String(d.full_name || ''),
      email: String(d.email || ''),
      phone: String(d.phone || ''),
      state: String(d.state || 'Lagos'), 
      role: d.role,
      bankDetails: d.bank_details,
      agreementSigned: d.agreement_signed,
      createdAt: d.created_at
    }));
  },

  signAgreement: async (userId: string, ip: string) => {
    if (!supabase) throw new Error("Database connection is missing.");
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(authError.message);
    
    const user = authData?.user;
    if (!user) throw new Error("Your authentication session has expired.");
    
    const profileUpsertData = { 
      id: userId,
      full_name: user?.user_metadata?.full_name || 'Agent',
      email: user?.email || '',
      phone: user?.user_metadata?.phone || '',
      state: user?.user_metadata?.state || 'Lagos',
      role: user?.user_metadata?.role || 'AGENT',
      agreement_signed: true, 
      agreement_timestamp: new Date().toISOString(), 
      agreement_ip: ip 
    };
    
    const { error: upsertError } = await supabase.from('profiles').upsert(profileUpsertData);
    
    if (upsertError) {
      if (upsertError.message.includes("column \"state\" does not exist")) {
        throw new Error("The 'state' field is missing in your database. Use the SQL Editor to add it.");
      }
      throw new Error(upsertError.message || "Database signature commit failed.");
    }
  },

  getSubmissions: async (role: string, userId: string): Promise<DriveSubmission[]> => {
    if (!supabase) throw new Error("Database not connected");
    let query = supabase.from('submissions').select('*').order('submission_date', { ascending: false });
    if (role === 'AGENT') query = query.eq('agent_id', userId);
    
    const { data: results, error: queryError } = await query;
    if (queryError) throw queryError;

    return (results || []).map(mapSubmission);
  },

  createSubmission: async (submission: Partial<DriveSubmission>) => {
    if (!supabase) throw new Error("Database not connected");
    const { data, error } = await supabase.from('submissions').insert({
      agent_id: submission.agentId,
      agent_name: submission.agentName,
      property_name: submission.propertyName,
      property_address: submission.propertyAddress,
      state_location: submission.stateLocation,
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
      interest_level: submission.interestLevel,
      features_interested: submission.featuresInterested,
      subscription_type: submission.subscriptionType,
      marketing_channels: submission.marketingChannels,
      feedback: submission.feedback,
      estimated_commission: submission.estimatedCommission,
      status: 'PENDING'
    }).select().single();

    if (error) {
       if (error.message.includes("column \"state_location\" does not exist")) {
         throw new Error("The 'state_location' field is missing in your 'submissions' table.");
       }
       throw error;
    }
    return mapSubmission(data);
  },

  updateSubmission: async (id: string, status: SubmissionStatus, verification?: VerificationResult) => {
    if (!supabase) throw new Error("Database not connected");
    const updateData: any = { status };
    if (verification) updateData.verification = verification;
    const { error } = await supabase.from('submissions').update(updateData).eq('id', id);
    if (error) throw error;
  }
};
