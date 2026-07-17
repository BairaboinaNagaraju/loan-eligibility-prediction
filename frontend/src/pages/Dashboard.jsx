import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle, XCircle, Clock, TrendingUp,
  ArrowRight, Trash2, Eye, AlertCircle, Cpu, BarChart2,
  PlusCircle, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { loanService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const StatusBadge = ({ status }) => {
  const cfg = {
    Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  };
  const Icon = { Approved: CheckCircle, Rejected: XCircle, Pending: Clock }[status] || Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg[status] || cfg.Pending}`}>
      <Icon className="w-3 h-3" />{status}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="glass-card rounded-2xl p-6 space-y-3"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  </motion.div>
);

const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const axisStyle = { fill: darkMode ? '#64748b' : '#94a3b8', fontSize: 11 };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await loanService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application record permanently?')) return;
    setDeletingId(id);
    try {
      await loanService.deleteApplication(id);
      fetchDashboard();
    } catch (err) {
      alert('Failed to delete the application');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[1,2,3,4].map(n => <div key={n} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1,2].map(n => <div key={n} className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-rose-500" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dashboard Unavailable</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{error}</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />Retry
        </button>
        <Link
          to="/dashboard/apply"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <PlusCircle className="w-4 h-4" />Apply First
        </Link>
      </div>
    </div>
  );

  const { summary, recent_applications, charts } = dashboardData;

  // Pie chart data
  const statusPieData = [
    { name: 'Approved', value: summary.approved },
    { name: 'Rejected', value: summary.rejected },
    { name: 'Pending', value: summary.pending },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Welcome back, {user?.full_name || user?.username}! 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your AI loan evaluation sandbox and application history
          </p>
        </div>
        <Link
          to="/dashboard/apply"
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-all shadow-lg shadow-primary-500/20"
        >
          <Cpu className="w-4 h-4" />
          New AI Prediction
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <StatCard icon={FileText} label="Total Applications" value={summary.total}
          color="bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400" />
        <StatCard icon={CheckCircle} label="Approved" value={summary.approved}
          sub={`${summary.approval_rate}% approval rate`}
          color="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={XCircle} label="Rejected" value={summary.rejected}
          color="bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" />
        <StatCard icon={TrendingUp} label="Approval Rate" value={`${summary.approval_rate}%`}
          color="bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400" />
      </div>

      {/* Empty state */}
      {summary.total === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto">
            <Cpu className="w-10 h-10 text-primary-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Applications Yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              Submit your first loan application to get an instant AI eligibility prediction with Explainable AI insights.
            </p>
          </div>
          <Link
            to="/dashboard/apply"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all"
          >
            <Cpu className="w-5 h-5" />
            Submit AI Application
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Charts Row */}
      {summary.total > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          {charts?.monthly_trends?.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                Monthly Application Trends
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={charts.monthly_trends}>
                  <defs>
                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="Approved" stroke="#22c55e" strokeWidth={2} fill="url(#colorApproved)" />
                  <Area type="monotone" dataKey="Rejected" stroke="#ef4444" strokeWidth={2} fill="url(#colorRejected)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Status Pie or Credit History Bar */}
          {statusPieData.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary-500" />
                Application Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val, name]} contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Property Area Bar Chart */}
      {summary.total > 0 && charts?.property_area?.some(d => d.value > 0) && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary-500" />
            Applications by Property Area
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={charts.property_area}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="value" fill="#3b66e8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Applications Table */}
      {recent_applications?.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              Recent Applications
            </h3>
            <Link to="/dashboard/apply" className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1">
              New Application <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="px-6 py-3 text-left font-semibold">ID</th>
                  <th className="px-6 py-3 text-left font-semibold">Loan</th>
                  <th className="px-6 py-3 text-left font-semibold">Confidence</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {recent_applications.map((app, idx) => (
                  <motion.tr
                    key={app.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{app.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      ${(app.loan_amount * 1000).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${app.prediction === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${(app.confidence_score || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {((app.confidence_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/dashboard/result/${app.id}`)}
                          className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          disabled={deletingId === app.id}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
