
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
 * High-resilience error parser for the terminal.
 * Aggressively extracts human-readable text and prevents generic '[object Object]' displays.
 */
export const parseErrorMessage = (err: any): string => {
  if (err === null || err === undefined) return "An unknown error occurred.";
  
  const OBJECT_ERROR_MSG = "The terminal encountered an unhandled data structure. Please refresh the page.";

  // Helper to check if a string is the generic object marker
  const isGenericObjectStr = (s: string) => 
    s.includes('[object Object]') || s === '{}' || s.includes('[object postgresterror]') || s.includes('[object PostgrestError]');

  // 1. If it's already a string
  if (typeof err === 'string') {
    return isGenericObjectStr(err) ? OBJECT_ERROR_MSG : err;
  }

  // 2. Handle known object structures (Standard Error, Supabase, Postgrest)
  let extracted = "";

  if (err.message && typeof err.message === 'string') extracted = err.message;
  else if (err.error_description && typeof err.error_description === 'string') extracted = err.error_description;
  else if (err.error && typeof err.error === 'string') extracted = err.error;
  else if (err.error && typeof err.error === 'object' && err.error.message) extracted = err.error.message;
  else if (err.msg && typeof err.msg === 'string') extracted = err.msg;
  else if (err.details && typeof err.details === 'string') extracted = err.details;
  
  // If we extracted a string, verify it's not generic
  if (extracted && !isGenericObjectStr(extracted)) return extracted;

  // 3. Fallback: JSON stringify (often better than String() for objects)
  try {
    const json = JSON.stringify(err);
    if (json && json !== '{}' && json !== 'null') {
      return json.length > 200 ? json.substring(0, 200) + '...' : json;
    }
  } catch (e) {
    // Stringify failed
  }

  // 4. Final resort: Native string representation
  const finalStr = String(err);
  return isGenericObjectStr(finalStr) ? OBJECT_ERROR_MSG : finalStr;
};

export const AgreementWall: React.FC<{ onSign: () => Promise<void> }> = ({ onSign }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSign();
    } catch (err: any) {
      console.error("Agreement Signing Error Caught:", err);
      // Ensure we always have a string for the error state
      const friendlyError = parseErrorMessage(err);
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-b-[12px] border-navy-900">
        <div className="p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-cyan-100 text-navy-900 rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-12">
            <ShieldCheck size={40} />
          </div>
          
          <h2 className="text-3xl font-black text-navy-900 uppercase italic tracking-tighter mb-4">Service Agreement</h2>
          <p className="text-gray-500 font-medium mb-10 text-sm">Please review the Field Operations Agreement to activate your terminal access.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-black uppercase tracking-tight mb-1">Activation Fault</p>
                <p className="font-medium leading-relaxed">{error}</p>
                <div className="mt-3 flex gap-4">
                  <button onClick={() => window.location.reload()} className="text-[10px] font-black uppercase underline hover:text-red-900 flex items-center gap-1">
                     <RefreshCw size={10} /> Restart Terminal
                  </button>
                  <button onClick={() => setError(null)} className="text-[10px] font-black uppercase underline hover:text-red-900">
                     Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="text-left mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-100 max-h-64 overflow-y-auto space-y-6 custom-scrollbar">
            <div>
              <h4 className="text-[10px] font-black uppercase text-navy-900 tracking-widest mb-2">1. Operational Integrity</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">Agents must provide accurate data from physical field visits. Fabrication of property details or management contacts is prohibited.</p>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase text-navy-900 tracking-widest mb-2">2. Payout Protocol</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">Commissions are calculated based on verified units. Estates with suspicious data will undergo manual audit before approval.</p>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase text-navy-900 tracking-widest mb-2">3. Termination</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">EstateGO reserves the right to deactivate any terminal found to be engaging in fraudulent reporting or brand misrepresentation.</p>
            </div>
          </div>

          <button 
            onClick={handleSign}
            disabled={loading}
            className="w-full py-5 bg-navy-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-navy-800 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <><CheckCircle2 size={18} className="text-cyan-400" /> Sign & Activate Terminal</>}
          </button>

          <p className="mt-6 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Digital Signature Node: {new Date().getFullYear()}/GO-AGENT-AUTH</p>
        </div>
      </div>
    </div>
  );
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
        setSuccessMsg("Registration initiated! Please check your email for a confirmation link to activate your account.");
      } else {
        await SupabaseService.signIn(email, password);
        onLogin();
      }
    } catch (err: any) {
      const msg = parseErrorMessage(err);
      
      if (msg.toLowerCase().includes("email not confirmed")) {
        setError(
          <div className="flex flex-col gap-3 p-1">
            <div className="flex items-center gap-2 text-orange-800 font-black uppercase text-[10px]">
              <AlertCircle size={14} /> Account Not Activated
            </div>
            <p className="text-[11px] text-orange-700 leading-tight font-medium">
              Your email hasn't been verified yet. Please click the link sent to <strong>{email}</strong> to activate your terminal.
            </p>
          </div>
        );
      } else if (msg.includes("already registered") || msg === "EXISTS_IN_AUTH") {
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
