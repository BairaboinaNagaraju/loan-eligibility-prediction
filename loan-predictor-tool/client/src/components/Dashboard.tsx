import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularGauge } from './Gauges';
import { WhatIfSimulator } from './WhatIfSimulator';
import { HistoryPanel } from './HistoryPanel';
import {
  Brain, HelpCircle, CheckCircle2, XCircle, ArrowRight,
  TrendingUp, Shield, BarChart3, Info, AlertTriangle
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from 'recharts';

const PURPOSES = ['home', 'education', 'personal', 'business', 'vehicle', 'medical', 'home_renovation', 'other'];

interface HistoryItem {
  id: string;
  date: string;
  creditScore: number;
  loanAmount: number;
  approved: boolean;
  confidence: number;
  riskScore: number;
}

export function Dashboard() {
  // Input State
  const [formData, setFormData] = useState({
    age: 32,
    gender: 'male',
    married: 1,
    education: 'Graduate',
    self_employed: 0,
    annual_income: 1200000,
    monthly_income: 100000,
    monthly_expenses: 30000,
    savings: 500000,
    investments: 200000,
    active_loans: 1,
    existing_loan_amount: 150000,
    existing_emi: 5000,
    credit_card_outstanding: 25000,
    credit_score: 740,
    requested_loan: 600000,
    loan_tenure: 36,
    interest_rate: 10.5,
    loan_purpose: 'home_renovation'
  });

  // What-If State
  const [whatIfData, setWhatIfData] = useState<any>(null);
  const [useWhatIf, setUseWhatIf] = useState(false);

  // Results State
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Model Info State
  const [modelInfo, setModelInfo] = useState<any>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('loan_predictions_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }

    // Load model info
    axios.get('/api/model-info')
      .then(res => setModelInfo(res.data))
      .catch(() => {});
  }, []);

  // Update annual income or monthly income dependencies
  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      if (key === 'annual_income') {
        updated.monthly_income = Math.round(value / 12);
      }
      return updated;
    });
    setUseWhatIf(false); // Reset simulator on form edit
  };

  // Live Calculations (Calculated instantly in UI)
  const monthly_emi = (formData.requested_loan * (formData.interest_rate / 1200)) / (1 - (1 + (formData.interest_rate / 1200))**(-formData.loan_tenure));
  const total_emi = formData.existing_emi + monthly_emi;
  const dti = parseFloat(((total_emi / Math.max(formData.monthly_income, 1.0)) * 100).toFixed(1));
  const disposable_income = Math.max(0, formData.monthly_income - formData.monthly_expenses - total_emi);
  const credit_util = parseFloat(((formData.credit_card_outstanding / 150000) * 100).toFixed(1));
  const savings_ratio = parseFloat(((formData.savings / formData.annual_income) * 100).toFixed(1));

  // Stability Score calculation
  const stability_score = Math.round(
    (formData.self_employed === 0 ? 30 : 15) +
    (formData.age >= 25 && formData.age <= 55 ? 20 : 10) +
    (formData.education === 'Graduate' ? 20 : 10) +
    (formData.active_loans <= 1 ? 30 : 15)
  );

  // Trigger Prediction
  const runPrediction = async (currentData: any, saveToHistory = true) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/predict', currentData);
      setPrediction(res.data);

      if (saveToHistory) {
        const newItem: HistoryItem = {
          id: Math.random().toString(36).substring(7),
          date: new Date().toLocaleString(),
          creditScore: currentData.credit_score,
          loanAmount: currentData.requested_loan,
          approved: res.data.approved,
          confidence: res.data.confidence,
          riskScore: res.data.risk_score
        };
        setHistory(prev => {
          const updated = [newItem, ...prev].slice(0, 20); // Keep max 20
          localStorage.setItem('loan_predictions_history', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Inference engine failed to respond.');
    } finally {
      setLoading(false);
    }
  };

  // Run on load or form submit
  useEffect(() => {
    runPrediction(formData, false);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runPrediction(formData, true);
  };

  // What-If Sliders Update
  const handleWhatIfUpdate = (key: string, value: number) => {
    setUseWhatIf(true);
    const updatedSim = whatIfData ? { ...whatIfData } : { ...formData };
    
    if (key === 'credit_score') updatedSim.credit_score = value;
    if (key === 'requested_loan') updatedSim.requested_loan = value;
    if (key === 'annual_income') {
      updatedSim.annual_income = value;
      updatedSim.monthly_income = Math.round(value / 12);
    }
    if (key === 'savings') updatedSim.savings = value;

    setWhatIfData(updatedSim);
    runPrediction(updatedSim, false); // Do not save simulator changes to history
  };

  const handleResetWhatIf = () => {
    setUseWhatIf(false);
    setWhatIfData(null);
    runPrediction(formData, false);
  };

  const clearHistory = () => {
    localStorage.removeItem('loan_predictions_history');
    setHistory([]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('loan_predictions_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Charts data
  const currentRisk = prediction?.risk_score || 35;
  const radarData = [
    { name: 'Credit Score', score: prediction?.scores?.credit_health || 70 },
    { name: 'Income Stability', score: prediction?.scores?.income_stability || 80 },
    { name: 'Debt Health', score: prediction?.scores?.debt_health || 65 },
    { name: 'Savings Health', score: prediction?.scores?.savings_health || 60 },
    { name: 'Stability', score: stability_score }
  ];

  const pieData = [
    { name: 'EMI Ratio (DTI)', value: dti },
    { name: 'Disposable', value: 100 - dti }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white font-display">AI Loan Eligibility Predictor</h1>
          <p className="text-xs text-slate-400">Interactive financial evaluation & what-if simulator engine</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left column - Form */}
        <div className="xl:col-span-1 glass-card p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" /> Financial Profile Inputs
          </h2>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Age</label>
                  <input type="number" value={formData.age} onChange={e => handleInputChange('age', parseInt(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Gender</label>
                  <select value={formData.gender} onChange={e => handleInputChange('gender', e.target.value)} className="input-field">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Financial Snapshot</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">Annual Income (₹)</label>
                  <input type="number" value={formData.annual_income} onChange={e => handleInputChange('annual_income', parseInt(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Savings (₹)</label>
                  <input type="number" value={formData.savings} onChange={e => handleInputChange('savings', parseInt(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Credit Score</label>
                  <input type="number" min="300" max="900" value={formData.credit_score} onChange={e => handleInputChange('credit_score', parseInt(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Active Loans</label>
                  <input type="number" value={formData.active_loans} onChange={e => handleInputChange('active_loans', parseInt(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Existing EMI (₹/mo)</label>
                  <input type="number" value={formData.existing_emi} onChange={e => handleInputChange('existing_emi', parseInt(e.target.value))} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">Credit Card O/S (₹)</label>
                  <input type="number" value={formData.credit_card_outstanding} onChange={e => handleInputChange('credit_card_outstanding', parseInt(e.target.value))} className="input-field" />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loan Request</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">Loan Amount (₹)</label>
                  <input type="number" value={formData.requested_loan} onChange={e => handleInputChange('requested_loan', parseInt(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tenure (Months)</label>
                  <input type="number" value={formData.loan_tenure} onChange={e => handleInputChange('loan_tenure', parseInt(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Interest Rate (%)</label>
                  <input type="number" step="0.1" value={formData.interest_rate} onChange={e => handleInputChange('interest_rate', parseFloat(e.target.value))} className="input-field" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full mt-4 btn-primary py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-lg active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
              Calculate & Save Run <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Columns - Predict result & visual analysis */}
        <div className="xl:col-span-2 space-y-8">
          {/* Live Calculations Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Debt-to-Income', value: `${dti}%`, color: dti > 45 ? 'text-red-400' : 'text-blue-400' },
              { label: 'Disposable Income', value: `₹${Math.round(disposable_income).toLocaleString()}`, color: 'text-emerald-400' },
              { label: 'Credit Card Util', value: `${credit_util}%`, color: credit_util > 50 ? 'text-amber-400' : 'text-slate-300' },
              { label: 'Stability Score', value: `${stability_score}/100`, color: 'text-indigo-400' }
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 rounded-xl bg-slate-900/40 border border-white/5 shadow-md">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</span>
                <p className={`text-lg font-black mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Inference Output Card */}
          {error ? (
            <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Inference Error</p>
                <p className="text-xs text-red-400 mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-2xl border ${
              prediction?.approved ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">AI Verdict</span>
                  <div className="flex items-center gap-3 mt-1">
                    {prediction?.approved ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
                    )}
                    <h2 className={`text-3xl font-black tracking-tight ${prediction?.approved ? 'text-emerald-400' : 'text-red-400'}`}>
                      {prediction?.approved ? 'LOAN APPROVED' : 'LOAN REJECTED'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Inference engine evaluated using: <strong className="text-indigo-400">{prediction?.model_used}</strong> ({prediction?.processing_ms}ms)
                  </p>
                </div>
                
                {/* Gauge Row */}
                <div className="flex gap-4">
                  <CircularGauge value={Math.round((prediction?.confidence || 0) * 100)} type="probability" approved={prediction?.approved} title="Confidence" subtitle="Model Probability" />
                  <CircularGauge value={prediction?.risk_score || 0} type="risk" title="Risk Score" subtitle="Aggregated Threat Level" />
                </div>
              </div>
            </div>
          )}

          {/* Visual Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Health Radar */}
            <div className="glass-card p-6 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-white mb-4">Financial Health Radar</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DTI Pie */}
            <div className="glass-card p-6 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-white mb-4">Debt-to-Income Ratio Contribution</h3>
              <div className="h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                      <Cell fill="#f43f5e" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white">{dti}%</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">DTI Ratio</span>
                </div>
              </div>
            </div>
          </div>

          {/* Explainable AI factors & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positive vs Negative Factors */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Explainable AI (XAI) Factors</h3>
              
              <div className="space-y-3">
                {prediction?.positive_factors?.map((f: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{f}</span>
                  </div>
                ))}
                {prediction?.negative_factors?.map((f: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-red-400">
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Roadmap */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">AI Optimization Roadmap</h3>
              
              <div className="space-y-3">
                {prediction?.approved ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                    🎉 Excellent financial configuration! Your profile complies with model standards. No negative modifiers flag eligibility.
                  </div>
                ) : (
                  prediction?.recommendations?.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-amber-300">
                      <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" /> <span>{r}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* What-If Simulator widget */}
          <WhatIfSimulator
            creditScore={useWhatIf && whatIfData ? whatIfData.credit_score : formData.credit_score}
            loanAmount={useWhatIf && whatIfData ? whatIfData.requested_loan : formData.requested_loan}
            annualIncome={useWhatIf && whatIfData ? whatIfData.annual_income : formData.annual_income}
            savings={useWhatIf && whatIfData ? whatIfData.savings : formData.savings}
            monthlyExpenses={formData.monthly_expenses}
            existingLoans={formData.active_loans}
            approved={prediction?.approved}
            confidence={prediction?.confidence || 0}
            riskScore={prediction?.risk_score || 0}
            onUpdate={handleWhatIfUpdate}
            onReset={handleResetWhatIf}
          />

          {/* Model Stats / Training comparison */}
          {modelInfo && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Comparison Matrix: Trained Classifiers</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(modelInfo.results || {}).map(([name, m]: any) => (
                  <div key={name} className={`p-3 rounded-lg border ${
                    name === modelInfo.best_model ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-900/30 border-white/5'
                  }`}>
                    <h4 className="text-xs font-bold text-white truncate">{name}</h4>
                    <div className="mt-2 space-y-1 text-[10px]">
                      <div className="flex justify-between"><span className="text-slate-500">Acc</span> <span className="font-bold text-slate-300">{(m.accuracy * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">F1</span> <span className="font-bold text-slate-300">{(m.f1_score * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Local predictions History Panel */}
          <HistoryPanel history={history} onClear={clearHistory} onDelete={deleteHistoryItem} />
        </div>
      </div>
    </div>
  );
}
