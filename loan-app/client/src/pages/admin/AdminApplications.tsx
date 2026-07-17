import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Eye, CheckCircle2, XCircle, Clock, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const STATUS_OPTS = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function AdminApplications() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-applications', page, statusFilter, search],
    queryFn: () => api.get(`/admin/applications?page=${page}&limit=15${statusFilter ? `&status=${statusFilter}` : ''}${search ? `&search=${search}` : ''}`).then(r => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/applications/${id}/status`, { status }),
    onSuccess: () => { toast.success('Application status updated'); qc.invalidateQueries({ queryKey: ['admin-applications'] }); },
    onError: () => toast.error('Update failed'),
  });

  const applications = data?.applications || [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Loan Applications</h1>
        <p className="text-slate-400 mt-1">{data?.pagination?.total || 0} total applications</p>
      </div>

      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search applications..." className="input-field pl-10" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field pl-10 min-w-[160px]">
            <option value="">All Status</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-slate-500 text-xs uppercase">
                  <th className="p-4 text-left">Applicant</th>
                  <th className="p-4 text-left">Loan Details</th>
                  <th className="p-4 text-left">AI Result</th>
                  <th className="p-4 text-left">Risk</th>
                  <th className="p-4 text-left">Fraud</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {applications.map((app: any, i: number) => (
                  <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {app.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{app.user?.fullName}</p>
                          <p className="text-xs text-slate-400">{app.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white font-medium">₹{app.loanAmount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 capitalize">{app.loanPurpose?.replace('_', ' ')} · {app.loanTerm}mo</p>
                    </td>
                    <td className="p-4">
                      {app.prediction ? (
                        <div>
                          <span className={app.prediction.verdict === 'APPROVED' ? 'badge-approved' : 'badge-rejected'}>
                            {app.prediction.verdict}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">{((app.prediction.confidence || 0) * 100).toFixed(0)}% confidence</p>
                        </div>
                      ) : <span className="text-slate-500 text-xs">Pending</span>}
                    </td>
                    <td className="p-4">
                      {app.prediction?.riskScore != null ? (
                        <div>
                          <p className="font-medium text-white">{app.prediction.riskScore.toFixed(1)}</p>
                          <p className="text-xs text-slate-400">{app.prediction.riskLevel}</p>
                        </div>
                      ) : <span className="text-slate-500 text-xs">—</span>}
                    </td>
                    <td className="p-4">
                      {app.prediction?.fraudScore != null ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          app.prediction.fraudScore > 0.6 ? 'bg-red-500/20 text-red-400' :
                          app.prediction.fraudScore > 0.3 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>{(app.prediction.fraudScore * 100).toFixed(0)}%</span>
                      ) : <span className="text-slate-500 text-xs">—</span>}
                    </td>
                    <td className="p-4">
                      <span className={app.status === 'APPROVED' ? 'badge-approved' : app.status === 'REJECTED' ? 'badge-rejected' : app.status === 'UNDER_REVIEW' ? 'badge-review' : 'badge-pending'}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/dashboard/result/${app.id}`)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' ? (
                          <>
                            <button onClick={() => updateStatus.mutate({ id: app.id, status: 'APPROVED' })}
                              className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all" title="Approve">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => updateStatus.mutate({ id: app.id, status: 'REJECTED' })}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => updateStatus.mutate({ id: app.id, status: 'UNDER_REVIEW' })}
                              className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" title="Under Review">
                              <Clock className="w-4 h-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
