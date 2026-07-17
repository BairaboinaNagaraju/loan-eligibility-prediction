import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, ShieldCheck, ArrowRight, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { setCredentials } from '../../store/slices/authSlice';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, 'Invalid phone number').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const passwordRules = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = data;
      const response = await api.post('/auth/register', payload);
      const { user, accessToken, refreshToken } = response.data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success('Account created successfully! Welcome to Vertex Loan AI 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b18] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">Vertex Loan AI</span>
        </Link>

        <div className="glass-card p-8">
          <h1 className="font-display font-bold text-3xl text-white mb-2 text-center">Create Account</h1>
          <p className="text-slate-400 text-center mb-8">Start your AI-powered loan journey today</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input {...register('fullName')} placeholder="Priya Sharma" className="input-field pl-10" />
                </div>
                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="form-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input {...register('email')} type="email" placeholder="you@example.com" className="input-field pl-10" />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="form-label">Phone (optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input {...register('phone')} placeholder="+91 98765 43210" className="input-field pl-10" />
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input-field pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="form-label">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input {...register('confirmPassword')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input-field pl-10" />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Password strength indicators */}
            <AnimatePresence>
              {password && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex gap-3">
                  {passwordRules.map(({ label, test }) => {
                    const ok = test(password);
                    return (
                      <div key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${ok ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                          {ok && <Check className="w-2.5 h-2.5" />}
                        </div>
                        {label}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3.5">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
