import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText, AlertTriangle,
  BarChart3, LogOut, Menu, X, ShieldCheck, Home
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store';

const adminNav = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/admin/users', label: 'User Management', icon: Users },
  { path: '/admin/applications', label: 'Applications', icon: FileText },
  { path: '/admin/fraud', label: 'Fraud Alerts', icon: AlertTriangle },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };
  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-white">Admin</span>
            <span className="block text-xs text-amber-400 font-medium -mt-1">Control Panel</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {adminNav.map(({ path, label, icon: Icon, exact }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive(path, exact)
                ? 'bg-gradient-to-r from-amber-600/70 to-orange-600/60 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium text-sm">{label}</span>
          </Link>
        ))}
        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <Home className="w-5 h-5" />
          <span className="font-medium text-sm">Customer Dashboard</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-amber-400">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#060b18]">
      <aside className="hidden lg:block w-64 flex-shrink-0 bg-[#0d1526] border-r border-white/10">
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#0d1526] border-r border-white/10 lg:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-[#060b18]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-lg lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-white">
              {adminNav.find(n => isActive(n.path, (n as any).exact))?.label || 'Admin Panel'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            <ShieldCheck className="w-3 h-3" />
            {user?.role}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
