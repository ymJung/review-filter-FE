'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLoginButton, KakaoLoginButton, NaverLoginButton } from '@/components/auth/SocialLoginButton';
import { useAuth } from '@/components/auth/AuthProvider';

export default function LoginPage() {
  const [error, setError] = useState<string>('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && !isRedirecting) {
      console.log('User is authenticated, redirecting to home...');
      setIsRedirecting(true);
      // Use setTimeout to ensure navigation happens outside of render cycle
      setTimeout(() => {
        router.push('/');
      }, 0);
    }
  }, [isAuthenticated, loading, router, isRedirecting]);

  const handleLoginSuccess = () => {
    setError('');
    // Navigation is handled by auth state change
  };

  const handleLoginError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Show loading while checking auth state or redirecting
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            소셜 계정으로 간편하게 로그인하세요
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <GoogleLoginButton
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
          
          <KakaoLoginButton
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
          
          <NaverLoginButton
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            로그인하면{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500">
              이용약관
            </a>
            {' '}및{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500">
              개인정보처리방침
            </a>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
      

    </div>
  );
}