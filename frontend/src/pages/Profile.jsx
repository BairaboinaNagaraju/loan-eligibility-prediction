import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Shield, CheckCircle, AlertCircle, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password && formData.password !== formData.confirm_password) {
      setError('New passwords do not match.');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const updatePayload = {};
    if (formData.full_name !== (user?.full_name || '')) updatePayload.full_name = formData.full_name;
    if (formData.email !== user?.email) updatePayload.email = formData.email;
    if (formData.password) updatePayload.password = formData.password;

    if (Object.keys(updatePayload).length === 0) {
      setError('No changes detected. Please modify at least one field.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(updatePayload);
      setSuccess('Profile updated successfully!');
      setFormData((prev) => ({ ...prev, password: '', confirm_password: '' }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.username || 'U').substring(0, 2).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your profile, email address, and security</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 space-y-8"
      >
        {/* Avatar Section */}
        <div className="flex items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-700/60">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-primary-500/20">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {user?.full_name || user?.username}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                user?.role === 'admin'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
              }`}>
                <Shield className="w-3 h-3" />
                {user?.role === 'admin' ? 'Administrator' : 'Member'}
              </span>
              <span className="text-xs text-slate-400">Member since {memberSince}</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <User className="w-4 h-4 text-primary-500" />
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full display name"
              className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
            />
          </div>

          {/* Username (read-only) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <User className="w-4 h-4 text-slate-400" />
              Username
              <span className="text-xs font-normal text-slate-400">(cannot be changed)</span>
            </label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <Mail className="w-4 h-4 text-primary-500" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
            />
          </div>

          {/* Password Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary-500" />
                Change Password
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Leave blank to keep your current password</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="w-full py-3 px-4 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Repeat your new password"
                className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900"
            >
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{success}</p>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold transition-all shadow-lg shadow-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving...</>
            ) : (
              <><Save className="w-4 h-4" />Save Changes</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
