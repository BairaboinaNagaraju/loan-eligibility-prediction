import React, { useState } from 'react';
import { Calendar, Trash2, CheckCircle2, XCircle, BarChart3, AlertCircle } from 'lucide-react';

interface HistoryItem {
  id: string;
  date: string;
  creditScore: number;
  loanAmount: number;
  approved: boolean;
  confidence: number;
  riskScore: number;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onClear: () => void;
  onDelete: (id: string) => void;
}

export function HistoryPanel({ history, onClear, onDelete }: HistoryPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds(prev => [...prev, id]);
      }
    }
  };

  const getComparisonData = () => {
    return history.filter(item => selectedIds.includes(item.id));
  };

  const compareItems = getComparisonData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Prediction History</h3>
          <p className="text-xs text-slate-400 mt-1">Select up to 3 runs to compare side-by-side</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/20 border border-white/5 rounded-2xl">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No predictions generated yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* History List */}
          <div className="lg:col-span-1 space-y-3 max-h-[420px] overflow-y-auto pr-2 no-scrollbar">
            {history.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/40'
                      : 'bg-slate-900/30 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {item.approved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm font-bold text-white">
                        ₹{(item.loanAmount / 100000).toFixed(1)}L Loan
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">{item.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-300">CS: {item.creditScore}</p>
                      <p className="text-[10px] text-slate-400">Risk: {item.riskScore}%</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                        setSelectedIds(prev => prev.filter(id => id !== item.id));
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison Panel */}
          <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" /> Comparison Matrix (Max 3)
            </h4>
            
            {compareItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-slate-400 text-sm">Select past runs from the list to compare details side-by-side</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400">
                      <th className="pb-2">Metric</th>
                      {compareItems.map((item, idx) => (
                        <th key={item.id} className="pb-2 font-bold text-blue-400">Run #{idx + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="text-white">
                      <td className="py-2 text-slate-400">Verdict</td>
                      {compareItems.map(item => (
                        <td key={item.id} className={`py-2 font-bold ${item.approved ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.approved ? 'APPROVED' : 'REJECTED'}
                        </td>
                      ))}
                    </tr>
                    <tr className="text-white">
                      <td className="py-2 text-slate-400">Confidence</td>
                      {compareItems.map(item => (
                        <td key={item.id} className="py-2">{(item.confidence * 100).toFixed(1)}%</td>
                      ))}
                    </tr>
                    <tr className="text-white">
                      <td className="py-2 text-slate-400">Risk Score</td>
                      {compareItems.map(item => (
                        <td key={item.id} className="py-2">{item.riskScore}%</td>
                      ))}
                    </tr>
                    <tr className="text-white">
                      <td className="py-2 text-slate-400">Credit Score</td>
                      {compareItems.map(item => (
                        <td key={item.id} className="py-2 font-bold">{item.creditScore}</td>
                      ))}
                    </tr>
                    <tr className="text-white">
                      <td className="py-2 text-slate-400">Loan Amount</td>
                      {compareItems.map(item => (
                        <td key={item.id} className="py-2">₹{item.loanAmount.toLocaleString()}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
