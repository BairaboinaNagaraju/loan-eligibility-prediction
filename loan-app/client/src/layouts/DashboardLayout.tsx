import React from 'react';
import ChatAssistant from '../components/chat/ChatAssistant';
import { Outlet } from 'react-router-dom';

export default function DashboardLayoutWrapper() {
  return (
    <>
      <DashboardLayout />
      <ChatAssistant />
    </>
  );
}

// Inline DashboardLayout implementation
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Calculator, User, LogOut,
  Bell, Menu, X, Sun, Moon, Plus, ChevronRight, ShieldCheck
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { toggleTheme } from '../store/slices/themeSlice';
import { RootState } from '../store';
import api from '../lib/api';
import { setUnreadCount } from '../store/slices/notificationSlice';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/dashboard/apply', label: 'Apply for Loan', icon: Plus },
  { path: '/dashboard/applications', label: 'My Applications', icon: FileText },
  { path: '/dashboard/calculator', label: 'EMI Calculator', icon: Calculator },
  { path: '/dashboard/profile', label: 'Profile & KYC', icon: User },
];

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark } = useSelector((state: RootState) => state.theme);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=5');
      setNotifications(data.data.notifications || []);
      dispatch(setUnreadCount(data.data.unreadCount || 0));
    } catch {}
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-white">Vertex</span>
            <span className="block text-xs text-blue-400 font-medium -mt-1">Loan AI</span>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon, exact }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive(path, exact)
                ? 'bg-gradient-to-r from-blue-600/80 to-violet-600/60 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive(path, exact) ? 'text-white' : ''}`} />
            <span className="font-medium text-sm">{label}</span>
            {isActive(path, exact) && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
          </Link>
        ))}

        {/* Admin link if applicable */}
        {['ADMIN', 'LOAN_OFFICER'].includes(user?.role || '') && (
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-all duration-200"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="font-medium text-sm">Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#060b18]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 bg-[#0d1526] border-r border-white/10">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#0d1526] border-r border-white/10 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-[#060b18]/80 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:block">
              <p className="text-xs text-slate-500">Welcome back,</p>
              <p className="text-sm font-semibold text-white">{user?.fullName} 👋</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 glass-card p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white text-sm">Notifications</h3>
                      <button onClick={() => setNotifOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">No notifications yet</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((n) => (
                          <div key={n.id} className={`p-3 rounded-xl ${n.isRead ? 'bg-white/5' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                            <p className="text-sm font-medium text-white">{n.title}</p>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-105 transition-transform"
              onClick={() => navigate('/dashboard/profile')}
            >
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
