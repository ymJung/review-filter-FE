'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth/config';
import { signOutFromSocial } from '@/lib/auth/social';
import { useAuth } from './AuthProvider';
import { handleError } from '@/lib/utils';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = '',
  children,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    if (loading) return;

    setLoading(true);
    
    try {
      // Sign out from social provider first
      if (user?.socialProvider) {
        await signOutFromSocial(user.socialProvider);
      }
      
      // Sign out from Firebase
      await signOut();
      
      onSuccess?.();
      router.push('/');
      
    } catch (error) {
      const errorMessage = handleError(error);
      console.error('Logout error:', error);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`
        flex items-center justify-center px-4 py-2 border border-transparent rounded-md font-medium transition-colors duration-200
        bg-red-600 hover:bg-red-700 text-white
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        children || '로그아웃'
      )}
    </button>
  );
};