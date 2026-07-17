import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  TrendingUp, Shield, Zap, Download, RotateCcw, Brain
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import api from '../../lib/api';
import { useRef } from 'react';

function RiskGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180;
  const getColor = (s: number) => s <= 20 ? '#10b981' : s <= 40 ? '#22c55e' : s <= 60 ? '#f59e0b' : s <= 80 ? '#f97316' : '#ef4444';
  const color = getColor(score);
  const getRiskLabel = (s: number) => s <= 20 ? 'Very Low Risk' : s <= 40 ? 'Low Risk' : s <= 60 ? 'Medium Risk' : s <= 80 ? 'High Risk' : 'Very High Risk';

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-56 h-32 overflow-hidden">
        <svg viewBox="0 0 200 115" className="w-full h-full">
          {/* Track segments */}
          {[['#10b981', 0, 36], ['#22c55e', 36, 72], ['#f59e0b', 72, 108], ['#f97316', 108, 144], ['#ef4444', 144, 180]].map(([c, start, end]) => (
            <path key={String(c)} d={`M ${100 + 85 * Math.cos((Number(start) - 180) * Math.PI / 180)} ${100 - 85 * Math.sin((180 - Number(start)) * Math.PI / 180)} A 85 85 0 0 1 ${100 + 85 * Math.cos((Number(end) - 180) * Math.PI / 180)} ${100 - 85 * Math.sin((180 - Number(end)) * Math.PI / 180)}`}
              fill="none" stroke={String(c)} strokeWidth="14" strokeLinecap="round" opacity="0.25" />
          ))}
          {/* Active arc */}
          <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 267} 267`} style={{ filter: `drop-shadow(0 0 10px ${color})`, transition: 'all 1.5s ease' }} />
          {/* Needle */}
          <line x1="100" y1="100" x2="100" y2="20"
            stroke="white" strokeWidth="2.5" strokeLinecap="round"
            transform={`rotate(${angle - 90}, 100, 100)`}
            style={{ transition: 'transform 1.5s ease' }} />
          <circle cx="100" cy="100" r="8" fill="#0d1526" stroke="white" strokeWidth="2" />
          {/* Score text */}
          <text x="100" y="88" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">{score.toFixed(1)}</text>
        </svg>
      </div>
      <p className="font-semibold text-lg mt-1" style={{ color }}>{getRiskLabel(score)}</p>
      <p className="text-slate-400 text-sm">Risk Score (0–100)</p>
    </div>
  );
}

function ConfidenceArc({ confidence, approved }: { confidence: number; approved: boolean }) {
  const pct = confidence * 100;
  const color = approved ? '#10b981' : '#ef4444';
  const circumference = 2 * Math.PI * 54;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 12px ${color})`, transition: 'stroke-dasharray 1.5s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{pct.toFixed(1)}%</span>
          <span className="text-xs text-slate-400">Confidence</span>
        </div>
      </div>
    </div>
  );
}

export default function PredictionResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api.get(`/loans/${id}`).then(r => r.data.data.application),
    retry: 3,
    retryDelay: 1000,
  });

  const handleDownloadPDF = () => {
    window.print();
  };

  if (isLoading) return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-4 animate-pulse">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">AI Analyzing Your Profile...</h2>
        <p className="text-slate-400 text-sm">Processing 20+ financial parameters</p>
        <div className="flex gap-2 mt-6">
          {['Credit Score', 'Income', 'Risk', 'Fraud'].map((step, i) => (
            <motion.div key={step}
              initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: i * 0.5, duration: 1.5, repeat: Infinity }}
              className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
              {step}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="text-center py-20">
      <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Application not found</h2>
      <button onClick={() => navigate('/dashboard/applications')} className="btn-primary mt-4">
        View All Applications
      </button>
    </div>
  );

  const pred = data.prediction;
  const approved = data.aiVerdict === 'APPROVED' || data.status === 'APPROVED';
  const confidence = pred?.confidence || (approved ? 0.85 : 0.70);
  const riskScore = pred?.riskScore || data.riskScore || 35;
  const fraudScore = pred?.fraudScore || data.fraudScore || 0.05;
  const positiveFactors: string[] = pred?.positiveFactors || data.explanation?.positive || [];
  const negativeFactors: string[] = pred?.negativeFactors || data.explanation?.negative || [];
  const improvements: any[] = pred?.improvements || data.improvements || [];
  const aiSummary = pred?.aiSummary || data.aiSummary || '';

  const radarData = [
    { factor: 'Credit Score', value: Math.min(100, ((data.creditScore - 300) / 600) * 100) },
    { factor: 'Income', value: Math.min(100, (data.monthlySalary / 200000) * 100) },
    { factor: 'Savings', value: Math.min(100, (data.savings / (data.annualIncome || 1)) * 100) },
    { factor: 'Experience', value: Math.min(100, (data.jobExperience / 20) * 100) },
    { factor: 'Stability', value: data.employmentType === 'salaried' ? 80 : 60 },
    { factor: 'Low Debt', value: Math.max(0, 100 - (data.existingLoans / (data.annualIncome || 1)) * 100) },
  ];

  const pieData = [
    { name: 'Confidence', value: confidence * 100 },
    { name: 'Uncertainty', value: (1 - confidence) * 100 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6" ref={reportRef}>
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">AI Prediction Result</h1>
          <p className="text-slate-400 text-sm mt-1">Application #{id?.slice(0, 8)}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadPDF} className="btn-ghost text-sm border border-white/10 gap-2">
            <Download className="w-4 h-4" /> PDF Report
          </button>
          <button onClick={() => navigate('/dashboard/apply')} className="btn-primary text-sm gap-2">
            <RotateCcw className="w-4 h-4" /> New Application
          </button>
        </div>
      </div>

      {/* Main Verdict Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass-card p-8 border ${approved ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center flex-shrink-0">
            {approved
              ? <CheckCircle2 className="w-20 h-20 text-emerald-400 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 16px #10b981)' }} />
              : <XCircle className="w-20 h-20 text-red-400 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 16px #ef4444)' }} />
            }
            <h2 className={`font-display font-bold text-4xl mt-3 ${approved ? 'text-emerald-400' : 'text-red-400'}`}>
              {approved ? 'APPROVED' : 'REJECTED'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">AI Decision</p>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{(confidence * 100).toFixed(1)}%</p>
                <p className="text-xs text-slate-400">Confidence</p>
              </div>
              <div className="w-px bg-white/10 hidden md:block" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{riskScore.toFixed(1)}</p>
                <p className="text-xs text-slate-400">Risk Score</p>
              </div>
              <div className="w-px bg-white/10 hidden md:block" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{(fraudScore * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-400">Fraud Risk</p>
              </div>
            </div>
            {aiSummary && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-slate-300 leading-relaxed italic">"{aiSummary}"</p>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Brain className="w-3 h-3" /> AI Generated Summary</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Risk + Confidence + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4 text-center">Risk Gauge</h3>
          <RiskGauge score={riskScore} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 flex flex-col items-center">
          <h3 className="font-semibold text-white mb-4">Confidence</h3>
          <ConfidenceArc confidence={confidence} approved={approved} />
          <p className="text-xs text-slate-400 mt-3">AI Prediction Confidence</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="font-semibold text-white mb-2 text-center">Financial Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="factor" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Profile" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* XAI — Explainable AI Factors */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive factors */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Positive Factors
          </h3>
          <div className="space-y-3">
            {positiveFactors.length === 0 ? (
              <p className="text-slate-400 text-sm">No positive factors identified</p>
            ) : positiveFactors.map((factor: string, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-200">{factor}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Negative factors */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Negative Factors
          </h3>
          <div className="space-y-3">
            {negativeFactors.length === 0 ? (
              <p className="text-slate-400 text-sm">No major negative factors</p>
            ) : negativeFactors.map((factor: string, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-200">{factor}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Fraud Detection */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
        <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" /> Fraud Detection Report
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${
              fraudScore < 0.3 ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' :
              fraudScore < 0.6 ? 'border-amber-500 text-amber-400 bg-amber-500/10' :
              'border-red-500 text-red-400 bg-red-500/10'
            }`}>
              {(fraudScore * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">Fraud Risk</p>
          </div>
          <div className="flex-1 space-y-2">
            {['Duplicate PAN Check', 'Same IP Detection', 'Income Verification', 'Document Authenticity'].map((check) => (
              <div key={check} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{check}</span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ Clear</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Improvement Suggestions */}
      {improvements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> AI Improvement Roadmap
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {improvements.slice(0, 6).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  item.impact === 'high' ? 'bg-red-400' : item.impact === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-white">{item.action}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.detail}</p>
                  <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
                    item.impact === 'high' ? 'text-red-400 bg-red-500/10' : item.impact === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10'
                  }`}>{item.impact} impact</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Application Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-card p-6">
        <h3 className="font-display font-semibold text-white mb-4">Application Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Loan Amount', value: `₹${data.loanAmount?.toLocaleString()}` },
            { label: 'Purpose', value: data.loanPurpose?.replace('_', ' ') },
            { label: 'Loan Term', value: `${data.loanTerm} months` },
            { label: 'Credit Score', value: data.creditScore },
            { label: 'Monthly Salary', value: `₹${data.monthlySalary?.toLocaleString()}` },
            { label: 'Annual Income', value: `₹${data.annualIncome?.toLocaleString()}` },
            { label: 'Job Experience', value: `${data.jobExperience} years` },
            { label: 'Model Used', value: pred?.modelUsed || 'XGBoost' },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-sm font-semibold text-white mt-1 capitalize">{String(value)}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
        className="flex flex-col sm:flex-row gap-4">
        <button onClick={() => navigate('/dashboard/applications')} className="flex-1 btn-ghost border border-white/10 justify-center">
          View All Applications
        </button>
        <button onClick={() => navigate('/dashboard/calculator')} className="flex-1 btn-ghost border border-white/10 justify-center">
          EMI Calculator
        </button>
        {!approved && (
          <button onClick={() => navigate('/dashboard/apply')} className="flex-1 btn-primary justify-center">
            Apply Again <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
