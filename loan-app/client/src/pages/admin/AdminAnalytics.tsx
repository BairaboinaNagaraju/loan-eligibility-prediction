import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import CountUp from 'react-countup';
import api from '../../lib/api';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then(r => r.data.data),
  });

  const { data: metricsData } = useQuery({
    queryKey: ['model-metrics'],
    queryFn: () => api.get('/admin/model-metrics').then(r => r.data.data),
  });

  if (isLoading) return <div className="space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}</div>;

  const overview = analytics?.overview || {};
  const monthly = analytics?.monthlyTrend || [];
  const byPurpose = analytics?.applicationsByPurpose || [];
  const metrics = metricsData?.metrics || [];

  const purposeData = byPurpose.map((p: any) => ({ name: p.loanPurpose?.replace('_', ' '), count: Number(p._count?.loanPurpose || 0) }));

  const handleExport = async () => {
    const response = await api.get('/admin/applications?limit=1000');
    const apps = response.data.data.applications;
    const csv = [
      'ID,Name,Amount,Purpose,Status,Credit Score,Risk Score,Fraud Score,Date',
      ...apps.map((a: any) => `${a.id},${a.fullName},${a.loanAmount},${a.loanPurpose},${a.status},${a.creditScore},${a.riskScore || ''},${a.fraudScore || ''},${a.submittedAt}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loan_applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-400" /> Analytics & Reports
          </h1>
          <p className="text-slate-400 mt-1">Comprehensive platform performance insights</p>
        </div>
        <button onClick={handleExport} className="btn-secondary gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Approval Rate', value: `${overview.approvalRate}%`, color: 'text-emerald-400' },
          { label: 'Avg Credit Score', value: overview.avgCreditScore, color: 'text-blue-400' },
          { label: 'Fraud Alerts', value: overview.fraudAlerts, color: 'text-red-400' },
          { label: 'Loans Disbursed', value: `₹${((overview.totalLoanDisbursed || 0) / 10000000).toFixed(1)}Cr`, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5">
            <p className={`text-3xl font-bold ${color}`}>{typeof value === 'number' ? <CountUp end={value} duration={1.5} /> : value}</p>
            <p className="text-slate-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trend Line Chart */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-white mb-4">6-Month Application Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthly.length > 0 ? monthly : [{ month: 'No Data', total: 0, approved: 0, rejected: 0 }]}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Total" />
            <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Approved" />
            <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} name="Rejected" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Loan Purpose Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Loan Purpose Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={purposeData.length > 0 ? purposeData : [{ name: 'None', count: 0 }]}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {purposeData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ML Model Comparison */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">ML Model Performance</h3>
          {metrics.length > 0 ? (
            <div className="space-y-3">
              {metrics.map((m: any) => (
                <div key={m.id} className={`p-3 rounded-xl ${m.isBest ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{m.modelName}</span>
                    {m.isBest && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Best Model</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-400">
                    {[['Acc', m.accuracy], ['Prec', m.precision], ['Recall', m.recall], ['F1', m.f1Score]].map(([label, value]) => (
                      <div key={String(label)}>
                        <span className="text-slate-500">{label}</span>
                        <span className="block text-white font-medium">{(Number(value) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-400">No model metrics available yet.</p>
              <p className="text-slate-500 text-xs mt-2">Run the ML training script to generate metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
