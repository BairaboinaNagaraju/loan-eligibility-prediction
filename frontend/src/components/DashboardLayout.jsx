import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, User, ShieldAlert,
  LogOut, Sun, Moon, Menu, X, MessageSquare, Send, Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { loanService } from '../services/api';

// ─── Sidebar Nav Item ──────────────────────────────────────────────────────────
const NavItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
      active
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
    }`}
  >
    <Icon className="w-4.5 h-4.5 shrink-0" />
    <span>{label}</span>
    {active && (
      <motion.div
        layoutId="active-pill"
        className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"
      />
    )}
  </Link>
);

// ─── Chat Message Bubble ──────────────────────────────────────────────────────
function ChatBubble({ message }) {
  const isUser = message.sender === 'user';

  // Simple markdown-like rendering: bold (**text**) and bullet points
  const renderText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Convert **bold**
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const rendered = parts.map((part, j) =>
        j % 2 === 1
          ? <strong key={j} className="font-extrabold">{part}</strong>
          : part
      );
      return (
        <span key={i} className="block">
          {rendered}
          {i < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shrink-0 mr-2 mt-0.5">
          <Cpu className="w-3 h-3 text-white" />
        </div>
      )}
      <div className={`px-3.5 py-2.5 rounded-2xl max-w-[82%] text-[12px] leading-relaxed ${
        isUser
          ? 'bg-primary-600 text-white rounded-tr-sm font-medium'
          : 'bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200/50 dark:border-slate-600/30'
      }`}>
        {renderText(message.text)}
      </div>
    </motion.div>
  );
}

// ─── Floating Chat Drawer ──────────────────────────────────────────────────────
function ChatDrawer({ onClose }) {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! 👋 I\'m the **Vertex AI Financial Advisor**.\n\nAsk me about loan eligibility, interest rates, EMI calculations, or your application status!' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputMsg.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInputMsg('');
    setLoading(true);

    try {
      const res = await loanService.chat(text);
      setMessages((prev) => [...prev, { sender: 'bot', text: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: "I'm sorry, I can't reach the backend right now. Please ensure the server is running on port 8000."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = ['How do I apply?', 'My loan status', 'Interest rates', 'Improve eligibility'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 16 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[520px] glass-card rounded-3xl flex flex-col shadow-2xl z-50 overflow-hidden border-slate-200/60 dark:border-slate-700/40"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-r from-primary-600 to-primary-500">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <span className="font-extrabold text-sm text-white tracking-tight">Vertex AI Advisor</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => <ChatBubble key={idx} message={m} />)}

        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shrink-0">
              <Cpu className="w-3 h-3 text-white" />
            </div>
            <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700/60 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Reply Chips */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {quickReplies.map((qr) => (
            <button
              key={qr}
              onClick={() => handleSend({ preventDefault: () => {}, target: {} }, setInputMsg(qr))}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-slate-100 dark:border-slate-800/60">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Ask about rates, eligibility, status..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={loading || !inputMsg.trim()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}

// ─── Dashboard Layout ─────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Apply for Loan', path: '/dashboard/apply', icon: FileText },
    { name: 'My Profile', path: '/dashboard/profile', icon: User },
  ];

  if (isAdmin) {
    menuItems.push({ name: 'Admin Console', path: '/admin', icon: ShieldAlert });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-dark-50 transition-colors duration-300">
      {/* ─── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 glass-effect border-r border-slate-200/80 dark:border-slate-800/60 p-6 fixed h-screen z-20">
        {/* Logo */}
        <div className="flex items-center gap-2.5 pb-8 border-b border-slate-200/60 dark:border-slate-800/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-primary-500/20">
            V
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent dark:from-white dark:to-primary-300">
            VertexBank
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 mt-8">
          {menuItems.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.name}
              active={isActive(item.path)}
            />
          ))}
        </nav>

        {/* User Section */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/50 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-emerald-400 flex items-center justify-center text-white font-bold text-sm uppercase shadow">
              {user?.username?.substring(0, 2) || 'US'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-bold text-sm truncate text-slate-900 dark:text-white">{user?.full_name || user?.username}</p>
              <p className="text-[10px] uppercase font-extrabold tracking-widest text-primary-600 dark:text-primary-400">{user?.role}</p>
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-500 hover:text-white text-rose-500 transition-all"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center px-5 py-3.5 glass-effect border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold shadow shadow-primary-500/20">
              V
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white">VertexBank</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex md:hidden"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative flex flex-col w-72 bg-white dark:bg-slate-900 p-6 h-full shadow-2xl"
              >
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2.5 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold shadow shadow-primary-500/20">
                    V
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-white">VertexBank</span>
                </div>

                <nav className="flex-1 space-y-1.5 mt-6">
                  {menuItems.map((item) => (
                    <NavItem
                      key={item.path}
                      to={item.path}
                      icon={item.icon}
                      label={item.name}
                      active={isActive(item.path)}
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  ))}
                </nav>

                <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-emerald-400 flex items-center justify-center text-white font-bold text-xs uppercase">
                      {user?.username?.substring(0, 2) || 'US'}
                    </div>
                    <div>
                      <p className="font-bold text-xs">{user?.full_name || user?.username}</p>
                      <p className="text-[10px] uppercase font-bold text-primary-500">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ─── Floating AI Chat Widget ──────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 chatbot-widget">
        <button
          onClick={() => setChatOpen((prev) => !prev)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 hover:from-primary-700 hover:to-primary-500 flex items-center justify-center text-white shadow-2xl shadow-primary-500/25 hover:scale-105 active:scale-95 transition-all"
          aria-label="Open AI Chat Assistant"
        >
          <AnimatePresence mode="wait">
            {chatOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <MessageSquare className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {chatOpen && <ChatDrawer onClose={() => setChatOpen(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
