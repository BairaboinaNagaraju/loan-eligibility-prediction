import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FileText, CheckCircle, XCircle, Clock, BarChart2,
  RefreshCw, Download, Trash2, Search, Filter, AlertCircle,
  ChevronLeft, ChevronRight, Cpu, TrendingUp, ShieldAlert,
  RotateCcw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, PieChart, Pie
} from 'recharts';
import { adminService } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const StatusBadge = ({ status }) => {
  const cfg = {
    Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${cfg[status] || cfg.Pending}`}>
      {status}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="glass-card rounded-2xl p-5 space-y-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  </div>
);

const PROP_COLORS = ['#6366f1', '#22c55e', '#f59e0b'];

export default function AdminPanel() {
  const { darkMode } = useTheme();
  const axisStyle = { fill: darkMode ? '#64748b' : '#94a3b8', fontSize: 11 };

  const [dashboardData, setDashboardData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [totalApps, setTotalApps] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [error, setError] = useState('');
  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const LIMIT = 15;

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load admin dashboard. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setAppsLoading(true);
    try {
      const data = await adminService.getApplications({
        page,
        limit: LIMIT,
        search: search || undefined,
        status_filter: statusFilter || undefined,
      });
      setApplications(data.applications || []);
      setTotalApps(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => { if (activeTab === 'applications') fetchApplications(); }, [activeTab, page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await adminService.updateStatus(id, newStatus);
      fetchApplications();
    } catch (err) {
      alert(`Failed to update status: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this application?')) return;
    try {
      await adminService.deleteApplication(id);
      fetchApplications();
    } catch (err) {
      alert('Failed to delete application');
    }
  };

  const handleExportCSV = async () => {
    try {
      await adminService.exportCSV();
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleRetrain = async () => {
    if (!window.confirm('Retrain the ML model? This will run train.py and may take 30–90 seconds.')) return;
    setRetraining(true);
    setRetrainResult(null);
    try {
      const result = await adminService.retrain();
      setRetrainResult({ success: true, ...result });
      fetchDashboard(); // Refresh metrics
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      setRetrainResult({ success: false, error: detail });
    } finally {
      setRetraining(false);
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {[1,2,3,4,5,6].map(n => <div key={n} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle className="w-12 h-12 text-rose-500" />
      <p className="font-semibold text-slate-900 dark:text-white">{error}</p>
      <button onClick={fetchDashboard} className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm">
        Retry
      </button>
    </div>
  );

  const { summary, charts } = dashboardData;
  const mlMetrics = charts?.ml_metrics;
  const featureImportances = mlMetrics?.feature_importances
    ? Object.entries(mlMetrics.feature_importances)
        .map(([name, value]) => ({ name, value: Math.round(value * 100) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    : [];

  const modelResults = mlMetrics?.results
    ? Object.entries(mlMetrics.results).map(([name, metrics]) => ({
        name,
        Accuracy: Math.round(metrics.Accuracy * 100),
        F1: Math.round(metrics['F1 Score'] * 100),
        AUC: Math.round(metrics['ROC AUC'] * 100),
        isBest: name === mlMetrics.best_model_name,
      }))
    : [];

  const totalPages = Math.ceil(totalApps / LIMIT);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
            Admin Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">System-wide loan analytics, model management, and user administration</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition-all"
          >
            <Download className="w-4 h-4" />Export CSV
          </button>
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-primary-600 hover:from-violet-700 hover:to-primary-700 text-white font-bold text-sm transition-all shadow-lg shadow-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {retraining ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />Retraining...</>
            ) : (
              <><RotateCcw className="w-4 h-4" />Retrain AI Model</>
            )}
          </button>
        </div>
      </div>

      {/* Retrain Result Banner */}
      <AnimatePresence>
        {retrainResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl border flex gap-3 items-start ${
              retrainResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
            }`}
          >
            {retrainResult.success
              ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${retrainResult.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {retrainResult.success ? retrainResult.message : 'Retraining Failed'}
              </p>
              {retrainResult.training_log && (
                <pre className="mt-2 text-xs bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-auto max-h-32 font-mono whitespace-pre-wrap">
                  {retrainResult.training_log}
                </pre>
              )}
              {retrainResult.error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{retrainResult.error}</p>
              )}
            </div>
            <button onClick={() => setRetrainResult(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/40 rounded-xl w-fit">
        {['overview', 'applications', 'ml_models'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'applications' ? 'Applications' : 'ML Models'}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ──────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <StatCard icon={FileText} label="Total Applications" value={summary.total_applications}
              color="bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400" />
            <StatCard icon={Users} label="Registered Users" value={summary.total_users}
              color="bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400" />
            <StatCard icon={TrendingUp} label="System Approval Rate" value={`${summary.approval_rate}%`}
              color="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={CheckCircle} label="Approved Loans" value={summary.approved_loans}
              color="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={XCircle} label="Rejected Loans" value={summary.rejected_loans}
              color="bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" />
            <StatCard icon={Cpu} label="Active Model Accuracy" value={`${summary.model_accuracy}%`}
              sub={summary.active_model}
              color="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Education Stats */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 text-sm">
                <BarChart2 className="w-4 h-4 text-primary-500" />Approval by Education
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.education_stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="category" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Total" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Property Area */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 text-sm">
                <BarChart2 className="w-4 h-4 text-primary-500" />Applications by Property Area
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={charts.property_stats} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {charts.property_stats.map((_, i) => <Cell key={i} fill={PROP_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Credit History */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 text-sm">
                <BarChart2 className="w-4 h-4 text-primary-500" />Credit History Impact
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.credit_stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="category" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="Approved" fill="#3b66e8" name="Approved" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Total" fill="#cbd5e1" name="Total" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Income Buckets */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 text-sm">
                <BarChart2 className="w-4 h-4 text-primary-500" />Income Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.income_buckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="range" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ─── Applications Tab ──────────────────────────── */}
      {activeTab === 'applications' && (
        <div className="space-y-5">
          {/* Search & Filter */}
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username, area..."
                className="w-full py-2.5 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending">Pending</option>
            </select>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all flex items-center gap-2">
              <Search className="w-4 h-4" />Search
            </button>
          </form>

          <div className="glass-card rounded-2xl overflow-hidden">
            {appsLoading ? (
              <div className="p-10 text-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin mx-auto" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/30">
                        <th className="px-4 py-3 text-left font-semibold">ID</th>
                        <th className="px-4 py-3 text-left font-semibold">User</th>
                        <th className="px-4 py-3 text-left font-semibold">Loan</th>
                        <th className="px-4 py-3 text-left font-semibold">AI Decision</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Date</th>
                        <th className="px-4 py-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-400">#{app.id}</td>
                          <td className="px-4 py-3.5">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-xs">{app.username}</p>
                              <p className="text-[10px] text-slate-400">{app.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-xs">${(app.loan_amount * 1000)?.toLocaleString()}</td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={app.prediction} />
                          </td>
                          <td className="px-4 py-3.5">
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                              className={`text-xs font-bold rounded-lg px-2 py-1 border focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                                app.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' :
                                app.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400' :
                                'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-slate-400">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => handleDelete(app.id)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400">{totalApps} total applications</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Page {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── ML Models Tab ─────────────────────────────── */}
      {activeTab === 'ml_models' && mlMetrics && (
        <div className="space-y-6">
          {/* Champion Model Banner */}
          <div className="glass-card rounded-2xl p-6 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-violet-500 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Champion Model</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{mlMetrics.best_model_name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Selected by highest F1 Score
                </p>
              </div>
            </div>
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-primary-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60"
            >
              {retraining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              {retraining ? 'Retraining...' : 'Retrain Now'}
            </button>
          </div>

          {/* Feature Importance */}
          {featureImportances.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 text-sm">
                <BarChart2 className="w-4 h-4 text-primary-500" />Feature Importance Weights
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={featureImportances} layout="vertical">
                  <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={130} tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Importance']}
                    contentStyle={{ background: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {featureImportances.map((_, i) => (
                      <Cell key={i} fill={`hsl(${220 + i * 20}, 80%, ${55 + i * 4}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Model Comparison Table */}
          {modelResults.length > 0 && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Model Comparison Report</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cross-validation results on 20% holdout test set</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30">
                      <th className="px-5 py-3 text-left font-semibold">Model</th>
                      <th className="px-5 py-3 text-right font-semibold">Accuracy</th>
                      <th className="px-5 py-3 text-right font-semibold">F1 Score</th>
                      <th className="px-5 py-3 text-right font-semibold">ROC AUC</th>
                      <th className="px-5 py-3 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {modelResults.sort((a, b) => b.F1 - a.F1).map((m) => (
                      <tr key={m.name} className={`transition-colors ${m.isBest ? 'bg-primary-50/50 dark:bg-primary-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'}`}>
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            {m.name}
                            {m.isBest && <span className="text-[10px] font-extrabold text-white bg-primary-500 px-2 py-0.5 rounded-full">CHAMPION</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-sm">{m.Accuracy}%</td>
                        <td className="px-5 py-3.5 text-right font-mono text-sm font-bold text-primary-600 dark:text-primary-400">{m.F1}%</td>
                        <td className="px-5 py-3.5 text-right font-mono text-sm">{m.AUC}%</td>
                        <td className="px-5 py-3.5 text-right">
                          {m.isBest
                            ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle className="w-3 h-3" />Active</span>
                            : <span className="text-xs text-slate-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ml_models' && !mlMetrics && (
        <div className="glass-card rounded-2xl p-10 text-center space-y-4">
          <Cpu className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="font-bold text-slate-900 dark:text-white">No Model Metrics Found</p>
          <p className="text-sm text-slate-500">Run the training script or use the Retrain button above to train the ML model.</p>
          <button onClick={handleRetrain} disabled={retraining} className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all disabled:opacity-60">
            {retraining ? 'Retraining...' : 'Train ML Model'}
          </button>
        </div>
      )}
    </div>
  );
}
