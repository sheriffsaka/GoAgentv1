
import React, { useState } from 'react';
import { User, DriveSubmission } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle2, Building2, MapPin, PhoneCall, Sparkles, Camera, Locate, Loader2, MessageSquareText } from 'lucide-react';

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

const FEATURES = [
  'Resident App', 'Utility Billing', 'Security Mgt', 'Visitor Control', 'Facility Mgt'
];

const QUICK_FEEDBACKS = [
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
    
    // Only proceed with final submission if we are on step 4
    if (step < 4) {
      setStep(s => s + 1);
      return;
    }
    
    // Final validations
    if (!formData.coordinates) {
      alert("Verification Error: Please capture your current GPS location in Step 1 to confirm your physical presence at the site.");
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
      alert(`Submission Error: ${err.message || "Please check your network connection."}`);
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
          The property lead has been logged with proof of visit. Our AI and admin team will verify the details shortly.
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
        <h2 className="text-2xl font-bold text-navy-900">GoAgent Drive Report</h2>
        <p className="text-gray-500">Step {step} of 4: {['Agent & Location', 'Property Metrics', 'Contact Info', 'Sales Intel'][step-1]}</p>
        
        <div className="mt-6 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-400 transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3 text-cyan-600 mb-4">
              <MapPin size={24} />
              <h3 className="font-bold text-lg">Agent & Property Location</h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <button 
                type="button" 
                onClick={handleCaptureLocation}
                disabled={locating}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all font-bold ${formData.coordinates ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-cyan-400'}`}
              >
                {locating ? <Loader2 className="animate-spin" /> : <Locate size={20} />}
                {formData.coordinates ? 'Location Captured ✓' : 'Capture Current Location'}
              </button>
              
              <label className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all font-bold ${formData.propertyPhoto ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-cyan-400'}`}>
                <Camera size={20} />
                {formData.propertyPhoto ? 'Photo Uploaded ✓' : 'Upload Property Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Agent Status</label>
                <select name="agentStatus" value={formData.agentStatus} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none">
                  <option value="Freelance">Freelance</option>
                  <option value="In-house">In-house</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State / Location</label>
                <select required name="stateLocation" value={formData.stateLocation} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none">
                  <option value="">Select State</option>
                  {NIGERIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
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
                <select required name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none">
                  <option value="">Select Type</option>
                  {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">No. of Units</label>
                <input type="number" required name="noOfUnits" value={formData.noOfUnits} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Occupancy Rate: <span className="text-cyan-600 font-bold">{formData.occupancyRate}%</span></label>
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
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interest Level</label>
                <select name="interestLevel" value={formData.interestLevel} onChange={handleChange} className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 outline-none">
                  <option value="High">High Interest</option>
                  <option value="Medium">Medium Interest</option>
                  <option value="Low">Low Interest</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Features Interested In</label>
                <div className="flex flex-wrap gap-2">
                  {FEATURES.map(f => (
                    <button 
                      key={f} 
                      type="button" 
                      onClick={() => toggleFeature(f)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${formData.featuresInterested.includes(f) ? 'bg-cyan-400 border-cyan-500 text-navy-900 shadow-md' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Quick Selection Feedback</label>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Select to populate notes</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {QUICK_FEEDBACKS.map((text, i) => (
                    <button 
                      key={i} 
                      type="button"
                      onClick={() => addQuickFeedback(text)}
                      className="text-left p-3 text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-cyan-50 hover:border-cyan-200 transition-all flex items-start gap-2 group"
                    >
                      <MessageSquareText size={14} className="shrink-0 text-gray-300 group-hover:text-cyan-400" />
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Agent Site Feedback / Detailed Notes</label>
                <textarea 
                  name="feedback" 
                  value={formData.feedback} 
                  onChange={handleChange} 
                  rows={4} 
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-400 focus:bg-white outline-none transition-all" 
                  placeholder="Record additional findings or observations from the site visit here..." 
                />
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
            <button 
              type="submit" 
              className="flex items-center gap-2 px-8 py-3 bg-navy-900 text-white rounded-xl font-bold hover:bg-navy-800 transition-all shadow-lg"
            >
              Next Step <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading} 
              className="flex items-center gap-2 px-10 py-3 bg-cyan-400 text-navy-900 rounded-xl font-bold hover:bg-cyan-500 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Reporting Lead...
                </>
              ) : 'Submit Final Drive Report'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
