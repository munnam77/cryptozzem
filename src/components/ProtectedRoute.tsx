import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/types/roles';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requiredRoles, requireAuth = true }: ProtectedRouteProps) {
  const { user, isLoading, requires2FA } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  // Handle 2FA requirement
  if (requires2FA) {
    return <Navigate to="/2fa-verify" state={{ from: location }} replace />;
  }

  // For auth pages (login, register, etc.), redirect to dashboard if already authenticated
  if (!requireAuth && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // For protected pages, check authentication
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (requiredRoles && user) {
    if (!requiredRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}