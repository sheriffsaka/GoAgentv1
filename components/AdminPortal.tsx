
import React, { useState } from 'react';
import { DriveSubmission, SubmissionStatus, User, VerificationResult } from '../types';
import { 
  Search, Download, CheckCircle, CreditCard, Send, MoreHorizontal, 
  Filter, Users as UsersIcon, ClipboardList, Mail, Phone, Calendar, 
  ShieldCheck, ShieldAlert, X, Eye, Sparkles, MapPin, Building2, PhoneCall, Loader2, ExternalLink, RefreshCw, AlertTriangle, BadgeCheck
} from 'lucide-react';
import { MockService } from '../services/mockService';
import { AIService } from '../services/aiService';

interface AdminPortalProps {
  submissions: DriveSubmission[];
  onUpdateStatus: (id: string, status: SubmissionStatus, verification?: VerificationResult) => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ submissions, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'agents'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Detail Modal State
  const [selectedLead, setSelectedLead] = useState<DriveSubmission | null>(null);
  const [verifying, setVerifying] = useState(false);

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.agentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const handleRunVerification = async (lead: DriveSubmission) => {
    setVerifying(true);
    const result = await AIService.verifyFieldVisit(lead);
    await onUpdateStatus(lead.id, lead.status, result);
    // Refresh selected lead state
    setSelectedLead({ ...lead, verification: result });
    setVerifying(false);
  };

  const closeDetail = () => {
    setSelectedLead(null);
  };

  return (
    <div className="space-y-6 relative">
      {/* Detail Slide-over Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={closeDetail} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-navy-900">{selectedLead.propertyName}</h2>
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <MapPin size={14} /> {selectedLead.propertyAddress}, {selectedLead.stateLocation}
                  </p>
                </div>
                <button onClick={closeDetail} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              {/* AI Verification Section */}
              <div className={`rounded-2xl p-6 mb-8 border-2 ${
                selectedLead.verification?.verdict === 'AUTHENTIC' ? 'bg-emerald-50 border-emerald-200' : 
                selectedLead.verification?.verdict === 'SUSPICIOUS' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className={selectedLead.verification?.verdict === 'AUTHENTIC' ? 'text-emerald-600' : 'text-navy-600'} size={20} />
                    <span className="font-bold text-sm uppercase tracking-widest text-navy-900">Field Visit Verification</span>
                  </div>
                  {!selectedLead.verification && (
                    <button 
                      onClick={() => handleRunVerification(selectedLead)}
                      disabled={verifying}
                      className="text-[10px] font-bold px-4 py-2 bg-navy-900 text-white hover:bg-navy-800 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {verifying ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                      Run AI Verification
                    </button>
                  )}
                </div>
                
                {selectedLead.verification ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${selectedLead.verification.verdict === 'AUTHENTIC' ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                           {selectedLead.verification.verdict === 'AUTHENTIC' ? <BadgeCheck size={24} /> : <AlertTriangle size={24} />}
                         </div>
                         <div>
                           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verdict</p>
                           <p className="font-black text-navy-900">{selectedLead.verification.verdict} ({selectedLead.verification.score}%)</p>
                         </div>
                       </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed bg-white/50 p-4 rounded-xl border border-gray-100">
                      {selectedLead.verification.findings}
                    </p>
                    {selectedLead.verification.sources.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Grounding Sources Found:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedLead.verification.sources.map((s, i) => (
                            <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-navy-900 hover:border-cyan-400 transition-colors">
                              <ExternalLink size={10} /> {s.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                     <p className="text-xs text-gray-500 text-center mb-4">Verification hasn't been run for this lead yet. Capture proof and verify authenticity before approval.</p>
                     {selectedLead.coordinates && (
                       <div className="flex items-center gap-2 text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full text-[10px] font-bold">
                         <MapPin size={12} /> Agent GPS Captured: {selectedLead.coordinates.lat.toFixed(4)}, {selectedLead.coordinates.lng.toFixed(4)}
                       </div>
                     )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8 mb-12">
                <section>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Building2 size={14} className="text-cyan-600" /> Property Metrics
                  </h3>
                  <div className="space-y-3">
                    <DetailItem label="Category" value={selectedLead.propertyCategory} />
                    <DetailItem label="Units" value={selectedLead.noOfUnits.toString()} />
                    <DetailItem label="Occupancy" value={`${selectedLead.occupancyRate}%`} />
                    <DetailItem label="Metering" value={selectedLead.meteringType} />
                  </div>
                </section>
                <section>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <PhoneCall size={14} className="text-cyan-600" /> Contact Details
                  </h3>
                  <div className="space-y-3">
                    <DetailItem label="Manager" value={selectedLead.landlordName} />
                    <DetailItem label="Management" value={selectedLead.managementType} />
                    <DetailItem label="Phone" value={selectedLead.contactPhone} />
                    <DetailItem label="Agent" value={selectedLead.agentName} />
                  </div>
                </section>
                {selectedLead.propertyPhoto && (
                  <section className="col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Site Photo Proof</p>
                    <img src={selectedLead.propertyPhoto} className="w-full h-64 object-cover rounded-2xl border border-gray-100 shadow-sm" alt="Property Proof" />
                  </section>
                )}
              </div>

              <div className="flex gap-4 pt-8 border-t border-gray-100">
                {selectedLead.status === 'PENDING' && (
                  <button 
                    onClick={() => { onUpdateStatus(selectedLead.id, 'APPROVED'); closeDetail(); }}
                    className="flex-1 bg-navy-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors shadow-lg shadow-navy-900/10"
                  >
                    <CheckCircle size={18} /> Approve Lead
                  </button>
                )}
                {selectedLead.status === 'APPROVED' && (
                  <button 
                    onClick={() => { onUpdateStatus(selectedLead.id, 'PAID'); closeDetail(); }}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/10"
                  >
                    <CreditCard size={18} /> Mark Payment Received
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main UI Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Admin Management Console</h2>
          <p className="text-gray-500">Real-time verification of field agent drives.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-sm text-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by property or agent..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-900 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
             className="bg-white border border-gray-200 rounded-xl px-6 py-3 text-sm font-bold text-gray-700 outline-none"
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value as any)}
           >
             <option value="ALL">All Status</option>
             <option value="PENDING">Pending</option>
             <option value="APPROVED">Approved</option>
             <option value="PAID">Paid</option>
           </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
                <th className="px-6 py-4">Lead Detail</th>
                <th className="px-6 py-4">AI Verification</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSubmissions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div onClick={() => setSelectedLead(s)} className="cursor-pointer">
                      <p className="text-sm font-bold text-navy-900 group-hover:text-cyan-600 transition-colors">{s.propertyName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">By {s.agentName} • {s.stateLocation}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {s.verification ? (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        s.verification.verdict === 'AUTHENTIC' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {s.verification.verdict} {s.verification.score}%
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unverified</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-navy-900">₦{s.estimatedCommission.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{s.status}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => setSelectedLead(s)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-navy-50 text-navy-900 text-xs font-bold rounded-lg hover:bg-navy-100 transition-colors"
                    >
                      <Eye size={14} /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
    <span className="text-gray-400 font-medium">{label}</span>
    <span className="text-navy-900 font-bold">{value}</span>
  </div>
);
