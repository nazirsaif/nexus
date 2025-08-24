import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectPath?: string;
}

/**
 * A component that protects routes based on authentication and user role
 * @param children - The components to render if authorized
 * @param allowedRoles - Array of roles that can access the route (optional)
 * @param redirectPath - Path to redirect to if not authenticated or authorized (default: /login)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectPath = '/login'
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // If roles are specified and user doesn't have required role, redirect
  if (allowedRoles && allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user role
      return <Navigate to={`/dashboard/${user.role}`} replace />;
    }
  }

  // User is authenticated and authorized, render the children
  return <>{children}</>;
};