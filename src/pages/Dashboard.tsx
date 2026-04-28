import { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Candidate } from '../types';
import { Search, Filter, Eye, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { candidates, updateCandidateStatus } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const [statusChangeModal, setStatusChangeModal] = useState<{id: string, status: Candidate['status']} | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const filteredCandidates = candidates.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgSkill = candidates.length > 0 
    ? Math.round(candidates.reduce((acc, c) => acc + c.scores.skill, 0) / candidates.length)
    : 0;

  const biasFlags = candidates.filter(c => c.scores.biasOriginal > 70).length;

  const handleStatusChangeClick = (id: string, newStatus: Candidate['status']) => {
    setStatusChangeModal({ id, status: newStatus });
  };

  const confirmStatusChange = () => {
    if (statusChangeModal && statusReason) {
      updateCandidateStatus(statusChangeModal.id, statusChangeModal.status, statusReason);
      setStatusChangeModal(null);
      setStatusReason('');
    }
  };

  const shortlistedCandidates = candidates.filter(c => c.status === 'Shortlisted');
  
  // Aggregate demographics for shortlisted candidates
  const genderData = Object.entries(
    shortlistedCandidates.reduce((acc, cand) => {
      const g = cand.demographics?.gender || 'Unknown';
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));
  
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', value: candidates.length, color: 'text-gray-900' },
          { label: 'Shortlisted', value: shortlistedCandidates.length, color: 'text-emerald-600' },
          { label: 'Avg Skill Score', value: avgSkill, color: 'text-blue-600' },
          { label: 'Bias Flags Raised', value: biasFlags, color: 'text-red-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <p className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={cn("text-3xl font-bold tracking-tight", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {genderData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <p className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Shortlisted Candidates Demographics (Gender)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by ID or Status..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:text-blue-700">
            <Filter size={14} /> Filter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Anonymized ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Skill Score</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bias Score (Orig)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fit Score</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No candidates found. <Link to="/upload" className="text-blue-600 font-medium hover:underline">Upload a resume</Link>.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-semibold text-sm">{c.id}</td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={c.scores.skill} />
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={c.scores.biasOriginal} invertColors />
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={c.scores.fit} />
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={c.status}
                        onChange={(e) => handleStatusChangeClick(c.id, e.target.value as any)}
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold border-none appearance-none pr-6 relative bg-no-repeat focus:outline-none focus:ring-1 focus:ring-black",
                          c.status === 'Shortlisted' ? "bg-emerald-50 text-emerald-600" :
                          c.status === 'Reviewed' ? "bg-amber-50 text-amber-600" :
                          c.status === 'Rejected' ? "bg-red-50 text-red-600" :
                          "bg-gray-100 text-gray-600"
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.25rem center',
                          backgroundSize: '1em 1em'
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedCandidate(c)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-xs transition-colors"
                      >
                        <Eye size={14} /> Audit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Change Modal */}
      {statusChangeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-mono text-gray-900">Change Status</h3>
              <button 
                onClick={() => setStatusChangeModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Provide a reason for overriding or updating the candidate's status to <strong>{statusChangeModal.status}</strong>. This will be recorded in the audit log.
            </p>
            <textarea
              className="w-full h-[100px] p-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-black focus:outline-none resize-none mb-4"
              placeholder="e.g., Passed technical screen..."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStatusChangeModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={!statusReason}
                className="px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold font-mono text-gray-900">{selectedCandidate.id} Audit Report</h3>
                <p className="text-sm text-gray-500 mt-1">Processed on {new Date(selectedCandidate.uploadDate).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Scores</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Skill Match</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedCandidate.scores.skill}/100</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Overall Fit</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedCandidate.scores.fit}/100</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Bias Risk (Orig)</p>
                      <p className="text-2xl font-bold text-red-600">{selectedCandidate.scores.biasOriginal}/100</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Bias Risk (Anon)</p>
                      <p className="text-2xl font-bold text-emerald-600">{selectedCandidate.scores.biasAnonymized}/100</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Extracted Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.technical.map(s => <span key={s} className="px-2 py-1 bg-gray-100 text-gray-900 rounded-md text-xs font-semibold">{s}</span>)}
                    {selectedCandidate.skills.soft.map(s => <span key={s} className="px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded-md text-xs font-semibold">{s}</span>)}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">AI Explanation (SHAP Proxy)</h4>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
                    "{selectedCandidate.explanation}"
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Anonymized Resume View</h4>
                <div className="bg-[#1A1A1A] text-gray-300 p-4 rounded-2xl font-mono text-sm leading-relaxed whitespace-pre-wrap h-[400px] overflow-y-auto shadow-inner">
                  {selectedCandidate.anonymizedText}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score, invertColors = false }: { score: number, invertColors?: boolean }) {
  let colorClass = "";
  if (invertColors) {
    if (score < 40) colorClass = "bg-emerald-50 text-emerald-600";
    else if (score < 70) colorClass = "bg-amber-50 text-amber-600";
    else colorClass = "bg-red-50 text-red-600";
  } else {
    if (score > 75) colorClass = "bg-emerald-50 text-emerald-600";
    else if (score > 50) colorClass = "bg-amber-50 text-amber-600";
    else colorClass = "bg-red-50 text-red-600";
  }

  return (
    <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest", colorClass)}>
      {score}
    </span>
  );
}
