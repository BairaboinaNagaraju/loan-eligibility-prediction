import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { User, Shield, Camera, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { RootState } from '../../store';
import { updateUser } from '../../store/slices/authSlice';
import api from '../../lib/api';

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<'profile' | 'kyc' | 'security'>('profile');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'kyc', label: 'KYC Information', icon: Shield },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const { register: regProfile, handleSubmit: handleProfile } = useForm({
    defaultValues: { fullName: user?.fullName, phone: '' },
  });

  const { register: regKYC, handleSubmit: handleKYC } = useForm();
  const { register: regPass, handleSubmit: handlePass, reset: resetPass } = useForm();

  const saveProfile = async (data: any) => {
    setLoading(true);
    try {
      await api.put('/users/profile', data);
      dispatch(updateUser({ fullName: data.fullName }));
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  const saveKYC = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/users/kyc', data);
      toast.success('KYC submitted for verification!');
    } catch { toast.error('KYC submission failed'); }
    finally { setLoading(false); }
  };

  const changePassword = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords don't match"); return;
    }
    setLoading(true);
    try {
      await api.put('/users/password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed!');
      resetPass();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display font-bold text-3xl text-white">Profile & KYC</h1>

      {/* Avatar + basic info */}
      <div className="glass-card p-6 flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-3xl">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg">
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex-1">
          <h2 className="font-display font-bold text-xl text-white">{user?.fullName}</h2>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <div className="flex gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${user?.isEmailVerified ? 'badge-approved' : 'badge-pending'}`}>
              {user?.isEmailVerified ? '✓ Email Verified' : 'Email Unverified'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${user?.kycStatus === 'VERIFIED' ? 'badge-approved' : 'badge-pending'}`}>
              KYC: {user?.kycStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}>
            <Icon className="w-4 h-4" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-white mb-6">Personal Information</h3>
          <form onSubmit={handleProfile(saveProfile)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name</label>
                <input {...regProfile('fullName')} className="input-field" />
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input {...regProfile('phone')} className="input-field" placeholder="+91 98765 43210" />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Email Address</label>
                <input value={user?.email} disabled className="input-field opacity-60 cursor-not-allowed" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </button>
          </form>
        </motion.div>
      )}

      {activeTab === 'kyc' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-white mb-2">KYC Information</h3>
          <p className="text-slate-400 text-sm mb-6">Your Aadhaar and PAN are encrypted with AES-256 before storage.</p>
          <form onSubmit={handleKYC(saveKYC)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Aadhaar Number</label>
                <input {...regKYC('aadhaar')} placeholder="XXXX XXXX XXXX" maxLength={12} className="input-field" />
              </div>
              <div>
                <label className="form-label">PAN Number</label>
                <input {...regKYC('pan')} placeholder="ABCDE1234F" maxLength={10} className="input-field uppercase" />
              </div>
              <div>
                <label className="form-label">Date of Birth</label>
                <input {...regKYC('dob')} type="date" className="input-field" />
              </div>
              <div>
                <label className="form-label">Gender</label>
                <select {...regKYC('gender')} className="input-field">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Address</label>
                <input {...regKYC('address')} placeholder="Street address" className="input-field" />
              </div>
              <div>
                <label className="form-label">City</label>
                <input {...regKYC('city')} placeholder="Mumbai" className="input-field" />
              </div>
              <div>
                <label className="form-label">State</label>
                <input {...regKYC('state')} placeholder="Maharashtra" className="input-field" />
              </div>
              <div>
                <label className="form-label">Pincode</label>
                <input {...regKYC('pincode')} placeholder="400001" maxLength={6} className="input-field" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Submit KYC
            </button>
          </form>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-white mb-6">Change Password</h3>
          <form onSubmit={handlePass(changePassword)} className="space-y-4">
            <div>
              <label className="form-label">Current Password</label>
              <input {...regPass('currentPassword')} type="password" className="input-field" placeholder="••••••••" />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input {...regPass('newPassword')} type="password" className="input-field" placeholder="••••••••" />
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input {...regPass('confirmPassword')} type="password" className="input-field" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update Password
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
