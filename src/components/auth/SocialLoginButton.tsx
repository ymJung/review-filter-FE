'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithGoogle, 
  signInWithKakao, 
  signInWithNaver,
  completeSocialLogin 
} from '@/lib/auth/social';
import { getOrCreateUser } from '@/lib/auth/user';
import { SocialProvider } from '@/types';
import { handleError } from '@/lib/utils';
import { useAuth } from './AuthProvider';

interface SocialLoginButtonProps {
  provider: SocialProvider;
  className?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const providerConfig = {
  google: {
    name: 'Google',
    bgColor: 'bg-white hover:bg-gray-50',
    textColor: 'text-gray-900',
    borderColor: 'border-gray-300',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
  kakao: {
    name: '카카오',
    bgColor: 'bg-yellow-400 hover:bg-yellow-500',
    textColor: 'text-gray-900',
    borderColor: 'border-yellow-400',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
      </svg>
    ),
  },
  naver: {
    name: '네이버',
    bgColor: 'bg-green-500 hover:bg-green-600',
    textColor: 'text-white',
    borderColor: 'border-green-500',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
      </svg>
    ),
  },
};

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  className = '',
  disabled = false,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();
  const config = providerConfig[provider];

  const handleLogin = async () => {
    if (loading || disabled) return;

    setLoading(true);
    
    try {
      let result;
      
      switch (provider) {
        case 'google':
          result = await signInWithGoogle();
          // For Google, we can directly create/get user
          await getOrCreateUser(
            result.user,
            'google' as SocialProvider,
            result.user.uid,
            {
              nickname: result.user.displayName || undefined,
            }
          );
          break;
          
        case 'kakao':
          const kakaoResult = await signInWithKakao();
          result = await completeSocialLogin(provider, {
            id: kakaoResult.profile.id,
            email: kakaoResult.profile.kakao_account?.email,
            name: kakaoResult.profile.kakao_account?.profile?.nickname,
            accessToken: kakaoResult.accessToken,
          });
          break;
          
        case 'naver':
          const naverResult = await signInWithNaver();
          result = await completeSocialLogin(provider, {
            id: naverResult.profile.id,
            email: naverResult.profile.email,
            name: naverResult.profile.name,
            nickname: naverResult.profile.nickname,
            accessToken: naverResult.accessToken,
          });
          break;
          
        default:
          throw new Error('Unsupported provider');
      }

      // Refresh user data in context
      await refreshUser();
      
      onSuccess?.();
      router.push('/');
      
    } catch (error) {
      const errorMessage = handleError(error);
      console.error(`${provider} login error:`, error);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading || disabled}
      className={`
        w-full flex items-center justify-center px-4 py-3 border rounded-lg font-medium transition-colors duration-200
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${loading || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
      ) : (
        <>
          {config.icon}
          <span className="ml-3">{config.name}로 로그인</span>
        </>
      )}
    </button>
  );
};

// Convenience components for each provider
export const GoogleLoginButton: React.FC<Omit<SocialLoginButtonProps, 'provider'>> = (props) => (
  <SocialLoginButton provider="google" {...props} />
);

export const KakaoLoginButton: React.FC<Omit<SocialLoginButtonProps, 'provider'>> = (props) => (
  <SocialLoginButton provider="kakao" {...props} />
);

export const NaverLoginButton: React.FC<Omit<SocialLoginButtonProps, 'provider'>> = (props) => (
  <SocialLoginButton provider="naver" {...props} />
);