
import React, { useState, useEffect } from 'react';
import { SupabaseService, supabase } from '../services/supabaseService';
import { AlertCircle, RefreshCw, UserPlus, LogIn, Info, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

type AuthView = 'LOGIN' | 'REGISTER' | 'RESET' | 'NEW_PASSWORD';

interface AuthProps {
  onLogin: () => void;
  initialView?: AuthView;
}

/**
 * Robustly parses any error into a displayable string.
 * Prevents [object Object] by checking types and stringifying objects.
 */
export const parseErrorMessage = (err: any): string => {
  if (!err) return "An unknown error occurred.";
  if (typeof err === 'string') {
    return err === '[object Object]' ? "An unexpected structured error occurred." : err;
  }
  
  // Handle Supabase/Standard Error objects
  if (err.message && typeof err.message === 'string') {
    return err.message;
  }
  
  // Handle specific Supabase Auth error patterns
  if (err.error_description && typeof err.error_description === 'string') {
    return err.error_description;
  }
  
  if (err.error && typeof err.error === 'string') {
    return err.error;
  }

  // Fallback to JSON stringification if it's an object
  try {
    const stringified = JSON.stringify(err);
    if (stringified === '{}') {
      // If it's a native Error object, String() will give 'Error: message'
      // If it's a plain object {}, String() will give '[object Object]'
      const str = String(err);
      return str === '[object Object]' ? "System error: Profile or data mismatch detected." : str;
    }
    return stringified;
  } catch {
    const finalFallback = String(err);
    return finalFallback === '[object Object]' ? "Critical system error occurred." : finalFallback;
  }
};

export const Auth: React.FC<AuthProps> = ({ onLogin, initialView = 'LOGIN' }) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (initialView === 'NEW_PASSWORD') {
      setView('NEW_PASSWORD');
    }
  }, [initialView]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await SupabaseService.resetPassword(email);
      setSuccessMsg("Password reset link sent! Please check your email inbox.");
    } catch (err: any) {
      setError(parseErrorMessage(err));
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
      setSuccessMsg("Password updated successfully! Redirecting...");
      setTimeout(() => {
        window.location.hash = '';
        onLogin();
      }, 2000);
    } catch (err: any) {
      setError(parseErrorMessage(err));
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
        await SupabaseService.signUp(email, password, fullName, phone, state, null, 'AGENT');
        setSuccessMsg("Registration successful! You can now sign in.");
        setTimeout(() => {
          setView('LOGIN');
          setSuccessMsg(null);
        }, 3000);
      } else {
        await SupabaseService.signIn(email, password);
        onLogin();
      }
    } catch (err: any) {
      const msg = parseErrorMessage(err);
      if (msg.includes("already registered") || msg === "EXISTS_IN_AUTH") {
        setError(
          <div className="flex flex-col gap-3 p-1">
            <div className="flex items-center gap-2 text-red-800 font-black uppercase text-[10px]">
              <AlertCircle size={14} /> Email Already Registered
            </div>
            <p className="text-[11px] text-red-700 leading-tight font-medium">Use the "Forgot Password" link if you cannot remember your credentials.</p>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => { setView('LOGIN'); setError(null); }}
                className="bg-navy-900 text-white px-4 py-2 rounded-xl font-black uppercase text-[9px] hover:bg-navy-800 transition-all shadow-lg"
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => { setView('RESET'); setError(null); }}
                className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl font-black uppercase text-[9px] hover:bg-red-50 transition-all flex items-center gap-2"
              >
                Reset Password
              </button>
            </div>
          </div>
        );
      } else {
        setError(msg);
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
          {view === 'REGISTER' ? 'Join EstateGO' : view === 'RESET' ? 'Reset Password' : view === 'NEW_PASSWORD' ? 'New Password' : 'GoAgent Access'}
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" 
                  placeholder="agent@estatego.app" 
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-sm font-black text-navy-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <><KeyRound size={18}/> Send Reset Link</>}
              </button>
              <button type="button" onClick={() => setView('LOGIN')} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-navy-900 transition-colors pt-2">
                <ArrowLeft size={14}/> Back to Login
              </button>
            </form>
          ) : view === 'NEW_PASSWORD' ? (
            <form className="space-y-5" onSubmit={handleUpdatePassword}>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New Password</label>
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
                {loading ? <RefreshCw className="animate-spin" /> : <><Lock size={18}/> Update Password</>}
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {view === 'REGISTER' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">State</label>
                    <select required value={state} onChange={e => setState(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900">
                      <option value="">Select State</option>
                      {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" placeholder="agent@estatego.app" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                   {view === 'LOGIN' && (
                     <button type="button" onClick={() => setView('RESET')} className="text-[10px] font-black text-cyan-600 hover:text-cyan-500 uppercase tracking-widest italic"> Forgot Password?</button>
                   )}
                </div>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" placeholder="••••••••" />
              </div>

              {view === 'REGISTER' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" placeholder="080..." />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-sm font-black text-navy-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                {loading ? <RefreshCw className="animate-spin" /> : (view === 'REGISTER' ? <><UserPlus size={18}/> Create Account</> : <><LogIn size={18}/> Sign In</>)}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const AgreementWall: React.FC<{ onSign: () => Promise<void> }> = ({ onSign }) => {
  const [loading, setLoading] = useState(false);
  
  const handleSign = async () => {
    setLoading(true);
    try {
      await onSign();
    } catch (e: any) {
      alert(parseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 md:p-12 shadow-2xl text-center">
        <div className="w-20 h-20 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-3xl font-black text-navy-900 uppercase italic tracking-tighter mb-4">Service Agreement</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          By accessing the GoAgent Field Operations Terminal, you agree to provide accurate property data and maintain the confidentiality of all field intelligence gathered. Leads must be verified through on-site presence.
        </p>
        <div className="bg-gray-50 p-6 rounded-2xl mb-8 text-left border border-gray-100">
          <ul className="space-y-3">
            {[
              "GPS verification is required for all leads.",
              "False reporting will result in immediate suspension.",
              "Commission payouts are subject to AI verification."
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-navy-800 uppercase tracking-tight">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
        <button 
          onClick={handleSign}
          disabled={loading}
          className="w-full py-4 bg-navy-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-navy-800 shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : 'I Accept and Sign Agreement'}
        </button>
      </div>
    </div>
  );
};
