import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
  SUBMITTED: 'badge-pending',
  UNDER_REVIEW: 'badge-review',
  DRAFT: 'badge-pending',
};

export default function ApplicationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['my-applications', page, statusFilter],
    queryFn: () => api.get(`/loans/my-applications?page=${page}&limit=10${statusFilter ? `&status=${statusFilter}` : ''}`).then(r => r.data.data),
  });

  const applications = data?.applications || [];
  const pagination = data?.pagination;

  const filtered = applications.filter((a: any) =>
    !search || a.loanPurpose?.includes(search.toLowerCase()) || a.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">My Applications</h1>
          <p className="text-slate-400 mt-1">{pagination?.total || 0} total applications</p>
        </div>
        <button onClick={() => navigate('/dashboard/apply')} className="btn-primary">
          New Application
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by purpose..."
            className="input-field pl-10" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field pl-10 pr-8 min-w-[160px]">
            <option value="">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Applications Found</h3>
          <p className="text-slate-400 mb-6">Start your loan journey by submitting an application.</p>
          <button onClick={() => navigate('/dashboard/apply')} className="btn-primary">Apply Now</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any, i: number) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:bg-white/10 transition-all cursor-pointer group"
              onClick={() => navigate(`/dashboard/result/${app.id}`)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    app.status === 'APPROVED' ? 'bg-emerald-500/20' : app.status === 'REJECTED' ? 'bg-red-500/20' : 'bg-amber-500/20'
                  }`}>
                    {app.status === 'APPROVED' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      : app.status === 'REJECTED' ? <XCircle className="w-5 h-5 text-red-400" />
                      : <Clock className="w-5 h-5 text-amber-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-white capitalize">{app.loanPurpose?.replace(/_/g, ' ')} Loan</p>
                    <p className="text-sm text-slate-400">{new Date(app.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-white font-semibold">₹{app.loanAmount?.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs">Loan Amount</p>
                  </div>
                  {app.prediction && (
                    <div className="text-right">
                      <p className="text-white font-semibold">{((app.prediction.confidence || 0) * 100).toFixed(0)}%</p>
                      <p className="text-slate-400 text-xs">Confidence</p>
                    </div>
                  )}
                  <span className={STATUS_COLORS[app.status] || 'badge-pending'}>{app.status}</span>
                </div>
                <Eye className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
              </div>
              {/* Mobile extras */}
              <div className="sm:hidden flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
                <span className={STATUS_COLORS[app.status] || 'badge-pending'}>{app.status}</span>
                <span className="text-sm text-white font-medium">₹{app.loanAmount?.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === i + 1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
