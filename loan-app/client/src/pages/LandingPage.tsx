import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ShieldCheck, Zap, BarChart3, Lock, Star, ArrowRight, ChevronDown,
  CheckCircle2, TrendingUp, Users, FileText, Brain, Calculator
} from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI-Powered Prediction', desc: 'XGBoost & ensemble ML models with 96%+ accuracy predict your loan eligibility instantly.', color: 'from-blue-500 to-cyan-500' },
  { icon: ShieldCheck, title: 'Explainable AI (XAI)', desc: 'Understand exactly why AI made its decision with SHAP-powered factor analysis.', color: 'from-violet-500 to-purple-600' },
  { icon: BarChart3, title: 'Credit Health Dashboard', desc: 'Interactive radar charts and gauges visualize your complete financial health profile.', color: 'from-emerald-500 to-teal-500' },
  { icon: Zap, title: 'Fraud Detection', desc: 'Real-time fraud scoring detects suspicious patterns before they become problems.', color: 'from-amber-500 to-orange-500' },
  { icon: Lock, title: 'Bank-Grade Security', desc: 'AES-256 encryption, JWT auth, rate limiting, and CORS protection on every endpoint.', color: 'from-rose-500 to-pink-500' },
  { icon: TrendingUp, title: 'Improvement Suggestions', desc: 'AI recommends actionable steps to improve eligibility if your application is rejected.', color: 'from-indigo-500 to-blue-500' },
];

const stats = [
  { label: 'Applications Processed', value: '50,000+', icon: FileText },
  { label: 'Approval Accuracy', value: '96.4%', icon: Brain },
  { label: 'Satisfied Customers', value: '12,000+', icon: Users },
  { label: 'Avg. Decision Time', value: '< 3 sec', icon: Zap },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer, Bangalore', text: 'Got my home renovation loan approved in minutes! The AI explained every factor clearly.', rating: 5, avatar: 'PS' },
  { name: 'Rajesh Kumar', role: 'Business Owner, Mumbai', text: 'The rejection suggestions helped me improve my credit score. Reapplied 3 months later — approved!', rating: 5, avatar: 'RK' },
  { name: 'Ananya Patel', role: 'Doctor, Hyderabad', text: 'Best fintech experience I\'ve had. The dashboard is gorgeous and the AI is incredibly accurate.', rating: 5, avatar: 'AP' },
];

function EMICalculatorWidget() {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(10.5);
  const [term, setTerm] = useState(36);

  const r = rate / (12 * 100);
  const emi = r === 0 ? amount / term : (amount * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);
  const totalAmount = emi * term;
  const totalInterest = totalAmount - amount;

  const SliderInput = ({ label, value, min, max, step, onChange, format }: any) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-slate-400">{label}</label>
        <span className="text-sm font-bold text-blue-400">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
        style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)` }}
      />
    </div>
  );

  return (
    <div className="glass-card p-8 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold text-white mb-6 font-display text-center">EMI Calculator</h3>
      <div className="space-y-6 mb-8">
        <SliderInput label="Loan Amount" value={amount} min={50000} max={5000000} step={10000}
          onChange={setAmount} format={(v: number) => `₹${(v / 100000).toFixed(1)}L`} />
        <SliderInput label="Interest Rate (p.a.)" value={rate} min={5} max={30} step={0.5}
          onChange={setRate} format={(v: number) => `${v}%`} />
        <SliderInput label="Loan Term" value={term} min={6} max={360} step={6}
          onChange={setTerm} format={(v: number) => v >= 12 ? `${v / 12}yr` : `${v}mo`} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Monthly EMI', value: `₹${Math.round(emi).toLocaleString()}`, color: 'text-blue-400' },
          { label: 'Total Interest', value: `₹${Math.round(totalInterest).toLocaleString()}`, color: 'text-amber-400' },
          { label: 'Total Amount', value: `₹${Math.round(totalAmount).toLocaleString()}`, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center p-4 bg-white/5 rounded-2xl">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1 }}
      className="glass-card p-6 hover:scale-[1.02] hover:shadow-glow transition-all duration-300 group"
    >
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <feature.icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-display font-semibold text-lg text-white mb-2">{feature.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060b18] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[#060b18]/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg">Vertex Loan AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#calculator" className="hover:text-white transition-colors">Calculator</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm hidden md:flex">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 text-center overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[100px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/5 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-5xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium mb-8"
          >
            <Zap className="w-4 h-4" />
            Powered by XGBoost & Ensemble AI — 96.4% Accuracy
          </motion.div>

          <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl leading-[1.05] mb-6 tracking-tight">
            Know Your Loan
            <br />
            <span className="gradient-text">Eligibility</span> in
            <br />
            <span className="text-white">3 Seconds</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Advanced AI analyzes 20+ financial parameters, explains every decision, detects fraud, and suggests personalized improvements. Banking intelligence, reinvented.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
            >
              Check My Eligibility <ArrowRight className="w-5 h-5" />
            </motion.button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-base px-8 py-4 w-full sm:w-auto"
            >
              Sign In to Dashboard
            </button>
          </div>
        </motion.div>

        {/* Floating cards */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="absolute right-8 top-1/3 hidden xl:block"
        >
          <div className="glass-card p-4 w-52">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-white">Loan Approved</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400 mb-1">97.4%</div>
            <div className="text-xs text-slate-400">Confidence Score</div>
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: '97%' }} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="absolute left-8 top-2/3 hidden xl:block"
        >
          <div className="glass-card p-4 w-48">
            <div className="text-xs text-slate-400 mb-2">Risk Score</div>
            <div className="text-3xl font-bold text-blue-400 mb-1">12.5</div>
            <div className="text-xs font-medium text-emerald-400">✓ Very Low Risk</div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 cursor-pointer"
          onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <Icon className="w-7 h-7 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{value}</div>
              <div className="text-sm text-slate-400">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
              Everything You Need,
              <br />
              <span className="gradient-text">Nothing You Don't</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A complete AI-powered banking platform that goes beyond simple loan checks.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* EMI Calculator */}
      <section id="calculator" className="py-20 px-6 bg-gradient-to-b from-transparent to-blue-900/10">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">EMI Calculator</h2>
            <p className="text-slate-400">Drag the sliders to calculate your monthly payments instantly.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <EMICalculatorWidget />
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">Loved by Thousands</h2>
            <p className="text-slate-400">Real customers, real results.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass-card p-6">
                <div className="flex mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto glass-card p-12 text-center"
        >
          <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
            Ready to Get <span className="gradient-text">Started?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8">Join 12,000+ customers making smarter borrowing decisions with AI.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-4">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-4">Sign In</Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span className="font-display font-bold text-white">Vertex Loan AI</span>
        </div>
        <p>© 2026 Vertex Loan AI. Enterprise AI Banking Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
