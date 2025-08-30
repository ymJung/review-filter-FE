'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NaverCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract token from URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const tokenType = params.get('token_type');
    const expiresIn = params.get('expires_in');
    
    if (accessToken) {
      // Store the token in localStorage or sessionStorage
      localStorage.setItem('naver_access_token', accessToken);
      
      // Send message to opener window if this is a popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'NAVER_LOGIN_SUCCESS',
          accessToken,
          tokenType,
          expiresIn
        }, window.location.origin);
        
        // Close the popup
        window.close();
      } else {
        // Redirect to home page or dashboard
        router.push('/');
      }
    } else {
      // Handle error case
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      
      console.error('Naver login error:', error, errorDescription);
      
      // Send error message to opener window if this is a popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'NAVER_LOGIN_ERROR',
          error,
          errorDescription
        }, window.location.origin);
        
        // Close the popup
        window.close();
      } else {
        // Redirect to login page with error
        router.push('/login?error=naver_login_failed');
      }
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">네이버 로그인 처리 중...</p>
      </div>
    </div>
  );
}