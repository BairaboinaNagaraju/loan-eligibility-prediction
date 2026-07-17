import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  FileText, CheckCircle2, XCircle, Clock, Plus, ArrowRight,
  TrendingUp, CreditCard, Shield, Zap
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { RootState } from '../../store';
import api from '../../lib/api';

const areaData = [
  { month: 'Jan', score: 680 }, { month: 'Feb', score: 695 }, { month: 'Mar', score: 710 },
  { month: 'Apr', score: 725 }, { month: 'May', score: 740 }, { month: 'Jun', score: 780 },
];

function CreditHealthGauge({ score }: { score: number }) {
  const percentage = ((score - 300) / 600) * 100;
  const angle = (percentage / 100) * 180 - 90;

  const getColor = (s: number) => {
    if (s >= 750) return '#10b981'; // green
    if (s >= 700) return '#3b82f6'; // blue
    if (s >= 650) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          {/* Background arc */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" strokeLinecap="round" />
          {/* Colored arc */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 251} 251`} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
          {/* Needle */}
          <line x1="100" y1="100" x2="100" y2="30"
            stroke="white" strokeWidth="3" strokeLinecap="round"
            transform={`rotate(${angle}, 100, 100)`} />
          <circle cx="100" cy="100" r="6" fill="white" />
          {/* Score */}
          <text x="100" y="80" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">{score}</text>
        </svg>
      </div>
      <p className="text-sm font-medium mt-1" style={{ color }}>
        {score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Poor'} Credit
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/users/dashboard-stats').then(r => r.data.data),
  });

  const { data: appsData } = useQuery({
    queryKey: ['my-applications-recent'],
    queryFn: () => api.get('/loans/my-applications?limit=5').then(r => r.data.data),
  });

  const statCards = [
    { label: 'Total Applications', value: stats?.stats?.totalApps || 0, icon: FileText, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10' },
    { label: 'Approved', value: stats?.stats?.approved || 0, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10' },
    { label: 'Rejected', value: stats?.stats?.rejected || 0, icon: XCircle, color: 'from-red-500 to-rose-500', bg: 'bg-red-500/10' },
    { label: 'Under Review', value: stats?.stats?.pending || 0, icon: Clock, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10' },
  ];

  const quickActions = [
    { label: 'Apply for Loan', icon: Plus, path: '/dashboard/apply', color: 'from-blue-600 to-violet-600' },
    { label: 'EMI Calculator', icon: CreditCard, path: '/dashboard/calculator', color: 'from-emerald-600 to-teal-600' },
    { label: 'My Applications', icon: FileText, path: '/dashboard/applications', color: 'from-amber-600 to-orange-600' },
    { label: 'Profile & KYC', icon: Shield, path: '/dashboard/profile', color: 'from-rose-600 to-pink-600' },
  ];

  if (isLoading) return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1">Here's your financial overview</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard/apply')}
          className="btn-primary hidden md:flex"
        >
          <Plus className="w-4 h-4" /> New Application
        </motion.button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5"
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 bg-gradient-to-r ${color} bg-clip-text`} style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' }} />
            </div>
            <div className="text-3xl font-bold text-white">
              <CountUp end={value} duration={1.5} />
            </div>
            <div className="text-sm text-slate-400 mt-1">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white">Credit Health</h2>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <CreditHealthGauge score={stats?.latestPrediction?.riskScore ? Math.max(300, 850 - (stats.latestPrediction.riskScore * 6)) : 720} />
          <div className="mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="url(#scoreGrad)" strokeWidth={2} dot={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">6-month score trend</p>
        </motion.div>

        {/* Latest Prediction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="font-display font-semibold text-white mb-4">Latest AI Result</h2>
          {stats?.latestPrediction ? (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-xl ${
                stats.latestPrediction.verdict === 'APPROVED' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
              }`}>
                {stats.latestPrediction.verdict === 'APPROVED'
                  ? <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                  : <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />}
                <div>
                  <p className={`text-xl font-bold ${stats.latestPrediction.verdict === 'APPROVED' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats.latestPrediction.verdict}
                  </p>
                  <p className="text-sm text-slate-400">
                    {((stats.latestPrediction.confidence || 0.5) * 100).toFixed(1)}% Confidence
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Loan Amount</span>
                  <span className="text-white font-medium">₹{stats.latestPrediction.application?.loanAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Risk Score</span>
                  <span className="text-white font-medium">{stats.latestPrediction.riskScore?.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Risk Level</span>
                  <span className="text-emerald-400 font-medium">{stats.latestPrediction.riskLevel}</span>
                </div>
              </div>
              <button onClick={() => navigate(`/dashboard/result/${stats.latestPrediction.applicationId}`)}
                className="w-full btn-ghost text-sm border border-white/10 justify-center">
                View Full Report <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Zap className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No predictions yet</p>
              <button onClick={() => navigate('/dashboard/apply')} className="btn-primary mt-4 text-sm py-2">
                Apply Now
              </button>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h2 className="font-display font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, icon: Icon, path, color }) => (
              <button key={label} onClick={() => navigate(path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-300 text-center">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Applications */}
      {appsData?.applications?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white">Recent Applications</h2>
            <button onClick={() => navigate('/dashboard/applications')} className="text-blue-400 text-sm hover:text-blue-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase border-b border-white/10">
                  <th className="pb-3 text-left">Purpose</th>
                  <th className="pb-3 text-left">Amount</th>
                  <th className="pb-3 text-left">Status</th>
                  <th className="pb-3 text-left">Confidence</th>
                  <th className="pb-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appsData.applications.slice(0, 5).map((app: any) => (
                  <tr key={app.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/result/${app.id}`)}>
                    <td className="py-3 text-white capitalize">{app.loanPurpose?.replace('_', ' ')}</td>
                    <td className="py-3 text-white">₹{app.loanAmount?.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={app.status === 'APPROVED' ? 'badge-approved' : app.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{app.prediction ? `${((app.prediction.confidence || 0) * 100).toFixed(0)}%` : '—'}</td>
                    <td className="py-3 text-slate-400">{new Date(app.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
