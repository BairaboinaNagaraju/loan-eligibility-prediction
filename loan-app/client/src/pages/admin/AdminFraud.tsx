import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function AdminFraud() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: () => api.get('/admin/fraud-alerts').then(r => r.data.data),
  });

  const alerts = data?.alerts || [];
  const highRisk = alerts.filter((a: any) => a.fraudScore >= 0.7).length;
  const mediumRisk = alerts.filter((a: any) => a.fraudScore >= 0.4 && a.fraudScore < 0.7).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-display font-bold text-3xl text-white flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-400" /> Fraud Alerts
        </h1>
        <p className="text-slate-400 mt-1">Applications flagged by AI fraud detection</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Alerts', value: alerts.length, color: 'text-white', bg: 'glass-card' },
          { label: 'High Risk (≥70%)', value: highRisk, color: 'text-red-400', bg: 'glass-card border-red-500/20' },
          { label: 'Medium Risk (40–70%)', value: mediumRisk, color: 'text-amber-400', bg: 'glass-card border-amber-500/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} p-5 text-center`}>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : alerts.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Fraud Alerts</h3>
          <p className="text-slate-400">All applications are clean. No suspicious patterns detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((app: any, i: number) => {
            const fraudScore = app.fraudScore || app.prediction?.fraudScore || 0;
            const flags: string[] = app.fraudFlags?.flags || app.prediction?.fraudFlags?.flags || [];
            const isHigh = fraudScore >= 0.7;
            return (
              <motion.div key={app.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`glass-card p-5 border ${isHigh ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 font-bold border-2 ${
                      isHigh ? 'border-red-500 text-red-400 bg-red-500/10' : 'border-amber-500 text-amber-400 bg-amber-500/10'
                    }`}>
                      <span className="text-xl">{(fraudScore * 100).toFixed(0)}%</span>
                      <span className="text-xs opacity-70">Fraud</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white">{app.user?.fullName}</p>
                        <span className={isHigh ? 'badge-rejected' : 'badge-pending'}>
                          {isHigh ? 'HIGH RISK' : 'MEDIUM RISK'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{app.user?.email} • ₹{app.loanAmount?.toLocaleString()} loan</p>
                      {flags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {flags.map((flag: string, j: number) => (
                            <span key={j} className={`text-xs px-2 py-0.5 rounded-full ${isHigh ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              ⚠ {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => navigate(`/dashboard/result/${app.id}`)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all flex-shrink-0">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
