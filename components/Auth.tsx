
import React, { useState, useEffect } from 'react';
import { SupabaseService, supabase } from '../services/supabaseService';
import { AlertCircle, RefreshCw, UserPlus, LogIn, Info, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

interface AuthProps {
  onLogin: () => void;
}

type AuthView = 'LOGIN' | 'REGISTER' | 'RESET' | 'NEW_PASSWORD';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [adminCode, setAdminCode] = useState('');

  // Automatically detect recovery links in URL
  useEffect(() => {
    const checkRecovery = () => {
      const hash = window.location.hash;
      // Supabase recovery links contain type=recovery or access_token in the URL fragment
      if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
        setView('NEW_PASSWORD');
      }
    };

    checkRecovery();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setView('NEW_PASSWORD');
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await SupabaseService.resetPassword(email);
      setSuccessMsg("Terminal Recovery Link Sent! Please check your email to set your new password.");
    } catch (err: any) {
      setError(err.message || "Unable to trigger recovery.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await SupabaseService.updateUserPassword(password);
      setSuccessMsg("Password updated successfully! You can now access your terminal.");
      setTimeout(() => {
        // Clear hash and notify App that we are done with recovery
        window.location.hash = '';
        onLogin();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Unable to update password. Your recovery link might have expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      if (view === 'REGISTER') {
        const role = adminCode === "ESTATEGO_ADMIN_2025" ? 'ADMIN' : 'AGENT';
        await SupabaseService.signUp(email, password, fullName, phone, state, null, role);
        setSuccessMsg("Terminal Identity Established! You can now sign in.");
        setTimeout(() => {
          setView('LOGIN');
          setSuccessMsg(null);
        }, 3000);
      } else {
        await SupabaseService.signIn(email, password);
        onLogin();
      }
    } catch (err: any) {
      if (err.message === "EXISTS_IN_AUTH") {
        setError(
          <div className="flex flex-col gap-3 p-1">
            <div className="flex items-center gap-2 text-red-800 font-black uppercase text-[10px]">
              <AlertCircle size={14} /> Identity Already Secured
            </div>
            <p className="text-[11px] text-red-700 leading-tight font-medium">This email is already registered. If you don't know your password, use the "Forgot Password" link to regain access.</p>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => { setView('LOGIN'); setError(null); }}
                className="bg-navy-900 text-white px-4 py-2 rounded-xl font-black uppercase text-[9px] hover:bg-navy-800 transition-all flex items-center gap-2 shadow-lg"
              >
                <LogIn size={10} /> Sign In
              </button>
              <button 
                type="button"
                onClick={() => { setView('RESET'); setError(null); }}
                className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl font-black uppercase text-[9px] hover:bg-red-50 transition-all flex items-center gap-2"
              >
                <KeyRound size={10} /> Reset Password
              </button>
            </div>
          </div>
        );
      } else {
        setError(err.message || "Terminal authentication error. Please verify credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img className="mx-auto h-16 w-auto mb-6" src="https://estatego.app/asset/images/logo.png" alt="EstateGO" />
        <h2 className="text-3xl font-black text-navy-900 uppercase tracking-tighter italic">
          {view === 'REGISTER' ? 'Terminal Onboarding' : view === 'RESET' ? 'Identity Recovery' : view === 'NEW_PASSWORD' ? 'Update Credentials' : 'GoAgent Access'}
        </h2>
        
        {view !== 'RESET' && view !== 'NEW_PASSWORD' && (
          <div className="mt-4 inline-block p-1 bg-white rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-1">
                <button 
                  onClick={() => { setView('LOGIN'); setError(null); setSuccessMsg(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'LOGIN' ? 'bg-navy-900 text-white shadow-md' : 'text-gray-400 hover:text-navy-900'}`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setView('REGISTER'); setError(null); setSuccessMsg(null); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'REGISTER' ? 'bg-cyan-400 text-navy-900 shadow-md' : 'text-gray-400 hover:text-navy-900'}`}
                >
                  Register
                </button>
             </div>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl rounded-3xl border-b-[12px] border-navy-900">
          
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-3 animate-in zoom-in">
              <CheckCircle2 size={18} className="shrink-0" />
              <p className="font-bold uppercase tracking-tight leading-tight">{successMsg}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-lg shadow-sm">
              {error}
            </div>
          )}
          
          {view === 'RESET' ? (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registered Agent Email</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400 transition-all font-medium text-navy-900" 
                  placeholder="agent@estatego.app" 
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-sm font-black text-navy-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <><KeyRound size={18}/> Send Recovery Link</>}
              </button>
              <button type="button" onClick={() => setView('LOGIN')} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-navy-900 transition-colors pt-2">
                <ArrowLeft size={14}/> Back to Login
              </button>
            </form>
          ) : view === 'NEW_PASSWORD' ? (
            <form className="space-y-5" onSubmit={handleUpdatePassword}>
              <div className="p-4 bg-navy-50 rounded-xl border border-navy-100 mb-4">
                <p className="text-[10px] font-bold text-navy-800 uppercase leading-tight">Identity verified. Please establish your new terminal password.</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New Terminal Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400 transition-all font-medium text-navy-900" placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confirm New Password</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400 transition-all font-medium text-navy-900" placeholder="Re-enter password" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-sm font-black text-navy-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <><Lock size={18}/> Set New Password</>}
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {view === 'REGISTER' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Identity</label>
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400 transition-all font-medium text-navy-900" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ops Base (State)</label>
                    <select required value={state} onChange={e => setState(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400 transition-all font-medium text-navy-900">
                      <option value="">Select State</option>
                      {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Agent Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400 transition-all font-medium text-navy-900" placeholder="agent@estatego.app" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Terminal Password</label>
                   {view === 'LOGIN' && (
                     <button type="button" onClick={() => setView('RESET')} className="text-[10px] font-black text-cyan-600 hover:text-cyan-500 uppercase tracking-widest italic"> Forgot Password</button>
                   )}
                </div>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400 transition-all font-medium text-navy-900" placeholder="••••••••" />
              </div>

              {view === 'REGISTER' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact Phone</label>
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400 transition-all font-medium text-navy-900" placeholder="080..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ops Code</label>
                    <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" placeholder="Admin Override Only" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-sm font-black text-navy-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                {loading ? <RefreshCw className="animate-spin" /> : (view === 'REGISTER' ? <><UserPlus size={18}/> Initiate Setup</> : <><LogIn size={18}/> Access Terminal</>)}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const AgreementWall: React.FC<{ onSign: () => void }> = ({ onSign }) => {
  const [loading, setLoading] = useState(false);

  const handleSign = async () => {
    setLoading(true);
    await onSign();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 md:p-12 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck size={32} className="text-cyan-500" />
            <h2 className="text-2xl font-black text-navy-900 uppercase italic tracking-tighter">Service Agreement // v2025.2</h2>
          </div>
          <div className="prose prose-sm max-h-80 overflow-y-auto pr-4 text-gray-600 font-medium leading-relaxed custom-scrollbar">
            <p className="mb-6">This GoAgent Field Operations Agreement ("Agreement") is entered into by and between EstateGO ("Company") and the undersigned Agent.</p>
            
            <div className="space-y-6">
              <section>
                <h4 className="text-navy-900 font-black uppercase text-[10px] tracking-widest mb-2">1. SCOPE OF ENGAGEMENT</h4>
                <p>The Agent is engaged to identify and report high-occupancy residential and commercial property leads within the assigned territory. Reports must include accurate GPS data and visual evidence of site visitation via the GoAgent terminal.</p>
              </section>

              <section>
                <h4 className="text-navy-900 font-black uppercase text-[10px] tracking-widest mb-2">2. PAYOUT STRUCTURE</h4>
                <p>Commissions are calculated at ₦450 per verified residential unit. Payments are disbursed via the payout subsystem upon successful verification by the Admin Portal and confirmation of data authenticity.</p>
              </section>

              <section>
                <h4 className="text-navy-900 font-black uppercase text-[10px] tracking-widest mb-2">3. ETHICAL CONDUCT</h4>
                <p>Agents must conduct themselves professionally. Fabrication of site visits or manual data entry of fictitious properties will result in immediate terminal deactivation and forfeiture of all pending commissions.</p>
              </section>

              <section>
                <h4 className="text-navy-900 font-black uppercase text-[10px] tracking-widest mb-2">4. PAYMENT CYCLE</h4>
                <p>Commissions are disbursed on the 7th of every month following successful client payment reconciliation. Payouts are made directly to the bank details registered in the Agent Identity Module.</p>
              </section>

              <section>
                <h4 className="text-navy-900 font-black uppercase text-[10px] tracking-widest mb-2">5. DIGITAL SIGNATURE</h4>
                <p>Acceptance of these terms is logged with your unique Agent ID, high-precision Timestamp, and Network IP Address as a legally binding digital contract of service.</p>
              </section>
            </div>
          </div>
        </div>
        <div className="p-8 md:p-12 bg-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Digital Timestamp Execution</p>
            <p className="text-xs font-bold text-navy-900">{new Date().toLocaleDateString()} // SECURE_NODE_102</p>
          </div>
          <button 
            onClick={handleSign} 
            disabled={loading}
            className="w-full md:w-auto px-10 py-4 bg-navy-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-navy-800 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <>Accept & Establish Identity</>}
          </button>
        </div>
      </div>
    </div>
  );
};
