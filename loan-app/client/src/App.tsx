import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setTheme } from './store/slices/themeSlice';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ApplyLoanPage from './pages/dashboard/ApplyLoanPage';
import ApplicationsPage from './pages/dashboard/ApplicationsPage';
import PredictionResultPage from './pages/dashboard/PredictionResultPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import EMICalculatorPage from './pages/dashboard/EMICalculatorPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminApplications from './pages/admin/AdminApplications';
import AdminFraud from './pages/admin/AdminFraud';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  const dispatch = useDispatch();
  const isDark = useSelector((state: RootState) => state.theme.isDark);

  useEffect(() => {
    // Init theme
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved ? saved === 'dark' : prefersDark;
    dispatch(setTheme(shouldBeDark));
  }, [dispatch]);

  return (
    <div className={`app-bg ${isDark ? 'dark' : ''}`}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/apply" element={<ApplyLoanPage />} />
            <Route path="/dashboard/applications" element={<ApplicationsPage />} />
            <Route path="/dashboard/result/:id" element={<PredictionResultPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/dashboard/calculator" element={<EMICalculatorPage />} />
          </Route>
        </Route>

        {/* Admin Panel */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/fraud" element={<AdminFraud />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
