import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { ShieldCheck, Moon, Sun } from 'lucide-react';

export default function App() {
  const [dark, setDark] = useState(true);

  return (
    <div className={`min-h-screen ${dark ? 'dark bg-[#030712]' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header bar */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#030712]/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-extrabold text-lg text-white">Vertex Loan Predictor</span>
        </div>
        <button
          onClick={() => setDark(!dark)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="pb-16">
        <Dashboard />
      </main>
    </div>
  );
}
