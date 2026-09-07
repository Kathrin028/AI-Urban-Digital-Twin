import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute – guards routes that require authentication and specific roles.
 *
 * While the session is being restored (isLoading), renders nothing to
 * prevent a flash redirect. Once resolved:
 *   - Authenticated & Role Match: renders children.
 *   - Authenticated & Role Mismatch: redirects to appropriate dashboard.
 *   - Unauthenticated: redirects to /login.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Wait for session restoration — render nothing to avoid flash redirect
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check if allowedRoles are specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to the correct dashboard based on actual role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'department') {
      return <Navigate to="/department/dashboard" replace />;
    } else {
      return <Navigate to="/citizen" replace />;
    }
  }

  return children;
}
