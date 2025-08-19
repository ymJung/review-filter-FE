'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { UserRole } from '@/types';
import { LoadingPage } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireAuth = true,
  fallback,
  redirectTo = '/login',
}) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return <LoadingPage text="인증 확인 중..." />;
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <Alert variant="warning" title="로그인이 필요합니다">
            <p className="mb-4">이 페이지에 접근하려면 로그인해주세요.</p>
            <Link href={redirectTo}>
              <Button>로그인하기</Button>
            </Link>
          </Alert>
        </div>
      </div>
    );
  }

  // Check specific role requirement
  if (requiredRole && user?.role !== requiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <Alert variant="danger" title="접근 권한이 없습니다">
            <p className="mb-4">이 페이지에 접근할 권한이 없습니다.</p>
            <Link href="/">
              <Button>홈으로 돌아가기</Button>
            </Link>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};