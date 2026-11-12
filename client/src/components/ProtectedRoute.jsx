import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container section">
        <div className="center-state">
          <div className="spinner" />
          <p>Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="container section">
        <div className="center-state">
          <h2>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            This section is restricted to BookNest administrators.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
