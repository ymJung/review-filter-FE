'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { UserRole } from '@/types';
import { USER_ROLES } from '@/lib/constants';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredRole?: UserRole;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  inverse?: boolean; // Show content when user DOESN'T have the role
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredRole,
  requireAuth = false,
  fallback = null,
  inverse = false,
}) => {
  const { user, isAuthenticated } = useAuth();

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // If no role restrictions, show content
  if (!allowedRoles && !requiredRole) {
    return <>{children}</>;
  }

  const userRole = user?.role;
  let hasAccess = false;

  // Check specific role requirement
  if (requiredRole) {
    hasAccess = userRole === requiredRole;
  }

  // Check allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = userRole ? allowedRoles.includes(userRole) : false;
  }

  // Apply inverse logic if specified
  if (inverse) {
    hasAccess = !hasAccess;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Convenience components for common role checks
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleGuard requiredRole={USER_ROLES.ADMIN as UserRole} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AuthenticatedOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleGuard
    allowedRoles={[
      USER_ROLES.AUTH_LOGIN,
      USER_ROLES.AUTH_PREMIUM,
      USER_ROLES.ADMIN,
    ] as UserRole[]}
    fallback={fallback}
  >
    {children}
  </RoleGuard>
);

export const PremiumOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleGuard
    allowedRoles={[USER_ROLES.AUTH_PREMIUM, USER_ROLES.ADMIN] as UserRole[]}
    fallback={fallback}
  >
    {children}
  </RoleGuard>
);

export const GuestOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <RoleGuard requireAuth={false} inverse={true} fallback={fallback}>
    {children}
  </RoleGuard>
);