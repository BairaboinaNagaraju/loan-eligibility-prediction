import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, 
  Cpu, 
  CheckCircle, 
  HelpCircle, 
  ChevronDown, 
  MessageSquare, 
  ArrowRight, 
  Percent, 
  DollarSign, 
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // EMI Calculator State
  const [loanAmount, setLoanAmount] = useState(150000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30); // in years

  // Affordability Calculator State
  const [monthlyIncome, setMonthlyIncome] = useState(6000);
  const [monthlyDebts, setMonthlyDebts] = useState(1200);

  // EMI Calculations
  const r = (interestRate / 12) / 100;
  const n = loanTerm * 12;
  const emi = r > 0 ? (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : loanAmount / n;
  const totalPayment = emi * n;
  const totalInterest = totalPayment - loanAmount;

  // Affordability Calculations
  // Standard banking guideline: Debt-to-Income (DTI) should not exceed 40%
  const maxEMI = (monthlyIncome * 0.40) - monthlyDebts;
  const maxLoanAffordable = maxEMI > 0 ? (maxEMI * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n)) : 0;

  const faqs = [
    {
      q: "How does the AI Loan Predictor evaluate my application?",
      a: "Our system runs your data through an advanced Random Forest and Gradient Boosting classifier trained on historical banking data. It analyzes factors like your credit history, income-to-debt ratio, property area, and education level to calculate the statistical probability of loan approval."
    },
    {
      q: "Is credit history mandatory for getting an approval prediction?",
      a: "Yes, credit history (whether you have met previous credit obligations) is the strongest indicator of loan eligibility in modern banking models. An active credit history of 1.0 (Good) significantly boosts your eligibility probability."
    },
    {
      q: "Can I use this for real mortgage or commercial loan evaluations?",
      a: "While our AI model is built on standard retail banking loan parameters, this tool is designed for eligibility estimation. Final approvals are subject to verification, home valuations, and regulatory checks by Vertex Bank underwriters."
    },
    {
      q: "How can I improve my eligibility if the AI predicts rejection?",
      a: "You can increase eligibility by adding a co-applicant with a stable income, requesting a lower principal loan amount, choosing a longer amortization term, or paying off minor credit cards to boost your credit history profile."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-dark-900 dark:text-dark-50 transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-effect w-full py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/20 text-white font-bold text-xl">
            V
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent dark:from-white dark:to-primary-300">
            VertexBank
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium shadow-md shadow-primary-500/10 hover:shadow-primary-500/20 transition-all flex items-center space-x-2"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium shadow-md shadow-primary-500/10 hover:shadow-primary-500/20 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-24 px-6 md:px-12 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center overflow-hidden">
        {/* Decorative Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl -z-10 dark:bg-primary-500/5"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl -z-10 dark:bg-emerald-500/5"></div>

        <div className="space-y-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-xs font-semibold uppercase tracking-wider border border-primary-100 dark:border-primary-900/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Retail Banking</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
            Smart Loan Eligibility, <br />
            <span className="bg-gradient-to-r from-primary-600 to-emerald-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-emerald-400">
              Evaluated by Machine Learning.
            </span>
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-350 max-w-lg leading-relaxed">
            Get instant, institutional-grade loan approval predictions using our advanced AI risk scoring. View real-time interest rates, calculate payments, and check eligibility in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link 
              to={isAuthenticated ? "/dashboard/apply" : "/register"} 
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold text-center shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 transform hover:-translate-y-0.5 transition-all flex justify-center items-center space-x-2.5"
            >
              <span>Apply for AI Prediction</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#calculators" 
              className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-center dark:bg-dark-650 dark:hover:bg-slate-800 dark:border-slate-750 dark:text-dark-50 transition-all"
            >
              Try Calculators
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800/80">
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">94%</p>
              <p className="text-xs text-slate-500 dark:text-dark-400 font-medium mt-1">Prediction Accuracy</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">&lt; 3s</p>
              <p className="text-xs text-slate-500 dark:text-dark-400 font-medium mt-1">Instant Decision Time</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">5.75%</p>
              <p className="text-xs text-slate-500 dark:text-dark-400 font-medium mt-1">Starting APR</p>
            </div>
          </div>
        </div>

        {/* Graphical Landing illustration */}
        <div className="relative flex justify-center items-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-emerald-500/20 rounded-3xl blur-2xl -z-10 opacity-70"></div>
          <div className="glass-card w-full max-w-md rounded-3xl p-8 space-y-6 transform hover:scale-[1.01] transition-transform duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <Cpu className="w-5 h-5 text-primary-500" />
                <span className="font-bold text-sm text-slate-500 dark:text-dark-300 uppercase tracking-wider">AI Assessment Engine</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">Active</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500 dark:text-dark-300">
                  <span>Applicant Income Profile</span>
                  <span className="font-bold">$7,500/mo</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 w-[75%] rounded-full"></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500 dark:text-dark-300">
                  <span>Requested Loan Amount</span>
                  <span className="font-bold">$220,000</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[55%] rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-dark-250">Credit History Verified</span>
                </div>
                <span className="text-xs font-bold text-emerald-500">GOOD (1.0)</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 text-white space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium opacity-90">Eligibility Decision</span>
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded">APPROVED</span>
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-3xl font-extrabold">91.4%</span>
                <span className="text-xs font-medium opacity-85">AI confidence score</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Cards */}
      <section className="py-20 px-6 bg-white dark:bg-dark-800 border-y border-slate-200 dark:border-slate-850">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Why Vertex Bank AI Scoring?</h2>
            <p className="text-slate-600 dark:text-dark-300">
              Unlike traditional credit bureaus, our algorithms consider multi-dimensional parameters to yield a fair and extremely comprehensive review.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-dark-650 dark:border-slate-750 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Explainable AI Checks</h3>
              <p className="text-slate-600 dark:text-dark-300 leading-relaxed text-sm">
                Get a transparent breakdown of exactly why you were approved or rejected. We list your profile's strengths and highlight risks transparently.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-dark-650 dark:border-slate-750 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure JWT Authentication</h3>
              <p className="text-slate-600 dark:text-dark-300 leading-relaxed text-sm">
                Your personal and financial profile is protected under industrial standard encryption, preventing unauthorized access or leaks.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-dark-650 dark:border-slate-750 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Financial Chatbot</h3>
              <p className="text-slate-600 dark:text-dark-300 leading-relaxed text-sm">
                Interact with our local financial assistant to query your loan statuses, calculate complex interests, or request direct tips on eligibility boost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Amortization and Affordability calculators */}
      <section id="calculators" className="py-20 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Interactive Loan Calculators</h2>
          <p className="text-slate-600 dark:text-dark-300">
            Estimate your monthly payments or discover the maximum budget you can afford before launching your AI evaluation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Card 1: EMI Calculator */}
          <div className="glass-card rounded-3xl p-8 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">EMI (Monthly Payment)</h3>
                <p className="text-xs text-slate-500 dark:text-dark-400">Calculate principal & interest amortization payments</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Loan Amount */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-600 dark:text-dark-350">Loan Amount ($)</span>
                  <span className="text-primary-600 dark:text-primary-400">${loanAmount.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="10000" 
                  max="750000" 
                  step="5000"
                  value={loanAmount} 
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500" 
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>$10k</span>
                  <span>$750k</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-600 dark:text-dark-350">Interest Rate (% APR)</span>
                  <span className="text-primary-600 dark:text-primary-400">{interestRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="2.0" 
                  max="15.0" 
                  step="0.1"
                  value={interestRate} 
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500" 
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>2.0%</span>
                  <span>15.0%</span>
                </div>
              </div>

              {/* Loan Term */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-600 dark:text-dark-350">Amortization Period (Years)</span>
                  <span className="text-primary-600 dark:text-primary-400">{loanTerm} Years</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 30].map(y => (
                    <button 
                      key={y}
                      onClick={() => setLoanTerm(y)}
                      className={`py-2 px-3 text-xs rounded-xl font-bold transition-all border ${
                        loanTerm === y 
                          ? 'bg-primary-600 border-primary-600 text-white' 
                          : 'bg-transparent border-slate-200 hover:bg-slate-100 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-dark-300'
                      }`}
                    >
                      {y} yrs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-dark-400 uppercase tracking-wider font-semibold">Monthly EMI</p>
                <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">${emi.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-dark-400 uppercase tracking-wider font-semibold">Total Interest</p>
                <p className="text-lg font-bold text-slate-700 dark:text-dark-200">${totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Affordability Calculator */}
          <div className="glass-card rounded-3xl p-8 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Loan Affordability</h3>
                <p className="text-xs text-slate-500 dark:text-dark-400">Estimate maximum supportable loan principal size</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Monthly Income */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-600 dark:text-dark-350">Gross Monthly Income ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                  <input 
                    type="number" 
                    value={monthlyIncome} 
                    onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                    className="w-full py-3.5 pl-8 pr-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                  />
                </div>
              </div>

              {/* Monthly Debts */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-600 dark:text-dark-350">Other Active Monthly Debts/Bills ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                  <input 
                    type="number" 
                    value={monthlyDebts} 
                    onChange={(e) => setMonthlyDebts(Math.max(0, Number(e.target.value)))}
                    className="w-full py-3.5 pl-8 pr-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Includes active auto loans, credit card balances, and utilities</p>
              </div>

              {/* Assumption term info */}
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>Assumes a <strong>{interestRate}% APR</strong> rate for a <strong>{loanTerm}-Year</strong> term.</span>
              </div>
            </div>

            {/* Results */}
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-center">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">Estimated Max Affordable Loan</p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {maxLoanAffordable > 0 
                  ? `$${maxLoanAffordable.toLocaleString(undefined, {maximumFractionDigits: 0})}`
                  : '$0'}
              </p>
              <p className="text-[10px] text-slate-400 pt-1">Target Monthly Payment capacity: ${Math.max(0, maxEMI).toLocaleString(undefined, {maximumFractionDigits: 0})}/mo</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-6 bg-slate-100 dark:bg-dark-800 border-y border-slate-200 dark:border-slate-850">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">How the System Works</h2>
            <p className="text-slate-600 dark:text-dark-300">Fast, automated, and explainable evaluations in four simple steps.</p>
          </div>

          <div className="relative border-l border-primary-200 dark:border-primary-900 pl-6 space-y-8 ml-4">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">Register Profile</h4>
                <p className="text-sm text-slate-600 dark:text-dark-300">Create a secure client profile to verify your personal authentication identifiers.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow">
                2
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">Provide Application Parameters</h4>
                <p className="text-sm text-slate-600 dark:text-dark-300">Fill in demographic metrics, income levels, credit default status, and requested loan amount.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow">
                3
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">Automated AI Prediction</h4>
                <p className="text-sm text-slate-600 dark:text-dark-300">Our machine learning classifiers evaluate inputs against historical default correlations.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow">
                4
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">Explainable Recommendations</h4>
                <p className="text-sm text-slate-600 dark:text-dark-300">View immediate eligibility ratings, confidence parameters, and custom tips for eligibility correction.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <h2 className="text-3xl font-extrabold tracking-tight text-center text-slate-900 dark:text-white">What Clients Say</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card rounded-2xl p-8 space-y-4">
            <p className="italic text-slate-600 dark:text-dark-300">
              "The AI prediction gave me an instant answer. Based on the recommendations, I lowered my requested principal, added my spouse as co-applicant, and successfully qualified on my second test. This is next-gen banking!"
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm uppercase">
                SC
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Sarah Connor</p>
                <p className="text-xs text-slate-500">Retail Client</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-8 space-y-4">
            <p className="italic text-slate-600 dark:text-dark-300">
              "The explainable AI breakdown is fantastic. It told me exactly that my credit history score was the main positive force but my debt-to-income ratio was on the edge. Very transparent and extremely useful tool."
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm uppercase">
                MD
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Marcus Devries</p>
                <p className="text-xs text-slate-500">Homebuyer Client</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-dark-900 border-t border-slate-200 dark:border-slate-850">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-center text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-650 overflow-hidden"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-5 flex justify-between items-center text-left font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="p-5 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-650 dark:text-dark-300 leading-relaxed bg-slate-50/50 dark:bg-dark-800/10">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-6 max-w-lg mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Contact Our Team</h2>
          <p className="text-slate-600 dark:text-dark-300">Have questions about our API integrations or ML systems?</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); alert("Thank you for your message! Our underwriting team will reach out shortly."); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
              <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-dark-650 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
              <input required type="email" className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-dark-650 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Message</label>
            <textarea required rows={4} className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-dark-650 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
          </div>
          <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold transition-all shadow shadow-primary-500/20">
            Submit Message
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-850 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold shadow shadow-primary-500/20 text-md">
                V
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                VertexBank
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Next-generation retail credit assessments using artificial intelligence algorithms. Fully transparent, safe, and secure under strict regulatory guidelines.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm">Products</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#calculators" className="hover:text-white transition-colors">EMI Calculator</a></li>
              <li><a href="#calculators" className="hover:text-white transition-colors">Affordability Scoring</a></li>
              <li><Link to="/register" className="hover:text-white transition-colors">AI Eligibility Check</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm">Developers</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Swagger API Documentation</a></li>
              <li><a href="http://localhost:8000/redoc" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Redoc Schemas</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm">Security</h5>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> <span>JWT Encrypted Session</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> <span>SQLite/PostgreSQL Compliant</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-800/80 mt-12 pt-6 text-center text-xs text-slate-650 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Vertex Bank International Inc. All rights reserved.</p>
          <div className="flex space-x-4">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
