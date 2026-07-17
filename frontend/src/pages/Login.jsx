import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Incorrect username or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md space-y-8 relative">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow shadow-primary-500/20 text-white font-bold text-lg">
              V
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent dark:from-white dark:to-primary-300">
              VertexBank
            </span>
          </Link>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4">Welcome Back</h2>
          <p className="text-sm text-slate-500 dark:text-dark-400">Enter your credentials to access your AI Loan portal</p>
        </div>

        {/* Glass Card */}
        <div className="glass-card rounded-3xl p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. johndoe"
                  className="w-full py-3 pl-11 pr-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-sm text-slate-800 dark:text-dark-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Password</label>
                <button 
                  type="button" 
                  onClick={() => alert("Please contact the administrator to reset your credentials: admin@vertexbank.com")}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 pl-11 pr-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-sm text-slate-800 dark:text-dark-50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold text-sm transition-all shadow-md shadow-primary-500/10 hover:shadow-primary-500/20 disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 dark:text-dark-450 border-t border-slate-100 dark:border-slate-800 pt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
