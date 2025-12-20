
import React, { useState } from 'react';
import { User } from '../types';
import { Save, UserCircle, Landmark, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

interface ProfileViewProps {
  user: User;
  onUpdate: (updates: Partial<User>) => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    state: user.state || '',
    bankName: user.bankDetails?.bankName || '',
    accountNumber: user.bankDetails?.accountNumber || '',
    accountName: user.bankDetails?.accountName || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);
    try {
      await onUpdate({
        fullName: formData.fullName,
        phone: formData.phone,
        state: formData.state,
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName
        }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Profile Update Error Detailed:", err);
      // More robust error stringification to prevent [object Object]
      let message = "Unknown error occurred.";
      if (typeof err === 'string') {
        message = err;
      } else if (err && typeof err === 'object') {
        if (err.message) message = err.message;
        else if (err.error_description) message = err.error_description;
        else message = JSON.stringify(err);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-navy-900 uppercase tracking-tighter italic">Terminal Settings</h2>
        <p className="text-gray-500 font-medium text-sm">Configure your agent identity and payout destination.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-lg shadow-sm flex items-start gap-3 animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-black uppercase tracking-tight text-[10px] mb-1">Terminal Update Error</p>
              <p className="font-medium text-[11px] opacity-80 break-words leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <UserCircle size={16} className="text-cyan-500" /> Identity Module
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Full Identity</label>
              <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Ops Base (State)</label>
              <select required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900">
                <option value="">Select State</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Contact Link (Phone)</label>
              <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Landmark size={16} className="text-emerald-500" /> Payout Subsystem
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Bank Institution</label>
              <input type="text" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" placeholder="e.g. Access Bank" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Account Number</label>
                <input type="text" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" maxLength={10} placeholder="10 Digits" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Full Account Name</label>
                <input type="text" value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" placeholder="Matches Identity" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading} 
            className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-navy-900 text-white hover:bg-navy-800'} disabled:opacity-50`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (saved ? <><CheckCircle size={18}/> Updated</> : <><Save size={18}/> Commit Updates</>)}
          </button>
        </div>
      </form>
    </div>
  );
};
