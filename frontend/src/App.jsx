import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LoanForm from './pages/LoanForm';
import PredictionResult from './pages/PredictionResult';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

// Layout
import DashboardLayout from './components/DashboardLayout';

// Protected Route Wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-500/10 border-t-primary-500 animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Anonymous Route Wrapper (prevents viewing login/register if already logged in)
const AnonymousRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-500/10 border-t-primary-500 animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={
                <AnonymousRoute>
                  <Login />
                </AnonymousRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <AnonymousRoute>
                  <Register />
                </AnonymousRoute>
              } 
            />

            {/* Dashboard Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="apply" element={<LoanForm />} />
              <Route path="result/:id" element={<PredictionResult />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Console Protected Route */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminPanel />} />
            </Route>

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
