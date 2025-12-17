
import React, { useState } from 'react';
import { DriveSubmission, SubmissionStatus, User } from '../types';
import { 
  Search, Download, CheckCircle, CreditCard, Send, MoreHorizontal, 
  Filter, Users as UsersIcon, ClipboardList, Mail, Phone, Calendar, 
  ShieldCheck, ShieldAlert, X, Eye, Sparkles, MapPin, Building2, PhoneCall, Loader2
} from 'lucide-react';
import { MockService } from '../services/mockService';
import { AIService } from '../services/aiService';

interface AdminPortalProps {
  submissions: DriveSubmission[];
  onUpdateStatus: (id: string, status: SubmissionStatus) => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ submissions, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'agents'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Detail Modal State
  const [selectedLead, setSelectedLead] = useState<DriveSubmission | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const allAgents = MockService.getAllAgents().filter(a => a.role === 'AGENT');

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.agentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredAgents = allAgents.filter(a => 
    a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusUpdate = async (id: string, status: SubmissionStatus) => {
    setUpdating(id);
    await onUpdateStatus(id, status);
    setUpdating(null);
  };

  const runAnalysis = async (lead: DriveSubmission) => {
    setAnalyzing(true);
    const result = await AIService.analyzeLead(lead);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  const closeDetail = () => {
    setSelectedLead(null);
    setAiAnalysis(null);
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

              {/* AI Analysis Section */}
              <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-6 text-white mb-8 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-cyan-400" size={20} />
                    <span className="font-bold text-sm uppercase tracking-widest">AI Opportunity Insight</span>
                  </div>
                  {!aiAnalysis && (
                    <button 
                      onClick={() => runAnalysis(selectedLead)}
                      disabled={analyzing}
                      className="text-[10px] font-bold px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {analyzing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      {analyzing ? 'Analyzing...' : 'Generate AI Summary'}
                    </button>
                  )}
                </div>
                {aiAnalysis ? (
                  <div className="text-sm text-navy-100 leading-relaxed italic border-l-2 border-cyan-400 pl-4 py-1">
                    {aiAnalysis}
                  </div>
                ) : (
                  <p className="text-xs text-navy-200 italic">Click the button above to have Gemini evaluate this lead's potential.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8 mb-12">
                <section>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Building2 size={14} className="text-cyan-600" /> Property Metrics
                  </h3>
                  <div className="space-y-3">
                    <DetailItem label="Category" value={selectedLead.propertyCategory} />
                    <DetailItem label="Type" value={selectedLead.propertyType} />
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
                <section className="col-span-2">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Features & Intel</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedLead.featuresInterested.map(f => (
                      <span key={f} className="px-3 py-1 bg-cyan-50 text-cyan-700 text-[10px] font-bold rounded-full border border-cyan-100">{f}</span>
                    ))}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Field Notes</p>
                    <p className="text-sm text-gray-700 italic">"{selectedLead.feedback || "No additional feedback provided."}"</p>
                  </div>
                </section>
              </div>

              <div className="flex gap-4 pt-8 border-t border-gray-100">
                {selectedLead.status === 'PENDING' && (
                  <button 
                    onClick={() => { handleStatusUpdate(selectedLead.id, 'APPROVED'); closeDetail(); }}
                    className="flex-1 bg-navy-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors"
                  >
                    <CheckCircle size={18} /> Approve Lead
                  </button>
                )}
                {selectedLead.status === 'APPROVED' && (
                  <button 
                    onClick={() => { handleStatusUpdate(selectedLead.id, 'PAID'); closeDetail(); }}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
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
          <p className="text-gray-500">Overview of platform growth and agent activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-sm text-sm">
            <Download size={16} /> Export Data
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'leads' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <ClipboardList size={18} /> Lead Submissions
        </button>
        <button 
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'agents' ? 'border-navy-900 text-navy-900' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <UsersIcon size={18} /> Agent Directory
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search leads..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-900 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'leads' && (
            <div className="flex items-center gap-3">
               <Filter size={18} className="text-gray-400" />
               <select 
                 className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 outline-none"
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value as any)}
               >
                 <option value="ALL">All Statuses</option>
                 <option value="PENDING">Pending</option>
                 <option value="APPROVED">Approved</option>
                 <option value="PAID">Paid</option>
               </select>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'leads' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b">
                  <th className="px-6 py-4">Property & Agent</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Commission</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSubmissions.length > 0 ? filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-5">
                      <div onClick={() => setSelectedLead(s)} className="cursor-pointer">
                        <p className="text-sm font-bold text-navy-900 group-hover:text-cyan-600 transition-colors">{s.propertyName}</p>
                        <p className="text-xs text-gray-500 mt-1">By <span className="text-navy-900 font-medium">{s.agentName}</span> • {s.noOfUnits} Units</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        s.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 
                        s.status === 'APPROVED' ? 'bg-cyan-100 text-cyan-800' : 
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-navy-900">₦{s.estimatedCommission.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{new Date(s.submissionDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setSelectedLead(s)}
                           className="p-2 text-gray-400 hover:text-navy-900 hover:bg-gray-100 rounded-lg transition-colors"
                           title="View Details"
                         >
                           <Eye size={20} />
                         </button>
                         {s.status === 'PENDING' && (
                           <button 
                             onClick={() => handleStatusUpdate(s.id, 'APPROVED')}
                             disabled={updating === s.id}
                             className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                           >
                             <CheckCircle size={20} />
                           </button>
                         )}
                         <button className="p-2 text-gray-300 hover:text-gray-500 rounded-lg">
                           <MoreHorizontal size={20} />
                         </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No submissions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
             <div className="p-12 text-center text-gray-400 italic">Agent directory view is active. Use search to filter agents.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-400 font-medium">{label}</span>
    <span className="text-navy-900 font-bold">{value}</span>
  </div>
);

const RefreshCw = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
