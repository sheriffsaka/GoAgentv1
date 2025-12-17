import React, { useState } from 'react';
import { DriveSubmission, SubmissionStatus } from '../types';
import { Search, Download, CheckCircle, CreditCard, Send, MoreHorizontal, Filter } from 'lucide-react';

interface AdminPortalProps {
  submissions: DriveSubmission[];
  onUpdateStatus: (id: string, status: SubmissionStatus) => Promise<void>;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ submissions, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [updating, setUpdating] = useState<string | null>(null);

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.agentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const headers = ["ID", "Agent", "Property", "Units", "Status", "Commission", "Date"];
    const rows = filteredSubmissions.map(s => [
      s.id, s.agentName, s.propertyName, s.noOfUnits, s.status, s.estimatedCommission, s.submissionDate
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `goagent_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusUpdate = async (id: string, status: SubmissionStatus) => {
    setUpdating(id);
    await onUpdateStatus(id, status);
    setUpdating(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Admin Review Portal</h2>
          <p className="text-gray-500">Manage submissions and process commission payouts.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download size={18} /> Export Marketing Data
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search properties or agents..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-900 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
             <Filter size={18} className="text-gray-400" />
             <select 
               className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 outline-none"
               value={filter}
               onChange={(e) => setFilter(e.target.value as any)}
             >
               <option value="ALL">All Statuses</option>
               <option value="PENDING">Pending</option>
               <option value="APPROVED">Approved</option>
               <option value="PAID">Paid</option>
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b">
                <th className="px-6 py-4">Property & Agent</th>
                <th className="px-6 py-4">Units</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSubmissions.length > 0 ? filteredSubmissions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-sm font-bold text-navy-900">{s.propertyName}</p>
                      <p className="text-xs text-gray-500 mt-1">Reported by <span className="text-navy-900 font-medium">{s.agentName}</span></p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-600">{s.noOfUnits} Units</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
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
                       {s.status === 'PENDING' && (
                         <button 
                           onClick={() => handleStatusUpdate(s.id, 'APPROVED')}
                           disabled={updating === s.id}
                           className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                           title="Approve Lead"
                         >
                           <CheckCircle size={20} />
                         </button>
                       )}
                       {s.status === 'APPROVED' && (
                         <button 
                           onClick={() => handleStatusUpdate(s.id, 'PAID')}
                           disabled={updating === s.id}
                           className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                           title="Mark Payment Received"
                         >
                           <CreditCard size={20} />
                         </button>
                       )}
                       {s.status === 'PAID' && (
                          <span className="text-emerald-500"><Send size={18} /></span>
                       )}
                       <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                         <MoreHorizontal size={20} />
                       </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                    No submissions found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};