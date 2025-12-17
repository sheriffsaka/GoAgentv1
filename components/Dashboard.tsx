import React from 'react';
import { User, DriveSubmission } from '../types';
import { Wallet, Users, Target, Clock, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  user: User;
  submissions: DriveSubmission[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, submissions }) => {
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

  // Simple Trend Data Generation
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const trendData = months.map((m, i) => ({
    month: m,
    value: Math.floor(Math.random() * 40) + 10 + (i * 5)
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-navy-900">Welcome back, {user.fullName.split(' ')[0]}!</h1>
        <p className="text-gray-500 mt-1">Here's your growth activity and earnings summary.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <Clock className="mb-4 text-orange-500" size={28} />
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Pending Payouts</p>
          <p className="text-3xl font-bold mt-2 text-navy-900">₦{pendingCommission.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-4 italic">7 day processing cycle</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <Users className="mb-4 text-cyan-500" size={28} />
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Residents</p>
          <p className="text-3xl font-bold mt-2 text-navy-900">{totalResidents.toLocaleString()}</p>
          <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full w-[65%]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <Target className="mb-4 text-emerald-500" size={28} />
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Estate Cap Track</p>
          <p className="text-3xl font-bold mt-2 text-navy-900">{totalSubmissions} / 1000</p>
          <p className="text-xs text-gray-400 mt-4">12-month rolling period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart - Custom SVG */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-navy-900">Onboarding Drive Trends</h3>
            <select className="text-sm border-none bg-gray-50 rounded-lg px-3 py-1 text-gray-600 outline-none">
              <option>Last 6 Months</option>
              <option>Year to Date</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-4 relative">
             {/* Simple Grid Lines */}
             <div className="absolute inset-0 border-b border-gray-100"></div>
             <div className="absolute top-1/2 left-0 right-0 border-b border-gray-50"></div>
             <div className="absolute top-1/4 left-0 right-0 border-b border-gray-50"></div>
             
             {trendData.map((d, i) => (
               <div key={i} className="flex-1 flex flex-col items-center group relative z-10">
                 <div 
                   className="w-full max-w-[40px] bg-navy-900 rounded-t-lg transition-all duration-500 ease-out group-hover:bg-cyan-400"
                   style={{ height: `${d.value}%` }}
                 >
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                     {d.value} Units
                   </div>
                 </div>
                 <span className="text-xs font-medium text-gray-400 mt-4">{d.month}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-navy-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {agentSubmissions.slice(0, 4).length > 0 ? agentSubmissions.slice(0, 4).map((s) => (
              <div key={s.id} className="flex gap-4 items-start">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                  s.status === 'PAID' ? 'bg-emerald-500' : s.status === 'APPROVED' ? 'bg-cyan-500' : 'bg-orange-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 truncate">{s.propertyName}</p>
                  <p className="text-xs text-gray-500">{new Date(s.submissionDate).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-bold text-navy-900">₦{s.estimatedCommission.toLocaleString()}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400 italic text-sm">
                No drives reported yet.
              </div>
            )}
          </div>
          {agentSubmissions.length > 0 && (
            <button className="w-full mt-8 py-2 text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors border-t pt-4">
              View All Reports
            </button>
          )}
        </div>
      </div>
    </div>
  );
};