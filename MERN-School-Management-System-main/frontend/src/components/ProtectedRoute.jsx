import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole, isLoading, isFirstLogin } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/teacher/dashboard" />;
    }
  }

  // Handle first login for teachers
  if (isFirstLogin && userRole === 'teacher' && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" />;
  }

  return children;
};

export default ProtectedRoute;