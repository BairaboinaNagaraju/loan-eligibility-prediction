import React from 'react';
import { Sliders, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface WhatIfSimulatorProps {
  creditScore: number;
  loanAmount: number;
  annualIncome: number;
  savings: number;
  monthlyExpenses: number;
  existingLoans: number;
  approved: boolean;
  confidence: number;
  riskScore: number;
  onUpdate: (key: string, value: number) => void;
  onReset: () => void;
}

export function WhatIfSimulator({
  creditScore,
  loanAmount,
  annualIncome,
  savings,
  monthlyExpenses,
  existingLoans,
  approved,
  confidence,
  riskScore,
  onUpdate,
  onReset
}: WhatIfSimulatorProps) {

  const getRiskColor = (r: number) => {
    if (r <= 20) return 'text-emerald-400';
    if (r <= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" /> What-If Eligibility Simulator
        </h3>
        <button
          onClick={onReset}
          className="p-1.5 rounded bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
          title="Reset values to original values"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sliders */}
        <div className="space-y-5">
          {/* Credit Score */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Credit Score</span>
              <span className="text-indigo-400 font-bold">{creditScore}</span>
            </div>
            <input
              type="range"
              min="300"
              max="900"
              value={creditScore}
              onChange={(e) => onUpdate('credit_score', parseInt(e.target.value))}
              className="w-full slider-accent"
            />
          </div>

          {/* Requested Loan Amount */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Requested Loan</span>
              <span className="text-indigo-400 font-bold">₹{(loanAmount / 100000).toFixed(1)}L</span>
            </div>
            <input
              type="range"
              min="50000"
              max="3000000"
              step="50000"
              value={loanAmount}
              onChange={(e) => onUpdate('requested_loan', parseInt(e.target.value))}
              className="w-full slider-accent"
            />
          </div>

          {/* Annual Income */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Annual Income</span>
              <span className="text-indigo-400 font-bold">₹{(annualIncome / 100000).toFixed(1)}L</span>
            </div>
            <input
              type="range"
              min="100000"
              max="5000000"
              step="50000"
              value={annualIncome}
              onChange={(e) => onUpdate('annual_income', parseInt(e.target.value))}
              className="w-full slider-accent"
            />
          </div>

          {/* Savings */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Total Savings</span>
              <span className="text-indigo-400 font-bold">₹{(savings / 100000).toFixed(1)}L</span>
            </div>
            <input
              type="range"
              min="10000"
              max="3000000"
              step="20000"
              value={savings}
              onChange={(e) => onUpdate('savings', parseInt(e.target.value))}
              className="w-full slider-accent"
            />
          </div>
        </div>

        {/* Real-time Eligibility Verdict */}
        <div className="flex flex-col justify-center p-6 rounded-2xl bg-slate-900/30 border border-white/5 space-y-4">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider text-center">Simulated Output</p>
          
          <div className="flex flex-col items-center justify-center space-y-2">
            {approved ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            ) : (
              <XCircle className="w-16 h-16 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
            )}
            <h4 className={`text-2xl font-black ${approved ? 'text-emerald-400' : 'text-red-400'}`}>
              {approved ? 'LOAN APPROVED' : 'LOAN REJECTED'}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center pt-2 border-t border-white/5">
            <div>
              <p className="text-sm font-bold text-white">{(confidence * 100).toFixed(1)}%</p>
              <p className="text-[10px] text-slate-400">Confidence</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${getRiskColor(riskScore)}`}>{riskScore}%</p>
              <p className="text-[10px] text-slate-400">Risk Score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
