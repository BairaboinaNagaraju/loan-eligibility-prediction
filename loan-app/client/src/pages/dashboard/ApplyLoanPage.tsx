import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2, User, Briefcase, DollarSign, FileText, Upload } from 'lucide-react';
import api from '../../lib/api';

const schema = z.object({
  // Personal
  fullName: z.string().min(2),
  age: z.coerce.number().min(18).max(70),
  gender: z.enum(['male', 'female', 'other']),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
  dependents: z.coerce.number().min(0).max(10),
  // Employment
  employmentType: z.enum(['salaried', 'self_employed', 'business', 'freelancer']),
  companyName: z.string().optional(),
  jobExperience: z.coerce.number().min(0).max(50),
  monthlySalary: z.coerce.number().min(0),
  annualIncome: z.coerce.number().min(0),
  coapplicantIncome: z.coerce.number().min(0).optional(),
  // Financial
  existingLoans: z.coerce.number().min(0),
  creditScore: z.coerce.number().min(300).max(900),
  creditCardDebt: z.coerce.number().min(0),
  monthlyExpenses: z.coerce.number().min(0),
  savings: z.coerce.number().min(0),
  investments: z.coerce.number().min(0),
  assets: z.coerce.number().min(0),
  // Loan Details
  loanAmount: z.coerce.number().min(10000),
  loanPurpose: z.enum(['home', 'education', 'personal', 'business', 'vehicle', 'medical', 'home_renovation', 'other']),
  loanTerm: z.coerce.number().min(6).max(360),
  interestPref: z.enum(['fixed', 'floating']),
  education: z.enum(['Graduate', 'Not Graduate']).optional(),
  propertyArea: z.enum(['Urban', 'Semiurban', 'Rural']).optional(),
});

type FormData = z.infer<typeof schema>;

const steps = [
  { id: 1, title: 'Personal Info', icon: User, desc: 'Basic personal details' },
  { id: 2, title: 'Employment', icon: Briefcase, desc: 'Your work details' },
  { id: 3, title: 'Financial', icon: DollarSign, desc: 'Income & debt snapshot' },
  { id: 4, title: 'Loan Details', icon: FileText, desc: 'What you need' },
  { id: 5, title: 'Documents', icon: Upload, desc: 'Upload documents' },
];

const FormField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="form-label">{label}</label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

const SelectField = ({ label, error, options, ...props }: any) => (
  <FormField label={label} error={error}>
    <select className="input-field" {...props}>
      <option value="">Select...</option>
      {options.map(([v, l]: [string, string]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </FormField>
);

const NumberInput = ({ label, error, prefix = '₹', ...props }: any) => (
  <FormField label={label} error={error}>
    <div className="relative">
      {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{prefix}</span>}
      <input type="number" className={`input-field ${prefix ? 'pl-8' : ''}`} min="0" {...props} />
    </div>
  </FormField>
);

export default function ApplyLoanPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { dependents: 0, existingLoans: 0, creditCardDebt: 0, savings: 0, investments: 0, assets: 0, interestPref: 'fixed', education: 'Graduate', propertyArea: 'Urban' },
  });

  const stepFields: Record<number, (keyof FormData)[]> = {
    1: ['fullName', 'age', 'gender', 'maritalStatus', 'dependents'],
    2: ['employmentType', 'jobExperience', 'monthlySalary', 'annualIncome'],
    3: ['existingLoans', 'creditScore', 'creditCardDebt', 'monthlyExpenses', 'savings'],
    4: ['loanAmount', 'loanPurpose', 'loanTerm', 'interestPref'],
  };

  const nextStep = async () => {
    if (step < 5) {
      const fields = stepFields[step];
      const valid = fields ? await trigger(fields) : true;
      if (valid) setStep(s => s + 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await api.post('/loans/apply', data);
      const { applicationId } = response.data.data;
      toast.success('Application submitted! AI is analyzing your profile... 🤖');
      navigate(`/dashboard/result/${applicationId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-white mb-2">Apply for a Loan</h1>
        <p className="text-slate-400">Complete all steps. AI will analyze your profile in real-time.</p>
      </div>

      {/* Step Progress */}
      <div className="glass-card p-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {steps.map(({ id, title, icon: Icon }, i) => (
            <div key={id} className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => id < step && setStep(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                  step === id
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                    : step > id
                    ? 'bg-emerald-500/20 text-emerald-400 cursor-pointer'
                    : 'bg-white/5 text-slate-500 cursor-default'
                }`}>
                {step > id ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span className="text-xs font-medium hidden md:block">{title}</span>
              </button>
              {i < steps.length - 1 && <div className={`w-6 h-px flex-shrink-0 ${step > id ? 'bg-emerald-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <div className="glass-card p-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 1 — Personal Information */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="font-display font-semibold text-xl text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" /> Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <FormField label="Full Name" error={errors.fullName?.message}>
                      <input {...register('fullName')} className="input-field" placeholder="Priya Sharma" />
                    </FormField>
                  </div>
                  <NumberInput label="Age" error={errors.age?.message} {...register('age')} prefix="" placeholder="32" />
                  <SelectField label="Gender" error={errors.gender?.message} {...register('gender')}
                    options={[['male', 'Male'], ['female', 'Female'], ['other', 'Other']]} />
                  <SelectField label="Marital Status" error={errors.maritalStatus?.message} {...register('maritalStatus')}
                    options={[['single', 'Single'], ['married', 'Married'], ['divorced', 'Divorced'], ['widowed', 'Widowed']]} />
                  <NumberInput label="Number of Dependents" error={errors.dependents?.message} {...register('dependents')} prefix="" placeholder="0" />
                </div>
              </motion.div>
            )}

            {/* Step 2 — Employment */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="font-display font-semibold text-xl text-white mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-violet-400" /> Employment Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <SelectField label="Employment Type" error={errors.employmentType?.message} {...register('employmentType')}
                    options={[['salaried', 'Salaried'], ['self_employed', 'Self Employed'], ['business', 'Business Owner'], ['freelancer', 'Freelancer']]} />
                  <FormField label="Company Name (optional)" error={errors.companyName?.message}>
                    <input {...register('companyName')} className="input-field" placeholder="Tech Corp India" />
                  </FormField>
                  <NumberInput label="Job Experience (Years)" error={errors.jobExperience?.message} {...register('jobExperience')} prefix="" placeholder="5" />
                  <NumberInput label="Monthly Salary" error={errors.monthlySalary?.message} {...register('monthlySalary')} placeholder="75000" />
                  <NumberInput label="Annual Income" error={errors.annualIncome?.message} {...register('annualIncome')} placeholder="900000" />
                  <NumberInput label="Co-applicant Income (if any)" error={errors.coapplicantIncome?.message} {...register('coapplicantIncome')} placeholder="0" />
                  <SelectField label="Education" error={errors.education?.message} {...register('education')}
                    options={[['Graduate', 'Graduate'], ['Not Graduate', 'Not Graduate']]} />
                </div>
              </motion.div>
            )}

            {/* Step 3 — Financial */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="font-display font-semibold text-xl text-white mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" /> Financial Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <NumberInput label="Credit Score" error={errors.creditScore?.message} {...register('creditScore')} prefix="" placeholder="750" />
                    <p className="text-xs text-slate-500 mt-1">CIBIL/Experian score (300–900)</p>
                  </div>
                  <NumberInput label="Existing Loans (outstanding)" error={errors.existingLoans?.message} {...register('existingLoans')} placeholder="200000" />
                  <NumberInput label="Credit Card Debt" error={errors.creditCardDebt?.message} {...register('creditCardDebt')} placeholder="15000" />
                  <NumberInput label="Monthly Expenses" error={errors.monthlyExpenses?.message} {...register('monthlyExpenses')} placeholder="35000" />
                  <NumberInput label="Total Savings" error={errors.savings?.message} {...register('savings')} placeholder="500000" />
                  <NumberInput label="Investments" error={errors.investments?.message} {...register('investments')} placeholder="300000" />
                  <NumberInput label="Total Assets (property, etc.)" error={errors.assets?.message} {...register('assets')} placeholder="2000000" />
                </div>
              </motion.div>
            )}

            {/* Step 4 — Loan Details */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="font-display font-semibold text-xl text-white mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" /> Loan Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <NumberInput label="Loan Amount Required" error={errors.loanAmount?.message} {...register('loanAmount')} placeholder="500000" />
                  </div>
                  <SelectField label="Loan Purpose" error={errors.loanPurpose?.message} {...register('loanPurpose')}
                    options={[['home', 'Home Purchase'], ['education', 'Education'], ['personal', 'Personal'], ['business', 'Business'], ['vehicle', 'Vehicle'], ['medical', 'Medical'], ['home_renovation', 'Home Renovation'], ['other', 'Other']]} />
                  <NumberInput label="Loan Term (Months)" error={errors.loanTerm?.message} {...register('loanTerm')} prefix="" placeholder="36" />
                  <SelectField label="Interest Type" error={errors.interestPref?.message} {...register('interestPref')}
                    options={[['fixed', 'Fixed Rate'], ['floating', 'Floating Rate']]} />
                  <SelectField label="Property Area" error={errors.propertyArea?.message} {...register('propertyArea')}
                    options={[['Urban', 'Urban'], ['Semiurban', 'Semi-urban'], ['Rural', 'Rural']]} />
                </div>
              </motion.div>
            )}

            {/* Step 5 — Documents (upload section) */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="font-display font-semibold text-xl text-white mb-6 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-rose-400" /> Documents & Submit
                </h2>
                <div className="space-y-4 mb-8">
                  {['Aadhaar Card', 'PAN Card', 'Salary Slips (Last 3)', 'Bank Statement (6 months)', 'Passport Photo'].map((doc) => (
                    <div key={doc} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-dashed border-white/20 hover:border-blue-500/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-white">{doc}</p>
                          <p className="text-xs text-slate-500">PDF, JPG, PNG — Max 10MB</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded">Optional</span>
                    </div>
                  ))}
                </div>
                <div className="glass-card p-4 border-blue-500/30 bg-blue-500/5">
                  <p className="text-sm text-blue-300">
                    📋 <strong>Note:</strong> Document upload can be completed later from your profile. Your AI prediction will run immediately after submission.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
            <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1}
              className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {step < 5 ? (
              <button type="button" onClick={nextStep} className="btn-primary">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="btn-primary px-8">
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI...</>
                ) : (
                  <>Submit & Get AI Prediction 🤖</>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
