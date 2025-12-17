import React from 'react';
import { User, DriveSubmission } from '../types';
import { Wallet, Users, Target, Clock, ArrowUpRight, CheckCircle, FileText } from 'lucide-react';

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
  
  // Admin Specific Metrics
  const onboardedCount = submissions.filter(s => s.status === 'PAID').length;
  const submittedCount = submissions.length;

  // 12 Months Data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendData = months.map((m, i) => ({
    month: m,
    value: Math.floor(Math.random() * 40) + 10 + (i * 2) // Mock growth
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-navy-900">Welcome back, {user.fullName.split(' ')[0]}!</h1>
        <p className="text-gray-500 mt-1">Here's your growth activity and earnings summary.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user.role === 'ADMIN' ? (
          <>
            <div className="bg-navy-900 p-6 rounded-2xl shadow-lg text-white">
              <FileText className="mb-4 text-cyan-400" size={28} />
              <p className="text-navy-100 text-sm font-medium uppercase tracking-wider">Total Submitted</p>
              <p className="text-3xl font-bold mt-2">{submittedCount}</p>
              <p className="text-xs text-navy-300 mt-4">All agent leads</p>
            </div>
            <div className="bg-cyan-400 p-6 rounded-2xl shadow-lg text-navy-900">
              <CheckCircle className="mb-4 text-navy-900" size={28} />
              <p className="text-navy-800 text-sm font-medium uppercase tracking-wider">Total Onboarded</p>
              <p className="text-3xl font-bold mt-2">{onboardedCount}</p>
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <Clock className="mb-4 text-orange-500" size={28} />
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Pending Payouts</p>
              <p className="text-3xl font-bold mt-2 text-navy-900">₦{pendingCommission.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-4 italic">7 day processing cycle</p>
            </div>
          </>
        )}

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
        {/* Trend Chart - 12 Months */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-8 min-w-[600px]">
            <h3 className="text-lg font-bold text-navy-900">Onboarding Drive Trends (Jan - Dec)</h3>
            <div className="flex gap-2">
               <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-navy-900"></span> Lead Activity</span>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-2 relative min-w-[600px]">
             <div className="absolute inset-0 border-b border-gray-100"></div>
             <div className="absolute top-1/2 left-0 right-0 border-b border-gray-50"></div>
             <div className="absolute top-1/4 left-0 right-0 border-b border-gray-50"></div>
             
             {trendData.map((d, i) => (
               <div key={i} className="flex-1 flex flex-col items-center group relative z-10">
                 <div 
                   className="w-full max-w-[24px] bg-navy-900 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-cyan-400"
                   style={{ height: `${d.value}%` }}
                 >
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                     {d.value}
                   </div>
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 mt-4">{d.month}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-navy-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {agentSubmissions.slice(0, 5).length > 0 ? agentSubmissions.slice(0, 5).map((s) => (
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
        </div>
      </div>
    </div>
  );
};