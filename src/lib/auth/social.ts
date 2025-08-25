import {
  signInWithPopup,
  signInWithCustomToken,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { googleProvider } from './config';
import { SocialProvider, AuthError } from '@/types';
import { handleAuthError } from '@/lib/firebase/errors';

// Kakao SDK types
declare global {
  interface Window {
    Kakao: any;
  }
}

// Initialize Kakao SDK
export const initKakaoSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Kakao SDK can only be initialized in browser'));
      return;
    }

    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID);
      }
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.onload = () => {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID);
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Kakao SDK'));
    document.head.appendChild(script);
  });
};

// Initialize Naver SDK
export const initNaverSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Naver SDK can only be initialized in browser'));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Naver SDK'));
    document.head.appendChild(script);
  });
};

// Google sign in
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    if (!auth) {
      throw new AuthError('Firebase Auth가 초기화되지 않았습니다.', 'AUTH_NOT_INITIALIZED');
    }
    
    console.log('Starting Google sign in...');
    console.log('Auth object:', auth);
    console.log('Google provider:', googleProvider);
    
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Google sign in successful:', result);
    return result;
  } catch (error: any) {
    console.error('Google sign in error details:', {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw handleAuthError(error);
  }
};

// Kakao sign in
export const signInWithKakao = async (): Promise<{
  accessToken: string;
  profile: any;
  provider: 'kakao'
}> => {
  try {
    await initKakaoSDK();

    return new Promise((resolve, reject) => {
      window.Kakao.Auth.login({
        success: async (authObj: any) => {
          try {
            // Get user profile
            window.Kakao.API.request({
              url: '/v2/user/me',
              success: (profile: any) => {
                resolve({
                  accessToken: authObj.access_token,
                  profile,
                  provider: 'kakao'
                });
              },
              fail: (error: any) => {
                reject(new AuthError('카카오 프로필 조회에 실패했습니다.', 'KAKAO_PROFILE_ERROR'));
              }
            });
          } catch (error) {
            reject(new AuthError('카카오 로그인 처리 중 오류가 발생했습니다.', 'KAKAO_LOGIN_ERROR'));
          }
        },
        fail: (error: any) => {
          reject(new AuthError('카카오 로그인에 실패했습니다.', 'KAKAO_AUTH_ERROR'));
        }
      });
    });
  } catch (error) {
    throw new AuthError('카카오 SDK 초기화에 실패했습니다.', 'KAKAO_SDK_ERROR');
  }
};

// Naver sign in
export const signInWithNaver = async (): Promise<{
  accessToken: string;
  profile: any;
  provider: 'naver';
}> => {
  try {
    await initNaverSDK();

    return new Promise((resolve, reject) => {
      const naverLogin = new (window as any).naver.LoginWithNaverId({
        clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
        callbackUrl: `${window.location.origin}/auth/naver/callback`,
        isPopup: true,
        loginButton: { color: 'green', type: 3, height: 40 }
      });

      naverLogin.init();

      // Override success callback
      naverLogin.getLoginStatus((status: boolean) => {
        if (status) {
          const user = naverLogin.user;
          resolve({
            accessToken: naverLogin.accessToken.accessToken,
            profile: {
              id: user.getId(),
              email: user.getEmail(),
              name: user.getName(),
              profileImage: user.getProfileImage(),
              nickname: user.getNickName()
            },
            provider: 'naver'
          });
        } else {
          reject(new AuthError('네이버 로그인에 실패했습니다.', 'NAVER_AUTH_ERROR'));
        }
      });

      // Trigger login
      naverLogin.login();
    });
  } catch (error) {
    throw new AuthError('네이버 SDK 초기화에 실패했습니다.', 'NAVER_SDK_ERROR');
  }
};

// Create custom Firebase token for social login
export const createCustomToken = async (
  provider: SocialProvider,
  socialData: any
): Promise<string> => {
  try {
    const response = await fetch('/api/auth/create-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        socialData
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create custom token');
    }

    const { customToken } = await response.json();
    return customToken;
  } catch (error) {
    throw new AuthError('커스텀 토큰 생성에 실패했습니다.', 'CUSTOM_TOKEN_ERROR');
  }
};

// Sign in with custom token
export const signInWithCustomTokenAuth = async (customToken: string): Promise<UserCredential> => {
  try {
    if (!auth) {
      throw new AuthError('Firebase Auth가 초기화되지 않았습니다.', 'AUTH_NOT_INITIALIZED');
    }
    const result = await signInWithCustomToken(auth, customToken);
    return result;
  } catch (error: any) {
    throw handleAuthError(error);
  }
};

// Complete social login flow
export const completeSocialLogin = async (
  provider: SocialProvider,
  socialData: any
): Promise<UserCredential> => {
  try {
    const customToken = await createCustomToken(provider, socialData);
    const result = await signInWithCustomTokenAuth(customToken);
    return result;
  } catch (error) {
    throw error;
  }
};

// Sign out from social providers
export const signOutFromSocial = async (provider: SocialProvider): Promise<void> => {
  try {
    switch (provider) {
      case 'kakao':
        if (window.Kakao && window.Kakao.Auth) {
          await new Promise<void>((resolve) => {
            window.Kakao.Auth.logout(() => {
              resolve();
            });
          });
        }
        break;
      case 'naver':
        // Naver logout is handled by clearing the session
        if (typeof window !== 'undefined') {
          const naverLogin = new (window as any).naver.LoginWithNaverId({
            clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
            callbackUrl: `${window.location.origin}/auth/naver/callback`,
          });
          naverLogin.init();
          naverLogin.logout();
        }
        break;
    }
  } catch (error) {
    console.error(`Failed to sign out from ${provider}:`, error);
  }
};