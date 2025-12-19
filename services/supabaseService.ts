
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, DriveSubmission, SubmissionStatus, VerificationResult, UserRole } from '../types';

/**
 * CONFIGURATION: 
 * If your database is not connecting:
 * 1. Check if your project is "Paused" in Supabase dashboard.
 * 2. Ensure you have created 'profiles' and 'submissions' tables.
 * 3. Disable any AdBlockers that might block 'supabase.co' domains.
 */
const supabaseUrl = (process.env as any).SUPABASE_URL || 'https://bfefblahvrgppmqfbuqb.supabase.co';
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZWZibGFodnJncHBtcWZidXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTk3MTQsImV4cCI6MjA4MTU3NTcxNH0._8kBN-PtdIsYQGUV30QQ9KCbZjRWomIdvTYmKpZoF8c';

// The system-wide internal password for field agents
const INTERNAL_AUTH_PASSWORD = 'EstateGO_Temporary_Password_123!';

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('PASTE_YOUR_SUPABASE_URL')
);

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const logError = (context: string, error: any) => {
  let message = error?.message || error?.error_description || "Unknown Error";
  
  if (message === 'Failed to fetch' || (error instanceof TypeError && error.message.includes('fetch'))) {
    message = "Network Error: The app cannot reach your Supabase project. Check your internet, ensure the URL is correct, and disable AdBlockers.";
  }

  const details = typeof error === 'object' ? JSON.stringify(error, null, 2) : error;
  console.error(`--- ${context} ---\nMessage: ${message}\nDetails: ${details}`);
  return message;
};

export const SupabaseService = {
  isConfigured,

  signUp: async (email: string, fullName: string, phone: string, bankDetails: any, role: UserRole = 'AGENT') => {
    if (!supabase) throw new Error("Supabase is not configured.");
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: INTERNAL_AUTH_PASSWORD,
        options: { data: { fullName } }
      });

      if (authError) throw authError;

      if (authData.user) {
        let profileCreated = false;
        let attempts = 0;
        
        while (!profileCreated && attempts < 3) {
          attempts++;
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            full_name: fullName,
            email: email,
            phone: phone,
            bank_details: bankDetails,
            role: role,
            agreement_signed: false
          }, { onConflict: 'id' });

          if (!profileError) {
            profileCreated = true;
          } else {
            console.warn(`Profile attempt ${attempts} failed, retrying...`);
            await new Promise(r => setTimeout(r, 1000));
            if (attempts === 3) throw profileError;
          }
        }
      }
      return authData.user;
    } catch (err: any) {
      const msg = logError("Auth Sign-up Error", err);
      throw new Error(msg);
    }
  },

  signIn: async (email: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: INTERNAL_AUTH_PASSWORD
      });
      
      if (error) throw error;
      return data.user;
    } catch (err: any) {
      const msg = logError("Sign-in Error", err);
      throw new Error(msg);
    }
  },

  getProfile: async (userId: string, retries = 3): Promise<User> => {
    if (!supabase) throw new Error("Supabase is not configured.");
    
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) throw error;

        if (data) {
          return {
            id: data.id,
            fullName: data.full_name || 'Anonymous User',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || 'AGENT',
            bankDetails: data.bank_details,
            agreementSigned: data.agreement_signed || false,
            agreementTimestamp: data.agreement_timestamp,
            agreementIp: data.agreement_ip,
            createdAt: data.created_at
          };
        }

        if (!data) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser && authUser.id === userId) {
            const { error: insertError } = await supabase.from('profiles').insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.fullName || 'User',
              role: 'AGENT',
              agreement_signed: false
            });
            if (!insertError) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue; 
            }
          }
        }
      } catch (err: any) {
        if (i === retries - 1) {
          const msg = logError("Get Profile Error", err);
          throw new Error(msg);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error("Critical sync failure. Check network connectivity.");
  },

  signAgreement: async (userId: string, ip: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase
      .from('profiles')
      .update({
        agreement_signed: true,
        agreement_timestamp: new Date().toISOString(),
        agreement_ip: ip
      })
      .eq('id', userId);
    if (error) throw error;
  },

  getSubmissions: async (role: string, userId: string): Promise<DriveSubmission[]> => {
    if (!supabase) throw new Error("Supabase is not configured.");
    try {
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
    } catch (err: any) {
      const msg = logError("Get Submissions Error", err);
      throw new Error(msg);
    }
  },

  createSubmission: async (submission: Partial<DriveSubmission>) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.from('submissions').insert({
      agent_id: submission.agentId,
      agent_name: submission.agentName,
      property_name: submission.propertyName,
      property_address: submission.propertyAddress,
      state_location: submission.stateLocation,
      coordinates: submission.coordinates || null,
      property_photo: submission.propertyPhoto || null,
      property_category: submission.propertyCategory,
      property_type: submission.propertyType,
      no_of_units: submission.noOfUnits || 0,
      occupancy_rate: submission.occupancyRate || 0,
      metering_type: submission.meteringType,
      landlord_name: submission.landlordName,
      management_type: submission.managementType,
      contact_phone: submission.contactPhone,
      interest_level: submission.interestLevel,
      features_interested: submission.featuresInterested || [],
      subscription_type: submission.subscriptionType,
      marketing_channels: submission.marketingChannels || [],
      feedback: submission.feedback || '',
      estimated_commission: submission.estimatedCommission || 0,
      status: 'PENDING'
    }).select().single();
    if (error) throw error;
    return data;
  },

  updateSubmission: async (id: string, status: SubmissionStatus, verification?: VerificationResult) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const updateData: any = { status };
    if (verification) updateData.verification = verification;
    const { error } = await supabase.from('submissions').update(updateData).eq('id', id);
    if (error) throw error;
  }
};
