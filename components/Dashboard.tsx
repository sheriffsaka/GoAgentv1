
import React, { useEffect, useState } from 'react';
import { User, DriveSubmission } from '../types';
import { Wallet, Users, Target, Clock, ArrowUpRight, CheckCircle, FileText, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { AIService } from '../services/aiService';

interface DashboardProps {
  user: User;
  submissions: DriveSubmission[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, submissions }) => {
  const [marketIntel, setMarketIntel] = useState<{ text: string; sources: any[] } | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  useEffect(() => {
    fetchIntel();
  }, []);

  const fetchIntel = async () => {
    setLoadingIntel(true);
    const intel = await AIService.getMarketIntel();
    setMarketIntel(intel);
    setLoadingIntel(false);
  };

  const agentSubmissions = user.role === 'ADMIN' 
    ? submissions 
    : submissions.filter(s => s.agentId === user.id);

  const totalEarned = agentSubmissions
    .filter(s => s.status === 'PAID')
    .reduce((acc, curr) => acc + curr.estimatedCommission, 0);

  const pendingCommission = agentSubmissions
    .filter(s => s.status !== 'PAID')
    .reduce((acc, curr) => acc + curr.estimatedCommission, 0);

  const totalResidents = agentSubmissions.reduce((acc, curr) => acc + curr.noOfUnits, 0);
  const totalSubmissions = agentSubmissions.length;
  
  // Real Data for Chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const submissionsByMonth = months.map((m, i) => {
    const count = agentSubmissions.filter(s => new Date(s.submissionDate).getMonth() === i).length;
    // Scale for visualization
    const scale = agentSubmissions.length > 0 ? (count / Math.max(...months.map((_, mi) => agentSubmissions.filter(s => new Date(s.submissionDate).getMonth() === mi).length)) * 80) : 5;
    return { month: m, count, value: Math.max(scale, 5) };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Welcome back, {user.fullName.split(' ')[0]}!</h1>
          <p className="text-gray-500 mt-1">Growth activity and market insights for EstateGO.</p>
        </div>
        {user.role === 'AGENT' && (
          <div className="bg-cyan-50 px-4 py-2 rounded-xl border border-cyan-100 flex items-center gap-2">
            <Sparkles className="text-cyan-600" size={18} />
            <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">Top Performing Agent Tier</span>
          </div>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user.role === 'ADMIN' ? (
          <>
            <div className="bg-navy-900 p-6 rounded-2xl shadow-lg text-white">
              <FileText className="mb-4 text-cyan-400" size={28} />
              <p className="text-navy-100 text-sm font-medium uppercase tracking-wider">Total Submitted</p>
              <p className="text-3xl font-bold mt-2">{submissions.length}</p>
              <p className="text-xs text-navy-300 mt-4">All agent leads</p>
            </div>
            <div className="bg-cyan-400 p-6 rounded-2xl shadow-lg text-navy-900">
              <CheckCircle className="mb-4 text-navy-900" size={28} />
              <p className="text-navy-800 text-sm font-medium uppercase tracking-wider">Total Onboarded</p>
              <p className="text-3xl font-bold mt-2">{submissions.filter(s => s.status === 'PAID').length}</p>
              <p className="text-xs text-navy-700 mt-4">Verified & Paid leads</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-navy-900 to-navy-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-white/10 p-8 rounded-full blur-2xl group-hover:bg-cyan-400/20 transition-all duration-500"></div>
              <Wallet className="mb-4 text-cyan-400" size={28} />
              <p className="text-navy-100 text-sm font-medium uppercase tracking-wider">Total Commission Earned</p>
              <p className="text-3xl font-bold mt-2">₦{totalEarned.toLocaleString()}</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-cyan-400">
                <ArrowUpRight size={14} />
                <span>+12.5% from last month</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <Clock className="mb-4 text-orange-500" size={28} />
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Pending Payouts</p>
              <p className="text-3xl font-bold mt-2 text-navy-900">₦{pendingCommission.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-4 italic">7 day processing cycle</p>
            </div>
          </>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <Users className="mb-4 text-cyan-500" size={28} />
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Residents</p>
          <p className="text-3xl font-bold mt-2 text-navy-900">{totalResidents.toLocaleString()}</p>
          <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full w-[65%]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <Target className="mb-4 text-emerald-500" size={28} />
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Estate Cap Track</p>
          <p className="text-3xl font-bold mt-2 text-navy-900">{totalSubmissions} / 1000</p>
          <p className="text-xs text-gray-400 mt-4">12-month rolling period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-navy-900 mb-8">Onboarding Drive Trends</h3>
          <div className="h-64 flex items-stretch justify-between gap-2 px-2 relative">
             <div className="absolute inset-x-0 bottom-0 border-b border-gray-100"></div>
             {submissionsByMonth.map((d, i) => (
               <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10">
                 <div 
                   className="w-full max-w-[28px] bg-navy-900 rounded-t-md transition-all duration-500 ease-out group-hover:bg-cyan-400"
                   style={{ height: `${d.value}%` }}
                 >
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                     {d.count} Leads
                   </div>
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-tighter">
                   {d.month}
                 </span>
               </div>
             ))}
          </div>
        </div>

        {/* AI Market Intel Section */}
        <div className="bg-navy-900 p-8 rounded-2xl shadow-xl text-white flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Sparkles size={120} />
          </div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="text-cyan-400" size={20} />
              AI Market Intel
            </h3>
            <button 
              onClick={fetchIntel} 
              disabled={loadingIntel}
              className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loadingIntel ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="flex-1 text-sm text-navy-100 leading-relaxed overflow-y-auto max-h-60 custom-scrollbar pr-2">
            {loadingIntel ? (
              <div className="space-y-4">
                <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-white/10 rounded animate-pulse w-full" />
                <div className="h-4 bg-white/10 rounded animate-pulse w-5/6" />
              </div>
            ) : (
              <>
                <p>{marketIntel?.text || "Scanning Nigerian real estate news..."}</p>
                {marketIntel?.sources && marketIntel.sources.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">Grounding Sources</p>
                    {marketIntel.sources.map((src, idx) => (
                      <a 
                        key={idx} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[10px] text-navy-200 hover:text-white mb-1 transition-colors"
                      >
                        <ExternalLink size={10} /> {src.title}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
