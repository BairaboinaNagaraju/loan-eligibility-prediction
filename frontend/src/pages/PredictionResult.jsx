import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Cpu, Download, ArrowRight, RefreshCw,
  TrendingUp, TrendingDown, Minus, AlertCircle, Shield,
  BarChart2, Lightbulb, FileText, Home
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';
import { loanService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Circular Gauge Component ────────────────────────────────────────────────
function ProbabilityGauge({ probability, approved }) {
  const radius = 80;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth;
  const circumference = normalizedRadius * 2 * Math.PI;
  const pct = Math.min(Math.max(probability, 0), 1);
  const strokeDashoffset = circumference - pct * circumference;

  const color = approved
    ? `hsl(${142 + pct * 20}, 76%, 36%)`
    : `hsl(${0 + pct * 20}, 84%, 60%)`;

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        {/* Background ring */}
        <circle
          stroke="rgba(148,163,184,0.15)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Animated progress ring */}
        <motion.circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-3xl font-extrabold"
          style={{ color }}
        >
          {(pct * 100).toFixed(1)}%
        </motion.p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Confidence</p>
      </div>
    </div>
  );
}

// ─── XAI Impact Badge ────────────────────────────────────────────────────────
function ImpactBadge({ impact }) {
  if (impact === 'positive') return (
    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
      <TrendingUp className="w-3 h-3" />Positive
    </span>
  );
  if (impact === 'negative') return (
    <span className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
      <TrendingDown className="w-3 h-3" />Negative
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />Neutral
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PredictionResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef(null);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResult = async () => {
      // 1. Try sessionStorage first (just submitted)
      const cached = sessionStorage.getItem('prediction_result');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (String(parsed.id) === String(id)) {
            setResult(parsed);
            setLoading(false);
            return;
          }
        } catch (_) {}
      }

      // 2. Fetch from API
      try {
        const data = await loanService.getApplicationById(id);
        setResult(data);
      } catch (err) {
        console.error(err);
        setError('Could not load application result. It may have been deleted or you may not have access.');
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
      <p className="text-sm font-semibold text-slate-500">Loading your AI evaluation result...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-16">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Result Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error}</p>
      </div>
      <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all">
        <Home className="w-4 h-4" />Back to Dashboard
      </Link>
    </div>
  );

  if (!result) return null;

  const approved = result.prediction === 'Approved';
  const confidence = result.confidence_score || 0;
  const probApproved = result.prob_approved ?? (approved ? confidence : 1 - confidence);
  const probRejected = result.prob_rejected ?? (approved ? 1 - confidence : confidence);

  const reasons = result.reasons || [];
  const recommendations = result.recommendations || [];
  const features = result.computed_features || {};

  const featureImportanceData = [
    { name: 'Credit History', value: 50, fill: '#3b66e8' },
    { name: 'Total Income', value: 18, fill: '#22c55e' },
    { name: 'Loan Amount', value: 12, fill: '#f59e0b' },
    { name: 'EMI Ratio', value: 10, fill: '#8b5cf6' },
    { name: 'Property Area', value: 6, fill: '#06b6d4' },
    { name: 'Education', value: 4, fill: '#64748b' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8" ref={printRef}>
      {/* ─── Print Header (only visible when printing) ── */}
      <div className="hidden print:block text-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-extrabold">VertexBank — AI Loan Eligibility Certificate</h1>
        <p className="text-sm text-gray-500">Application ID: #{result.id} | Generated: {new Date().toLocaleDateString()}</p>
      </div>

      {/* ─── Page Header ─────────────────────────────── */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            AI Evaluation Result
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Application #{result.id} · {result.created_at ? new Date(result.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Just now'}
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition-all"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* ─── Hero Decision Card ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-3xl p-8 relative overflow-hidden ${
          approved
            ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white'
            : 'bg-gradient-to-br from-rose-600 to-rose-500 text-white'
        }`}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-8 w-64 h-64 rounded-full bg-white/5" />

        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {approved
                ? <CheckCircle className="w-8 h-8" />
                : <XCircle className="w-8 h-8" />}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">AI Decision</p>
                <h2 className="text-3xl font-extrabold">{result.prediction}</h2>
              </div>
            </div>

            <p className="text-sm opacity-80 leading-relaxed">
              {approved
                ? 'Congratulations! Your financial profile meets the lending criteria. Download your eligibility certificate below.'
                : 'Your application was flagged as high-risk. Review the AI recommendations to improve your profile.'}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase opacity-60">Status Override</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border border-white/30 ${
                result.status === 'Approved' ? 'bg-white/20' :
                result.status === 'Rejected' ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {result.status}
              </span>
            </div>
          </div>

          {/* Gauge */}
          <div className="flex flex-col items-center gap-2">
            <ProbabilityGauge probability={confidence} approved={approved} />
            <div className="grid grid-cols-2 gap-4 w-full mt-2">
              <div className="text-center p-3 rounded-2xl bg-white/15">
                <p className="text-xs opacity-70 font-semibold">P(Approved)</p>
                <p className="text-lg font-extrabold">{(probApproved * 100).toFixed(1)}%</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-white/15">
                <p className="text-xs opacity-70 font-semibold">P(Rejected)</p>
                <p className="text-lg font-extrabold">{(probRejected * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Computed Features ───────────────────────── */}
      {Object.keys(features).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6"
        >
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
            <BarChart2 className="w-5 h-5 text-primary-500" />
            Engineered Financial Features
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Income', value: `$${(features.TotalIncome || 0).toLocaleString()}/mo` },
              { label: 'Monthly EMI', value: `$${(features.EMI || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
              { label: 'Income-to-EMI', value: `${(features.IncomeToEMI_Ratio || 0).toFixed(1)}×` },
              { label: 'Loan Amount', value: `$${((features.LoanAmount || 0) * 1000).toLocaleString()}` },
              { label: 'Credit History', value: features.CreditHistory === 1.0 ? '✅ Good' : '⚠️ Bad' },
              { label: 'Property Area', value: features.PropertyArea || '—' },
            ].map((item) => (
              <div key={item.label} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{item.label}</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── XAI Reasons ─────────────────────────────── */}
      {reasons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl p-6 space-y-4"
        >
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary-500" />
            Explainable AI Factors
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Key factors the ML model weighted in making this decision
          </p>
          <div className="space-y-3">
            {reasons.map((reason, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                className="flex gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/20"
              >
                <div className={`w-1.5 rounded-full shrink-0 self-stretch ${
                  reason.impact === 'positive' ? 'bg-emerald-500' :
                  reason.impact === 'negative' ? 'bg-rose-500' : 'bg-amber-400'
                }`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{reason.factor || 'Factor'}</span>
                    <ImpactBadge impact={reason.impact} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{reason.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Feature Importance Bar Chart ────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-3xl p-6"
      >
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-primary-500" />
          Model Feature Importance
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(val) => [`${val}%`, 'Importance Weight']}
              contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {featureImportanceData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ─── Recommendations (if any) ────────────────── */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-3xl p-6 space-y-4"
        >
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            AI Recommendations to Improve Eligibility
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.07 }}
                className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30"
              >
                <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{rec}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Actions ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap gap-4 print:hidden"
      >
        <button
          onClick={handlePrint}
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-all shadow-lg shadow-primary-500/20"
        >
          <FileText className="w-4 h-4" />
          Download Credit Certificate
        </button>
        <Link
          to="/dashboard/apply"
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Apply Again
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition-all"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
      </motion.div>

      {/* Print-only application details */}
      <div className="hidden print:block mt-8 space-y-4">
        <h2 className="font-bold text-lg border-b pb-2">Application Summary</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Applicant Income:</strong> ${result.applicant_income?.toLocaleString()}/mo</div>
          <div><strong>Loan Amount:</strong> ${(result.loan_amount * 1000)?.toLocaleString()}</div>
          <div><strong>Credit History:</strong> {result.credit_history === 1.0 ? 'Good (1.0)' : 'Poor (0.0)'}</div>
          <div><strong>Property Area:</strong> {result.property_area}</div>
          <div><strong>AI Decision:</strong> {result.prediction}</div>
          <div><strong>Confidence:</strong> {(confidence * 100).toFixed(1)}%</div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          * This certificate is an AI-generated eligibility estimate. Final loan approval is subject to formal underwriting verification by Vertex Bank.
        </p>
      </div>
    </div>
  );
}
