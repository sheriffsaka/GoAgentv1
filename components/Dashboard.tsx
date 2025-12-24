
import React, { useEffect, useState, useMemo } from 'react';
import { User, DriveSubmission } from '../types';
import { Wallet, Users, Target, Clock, Sparkles, RefreshCw, Layers, TrendingUp, ChevronRight, BarChart3, BadgeCheck } from 'lucide-react';
import { AIService } from '../services/aiService';
import { SupabaseService } from '../services/supabaseService';
import { parseErrorMessage } from './Auth';

interface DashboardProps {
  user: User;
  submissions: DriveSubmission[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, submissions }) => {
  const [marketIntel, setMarketIntel] = useState<{ text: string; sources: any[] } | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [profiles, setProfiles] = useState<User[]>([]);

  useEffect(() => { 
    fetchIntel(); 
    if (user.role === 'ADMIN') {
      SupabaseService.getAllAgents().then(data => {
        setProfiles(data);
      }).catch(e => console.error(parseErrorMessage(e)));
    }
  }, [user.role]);

  const fetchIntel = async () => { 
    setLoadingIntel(true); 
    try {
      const intel = await AIService.getMarketIntel();
      setMarketIntel(intel); 
    } catch (e) { 
      console.error(parseErrorMessage(e)); 
    }
    setLoadingIntel(false); 
  };

  const agentSubmissions = user.role === 'ADMIN' ? submissions : submissions.filter(s => s.agentId === user.id);

  // Stats Logic
  const totalCommissionPaid = agentSubmissions.filter(s => s.status === 'PAID').reduce((a, b) => a + (b.estimatedCommission || 0), 0);
  const pendingPayouts = agentSubmissions.filter(s => s.status === 'APPROVED').reduce((a, b) => a + (b.estimatedCommission || 0), 0);
  const totalUnits = agentSubmissions.reduce((a, b) => a + (b.noOfUnits || 0), 0);
  
  // Admin stats
  const totalVolume = submissions.reduce((a, b) => a + (b.estimatedCommission || 0), 0);
  const totalPendingPayouts = submissions.filter(s => s.status === 'APPROVED').reduce((a, b) => a + (b.estimatedCommission || 0), 0);
  
  // Agents count: prioritize exhaustive union logic for Admin
  const displayAgentsCount = useMemo(() => {
    if (user.role !== 'ADMIN') return 1;
    const idsFromSubmissions = submissions.map(s => s.agentId);
    const idsFromProfiles = profiles.map(p => p.id);
    return new Set([...idsFromSubmissions, ...idsFromProfiles]).size;
  }, [user.role, submissions, profiles]);

  // Chart Data: last 12 months
  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const result = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIndex = d.getMonth();
      const year = d.getFullYear();
      
      const count = agentSubmissions.filter(s => {
        const subDate = new Date(s.submissionDate);
        return subDate.getFullYear() === year && subDate.getMonth() === mIndex;
      }).length;
      
      result.push({ 
        month: months[mIndex], 
        count,
        label: `${months[mIndex]} ${year}`
      });
    }
    return result;
  }, [agentSubmissions]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-navy-900 tracking-tighter uppercase italic">Welcome, {user.fullName.split(' ')[0]}</h1>
          <p className="text-gray-500 font-medium text-sm">EstateGO Field Operations Terminal</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-navy-900 uppercase tracking-widest">Network Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {user.role === 'ADMIN' ? (
          <>
            <StatCard icon={<Layers className="text-cyan-400" />} title="Total Gross Volume" value={`₦${totalVolume.toLocaleString()}`} subtitle="Aggregated Leads" color="navy" />
            <StatCard icon={<Clock className="text-orange-400" />} title="Pending Payouts" value={`₦${totalPendingPayouts.toLocaleString()}`} subtitle="Awaiting Settlement" color="white" />
            <StatCard icon={<BadgeCheck className="text-emerald-500" />} title="Total Agents" value={displayAgentsCount.toString()} subtitle="Registered Force" color="white" />
            <StatCard icon={<Users className="text-purple-400" />} title="Total Units" value={totalUnits.toLocaleString()} subtitle="Managed Residents" color="white" />
          </>
        ) : (
          <>
            <StatCard icon={<Wallet className="text-cyan-400" />} title="Total Earned (Paid)" value={`₦${totalCommissionPaid.toLocaleString()}`} subtitle="Credited to Bank" color="navy" />
            <StatCard icon={<Clock className="text-orange-400" />} title="Pending Payouts" value={`₦${pendingPayouts.toLocaleString()}`} subtitle="In Approval Flow" color="white" />
            <StatCard icon={<Target className="text-emerald-500" />} title="Activity Rank" value={`${agentSubmissions.length}`} subtitle="Submissions Count" color="white" />
            <StatCard icon={<TrendingUp className="text-purple-500" />} title="Total Units" value={totalUnits.toLocaleString()} subtitle="Onboarded Residents" color="white" />
          </>
        )}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="font-black text-navy-900 uppercase tracking-widest text-sm flex items-center gap-2">
              <BarChart3 size={18} className="text-cyan-500" /> 
              Performance Analytics
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Onboarding frequency (Last 12 Months)</p>
          </div>
          <div className="px-3 py-1 bg-gray-50 rounded-lg text-[9px] font-black text-gray-400 uppercase border border-gray-100">
            Node: FIELD_ACTIVITY_ROLLING
          </div>
        </div>

        <div className="relative h-48 md:h-64 flex items-end justify-between gap-1 md:gap-3 px-1">
          {chartData.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group h-full">
              <div className="relative w-full flex flex-col items-center justify-end h-full pt-10">
                <div className="absolute -top-2 bg-navy-900 text-white text-[9px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 pointer-events-none whitespace-nowrap z-20 shadow-xl border border-navy-700">
                  {data.count} {data.count === 1 ? 'Lead' : 'Leads'} • {data.label}
                </div>
                <div 
                  className={`w-full max-w-[24px] md:max-w-[40px] rounded-t-md md:rounded-t-lg transition-all duration-700 ease-out shadow-sm cursor-pointer hover:brightness-110 ${data.count > 0 ? 'bg-cyan-400' : 'bg-gray-100'}`}
                  style={{ height: `${Math.max((data.count / maxCount) * 100, 2)}%` }}
                />
              </div>
              <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase mt-3 tracking-tighter text-center">
                {data.month}
              </p>
            </div>
          ))}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pt-10 pb-8 opacity-[0.03]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-px bg-navy-900" />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-navy-900 p-6 md:p-10 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-tight"><Sparkles className="text-cyan-400" /> Market Intelligence</h3>
            <button onClick={fetchIntel} disabled={loadingIntel} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
              <RefreshCw size={14} className={loadingIntel ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="text-xs md:text-sm text-navy-100 leading-relaxed font-medium max-w-2xl whitespace-pre-wrap">
            {loadingIntel ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Syncing field trends...</span>
              </div>
            ) : (marketIntel?.text || "Synchronizing with Nigerian prop-tech trends...")}
          </div>
        </div>
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
