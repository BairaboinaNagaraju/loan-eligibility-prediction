import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, DollarSign, HelpCircle, ArrowRight, ArrowLeft,
  Cpu, ShieldCheck, AlertCircle, CheckCircle, Home,
  Briefcase, Users, GraduationCap, MapPin, CreditCard
} from 'lucide-react';
import { loanService } from '../services/api';

const STEPS = ['Personal Info', 'Financial Details', 'Review & Submit'];

const SelectCard = ({ options, value, onChange, name }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange({ target: { name, value: opt.value } })}
        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
          value === opt.value
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 dark:border-primary-500'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/30'
        }`}
      >
        {opt.icon && <opt.icon className="w-4 h-4" />}
        <span>{opt.label}</span>
      </button>
    ))}
  </div>
);

const FieldLabel = ({ children, icon: Icon, hint }) => (
  <div className="flex items-center justify-between mb-2">
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
      {Icon && <Icon className="w-4 h-4 text-primary-500" />}
      {children}
    </label>
    {hint && <span className="text-xs text-slate-400">{hint}</span>}
  </div>
);

export default function LoanForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mlLogs, setMlLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);

  const [formData, setFormData] = useState({
    gender: 'Male',
    married: 'Yes',
    dependents: '0',
    education: 'Graduate',
    self_employed: 'No',
    applicant_income: '',
    coapplicant_income: '0',
    loan_amount: '',
    loan_amount_term: '360',
    credit_history: '1.0',
    property_area: 'Semiurban',
  });

  const logs = [
    '🔐 Establishing secure connection to Vertex Assess API...',
    '🔎 Validating financial inputs and schema integrity...',
    '⚙️  Engineering features: TotalIncome, Monthly EMI, IncomeToEMI...',
    '📏 Scaling parameters against training distribution values...',
    '🤖 Running inference through the champion ML classifier...',
    '💡 Calculating Explainable AI (XAI) factor weights...',
    '📋 Compiling credit risk certificate report...',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    if (step === 2) {
      if (!formData.applicant_income || Number(formData.applicant_income) <= 0) {
        setError('Please enter a valid applicant monthly income (must be > $0)');
        return false;
      }
      if (!formData.loan_amount || Number(formData.loan_amount) <= 0) {
        setError('Please enter a valid requested loan amount (in thousands, e.g. 100 for $100k)');
        return false;
      }
      if (!formData.loan_amount_term || Number(formData.loan_amount_term) <= 0) {
        setError('Please enter a valid loan amortization term (in months, e.g. 360 for 30 years)');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setError('');
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const runLogsAnimation = () => {
    return new Promise((resolve) => {
      let i = 0;
      setMlLogs([logs[0]]);
      const interval = setInterval(() => {
        i++;
        if (i < logs.length) {
          setMlLogs((prev) => [...prev, logs[i]]);
        } else {
          clearInterval(interval);
          setTimeout(resolve, 500);
        }
      }, 400);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setMlLogs([]);

    try {
      // Run log animation in parallel with API call
      const [result] = await Promise.all([
        loanService.submitApplication({
          ...formData,
          applicant_income: Number(formData.applicant_income),
          coapplicant_income: Number(formData.coapplicant_income),
          loan_amount: Number(formData.loan_amount),
          loan_amount_term: Number(formData.loan_amount_term),
          credit_history: Number(formData.credit_history),
        }),
        runLogsAnimation(),
      ]);

      // Store result in sessionStorage for PredictionResult page
      sessionStorage.setItem('prediction_result', JSON.stringify(result));
      navigate(`/dashboard/result/${result.id}`);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string' && detail.includes('not found')) {
        setError('ML model not trained yet. Please ask an admin to train the model first.');
      } else {
        setError(detail || 'Prediction failed. Please verify all fields and try again.');
      }
      setIsSubmitting(false);
    }
  };

  // ─── Computed preview values ───────────────────────────────────────────────
  const totalIncome = (Number(formData.applicant_income) || 0) + (Number(formData.coapplicant_income) || 0);
  const emiMonthly = formData.loan_amount && formData.loan_amount_term
    ? (Number(formData.loan_amount) * 1000) / Number(formData.loan_amount_term)
    : 0;
  const dti = totalIncome > 0 ? (emiMonthly / totalIncome) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          AI Loan Eligibility Application
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Complete all 3 steps — our ML model evaluates your profile instantly
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between">
          {STEPS.map((label, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs font-semibold ${
              i + 1 <= step ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i + 1 < step
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : i + 1 === step
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-slate-300 dark:border-slate-700 text-slate-400'
              }`}>
                {i + 1 < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="hidden sm:block">{label}</span>
            </div>
          ))}
        </div>
        <div className="relative h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"
            animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Form Card */}
      <div className="glass-card rounded-3xl p-8">
        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Personal Information ─────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Demographic details used for risk profiling</p>
              </div>

              {/* Gender */}
              <div>
                <FieldLabel icon={User}>Gender</FieldLabel>
                <SelectCard
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  options={[
                    { value: 'Male', label: 'Male', icon: User },
                    { value: 'Female', label: 'Female', icon: User },
                  ]}
                />
              </div>

              {/* Married */}
              <div>
                <FieldLabel icon={Users}>Marital Status</FieldLabel>
                <SelectCard
                  name="married"
                  value={formData.married}
                  onChange={handleInputChange}
                  options={[
                    { value: 'Yes', label: 'Married' },
                    { value: 'No', label: 'Single / Unmarried' },
                  ]}
                />
              </div>

              {/* Dependents */}
              <div>
                <FieldLabel icon={Users} hint="Number of financially dependent family members">Dependents</FieldLabel>
                <SelectCard
                  name="dependents"
                  value={formData.dependents}
                  onChange={handleInputChange}
                  options={[
                    { value: '0', label: 'None (0)' },
                    { value: '1', label: '1 Dependent' },
                    { value: '2', label: '2 Dependents' },
                    { value: '3+', label: '3+ Dependents' },
                  ]}
                />
              </div>

              {/* Education */}
              <div>
                <FieldLabel icon={GraduationCap}>Education Level</FieldLabel>
                <SelectCard
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  options={[
                    { value: 'Graduate', label: 'Graduate', icon: GraduationCap },
                    { value: 'Not Graduate', label: 'Undergraduate', icon: GraduationCap },
                  ]}
                />
              </div>

              {/* Self Employed */}
              <div>
                <FieldLabel icon={Briefcase}>Employment Status</FieldLabel>
                <SelectCard
                  name="self_employed"
                  value={formData.self_employed}
                  onChange={handleInputChange}
                  options={[
                    { value: 'No', label: 'Salaried / Employed', icon: Briefcase },
                    { value: 'Yes', label: 'Self-Employed / Business', icon: Briefcase },
                  ]}
                />
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Financial Details ─────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Financial Details</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Income, loan parameters, and credit standing</p>
              </div>

              {/* Income fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel icon={DollarSign} hint="Monthly gross">Applicant Income ($)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number" name="applicant_income" min="0"
                      value={formData.applicant_income}
                      onChange={handleInputChange}
                      placeholder="e.g. 5000"
                      className="w-full py-3 pl-8 pr-4 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel icon={DollarSign} hint="Optional">Co-Applicant Income ($)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number" name="coapplicant_income" min="0"
                      value={formData.coapplicant_income}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full py-3 pl-8 pr-4 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Loan amount */}
              <div>
                <FieldLabel icon={DollarSign} hint="In thousands (e.g. 150 = $150,000)">Requested Loan Amount (in $k)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number" name="loan_amount" min="1"
                    value={formData.loan_amount}
                    onChange={handleInputChange}
                    placeholder="e.g. 150"
                    className="w-full py-3 pl-8 pr-4 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">× 1000</span>
                </div>
                {formData.loan_amount && (
                  <p className="text-xs text-slate-400 mt-1">= ${(Number(formData.loan_amount) * 1000).toLocaleString()} total</p>
                )}
              </div>

              {/* Loan term */}
              <div>
                <FieldLabel icon={HelpCircle} hint="In months">Loan Amortization Term</FieldLabel>
                <div className="grid grid-cols-4 gap-2">
                  {[{ v: '60', l: '5 Yrs' }, { v: '120', l: '10 Yrs' }, { v: '180', l: '15 Yrs' }, { v: '360', l: '30 Yrs' }].map((t) => (
                    <button
                      key={t.v}
                      type="button"
                      onClick={() => handleInputChange({ target: { name: 'loan_amount_term', value: t.v } })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                        formData.loan_amount_term === t.v
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
                <input
                  type="number" name="loan_amount_term" min="12" max="480"
                  value={formData.loan_amount_term}
                  onChange={handleInputChange}
                  placeholder="Custom months"
                  className="mt-2 w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                />
              </div>

              {/* Credit History */}
              <div>
                <FieldLabel icon={CreditCard}>Credit History</FieldLabel>
                <SelectCard
                  name="credit_history"
                  value={formData.credit_history}
                  onChange={handleInputChange}
                  options={[
                    { value: '1.0', label: 'Good (1.0) — Timely payments, no defaults', icon: ShieldCheck },
                    { value: '0.0', label: 'Bad / None (0.0) — Defaults or no history', icon: AlertCircle },
                  ]}
                />
              </div>

              {/* Property Area */}
              <div>
                <FieldLabel icon={MapPin}>Property Location</FieldLabel>
                <SelectCard
                  name="property_area"
                  value={formData.property_area}
                  onChange={handleInputChange}
                  options={[
                    { value: 'Urban', label: 'Urban', icon: Home },
                    { value: 'Semiurban', label: 'Semiurban', icon: Home },
                    { value: 'Rural', label: 'Rural', icon: Home },
                  ]}
                />
              </div>

              {/* Live preview */}
              {formData.applicant_income && formData.loan_amount && (
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Income</p>
                    <p className="text-base font-extrabold text-primary-600 dark:text-primary-400 mt-0.5">${totalIncome.toLocaleString()}/mo</p>
                  </div>
                  <div className="text-center border-x border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Est. Monthly EMI</p>
                    <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">${emiMonthly.toFixed(0)}/mo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">DTI Ratio</p>
                    <p className={`text-base font-extrabold mt-0.5 ${dti < 40 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {dti.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── STEP 3: Review & Submit ───────────────────────────────── */}
          {step === 3 && !isSubmitting && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review Application</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Confirm your details before AI evaluation</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Gender', value: formData.gender },
                  { label: 'Married', value: formData.married },
                  { label: 'Dependents', value: formData.dependents },
                  { label: 'Education', value: formData.education },
                  { label: 'Self Employed', value: formData.self_employed },
                  { label: 'Property Area', value: formData.property_area },
                  { label: 'Applicant Income', value: `$${Number(formData.applicant_income).toLocaleString()}/mo` },
                  { label: 'Co-Applicant Income', value: `$${Number(formData.coapplicant_income).toLocaleString()}/mo` },
                  { label: 'Loan Amount', value: `$${(Number(formData.loan_amount) * 1000).toLocaleString()}` },
                  { label: 'Loan Term', value: `${formData.loan_amount_term} months` },
                  { label: 'Credit History', value: formData.credit_history === '1.0' ? '✅ Good (1.0)' : '⚠️ Bad / None (0.0)' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{row.label}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 flex gap-3 items-start">
                <Cpu className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-primary-700 dark:text-primary-300">AI Evaluation Ready</p>
                  <p className="text-xs text-primary-600/70 dark:text-primary-400/70 mt-0.5">
                    Our champion ML model will analyze your 14-dimensional feature profile and deliver an instant eligibility decision with Explainable AI insights.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── ML Execution Loading State ────────────────────────────── */}
          {isSubmitting && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 space-y-8"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-primary-500" />
                </div>
              </div>

              <div className="w-full space-y-2">
                <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                  Running AI Inference Engine...
                </p>
                <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 font-mono text-xs space-y-1.5 max-h-52 overflow-y-auto">
                  <AnimatePresence>
                    {mlLogs.map((log, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-emerald-400 flex items-center gap-2"
                      >
                        <span className="text-slate-500 select-none">›</span>
                        {log}
                      </motion.p>
                    ))}
                  </AnimatePresence>
                  <p className="text-slate-500 animate-pulse">▍</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{error}</p>
          </motion.div>
        )}

        {/* Navigation buttons */}
        {!isSubmitting && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/60">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg shadow-primary-500/15 text-sm"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold transition-all shadow-lg shadow-primary-500/25 text-sm"
              >
                <Cpu className="w-4 h-4" />
                Run AI Prediction
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
