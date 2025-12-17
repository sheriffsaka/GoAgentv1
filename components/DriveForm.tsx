import React, { useState } from 'react';
import { User, DriveSubmission } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle2, Building2, MapPin, Calculator, PhoneCall, Sparkles } from 'lucide-react';

interface DriveFormProps {
  user: User;
  onSubmit: (data: any) => Promise<void>;
}

export const DriveForm: React.FC<DriveFormProps> = ({ user, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    agentName: user.fullName,
    agentStatus: 'Freelance' as 'In-house' | 'Freelance',
    propertyName: '',
    propertyAddress: '',
    stateLocation: '',
    propertyCategory: 'Residential' as 'Residential' | 'Commercial',
    propertyType: '',
    noOfUnits: 0,
    occupancyRate: 0,
    meteringType: 'Prepaid',
    landlordName: '',
    managementType: 'Individual' as 'Individual' | 'Company',
    contactPhone: '',
    interestLevel: 'High' as 'High' | 'Medium' | 'Low',
    featuresInterested: [] as string[],
    subscriptionType: 'Monthly',
    marketingChannels: [] as string[],
    feedback: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (list: 'featuresInterested' | 'marketingChannels', item: string) => {
    setFormData(prev => {
      const current = prev[list];
      if (current.includes(item)) {
        return { ...prev, [list]: current.filter(i => i !== item) };
      }
      return { ...prev, [list]: [...current, item] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        agentId: user.id
      });
      setSuccess(true);
    } catch (err) {
      alert("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold text-navy-900 mb-4">Drive Reported!</h2>
        <p className="text-gray-500 mb-10 text-lg leading-relaxed">
          The property lead has been logged. Our admin team will verify the details within 24-48 hours. 
          Pending commission has been added to your dashboard.
        </p>
        <button 
          onClick={() => { setSuccess(false); setStep(1); setFormData({...formData, propertyName: '', propertyAddress: ''}) }}
          className="bg-navy-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-navy-800 transition-all shadow-lg"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-navy-900">GoAgent Drive Report</h2>
        <p className="text-gray-500">Step {step} of 4: {['Agent & Location', 'Property Metrics', 'Contact Info', 'Sales Intel'][step-1]}</p>
        
        {/* Progress Bar */}
        <div className="mt-6 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-400 transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-cyan-600 mb-4">
              <MapPin size={24} />
              <h3 className="font-bold text-lg">Agent & Property Location</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Agent Name</label>
                <input disabled value={formData.agentName} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Agent Status</label>
                <select name="agentStatus" value={formData.agentStatus} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none">
                  <option value="Freelance">Freelance</option>
                  <option value="In-house">In-house</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Name</label>
                <input required name="propertyName" value={formData.propertyName} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none" placeholder="e.g. Silver Valley Estate" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Address</label>
                <input required name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none" placeholder="Enter full address" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State / Location</label>
                <input required name="stateLocation" value={formData.stateLocation} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none" placeholder="e.g. Lagos, Nigeria" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-cyan-600 mb-4">
              <Building2 size={24} />
              <h3 className="font-bold text-lg">Property Metrics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Category</label>
                <select name="propertyCategory" value={formData.propertyCategory} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                <input required name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none" placeholder="Malls, Estates, High-rise, etc." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">No. of Units</label>
                <input type="number" required name="noOfUnits" value={formData.noOfUnits} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Occupancy Rate (%)</label>
                <input type="number" required name="occupancyRate" value={formData.occupancyRate} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Metering Type</label>
                <select name="meteringType" value={formData.meteringType} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none">
                  <option value="Prepaid">Prepaid</option>
                  <option value="Postpaid">Postpaid</option>
                  <option value="Bulk">Bulk Metering</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-cyan-600 mb-4">
              <PhoneCall size={24} />
              <h3 className="font-bold text-lg">Contact Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Landlord / Facility Manager Name</label>
                <input required name="landlordName" value={formData.landlordName} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Management</label>
                <select name="managementType" value={formData.managementType} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none">
                  <option value="Individual">Individual</option>
                  <option value="Company">Management Company</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone No.</label>
                <input required type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none" />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-cyan-600 mb-4">
              <Sparkles size={24} />
              <h3 className="font-bold text-lg">Sales Intel & Feedback</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interest Level</label>
                <select name="interestLevel" value={formData.interestLevel} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none">
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subscription Preference</label>
                <select name="subscriptionType" value={formData.subscriptionType} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none">
                  <option value="Monthly">Monthly Billing</option>
                  <option value="Quarterly">Quarterly Billing</option>
                  <option value="Annual">Annual Billing</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Features Interested In</label>
                <div className="flex flex-wrap gap-2">
                  {['Resident App', 'Utility Billing', 'Security Mgt', 'Visitor Control', 'Facility Mgt'].map(f => (
                    <button 
                      key={f} type="button" 
                      onClick={() => handleCheckbox('featuresInterested', f)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${formData.featuresInterested.includes(f) ? 'bg-cyan-400 text-navy-900 shadow-md' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Marketing Channels Discovered Through</label>
                <div className="flex flex-wrap gap-2">
                  {['Facebook', 'Referral', 'Billboard', 'Direct Drive', 'Newspaper'].map(c => (
                    <button 
                      key={c} type="button" 
                      onClick={() => handleCheckbox('marketingChannels', c)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${formData.marketingChannels.includes(c) ? 'bg-navy-900 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback / Notes</label>
                <textarea name="feedback" value={formData.feedback} onChange={handleChange} rows={4} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none" placeholder="Any additional notes from the site visit?" />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-8 border-t">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-2 text-gray-600 font-bold hover:text-navy-900 transition-colors">
              <ChevronLeft size={20} /> Back
            </button>
          ) : <div />}
          
          {step < 4 ? (
            <button type="button" onClick={nextStep} className="flex items-center gap-2 px-8 py-3 bg-navy-900 text-white rounded-xl font-bold hover:bg-navy-800 transition-all shadow-lg">
              Next Step <ChevronRight size={20} />
            </button>
          ) : (
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-10 py-3 bg-cyan-400 text-navy-900 rounded-xl font-bold hover:bg-cyan-500 transition-all shadow-lg disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Drive Report'}
            </button>
          )}
        </div>
      </form>

      {step === 4 && (
        <div className="mt-8 bg-cyan-50 p-6 rounded-2xl border border-cyan-100 flex items-center justify-between">
           <div>
             <p className="text-cyan-800 text-sm font-bold uppercase tracking-wide">Potential Commission</p>
             <p className="text-2xl font-black text-navy-900">₦{(formData.noOfUnits * 450).toLocaleString()}</p>
           </div>
           <div className="text-right">
             <p className="text-xs text-cyan-700">Calculated at ₦450/unit</p>
             <p className="text-xs text-cyan-700">Base Plan: ₦1,500/month</p>
           </div>
        </div>
      )}
    </div>
  );
};