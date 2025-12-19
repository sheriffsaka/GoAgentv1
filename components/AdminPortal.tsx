
import React, { useState, useEffect } from 'react';
import { DriveSubmission, SubmissionStatus, VerificationResult, User } from '../types';
import { Search, Download, CheckCircle, CreditCard, X, Eye, Sparkles, Loader2, BadgeCheck, AlertTriangle, ShieldCheck, Ban, Phone, Users, FileText, ChevronDown, ArrowUpDown, Landmark, MapPin, Filter } from 'lucide-react';
import { AIService } from '../services/aiService';
import { SupabaseService } from '../services/supabaseService';

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

interface AdminPortalProps {
  submissions: DriveSubmission[];
  onUpdateStatus: (id: string, status: SubmissionStatus, verification?: VerificationResult) => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ submissions, onUpdateStatus }) => {
  const [activeView, setActiveView] = useState<'leads' | 'agents'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [selectedLead, setSelectedLead] = useState<DriveSubmission | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [manualNote, setManualNote] = useState('');
  
  const [agents, setAgents] = useState<User[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [agentSortField, setAgentSortField] = useState<keyof User | 'bankStatus'>('fullName');
  const [agentSortOrder, setAgentSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (activeView === 'agents') fetchAgents();
  }, [activeView]);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const data = await SupabaseService.getAllAgents();
      setAgents(data);
    } catch (e) { console.error(e); }
    finally { setLoadingAgents(false); }
  };

  const filteredSubmissions = submissions.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = s.propertyName.toLowerCase().includes(term) || s.agentName.toLowerCase().includes(term);
    const matchesFilter = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const sortedAgents = [...agents].filter(a => {
    const matchesSearch = a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || a.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'ALL' || a.state === stateFilter;
    return matchesSearch && matchesState;
  }).sort((a, b) => {
    let valA: any = a[agentSortField as keyof User] || '';
    let valB: any = b[agentSortField as keyof User] || '';
    
    if (agentSortField === 'bankStatus') {
      valA = a.bankDetails?.accountNumber ? 1 : 0;
      valB = b.bankDetails?.accountNumber ? 1 : 0;
    }

    if (valA < valB) return agentSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return agentSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleRunVerification = async (lead: DriveSubmission) => {
    setVerifying(true);
    try {
      const result = await AIService.verifyFieldVisit(lead);
      await onUpdateStatus(lead.id, lead.status, result);
      setSelectedLead({ ...lead, verification: result });
    } catch (e) { alert("Verification engine offline."); }
    finally { setVerifying(false); }
  };

  const handleStatusUpdate = async (id: string, status: SubmissionStatus) => {
    const verification = selectedLead?.verification ? { ...selectedLead.verification, manualNote } : undefined;
    await onUpdateStatus(id, status, verification);
    setSelectedLead(null);
    setManualNote('');
  };

  const toggleSort = (field: any) => {
    if (agentSortField === field) {
      setAgentSortOrder(agentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setAgentSortField(field);
      setAgentSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Detail Slide-over (Leads Only) */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 md:p-10 pb-32">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-navy-900 uppercase italic tracking-tighter">{selectedLead.propertyName}</h2>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">UUID: {selectedLead.id.slice(0, 8)}...</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
              </div>

              {/* Verification UI */}
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                   <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><ShieldCheck size={14} className="text-cyan-500"/> Verification Protocol</h4>
                   {!selectedLead.verification && (
                     <button onClick={() => handleRunVerification(selectedLead)} disabled={verifying} className="w-full sm:w-auto px-4 py-2 bg-navy-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-navy-800 flex items-center justify-center gap-2">
                       {verifying ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Trigger AI Check
                     </button>
                   )}
                </div>

                {selectedLead.verification ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className={`p-3 rounded-2xl ${selectedLead.verification.verdict === 'AUTHENTIC' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                         {selectedLead.verification.verdict === 'AUTHENTIC' ? <BadgeCheck size={24} /> : <AlertTriangle size={24} />}
                       </div>
                       <div>
                         <p className="text-xl font-black text-navy-900">{selectedLead.verification.score}% {selectedLead.verification.verdict}</p>
                         <p className="text-[10px] text-gray-500 font-bold uppercase">Confidence Score</p>
                       </div>
                    </div>
                    <p className="text-xs text-gray-600 bg-white p-4 rounded-xl border border-gray-100 italic leading-relaxed">"{selectedLead.verification.findings}"</p>
                  </div>
                ) : <div className="text-center py-6 text-gray-400 font-bold uppercase text-[10px] border-2 border-dashed rounded-2xl">Awaiting automated scan...</div>}
                
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Phone size={12}/> Manual Call Notes</label>
                  <textarea value={manualNote} onChange={e => setManualNote(e.target.value)} className="w-full p-4 text-xs bg-white border border-gray-200 rounded-2xl outline-none" rows={3} placeholder="Add findings from manual check..."></textarea>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                 <div className="space-y-6">
                    <InfoBlock label="Lead Source" value={selectedLead.agentName} />
                    <InfoBlock label="Units / Occupancy" value={`${selectedLead.noOfUnits} @ ${selectedLead.occupancyRate}%`} />
                 </div>
                 <div className="space-y-6">
                    <InfoBlock label="Contact" value={selectedLead.landlordName} />
                    <InfoBlock label="Phone" value={selectedLead.contactPhone} />
                 </div>
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 p-8 bg-white/95 backdrop-blur-md border-t border-gray-100 grid grid-cols-2 gap-4">
               {selectedLead.status === 'PENDING' && (
                 <>
                  <button onClick={() => handleStatusUpdate(selectedLead.id, 'REJECTED')} className="py-4 border-2 border-red-500 text-red-500 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2">Reject</button>
                  <button onClick={() => handleStatusUpdate(selectedLead.id, 'APPROVED')} className="py-4 bg-navy-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-xl">Approve</button>
                 </>
               )}
               {selectedLead.status === 'APPROVED' && (
                  <button onClick={() => handleStatusUpdate(selectedLead.id, 'PAID')} className="col-span-2 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-xl">Confirm Payment</button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Header View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-navy-900 uppercase italic tracking-tighter">Terminal Command</h2>
          <p className="text-gray-500 font-medium text-sm">Growth oversight & resource management.</p>
        </div>
        
        <div className="flex p-1 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
           <button onClick={() => setActiveView('leads')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === 'leads' ? 'bg-navy-900 text-white shadow-lg' : 'text-gray-400 hover:text-navy-900'}`}>
             <FileText size={16} /> Leads
           </button>
           <button onClick={() => setActiveView('agents')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeView === 'agents' ? 'bg-navy-900 text-white shadow-lg' : 'text-gray-400 hover:text-navy-900'}`}>
             <Users size={16} /> Agent Hub
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search & Global Filters */}
        <div className="p-4 md:p-6 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder={activeView === 'leads' ? "Search properties..." : "Search agents..."} className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-navy-900 outline-none text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            {activeView === 'leads' ? (
              <select className="flex-1 md:flex-none px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase text-navy-900 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Disbursed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            ) : (
               <>
                <div className="flex items-center bg-white border rounded-2xl px-3 group">
                   <Filter size={14} className="text-gray-400" />
                   <select 
                    className="px-2 py-3 bg-transparent text-[10px] font-black uppercase text-navy-900 outline-none min-w-[120px]" 
                    value={stateFilter} 
                    onChange={e => setStateFilter(e.target.value)}
                  >
                    <option value="ALL">All States</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button onClick={fetchAgents} className="p-3 bg-white border rounded-2xl hover:bg-gray-50 transition-all text-navy-900">
                  <Download size={18}/>
                </button>
               </>
            )}
          </div>
        </div>

        {/* View Rendering */}
        {activeView === 'leads' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Lead Detail</th>
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Payout</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSubmissions.map(s => (
                  <tr key={s.id} className="hover:bg-cyan-50/10 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-navy-900">{s.propertyName}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{s.stateLocation}</p>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-600">{s.agentName}</td>
                    <td className="px-6 py-5 text-sm font-black text-navy-900">₦{(s.estimatedCommission || 0).toLocaleString()}</td>
                    <td className="px-6 py-5"><StatusBadge status={s.status}/></td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => setSelectedLead(s)} className="p-2.5 bg-navy-50 text-navy-900 rounded-xl hover:bg-navy-900 hover:text-white transition-all"><Eye size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {loadingAgents ? (
              <div className="p-20 flex flex-col items-center gap-4 text-gray-400">
                <Loader2 size={32} className="animate-spin text-cyan-500" />
                <p className="text-xs font-black uppercase">Indexing Agent Directory...</p>
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <table className="w-full text-left hidden md:table">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4 cursor-pointer hover:text-navy-900 group" onClick={() => toggleSort('fullName')}>
                        Agent <ArrowUpDown size={10} className="inline ml-1 opacity-0 group-hover:opacity-100"/>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:text-navy-900 group" onClick={() => toggleSort('state')}>
                        State <ArrowUpDown size={10} className="inline ml-1 opacity-0 group-hover:opacity-100"/>
                      </th>
                      <th className="px-6 py-4">Contact Link</th>
                      <th className="px-6 py-4 cursor-pointer hover:text-navy-900 group" onClick={() => toggleSort('bankStatus')}>
                        Payout Ready <ArrowUpDown size={10} className="inline ml-1 opacity-0 group-hover:opacity-100"/>
                      </th>
                      <th className="px-6 py-4 text-right">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sortedAgents.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-navy-900">{a.fullName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">ID: {a.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-2 py-1 bg-gray-100 rounded-md text-[9px] font-black uppercase text-gray-600">{a.state}</span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-gray-600">{a.email}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{a.phone}</p>
                        </td>
                        <td className="px-6 py-5">
                          {a.bankDetails?.accountNumber ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                              <Landmark size={12}/> OK
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-400 font-bold text-[10px] uppercase">
                              <AlertTriangle size={12}/> NO BANK
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                           <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(a.createdAt || '').toLocaleDateString()}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile View Cards */}
                <div className="md:hidden divide-y divide-gray-50">
                  {sortedAgents.map(a => (
                    <div key={a.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-black text-navy-900">{a.fullName}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">{a.state}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${a.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-navy-50 text-navy-600 border-navy-100'}`}>{a.role}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                         <div className="flex items-center gap-1 text-gray-400">
                           <Phone size={12}/> {a.phone}
                         </div>
                         {a.bankDetails?.accountNumber ? (
                            <span className="text-emerald-600 flex items-center gap-1"><BadgeCheck size={12}/> Paid</span>
                         ) : (
                            <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={12}/> Setup Pending</span>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-navy-900 mt-1">{value || 'Not provided'}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    PENDING: 'bg-orange-50 text-orange-600 border-orange-100',
    APPROVED: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    PAID: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    REJECTED: 'bg-red-50 text-red-600 border-red-100'
  };
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${styles[status]}`}>{status}</span>;
};
