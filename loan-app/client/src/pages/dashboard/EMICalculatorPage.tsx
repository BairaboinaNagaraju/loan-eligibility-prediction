import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function EMICalculatorPage() {
  const [amount, setAmount] = useState(1000000);
  const [rate, setRate] = useState(10.5);
  const [term, setTerm] = useState(60);

  const r = rate / (12 * 100);
  const emi = r === 0 ? amount / term : (amount * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);
  const totalAmount = emi * term;
  const totalInterest = totalAmount - amount;

  // Amortization schedule
  const schedule = [];
  let balance = amount;
  for (let i = 1; i <= Math.min(term, 60); i++) {
    const interest = balance * r;
    const principal = emi - interest;
    balance -= principal;
    schedule.push({ month: i, emi: Math.round(emi), principal: Math.round(principal), interest: Math.round(interest), balance: Math.max(0, Math.round(balance)) });
  }

  const SliderInput = ({ label, value, min, max, step, onChange, format }: any) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-lg font-bold text-blue-400">{format(value)}</span>
      </div>
      <div className="relative">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-white mb-2 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-400" /> EMI Calculator
        </h1>
        <p className="text-slate-400">Calculate your monthly payments and see a full amortization schedule.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="glass-card p-8 space-y-8">
          <SliderInput label="Loan Amount" value={amount} min={50000} max={10000000} step={50000}
            onChange={setAmount} format={(v: number) => `₹${(v / 100000).toFixed(1)}L`} />
          <SliderInput label="Annual Interest Rate" value={rate} min={4} max={30} step={0.25}
            onChange={setRate} format={(v: number) => `${v}% p.a.`} />
          <SliderInput label="Loan Term" value={term} min={6} max={360} step={6}
            onChange={setTerm} format={(v: number) => v >= 12 ? `${Math.floor(v / 12)}yr ${v % 12 ? `${v % 12}mo` : ''}`.trim() : `${v}mo`} />

          {/* Results */}
          <div className="pt-4 border-t border-white/10">
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Monthly EMI', value: `₹${Math.round(emi).toLocaleString()}`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Total Interest Payable', value: `₹${Math.round(totalInterest).toLocaleString()}`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'Total Amount Payable', value: `₹${Math.round(totalAmount).toLocaleString()}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              ].map(({ label, value, color, bg }) => (
                <motion.div key={label} layout className={`flex items-center justify-between p-4 rounded-xl ${bg}`}>
                  <span className="text-sm text-slate-300">{label}</span>
                  <span className={`text-xl font-bold ${color}`}>{value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-4">
          {/* Donut-style breakdown */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Principal vs Interest Breakdown
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="16"
                    strokeDasharray={`${(amount / totalAmount) * 251} 251`} />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="16"
                    strokeDasharray={`${(totalInterest / totalAmount) * 251} 251`}
                    strokeDashoffset={`-${(amount / totalAmount) * 251}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-slate-400 text-center">Loan<br/>Breakup</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-sm text-slate-300">Principal</span></div>
                  <span className="text-sm font-bold text-white">₹{amount.toLocaleString()} ({((amount / totalAmount) * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-sm text-slate-300">Interest</span></div>
                  <span className="text-sm font-bold text-white">₹{Math.round(totalInterest).toLocaleString()} ({((totalInterest / totalAmount) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Area chart of balance over time */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4">Outstanding Balance Over Time</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={schedule}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} label={{ value: 'Month', position: 'insideBottom', fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Balance']}
                  contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="url(#balGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Amortization Schedule */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-white mb-4">Amortization Schedule (First {Math.min(term, 60)} months)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase border-b border-white/10">
                <th className="pb-3 text-left">Month</th>
                <th className="pb-3 text-right">EMI</th>
                <th className="pb-3 text-right">Principal</th>
                <th className="pb-3 text-right">Interest</th>
                <th className="pb-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {schedule.slice(0, 24).map((row) => (
                <tr key={row.month} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 text-slate-300">Month {row.month}</td>
                  <td className="py-2 text-right text-white">₹{row.emi.toLocaleString()}</td>
                  <td className="py-2 text-right text-blue-400">₹{row.principal.toLocaleString()}</td>
                  <td className="py-2 text-right text-amber-400">₹{row.interest.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-300">₹{row.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
