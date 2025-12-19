
import React, { useState } from 'react';
import { User } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Loader2, ShieldCheck, Info, AlertCircle, Lock, RefreshCw } from 'lucide-react';

interface AuthProps {
  onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminCode, setShowAdminCode] = useState(false);
  
  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [adminCode, setAdminCode] = useState('');

  const ADMIN_SECRET = "ESTATEGO_ADMIN_2025";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegistering) {
        const role = adminCode === ADMIN_SECRET ? 'ADMIN' : 'AGENT';
        await SupabaseService.signUp(email, fullName, phone, { bankName, accountNumber, accountName }, role);
        alert("Account created successfully! You can now sign in.");
        setIsRegistering(false);
      } else {
        // Attempt Sign In
        try {
          await SupabaseService.signIn(email);
          onLogin();
        } catch (signInErr: any) {
          if (signInErr.message?.includes("Invalid login credentials") || signInErr.status === 400) {
            setError("Invalid email or password. If you just registered, ensure your email is correct. Default internal password is being used.");
          } else {
            throw signInErr;
          }
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.message?.includes("already registered") || err.code === "23505") {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.message?.includes("rate limit")) {
        setError("Too many attempts. Please wait a few minutes.");
      } else {
        setError(err.message || "An authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-16 w-auto"
          src="https://estatego.app/asset/images/logo.png"
          alt="EstateGO"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-navy-900 uppercase tracking-tighter">
          {isRegistering ? 'Growth Team Signup' : 'GoAgent Terminal'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isRegistering ? 'Already part of the team? ' : 'New Field Agent? '}
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="font-bold text-cyan-600 hover:text-cyan-500 underline decoration-2 underline-offset-4"
          >
            {isRegistering ? 'Login here' : 'Register now'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border-b-8 border-navy-900">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Failed</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {isRegistering && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-navy-900 outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="agent@estatego.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-navy-900 outline-none transition-all"
              />
            </div>

            {isRegistering && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="080 0000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-navy-900 outline-none transition-all"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-black text-navy-900 uppercase">Payout Destination</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowAdminCode(!showAdminCode)}
                      className="text-[10px] font-bold text-gray-400 hover:text-navy-900 flex items-center gap-1 uppercase"
                    >
                      <Lock size={10} /> Admin Key
                    </button>
                  </div>
                  
                  {showAdminCode && (
                    <div className="mb-4 p-3 bg-navy-900 rounded-xl animate-in zoom-in duration-200">
                      <input
                        type="password"
                        placeholder="Secret Invitation Code"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        className="block w-full px-3 py-2 bg-navy-800 border border-navy-700 text-cyan-400 text-sm rounded-lg outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Acc. Number"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Acc. Name"
                        required
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isRegistering && (
               <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl text-[10px] text-cyan-800 leading-relaxed font-bold uppercase tracking-tight">
                 <p>EstateGO Internal Security: System-generated passwords apply to all field agent terminals.</p>
               </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-black text-navy-900 bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all uppercase tracking-widest"
            >
              {loading ? <RefreshCw className="animate-spin h-5 w-5" /> : (isRegistering ? 'Initialize Agent Account' : 'Authenticate')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

interface AgreementProps {
  onSign: () => void;
}

export const AgreementWall: React.FC<AgreementProps> = ({ onSign }) => {
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    setSigning(true);
    try {
      await onSign();
    } catch (err) {
      console.error(err);
      alert("Error signing agreement. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-navy-900 bg-opacity-95 backdrop-blur-sm transition-opacity"></div>
      <div className="relative bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="bg-navy-900 p-8 text-center border-b border-navy-800">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-cyan-400 mb-4">
            <ShieldCheck className="h-8 w-8 text-navy-900" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
            Field Operations Agreement
          </h3>
        </div>
        
        <div className="p-8">
          <div className="h-80 overflow-y-auto border border-gray-100 p-6 rounded-2xl bg-gray-50 text-sm text-gray-700 space-y-4 leading-relaxed custom-scrollbar">
            <p><strong className="text-navy-900">1. SCOPE OF SERVICES:</strong> The Agent is engaged as an independent contractor to onboard residential and commercial properties to the EstateGO platform.</p>
            <p><strong className="text-navy-900">2. COMMISSION:</strong> A commission of <span className="text-cyan-600 font-bold">N450 per resident/month</span> will be paid for every successfully onboarded and paying unit via the GoAgent platform.</p>
            <p><strong className="text-navy-900">3. DATA INTEGRITY:</strong> All drives must include GPS coordinates and real property photos. Fraudulent entries will result in immediate termination and loss of accrued commissions.</p>
            <p><strong className="text-navy-900">4. PAYMENT CYCLE:</strong> Commissions are disbursed on the 7th of every month following successful client payment reconciliation.</p>
            <p><strong className="text-navy-900">5. DIGITAL SIGNATURE:</strong> Acceptance of these terms is logged with your Auth ID, Timestamp, and IP Address as a legally binding digital contract.</p>
          </div>
          
          <button
            type="button"
            onClick={handleSign}
            disabled={signing}
            className="mt-8 w-full rounded-2xl py-4 bg-navy-900 text-white font-black hover:bg-navy-800 transition-all uppercase tracking-widest shadow-xl flex justify-center items-center gap-2"
          >
            {signing ? <Loader2 className="animate-spin h-5 w-5" /> : 'I Bind My Signature to This Agreement'}
          </button>
        </div>
      </div>
    </div>
  );
};
