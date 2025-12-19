
import React, { useState, useEffect } from 'react';
import { User, DriveSubmission, SubmissionStatus, VerificationResult } from './types';
import { SupabaseService, supabase, isConfigured } from './services/supabaseService';
import { Auth, AgreementWall } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DriveForm } from './components/DriveForm';
import { AdminPortal } from './components/AdminPortal';
import { Loader2, Database, AlertCircle, RefreshCw, LogOut, WifiOff, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'admin'>('dashboard');
  const [submissions, setSubmissions] = useState<DriveSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    supabase!.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
      else setLoading(false);
    }).catch(err => {
      setAppError("Connection Error: " + (err.message || "Failed to reach database terminal."));
      setLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
        setAppError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    setAppError(null);
    try {
      const profile = await SupabaseService.getProfile(userId);
      setUser(profile);
      const subs = await SupabaseService.getSubmissions(profile.role, userId);
      setSubmissions(subs);
    } catch (err: any) {
      setAppError(err?.message || "Profile sync failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    try { await supabase.auth.signOut(); } catch (e) {}
    setUser(null);
    setSession(null);
    setAppError(null);
  };

  const handleReportDrive = async (data: any) => {
    if (!user) return;
    try {
      const newSub = await SupabaseService.createSubmission({ ...data, agentId: user.id, agentName: user.fullName, estimatedCommission: data.noOfUnits * 450 });
      setSubmissions(prev => [newSub, ...prev]);
    } catch (err: any) { throw err; }
  };

  const handleUpdateStatus = async (id: string, status: SubmissionStatus, verification?: VerificationResult) => {
    try {
      await SupabaseService.updateSubmission(id, status, verification);
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status, verification: verification || s.verification } : s));
    } catch (err: any) { alert(err.message); }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-2xl text-center">
          <Database size={48} className="mx-auto mb-4 text-cyan-400" />
          <h1 className="text-xl font-bold">Database Required</h1>
          <p className="text-gray-500 mt-2 text-sm">Please update your <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> in <code>services/supabaseService.ts</code>.</p>
          <button onClick={() => window.location.reload()} className="mt-6 w-full bg-navy-900 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest">Check Connection</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400 mb-4" size={48} />
        <p className="text-white text-xs font-bold uppercase tracking-widest">Connecting to GoAgent HQ...</p>
      </div>
    );
  }

  if (appError && !user) {
    const isNetworkError = appError.toLowerCase().includes('fetch') || appError.toLowerCase().includes('network');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white p-10 rounded-3xl shadow-xl border-t-8 border-red-500">
          <div className="flex items-center gap-4 text-red-600 mb-6">
            {isNetworkError ? <WifiOff size={40} /> : <AlertCircle size={40} />}
            <h2 className="text-2xl font-black">{isNetworkError ? "Connection Failed" : "Sync Failure"}</h2>
          </div>
          <p className="text-gray-600 mb-8 leading-relaxed font-medium">
            {appError}
          </p>
          
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 space-y-4 border border-gray-100">
            <h3 className="text-xs font-black text-navy-900 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" /> Troubleshooting Checklist
            </h3>
            <ul className="text-xs text-gray-500 space-y-3">
              <li className="flex gap-3">
                <span className="w-4 h-4 rounded-full bg-navy-900 text-white flex-shrink-0 flex items-center justify-center text-[10px]">1</span>
                <span><strong>Check Internet:</strong> Ensure you have a stable data connection.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-4 h-4 rounded-full bg-navy-900 text-white flex-shrink-0 flex items-center justify-center text-[10px]">2</span>
                <span><strong>Verify URL:</strong> Ensure your Supabase URL doesn't have extra slashes or typos.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-4 h-4 rounded-full bg-navy-900 text-white flex-shrink-0 flex items-center justify-center text-[10px]">3</span>
                <span><strong>Check Project Status:</strong> Log in to Supabase and ensure your project is <strong>Active</strong> (not Paused).</span>
              </li>
              <li className="flex gap-3">
                <span className="w-4 h-4 rounded-full bg-navy-900 text-white flex-shrink-0 flex items-center justify-center text-[10px]">4</span>
                <span><strong>Disable AdBlockers:</strong> Some extensions block 'supabase.co' requests.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="w-full bg-navy-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
              <RefreshCw size={18} /> Retry Full Boot
            </button>
            {session && (
              <button onClick={handleLogout} className="w-full bg-gray-100 text-gray-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                <LogOut size={18} /> Sign Out & Reset
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!session || !user) return <Auth onLogin={() => {}} />;
  if (!user.agreementSigned) return <AgreementWall onSign={() => SupabaseService.signAgreement(user.id, 'Logged').then(() => fetchUserData(user.id))} />;

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {activeTab === 'dashboard' && <Dashboard user={user} submissions={submissions} />}
      {activeTab === 'form' && <DriveForm user={user} onSubmit={handleReportDrive} />}
      {activeTab === 'admin' && user.role === 'ADMIN' && <AdminPortal submissions={submissions} onUpdateStatus={handleUpdateStatus} />}
    </Layout>
  );
};

export default App;
