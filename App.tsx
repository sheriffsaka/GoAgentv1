
import React, { useState, useEffect } from 'react';
import { User, DriveSubmission, SubmissionStatus, VerificationResult } from './types';
import { SupabaseService, supabase, isConfigured } from './services/supabaseService';
import { Auth, AgreementWall, parseErrorMessage } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DriveForm } from './components/DriveForm';
import { AdminPortal } from './components/AdminPortal';
import { ProfileView } from './components/ProfileView';
import { Loader2, Database, AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'admin' | 'profile'>('dashboard');
  const [submissions, setSubmissions] = useState<DriveSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [recoveryFlow, setRecoveryFlow] = useState(false);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    
    const hash = window.location.hash;
    const search = window.location.search;
    const isRecovery = hash.includes('type=recovery') || 
                       hash.includes('access_token=') || 
                       search.includes('type=recovery');

    if (isRecovery) {
      console.log("Terminal recovery detected in URL");
      setRecoveryFlow(true);
    }

    const initApp = async () => {
      try {
        const { data: { session: currentSession } } = await supabase!.auth.getSession();
        setSession(currentSession);
        
        if (currentSession && !isRecovery) {
          await fetchUserData(currentSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) { setLoading(false); }
    };

    initApp();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryFlow(true);
      }

      if (session) {
        if (event !== 'PASSWORD_RECOVERY' && !window.location.hash.includes('access_token')) {
           fetchUserData(session.user.id);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    setProfileError(null);
    try {
      const profile = await SupabaseService.getProfile(userId);
      setUser(profile);
      const subs = await SupabaseService.getSubmissions(profile.role, userId);
      setSubmissions(subs);
    } catch (err: any) { 
      const msg = parseErrorMessage(err);
      console.error("User Data Sync Error:", msg);
      setProfileError(msg);
    }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id: string, status: SubmissionStatus, verification?: VerificationResult) => {
    try {
      await SupabaseService.updateSubmission(id, status, verification);
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status, verification: verification || s.verification } : s));
    } catch (err: any) { 
      const msg = parseErrorMessage(err);
      alert(msg); 
    }
  };

  if (!isConfigured) return <div className="min-h-screen bg-navy-900 text-white flex items-center justify-center p-8 text-center"><Database size={48}/><h1 className="mt-4 font-black">Missing Credentials</h1></div>;
  
  if (loading) return <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-cyan-400" size={48} /><p className="text-white text-[10px] font-black uppercase mt-4">Syncing GoAgentHQ...</p></div>;

  if (recoveryFlow || !session || !user) {
    return (
      <Auth 
        initialView={recoveryFlow ? 'NEW_PASSWORD' : 'LOGIN'}
        onLogin={() => {
          setRecoveryFlow(false);
          if (session) fetchUserData(session.user.id);
        }} 
      />
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-navy-900 text-center">
          <AlertCircle size={48} className="mx-auto text-orange-500 mb-6" />
          <h2 className="text-2xl font-black text-navy-900 uppercase tracking-tight mb-4">Profile Synchronization Issue</h2>
          <div className="text-sm text-gray-500 mb-8 leading-relaxed">
            <p className="font-bold text-red-600 mb-2 uppercase text-[10px]">{profileError}</p>
            <p>We found your account, but your agent identity profile encountered a sync error. This can usually be fixed by retrying or re-logging.</p>
          </div>
          <div className="space-y-4">
             <button 
               onClick={() => supabase?.auth.signOut().then(() => setProfileError(null))}
               className="w-full py-4 bg-navy-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-navy-800"
             >
               Return to Login
             </button>
             <button 
               onClick={() => fetchUserData(session.user.id)}
               className="w-full py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 flex items-center justify-center gap-2"
             >
               <RefreshCw size={14} /> Retry Sync
             </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user.agreementSigned) return <AgreementWall onSign={() => SupabaseService.signAgreement(user.id, '127.0.0.1').then(() => fetchUserData(user.id))} />;

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => supabase?.auth.signOut()}>
      {activeTab === 'dashboard' && <Dashboard user={user} submissions={submissions} />}
      {activeTab === 'form' && <DriveForm user={user} onSubmit={data => SupabaseService.createSubmission({ ...data, agentId: user.id, agentName: user.fullName, estimatedCommission: data.noOfUnits * 450 }).then(n => setSubmissions(p => [n, ...p]))} />}
      {activeTab === 'admin' && user.role === 'ADMIN' && <AdminPortal submissions={submissions} onUpdateStatus={handleUpdateStatus} />}
      {activeTab === 'profile' && <ProfileView user={user} onUpdate={(updates) => SupabaseService.updateProfile(user.id, updates).then(() => fetchUserData(user.id))} />}
    </Layout>
  );
};

export default App;
