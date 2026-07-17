import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Users, FileText, CheckCircle2, AlertTriangle, TrendingUp, Brain, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import api from '../../lib/api';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then(r => r.data.data),
  });

  if (isLoading) return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  );

  const overview = analytics?.overview || {};
  const byStatus = analytics?.applicationsByStatus || [];
  const byPurpose = analytics?.applicationsByPurpose || [];
  const monthly = analytics?.monthlyTrend || [];
  const recent = analytics?.recentApplications || [];

  const statusData = byStatus.map((s: any) => ({ name: s.status, value: Number(s._count) }));
  const purposeData = byPurpose.map((p: any) => ({ name: p.loanPurpose?.replace('_', ' '), value: Number(p._count.loanPurpose) }));

  const statCards = [
    { label: 'Total Users', value: overview.totalUsers || 0, icon: Users, color: 'from-blue-500 to-cyan-500', change: '+12%' },
    { label: 'Total Applications', value: overview.totalApplications || 0, icon: FileText, color: 'from-violet-500 to-purple-600', change: '+8%' },
    { label: 'Approval Rate', value: `${overview.approvalRate || 0}%`, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500', change: '+2%' },
    { label: 'Fraud Alerts', value: overview.fraudAlerts || 0, icon: AlertTriangle, color: 'from-red-500 to-rose-600', change: '-5%' },
    { label: 'Loan Disbursed', value: `₹${((overview.totalLoanDisbursed || 0) / 10000000).toFixed(1)}Cr`, icon: DollarSign, color: 'from-amber-500 to-orange-500', change: '+15%' },
    { label: 'Avg Credit Score', value: overview.avgCreditScore || 0, icon: Brain, color: 'from-indigo-500 to-blue-600', change: '+3%' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Platform overview and analytics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, change }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} bg-opacity-20 flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">{typeof value === 'number' ? <CountUp end={value} duration={1.5} /> : value}</div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
            <div className={`text-xs mt-1 font-medium ${change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{change} this month</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="glass-card p-6 xl:col-span-2">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" /> Monthly Application Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly.length > 0 ? monthly : [{ month: 'No Data', total: 0 }]}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="apprGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#totalGrad)" strokeWidth={2} name="Total" />
              <Area type="monotone" dataKey="approved" stroke="#10b981" fill="url(#apprGrad)" strokeWidth={2} name="Approved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Application Status Pie */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Applications by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData.length > 0 ? statusData : [{ name: 'None', value: 1 }]} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                style={{ fontSize: '10px', fill: '#94a3b8' }}>
                {statusData.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Loan Purpose Bar Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Applications by Purpose</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={purposeData.length > 0 ? purposeData : [{ name: 'None', value: 0 }]} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {purposeData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Applications */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Recent Applications</h3>
          <div className="space-y-3">
            {recent.slice(0, 5).map((app: any) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                    {app.user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{app.user?.fullName}</p>
                    <p className="text-xs text-slate-400">₹{app.loanAmount?.toLocaleString()}</p>
                  </div>
                </div>
                <span className={app.status === 'APPROVED' ? 'badge-approved' : app.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
