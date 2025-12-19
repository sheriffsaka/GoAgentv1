
import React, { useEffect, useState } from 'react';
import { User, DriveSubmission } from '../types';
import { Wallet, Users, Target, Clock, CheckCircle, Sparkles, RefreshCw, Layers, TrendingUp, ChevronRight, MapPin, Building2 } from 'lucide-react';
import { AIService } from '../services/aiService';

interface DashboardProps {
  user: User;
  submissions: DriveSubmission[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, submissions }) => {
  const [marketIntel, setMarketIntel] = useState<{ text: string; sources: any[] } | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  useEffect(() => { fetchIntel(); }, []);
  const fetchIntel = async () => { 
    setLoadingIntel(true); 
    const intel = await AIService.getMarketIntel();
    setMarketIntel(intel); 
    setLoadingIntel(false); 
  };

  const agentSubmissions = user.role === 'ADMIN' ? submissions : submissions.filter(s => s.agentId === user.id);

  // Stats Logic
  const totalCommissionPaid = agentSubmissions.filter(s => s.status === 'PAID').reduce((a, b) => a + b.estimatedCommission, 0);
  const pendingPayouts = agentSubmissions.filter(s => s.status === 'APPROVED').reduce((a, b) => a + b.estimatedCommission, 0);
  const totalUnits = agentSubmissions.reduce((a, b) => a + b.noOfUnits, 0);
  
  // Admin-Specific stats
  const totalVolume = submissions.reduce((a, b) => a + (b.estimatedCommission || 0), 0);
  const totalDisbursed = submissions.filter(s => s.status === 'PAID').reduce((a, b) => a + (b.estimatedCommission || 0), 0);
  const totalPendingPayouts = submissions.filter(s => s.status === 'APPROVED').reduce((a, b) => a + (b.estimatedCommission || 0), 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-navy-900 tracking-tighter uppercase italic">HQ // Welcome, {user.fullName.split(' ')[0]}</h1>
          <p className="text-gray-500 font-medium text-sm">EstateGO Field Operations Terminal</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-navy-900 uppercase tracking-widest">Network Active</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {user.role === 'ADMIN' ? (
          <>
            <StatCard icon={<Layers className="text-cyan-400" />} title="Total Commission Volume" value={`₦${totalVolume.toLocaleString()}`} subtitle="Gross Lead Value" color="navy" />
            <StatCard icon={<Clock className="text-orange-400" />} title="Pending Payouts" value={`₦${totalPendingPayouts.toLocaleString()}`} subtitle="Awaiting Disbursement" color="white" />
            <StatCard icon={<CheckCircle className="text-emerald-500" />} title="Total Disbursed" value={`₦${totalDisbursed.toLocaleString()}`} subtitle="Settled via Bank" color="white" />
            <StatCard icon={<Users className="text-purple-400" />} title="Total Residents" value={totalUnits.toLocaleString()} subtitle="Managed Units" color="white" />
          </>
        ) : (
          <>
            <StatCard icon={<Wallet className="text-cyan-400" />} title="Total Earned (Paid)" value={`₦${totalCommissionPaid.toLocaleString()}`} subtitle="Credited to Bank" color="navy" />
            <StatCard icon={<Clock className="text-orange-400" />} title="Pending Payouts" value={`₦${pendingPayouts.toLocaleString()}`} subtitle="In Approval Flow" color="white" />
            <StatCard icon={<Target className="text-emerald-500" />} title="Activity Rank" value={`${agentSubmissions.length}`} subtitle="Current Submissions" color="white" />
            <StatCard icon={<TrendingUp className="text-purple-500" />} title="Total Units" value={totalUnits.toLocaleString()} subtitle="Onboarded Residents" color="white" />
          </>
        )}
      </div>

      {/* AGENT VIEW: SUBMISSION HISTORY (RESPONSIVE) */}
      {user.role === 'AGENT' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-black text-navy-900 uppercase tracking-widest text-sm">My Lead History</h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase">{agentSubmissions.length} Entries</span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4 text-center">Units</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agentSubmissions.length === 0 ? (
                   <tr><td colSpan={4} className="p-12 text-center text-gray-400 font-bold uppercase text-xs">No reports yet. Capture your first site today.</td></tr>
                ) : agentSubmissions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-navy-900">{s.propertyName}</p>
                      <p className="text-[10px] text-gray-400">{s.stateLocation} • {new Date(s.submissionDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-navy-900 text-sm">{s.noOfUnits}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-black text-cyan-600 text-sm">₦{s.estimatedCommission?.toLocaleString() || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-gray-50">
            {agentSubmissions.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-bold uppercase text-xs">No reports yet.</div>
            ) : agentSubmissions.map(s => (
              <div key={s.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-navy-900">{s.propertyName}</h4>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{s.stateLocation}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                    <Building2 size={12}/> {s.noOfUnits} Units
                  </div>
                  <div className="text-sm font-black text-cyan-600">
                    ₦{s.estimatedCommission?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Intel Card */}
      <div className="bg-navy-900 p-6 md:p-10 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-tight"><Sparkles className="text-cyan-400" /> AI Market Intelligence</h3>
            <button onClick={fetchIntel} disabled={loadingIntel} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
              <RefreshCw size={14} className={loadingIntel ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="text-xs md:text-sm text-navy-100 leading-relaxed font-medium max-w-2xl">
            {loadingIntel ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Synchronizing with latest Nigerian Prop-Tech data...</span>
              </div>
            ) : marketIntel?.text}
          </div>
          {!loadingIntel && marketIntel?.sources && marketIntel.sources.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {marketIntel.sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full flex items-center gap-1 transition-all">
                  <ChevronRight size={10} /> {s.title}
                </a>
              ))}
            </div>
          )}
        </div>
        {/* Abstract Background Element */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, color }: any) => (
  <div className={`p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 ${color === 'navy' ? 'bg-navy-900 text-white' : 'bg-white text-navy-900'}`}>
    <div className="mb-4">{icon}</div>
    <p className={`text-[10px] font-black uppercase tracking-widest ${color === 'navy' ? 'text-navy-300' : 'text-gray-400'}`}>{title}</p>
    <p className="text-2xl md:text-3xl font-black mt-1">{value}</p>
    <p className={`text-[10px] font-bold mt-3 ${color === 'navy' ? 'text-cyan-400' : 'text-gray-400'}`}>{subtitle}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    PENDING: 'bg-orange-50 text-orange-600 border-orange-100',
    APPROVED: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    PAID: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    REJECTED: 'bg-red-50 text-red-600 border-red-100'
  };
  return <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border shrink-0 ${styles[status]}`}>{status}</span>;
};
