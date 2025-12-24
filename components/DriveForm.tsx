
import React, { useState, useEffect } from 'react';
import { User, DriveSubmission } from '../types';
import { parseErrorMessage } from './Auth';
import { ChevronLeft, ChevronRight, CheckCircle2, Building2, MapPin, PhoneCall, Sparkles, Camera, Locate, Loader2, MessageSquareText, PlusCircle } from 'lucide-react';

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

const PROPERTY_TYPES = [
  "Malls", "Small Estate", "Large Estate", "High-rise Building", "Shop Complex", "Gated Community", "Corporate Office"
];

const DEFAULT_FEATURES = [
  'Resident App', 'Utility Billing', 'Security Mgt', 'Visitor Control', 'Facility Mgt', 'Automated Receipts'
];

const DEFAULT_QUICK_FEEDBACKS = [
  "Landlord is very interested in the billing automation.",
  "Security is the main priority for this facility manager.",
  "Property currently uses manual receipts and wants to go digital.",
  "Concerns about the initial setup fee for the hardware.",
  "Requested a follow-up demo for the board members.",
  "High occupancy but struggles with debt recovery from tenants."
];

interface DriveFormProps {
  user: User;
  onSubmit: (data: any) => Promise<void>;
}

export const DriveForm: React.FC<DriveFormProps> = ({ user, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locating, setLocating] = useState(false);

  // Dynamic lists from localStorage (managed by Admin)
  const [availableFeatures, setAvailableFeatures] = useState(DEFAULT_FEATURES);
  const [quickFeedbacks, setQuickFeedbacks] = useState(DEFAULT_QUICK_FEEDBACKS);

  useEffect(() => {
    const storedFeatures = localStorage.getItem('estatego_features');
    if (storedFeatures) setAvailableFeatures(JSON.parse(storedFeatures));
    
    const storedFeedbacks = localStorage.getItem('estatego_feedbacks');
    if (storedFeedbacks) setQuickFeedbacks(JSON.parse(storedFeedbacks));
  }, []);

  const [formData, setFormData] = useState({
    agentName: user.fullName,
    agentStatus: 'Freelance' as 'In-house' | 'Freelance',
    propertyName: '',
    propertyAddress: '',
    stateLocation: '',
    propertyCategory: 'Residential' as 'Residential' | 'Commercial',
    propertyType: '',
    noOfUnits: 0,
    occupancyRate: 50,
    meteringType: 'Prepaid',
    landlordName: '',
    managementType: 'Individual' as 'Individual' | 'Company',
    contactPhone: '',
    interestLevel: 'High' as 'High' | 'Medium' | 'Low',
    featuresInterested: [] as string[],
    subscriptionType: 'Residential',
    marketingChannels: [] as string[],
    feedback: '',
    coordinates: undefined as { lat: number; lng: number } | undefined,
    propertyPhoto: undefined as string | undefined
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCaptureLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({ 
          ...prev, 
          coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude } 
        }));
        setLocating(false);
      },
      () => {
        alert("Unable to retrieve location. Please enable location permissions.");
        setLocating(false);
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, propertyPhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => {
      const current = prev.featuresInterested;
      if (current.includes(feature)) {
        return { ...prev, featuresInterested: current.filter(i => i !== feature) };
      }
      return { ...prev, featuresInterested: [...current, feature] };
    });
  };

  const addQuickFeedback = (text: string) => {
    setFormData(prev => ({
      ...prev,
      feedback: prev.feedback ? `${prev.feedback}\n${text}` : text
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 4) {
      setStep(s => s + 1);
      return;
    }
    
    if (!formData.coordinates) {
      alert("Verification Error: Please capture your GPS location in Step 1 to confirm site presence.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        agentId: user.id
      });
      setSuccess(true);
    } catch (err: any) {
      alert(`Submission Error: ${parseErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold text-navy-900 mb-4">Drive Reported!</h2>
        <p className="text-gray-500 mb-10 text-lg leading-relaxed">
          Lead logged successfully. Our AI will verify the data shortly.
        </p>
        <button 
          onClick={() => { setSuccess(false); setStep(1); setFormData({...formData, propertyName: '', propertyAddress: '', propertyPhoto: undefined, coordinates: undefined, feedback: '', featuresInterested: []}) }}
          className="bg-navy-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-navy-800 transition-all shadow-lg"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-2xl font-black text-navy-900 uppercase italic tracking-tighter">New Drive Report</h2>
        <p className="text-gray-500 font-medium text-sm">Step {step} of 4: {['Location Verification', 'Property Metrics', 'Stakeholders', 'Sales Intel'][step-1]}</p>
        
        <div className="mt-6 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-400 transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8">
        
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-cyan-600 mb-4">
              <MapPin size={24} />
              <h3 className="font-bold text-lg uppercase tracking-tight">Location Proof</h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <button 
                type="button" 
                onClick={handleCaptureLocation}
                disabled={locating}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all font-bold ${formData.coordinates ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-cyan-400'}`}
              >
                {locating ? <Loader2 className="animate-spin" /> : <Locate size={20} />}
                {formData.coordinates ? 'Location Verified ✓' : 'Verify Current Location'}
              </button>
              
              <label className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all font-bold ${formData.propertyPhoto ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-cyan-400'}`}>
                <Camera size={20} />
                {formData.propertyPhoto ? 'Proof Captured ✓' : 'Upload Proof Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">State / Region</label>
                <select required name="stateLocation" value={formData.stateLocation} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900">
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Property Name</label>
                <input required name="propertyName" value={formData.propertyName} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" placeholder="e.g. Silver Valley Estate" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Physical Address</label>
                <input required name="propertyAddress" value={formData.propertyAddress} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" placeholder="Enter full address" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <Building2 size={24} />
              <h3 className="font-bold text-lg uppercase tracking-tight">Lead Capacity</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                <select name="propertyCategory" value={formData.propertyCategory} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Property Type</label>
                <select required name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900">
                  <option value="">Select Type</option>
                  {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Units (Residents)</label>
                <input type="number" required min="0" name="noOfUnits" value={formData.noOfUnits} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Occupancy Estimate: <span className="text-cyan-600 font-bold">{formData.occupancyRate}%</span></label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="1"
                  name="occupancyRate" 
                  value={formData.occupancyRate} 
                  onChange={handleChange} 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-orange-600 mb-4">
              <PhoneCall size={24} />
              <h3 className="font-bold text-lg uppercase tracking-tight">Stakeholder Info</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Key Decision Maker Name</label>
                <input required name="landlordName" value={formData.landlordName} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" placeholder="e.g. Facility Manager or Landlord" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Governance</label>
                <select name="managementType" value={formData.managementType} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900">
                  <option value="Individual">Individual Landlord</option>
                  <option value="Company">Professional Mgmt Co.</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contact Phone</label>
                <input required type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-purple-600 mb-4">
              <Sparkles size={24} />
              <h3 className="font-bold text-lg uppercase tracking-tight">Sales Opportunity</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Interest Rating</label>
                <select name="interestLevel" value={formData.interestLevel} onChange={handleChange} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900">
                  <option value="High">Hot Lead (Immediate Follow-up)</option>
                  <option value="Medium">Warm Lead (Needs Nurturing)</option>
                  <option value="Low">Cold Lead (Discovery Stage)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Priority Features Interested In</label>
                <div className="flex flex-wrap gap-2">
                  {availableFeatures.map(f => (
                    <button 
                      key={f} 
                      type="button" 
                      onClick={() => toggleFeature(f)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${formData.featuresInterested.includes(f) ? 'bg-cyan-400 border-cyan-500 text-navy-900 shadow-lg scale-105' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Decision Maker Feedback</label>
                  <span className="text-[9px] text-gray-300 font-black uppercase italic">Select to populate notes</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {quickFeedbacks.map((text, i) => (
                    <button 
                      key={i} 
                      type="button"
                      onClick={() => addQuickFeedback(text)}
                      className="text-left p-3 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white hover:border-cyan-200 hover:text-navy-900 transition-all flex items-start gap-2 group"
                    >
                      <MessageSquareText size={14} className="shrink-0 text-gray-200 group-hover:text-cyan-400" />
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detailed Situation Notes</label>
                <textarea 
                  name="feedback" 
                  value={formData.feedback} 
                  onChange={handleChange} 
                  rows={4} 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all font-medium text-navy-900" 
                  placeholder="Record unique observations from the field visit here..." 
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-8 border-t border-gray-50">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-3 text-gray-400 font-black uppercase text-xs hover:text-navy-900 transition-colors">
              <ChevronLeft size={20} /> Previous
            </button>
          ) : <div />}
          
          {step < 4 ? (
            <button 
              type="submit" 
              className="flex items-center gap-2 px-8 py-4 bg-navy-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-navy-800 transition-all shadow-xl"
            >
              Continue <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading} 
              className="flex items-center gap-2 px-10 py-4 bg-cyan-400 text-navy-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-500 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Transmitting...
                </>
              ) : 'Commit Final Drive Report'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
