import React from 'react';

interface CircularGaugeProps {
  value: number; // 0 to 100
  title: string;
  subtitle: string;
  approved?: boolean;
  type?: 'risk' | 'probability';
}

export function CircularGauge({ value, title, subtitle, approved, type = 'risk' }: CircularGaugeProps) {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (type === 'probability') {
      return approved ? '#10b981' : '#ef4444'; // green or red
    }
    // Risk score coloring (0-20 Very Low, 21-40 Low, etc.)
    if (value <= 20) return '#10b981'; // Green
    if (value <= 40) return '#22c55e'; // Light green
    if (value <= 60) return '#f59e0b'; // Amber
    if (value <= 80) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getRiskLabel = () => {
    if (value <= 20) return 'Very Low';
    if (value <= 40) return 'Low';
    if (value <= 60) return 'Medium';
    if (value <= 80) return 'High';
    return 'Very High';
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/40 border border-white/5 shadow-inner">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-white">{value}%</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{type === 'risk' ? getRiskLabel() : 'Probability'}</span>
        </div>
      </div>
      <h4 className="text-sm font-semibold text-slate-200 mt-3">{title}</h4>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}
