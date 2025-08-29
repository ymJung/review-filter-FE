import {
  signInWithPopup,
  signInWithCustomToken,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { googleProvider } from './config';
import { SocialProvider, AuthError } from '@/types';
import { handleAuthError } from '@/lib/firebase/errors';
import { KAKAO_CONFIG, validateKakaoDomain, checkKakaoSDKStatus } from './kakao-config';

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

    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    if (!clientId) {
      reject(new Error('Kakao Client ID is not configured'));
      return;
    }

    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        try {
          window.Kakao.init(clientId);
          console.log('Kakao SDK initialized successfully');
        } catch (error) {
          console.error('Failed to initialize Kakao SDK:', error);
          reject(error);
          return;
        }
      }
      resolve();
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="kakao.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        try {
          window.Kakao.init(clientId);
          console.log('Kakao SDK initialized successfully');
          resolve();
        } catch (error) {
          console.error('Failed to initialize Kakao SDK:', error);
          reject(error);
        }
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.async = true;
    script.onload = () => {
      try {
        window.Kakao.init(clientId);
        console.log('Kakao SDK loaded and initialized successfully');
        resolve();
      } catch (error) {
        console.error('Failed to initialize Kakao SDK after loading:', error);
        reject(error);
      }
    };
    script.onerror = (error) => {
      console.error('Failed to load Kakao SDK script:', error);
      reject(new Error('Failed to load Kakao SDK'));
    };
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

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="naveridlogin_js_sdk"]');
    if (existingScript) {
      // Check if SDK is already available
      if ((window as any).naver && (window as any).naver.LoginWithNaverId) {
        resolve();
        return;
      }
      
      // Wait for script to load
      existingScript.addEventListener('load', () => {
        resolve();
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Naver SDK'));
      });
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
    // 도메인 검증
    if (!validateKakaoDomain()) {
      throw new AuthError('허용되지 않은 도메인입니다.', 'KAKAO_DOMAIN_ERROR');
    }

    await initKakaoSDK();

    // SDK 상태 확인
    const sdkStatus = checkKakaoSDKStatus();
    if (!sdkStatus.loaded || !sdkStatus.initialized) {
      throw new AuthError(`카카오 SDK 오류: ${sdkStatus.error}`, 'KAKAO_SDK_ERROR');
    }

    return new Promise((resolve, reject) => {
      // 타임아웃 설정 (30초)
      const timeout = setTimeout(() => {
        reject(new AuthError('카카오 로그인 시간이 초과되었습니다.', 'KAKAO_TIMEOUT'));
      }, 30000);

      window.Kakao.Auth.login({
        ...KAKAO_CONFIG,
        success: async (authObj: any) => {
          clearTimeout(timeout);
          try {
            console.log('Kakao auth success:', authObj);
            
            // Get user profile
            window.Kakao.API.request({
              url: '/v2/user/me',
              success: (profile: any) => {
                console.log('Kakao profile success:', profile);
                resolve({
                  accessToken: authObj.access_token,
                  profile,
                  provider: 'kakao'
                });
              },
              fail: (error: any) => {
                console.error('Kakao profile request failed:', error);
                reject(new AuthError('카카오 프로필 조회에 실패했습니다.', 'KAKAO_PROFILE_ERROR'));
              }
            });
          } catch (error) {
            console.error('Kakao login processing error:', error);
            reject(new AuthError('카카오 로그인 처리 중 오류가 발생했습니다.', 'KAKAO_LOGIN_ERROR'));
          }
        },
        fail: (error: any) => {
          clearTimeout(timeout);
          console.error('Kakao auth failed:', error);
          
          // 사용자가 취소한 경우
          if (error && error.error === 'access_denied') {
            reject(new AuthError('카카오 로그인이 취소되었습니다.', 'KAKAO_CANCELLED'));
          } else {
            reject(new AuthError('카카오 로그인에 실패했습니다.', 'KAKAO_AUTH_ERROR'));
          }
        }
      });
    });
  } catch (error) {
    console.error('Kakao SDK initialization error:', error);
    if (error instanceof AuthError) {
      throw error;
    }
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
      // Set up timeout
      const timeout = setTimeout(() => {
        reject(new AuthError('네이버 로그인 시간이 초과되었습니다.', 'NAVER_TIMEOUT'));
      }, 30000);

      // Create popup window for Naver login
      const popupWidth = 480;
      const popupHeight = 640;
      const left = (window.screen.width - popupWidth) / 2;
      const top = (window.screen.height - popupHeight) / 2;
      
      const popup = window.open(
        `https://nid.naver.com/oauth2.0/authorize?response_type=token&client_id=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${window.location.origin}/auth/naver/callback`)}&state=${Math.random().toString(36).substring(2, 15)}`,
        'naver_login',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );

      if (!popup) {
        clearTimeout(timeout);
        reject(new AuthError('팝업 차단이 감지되었습니다. 팝업 차단을 해제해주세요.', 'NAVER_POPUP_BLOCKED'));
        return;
      }

      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        // Check if the message is from our domain
        if (event.origin !== window.location.origin) {
          return;
        }

        // Check if this is our Naver login message
        if (event.data && event.data.type) {
          switch (event.data.type) {
            case 'NAVER_LOGIN_SUCCESS':
              clearTimeout(timeout);
              window.removeEventListener('message', handleMessage);
              
              // Get user profile using our backend API to avoid CORS issues
              fetch(`/api/auth/naver/profile?access_token=${event.data.accessToken}`)
              .then(response => response.json())
              .then(data => {
                if (data.profile) {
                  resolve({
                    accessToken: event.data.accessToken,
                    profile: data.profile,
                    provider: 'naver'
                  });
                } else {
                  reject(new AuthError('네이버 프로필 조회에 실패했습니다.', 'NAVER_PROFILE_ERROR'));
                }
              })
              .catch(error => {
                console.error('Naver profile fetch error:', error);
                reject(new AuthError('네이버 프로필 조회 중 오류가 발생했습니다.', 'NAVER_PROFILE_ERROR'));
              });
              break;

            case 'NAVER_LOGIN_ERROR':
              clearTimeout(timeout);
              window.removeEventListener('message', handleMessage);
              reject(new AuthError('네이버 로그인에 실패했습니다.', 'NAVER_AUTH_ERROR'));
              break;
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup is closed
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          reject(new AuthError('로그인 창이 닫혔습니다.', 'NAVER_POPUP_CLOSED'));
        }
      }, 1000);
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
    console.log('Calling create-token API with:', { provider, socialData });
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

    console.log('Create-token API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Create-token API error:', errorData);
      throw new Error(`Failed to create custom token: ${response.status} ${errorData}`);
    }

    const responseData = await response.json();
    console.log('Create-token API success:', responseData);
    const { customToken } = responseData;
    return customToken;
  } catch (error) {
    console.error('Create custom token error:', error);
    throw new AuthError('커스텀 토큰 생성에 실패했습니다.', 'CUSTOM_TOKEN_ERROR');
  }
};

// Sign in with custom token
export const signInWithCustomTokenAuth = async (customToken: string): Promise<UserCredential> => {
  try {
    console.log('Signing in with custom token:', customToken.substring(0, 20) + '...');
    if (!auth) {
      throw new AuthError('Firebase Auth가 초기화되지 않았습니다.', 'AUTH_NOT_INITIALIZED');
    }
    const result = await signInWithCustomToken(auth, customToken);
    console.log('Custom token sign in successful:', result.user.uid);
    return result;
  } catch (error: any) {
    console.error('Custom token sign in error:', error);
    throw handleAuthError(error);
  }
};

// Complete social login flow
export const completeSocialLogin = async (
  provider: SocialProvider,
  socialData: any
): Promise<UserCredential> => {
  try {
    console.log('Completing social login for provider:', provider);
    console.log('Social data:', socialData);
    const customToken = await createCustomToken(provider, socialData);
    console.log('Custom token received, signing in...');
    const result = await signInWithCustomTokenAuth(customToken);
    console.log('Social login completed successfully');
    return result;
  } catch (error) {
    console.error('Complete social login error:', error);
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