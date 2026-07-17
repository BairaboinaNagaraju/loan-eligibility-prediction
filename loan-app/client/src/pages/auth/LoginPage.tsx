import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { setCredentials } from '../../store/slices/authSlice';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success(`Welcome back, ${user.fullName}! 👋`);
      navigate(user.role === 'ADMIN' || user.role === 'LOAN_OFFICER' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials for testing
  const demoLogin = async (type: 'admin' | 'customer') => {
    const creds = {
      admin: { email: 'admin@vertexloan.com', password: 'Admin@123' },
      customer: { email: 'demo@vertexloan.com', password: 'Customer@123' },
    };
    setLoading(true);
    try {
      const response = await api.post('/auth/login', creds[type]);
      const { user, accessToken, refreshToken } = response.data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success(`Demo ${type} login successful! 🚀`);
      navigate(user.role === 'ADMIN' || user.role === 'LOAN_OFFICER' ? '/admin' : '/dashboard');
    } catch {
      toast.error('Demo login failed. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b18] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-violet-600/20 to-transparent" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-500/15 rounded-full blur-[80px]" />

        <Link to="/" className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">Vertex Loan AI</span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display font-bold text-4xl xl:text-5xl text-white mb-4 leading-tight">
            AI-Powered<br />Loan Intelligence<br />
            <span className="gradient-text">for Everyone</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Join 12,000+ users making smarter financial decisions with our enterprise-grade AI platform.
          </p>

          <div className="mt-10 space-y-4">
            {['Instant AI prediction in under 3 seconds', 'SHAP-powered explainability', 'Bank-grade AES-256 encryption'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-600 text-sm">© 2026 Vertex Loan AI</p>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">Vertex Loan AI</span>
          </Link>

          <h1 className="font-display font-bold text-3xl text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 mb-8">Sign in to your account to continue</p>

          {/* Demo buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => demoLogin('customer')} disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-all">
              Demo Customer
            </button>
            <button onClick={() => demoLogin('admin')} disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-all">
              Demo Admin
            </button>
          </div>

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-500 text-xs">or sign in manually</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input {...register('email')} type="email" placeholder="you@example.com"
                  className="input-field pl-10" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3.5">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
