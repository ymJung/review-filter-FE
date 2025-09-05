'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NaverCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract token from URL hash
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const qsParams = new URLSearchParams(window.location.search);
    const accessToken = hashParams.get('access_token');
    const tokenType = hashParams.get('token_type');
    const expiresIn = hashParams.get('expires_in');
    // Some providers may return state in query instead of fragment
    const state = hashParams.get('state') || qsParams.get('state') || undefined;
    // We will postMessage with target '*' and let the opener validate origin
    
    if (accessToken) {
      // Store the token in localStorage or sessionStorage
      localStorage.setItem('naver_access_token', accessToken);
      
      // Send message to opener window if this is a popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'NAVER_LOGIN_SUCCESS',
          accessToken,
          tokenType,
          expiresIn,
          state,
        }, '*');
        
        // Close the popup
        setTimeout(() => window.close(), 0);
      } else {
        // Redirect to home page or dashboard
        router.push('/');
      }
    } else {
      // Handle error case
      const error = hashParams.get('error') || qsParams.get('error');
      const errorDescription = hashParams.get('error_description') || qsParams.get('error_description');
      
      console.error('Naver login error:', error, errorDescription);
      
      // Send error message to opener window if this is a popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'NAVER_LOGIN_ERROR',
          error,
          errorDescription,
          state,
        }, '*');
        
        // Close the popup
        setTimeout(() => window.close(), 0);
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
