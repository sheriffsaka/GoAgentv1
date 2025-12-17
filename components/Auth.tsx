import React, { useState } from 'react';
import { User } from '../types';
import { MockService } from '../services/mockService';
import { Loader2, ShieldCheck } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user: User;
      if (isRegistering) {
        user = await MockService.register({
          fullName,
          email,
          phone,
          bankDetails: { bankName, accountNumber, accountName }
        });
      } else {
        user = await MockService.login(email);
      }
      onLogin(user);
    } catch (error) {
      alert("Login failed. For demo, use 'admin@estatego.app' for Admin, or register a new agent.");
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
        <h2 className="mt-6 text-center text-3xl font-extrabold text-navy-900">
          {isRegistering ? 'Join the Growth Team' : 'Sign in to GoAgent'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isRegistering ? 'Already have an account? ' : 'New Agent? '}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="font-medium text-cyan-600 hover:text-cyan-500"
          >
            {isRegistering ? 'Sign in' : 'Register now'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-t-4 border-navy-900">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-navy-900 focus:border-navy-900 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-navy-900 focus:border-navy-900 sm:text-sm"
                />
              </div>
            </div>

            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-navy-900 focus:border-navy-900 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-navy-900 mb-3">Bank Details (Payouts)</h3>
                  <div className="grid grid-cols-1 gap-y-4">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-navy-900 focus:border-navy-900"
                    />
                     <input
                      type="text"
                      placeholder="Account Number"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-navy-900 focus:border-navy-900"
                    />
                     <input
                      type="text"
                      placeholder="Account Name"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-navy-900 focus:border-navy-900"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-navy-900 bg-cyan-400 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isRegistering ? 'Register Account' : 'Sign In')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface AgreementProps {
  onSign: (user: User) => void;
}

export const AgreementWall: React.FC<AgreementProps> = ({ onSign }) => {
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    setSigning(true);
    try {
      const updatedUser = await MockService.signAgreement();
      onSign(updatedUser);
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-navy-900 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-cyan-100">
              <ShieldCheck className="h-6 w-6 text-navy-900" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-xl leading-6 font-bold text-navy-900" id="modal-title">
                Freelance Agent Agreement
              </h3>
              <div className="mt-4 text-left h-80 overflow-y-auto border p-6 rounded-lg bg-gray-50 text-sm text-gray-700 space-y-4 leading-relaxed">
                <p><strong className="text-navy-900">1. SCOPE OF SERVICES:</strong> The Agent is engaged as an independent contractor to onboard residential and commercial properties to the EstateGO platform.</p>
                <p><strong className="text-navy-900">2. COMMISSION:</strong> A commission of <span className="text-cyan-600 font-semibold">N450 per resident/month</span> (30% of N1,500) will be paid for every successfully onboarded and paying unit.</p>
                <p><strong className="text-navy-900">3. LIMITATIONS:</strong> Agents are capped at onboarding 1,000 estates per a 12-month period to ensure quality management.</p>
                <p><strong className="text-navy-900">4. PAYMENT CYCLE:</strong> Commissions are processed within 7 days of the company receiving subscription funds from the client.</p>
                <p><strong className="text-navy-900">5. DIGITAL SIGNATURE:</strong> By clicking "I Agree & Sign", you log a unique digital signature (Timestamp + IP Address) as binding acceptance of these terms.</p>
                <div className="border-t pt-4 mt-6">
                   <p className="text-xs text-gray-400 italic">Electronic record: Signature ID will be generated upon confirmation.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 sm:mt-10">
            <button
              type="button"
              onClick={handleSign}
              disabled={signing}
              className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-3 bg-navy-900 text-base font-semibold text-white hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-900 transition-colors"
            >
              {signing ? <Loader2 className="animate-spin h-5 w-5" /> : 'I Agree & Sign Digital Agreement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};