
import React, { useState, useEffect, useMemo } from 'react';
import { DriveSubmission, SubmissionStatus, VerificationResult, User } from '../types';
import { Search, X, Eye, Sparkles, Loader2, BadgeCheck, AlertTriangle, ShieldCheck, Phone, Users, FileText, Landmark, BarChart3, Building2, Wallet, PlusCircle, Settings2, Trash2, RefreshCw, CreditCard } from 'lucide-react';
import { AIService } from '../services/aiService';
import { SupabaseService } from '../services/supabaseService';
import { parseErrorMessage } from './Auth';

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
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

interface AdminPortalProps {
  submissions: DriveSubmission[];
  onUpdateStatus: (id: string, status: SubmissionStatus, verification?: VerificationResult) => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ submissions, onUpdateStatus }) => {
  const [activeView, setActiveView] = useState<'leads' | 'agents' | 'settings'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [selectedLead, setSelectedLead] = useState<DriveSubmission | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [manualNote, setManualNote] = useState('');
  
  const [profiles, setProfiles] = useState<User[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [agentSortField, setAgentSortField] = useState<keyof User | 'bankStatus'>('fullName');
  const [agentSortOrder, setAgentSortOrder] = useState<'asc' | 'desc'>('asc');

  // Settings state
  const [features, setFeatures] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchAgents();
    
    // Load metadata
    const storedFeatures = localStorage.getItem('estatego_features');
    setFeatures(storedFeatures ? JSON.parse(storedFeatures) : DEFAULT_FEATURES);
    
    const storedFeedbacks = localStorage.getItem('estatego_feedbacks');
    setFeedbacks(storedFeedbacks ? JSON.parse(storedFeedbacks) : DEFAULT_QUICK_FEEDBACKS);
  }, []);

  const saveMetadata = (key: string, data: string[]) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addItem = (listType: 'features' | 'feedbacks') => {
    if (!newItem.trim()) return;
    if (listType === 'features') {
      const updated = [...features, newItem.trim()];
      setFeatures(updated);
      saveMetadata('estatego_features', updated);
    } else {
      const updated = [...feedbacks, newItem.trim()];
      setFeedbacks(updated);
      saveMetadata('estatego_feedbacks', updated);
    }
    setNewItem('');
  };

  const removeItem = (listType: 'features' | 'feedbacks', index: number) => {
    if (listType === 'features') {
      const updated = features.filter((_, i) => i !== index);
      setFeatures(updated);
      saveMetadata('estatego_features', updated);
    } else {
      const updated = feedbacks.filter((_, i) => i !== index);
      setFeedbacks(updated);
      saveMetadata('estatego_feedbacks', updated);
    }
  };

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const data = await SupabaseService.getAllAgents();
      setProfiles(data);
    } catch (e) { 
      console.error("Agent Sync Failure:", e);
    }
    finally { setLoadingAgents(false); }
  };

  const toggleSort = (field: keyof User | 'bankStatus') => {
    if (agentSortField === field) {
      setAgentSortOrder(agentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setAgentSortField(field);
      setAgentSortOrder('asc');
    }
  };

  /**
   * Merged Agent List Logic.
   * Combine actual DB profiles with unique IDs found in submissions.
   */
  const allUniqueAgents = useMemo(() => {
    const agentMap = new Map<string, User>();
    
    // 1. Start with registered profiles
    profiles.forEach(p => {
      if (p && p.id) agentMap.set(p.id, p);
    });
    
    // 2. Add agents from submissions who might not have explicit profiles (Ghost records)
    submissions.forEach(s => {
      if (s && s.agentId && !agentMap.has(s.agentId)) {
        agentMap.set(s.agentId, {
          id: s.agentId,
          fullName: String(s.agentName || 'Unnamed Agent'),
          email: 'Contact profile pending',
          phone: 'N/A',
          state: String(s.stateLocation || 'N/A'),
          role: 'AGENT',
          agreementSigned: true, 
          createdAt: s.submissionDate
        } as User);
      }
    });
    
    return Array.from(agentMap.values());
  }, [profiles, submissions]);

  // Use the merged count for the stats card
  const uniqueAgentsCount = allUniqueAgents.length;

  // Executive Stats
  const totalResidents = submissions.reduce((a, b) => a + (b.noOfUnits || 0), 0);
  const totalVolume = submissions.reduce((a, b) => a + (b.estimatedCommission || 0), 0);
  const totalDisbursed = submissions.filter(s => s.status === 'PAID').reduce((a, b) => a + (b.estimatedCommission || 0), 0);
  const totalCommission = submissions.filter(s => s.status === 'APPROVED' || s.status === 'PAID').reduce((a, b) => a + (b.estimatedCommission || 0), 0);

  const filteredSubmissions = submissions.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = String(s.propertyName || '').toLowerCase().includes(term) || String(s.agentName || '').toLowerCase().includes(term);
    const matchesFilter = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const sortedAgents = [...allUniqueAgents].filter(a => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = String(a.fullName || '').toLowerCase().includes(term) || String(a.email || '').toLowerCase().includes(term);
    const matchesState = stateFilter === 'ALL' || String(a.state || '').toLowerCase() === stateFilter.toLowerCase();
    return matchesSearch && matchesState;
  }).sort((a, b) => {
    // Standardize comparison by only using primitives for sorting
    let valA: any = a[agentSortField as keyof User];
    let valB: any = b[agentSortField as keyof User];
    
    if (agentSortField === 'bankStatus') {
      valA = a.bankDetails?.accountNumber ? 1 : 0;
      valB = b.bankDetails?.accountNumber ? 1 : 0;
    } else if (typeof valA === 'object') {
      valA = 0; // Don't try to sort objects as strings
      valB = 0;
    } else {
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
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
    } catch (e) { 
      alert("Verification Engine Error: " + parseErrorMessage(e)); 
    }
    finally { setVerifying(false); }
  };

  const handleStatusUpdate = async (id: string, status: SubmissionStatus) => {
    const verification = selectedLead?.verification ? { ...selectedLead.verification, manualNote } : undefined;
    try {
      await onUpdateStatus(id, status, verification);
      setSelectedLead(null);
      setManualNote('');
    } catch (e) {
      alert("Update Failed: " + parseErrorMessage(e));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Detail Slide-over */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 md:p-10 pb-32">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-navy-900 uppercase italic tracking-tighter">{String(selectedLead.propertyName || '')}</h2>
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">UUID: {selectedLead.id.slice(0, 8)}...</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
              </div>

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
                    <p className="text-xs text-gray-600 bg-white p-4 rounded-xl border border-gray-100 italic leading-relaxed">"{String(selectedLead.verification.findings || '')}"</p>
                  </div>
                ) : <div className="text-center py-6 text-gray-400 font-bold uppercase text-[10px] border-2 border-dashed rounded-2xl">Awaiting automated scan...</div>}
                
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Phone size={12}/> Manual Call Notes</label>
                  <textarea value={manualNote} onChange={e => setManualNote(e.target.value)} className="w-full p-4 text-xs bg-white border border-gray-200 rounded-2xl outline-none" rows={3} placeholder="Add findings from manual check..."></textarea>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                 <div className="space-y-6">
                    <InfoBlock label="Lead Source" value={String(selectedLead.agentName || '')} />
                    <InfoBlock label="Units / Occupancy" value={`${selectedLead.noOfUnits} @ ${selectedLead.occupancyRate}%`} />
                 </div>
                 <div className="space-y-6">
                    <InfoBlock label="Contact" value={String(selectedLead.landlordName || '')} />
                    <InfoBlock label="Phone" value={String(selectedLead.contactPhone || '')} />
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

      {/* Executive Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryCard icon={<Building2 className="text-cyan-400" />} title="List of Estates" value={submissions.length.toString()} color="navy" />
        <SummaryCard icon={<Users className="text-purple-400" />} title="List of Residents" value={totalResidents.toLocaleString()} color="white" />
        <SummaryCard icon={<BadgeCheck className="text-emerald-400" />} title="List of Agents" value={uniqueAgentsCount.toString()} color="white" />
        <SummaryCard icon={<BarChart3 className="text-orange-400" />} title="Total Volume" value={`₦${totalVolume.toLocaleString()}`} color="white" />
        <SummaryCard icon={<Wallet className="text-blue-400" />} title="Total Disbursed" value={`₦${totalDisbursed.toLocaleString()}`} color="white" />
        <SummaryCard icon={<CreditCard className="text-indigo-400" />} title="Total Commission" value={`₦${totalCommission.toLocaleString()}`} color="white" />
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div>
          <h2 className="text-2xl font-black text-navy-900 uppercase italic tracking-tighter">Reports & Analytics</h2>
          <p className="text-gray-500 font-medium text-sm">Operation terminal for field activity and lead verification.</p>
        </div>
        
        <div className="flex p-1 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit overflow-x-auto">
           <button onClick={() => { setActiveView('leads'); setSearchTerm(''); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeView === 'leads' ? 'bg-navy-900 text-white shadow-lg' : 'text-gray-400 hover:text-navy-900'}`}>
             <FileText size={16} /> Estates
           </button>
           <button onClick={() => { setActiveView('agents'); setSearchTerm(''); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeView === 'agents' ? 'bg-navy-900 text-white shadow-lg' : 'text-gray-400 hover:text-navy-900'}`}>
             <Users size={16} /> Agents ({uniqueAgentsCount})
           </button>
           <button onClick={() => { setActiveView('settings'); setSearchTerm(''); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${activeView === 'settings' ? 'bg-navy-900 text-white shadow-lg' : 'text-gray-400 hover:text-navy-900'}`}>
             <Settings2 size={16} /> Settings
           </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {activeView !== 'settings' && (
          <div className="p-4 md:p-6 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder={activeView === 'leads' ? "Search estates..." : "Search agents..."} className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-navy-900 outline-none text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              {activeView === 'leads' ? (
                <select className="flex-1 md:flex-none px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase text-navy-900 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Approved Payout</option>
                  <option value="PAID">Disbursed (Settled)</option>
                  <option value="REJECTED">Rejected Lead</option>
                </select>
              ) : (
                <>
                  <select className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase text-navy-900 outline-none" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                    <option value="ALL">All States</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={fetchAgents} disabled={loadingAgents} className="p-3 bg-white border border-gray-200 rounded-2xl text-navy-900 hover:bg-gray-50">
                    <RefreshCw size={18} className={loadingAgents ? 'animate-spin' : ''} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeView === 'leads' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Estate Name</th>
                  <th className="px-6 py-4">Onboarding Agent</th>
                  <th className="px-6 py-4">Comm. Value</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSubmissions.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-black uppercase text-xs">No records found matching criteria.</td></tr>
                ) : filteredSubmissions.map(s => (
                  <tr key={s.id} className="hover:bg-cyan-50/10 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-navy-900">{String(s.propertyName || '')}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{String(s.stateLocation || '')} • {s.noOfUnits} Units</p>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-600">{String(s.agentName || '')}</td>
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
        )}

        {activeView === 'agents' && (
          <div className="overflow-x-auto">
            {loadingAgents ? (
              <div className="p-20 flex flex-col items-center gap-4 text-gray-400">
                <Loader2 size={32} className="animate-spin text-cyan-500" />
                <p className="text-xs font-black uppercase tracking-widest">Syncing Agent Database...</p>
              </div>
            ) : sortedAgents.length === 0 ? (
              <div className="p-20 text-center text-gray-400 font-black uppercase text-xs">No registered agents detected matching the filters.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4 cursor-pointer hover:text-navy-900" onClick={() => toggleSort('fullName')}>Agent Identity</th>
                    <th className="px-6 py-4 cursor-pointer hover:text-navy-900" onClick={() => toggleSort('state')}>Region</th>
                    <th className="px-6 py-4">Payout Status</th>
                    <th className="px-6 py-4 text-right">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedAgents.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${a.role === 'ADMIN' ? 'bg-navy-900 text-white' : 'bg-cyan-100 text-cyan-700'}`}>
                            {String(a.fullName || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-navy-900 flex items-center gap-2">
                              {String(a.fullName || 'Unnamed Agent')}
                              {a.role === 'ADMIN' && <ShieldCheck size={12} className="text-navy-900" />}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold">{String(a.email || '')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-[9px] font-black uppercase text-gray-600">{String(a.state || 'N/A')}</span>
                      </td>
                      <td className="px-6 py-5">
                        {a.bankDetails?.accountNumber ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                            <Landmark size={12}/> Account OK
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-400 font-bold text-[10px] uppercase">
                            <AlertTriangle size={12}/> Pending
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-gray-400 text-[10px] uppercase">
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeView === 'settings' && (
          <div className="p-8 space-y-12">
            <MetadataSection 
              title="Form Features" 
              subtitle="Manage the property features agents can select." 
              items={features} 
              onAdd={() => addItem('features')} 
              onRemove={(i: number) => removeItem('features', i)} 
              value={newItem} 
              onChange={setNewItem} 
            />
            <MetadataSection 
              title="Landlord Feedback Templates" 
              subtitle="Quick response chips for agent field reporting." 
              items={feedbacks} 
              onAdd={() => addItem('feedbacks')} 
              onRemove={(i: number) => removeItem('feedbacks', i)} 
              value={newItem} 
              onChange={setNewItem} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, title, value, color }: any) => (
  <div className={`p-4 rounded-3xl shadow-sm border border-gray-100 ${color === 'navy' ? 'bg-navy-900 text-white' : 'bg-white text-navy-900'}`}>
    <div className="mb-3">{icon}</div>
    <p className={`text-[9px] font-black uppercase tracking-tight mb-0.5 ${color === 'navy' ? 'text-navy-300' : 'text-gray-400'}`}>{title}</p>
    <p className="text-base font-black truncate">{String(value || '')}</p>
  </div>
);

const MetadataSection = ({ title, subtitle, items, onAdd, onRemove, value, onChange }: any) => (
  <div className="max-w-3xl">
    <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
      <div>
        <h3 className="text-lg font-black text-navy-900 uppercase italic tracking-tighter">{title}</h3>
        <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder="New entry..." 
          className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-navy-900 transition-all min-w-[150px]"
        />
        <button onClick={onAdd} className="p-3 bg-navy-900 text-white rounded-xl hover:bg-navy-800 transition-all">
          <PlusCircle size={18} />
        </button>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {(items || []).map((item: string, i: number) => (
        <div key={i} className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 text-[10px] font-black uppercase text-gray-600 group hover:border-red-200 transition-all">
          {String(item || '')}
          <button onClick={() => onRemove(i)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-navy-900 mt-1">{String(value || 'Not provided')}</p>
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
