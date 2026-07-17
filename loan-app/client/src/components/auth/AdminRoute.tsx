import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export default function AdminRoute() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!['ADMIN', 'LOAN_OFFICER'].includes(user?.role || '')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
