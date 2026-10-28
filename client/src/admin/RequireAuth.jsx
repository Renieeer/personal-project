import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="admin-boot">Loading…</div>;
  if (!session) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}
