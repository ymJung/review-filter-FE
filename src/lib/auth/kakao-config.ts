// Kakao Login Configuration
export const KAKAO_CONFIG = {
  // 웹 브라우저에서만 로그인 (카카오톡 앱 실행 방지)
  throughTalk: false,
  // 액세스 토큰 유지
  persistAccessToken: true
};

// 카카오 로그인 도메인 검증
export const validateKakaoDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const currentDomain = window.location.hostname;
  const allowedDomains = [
    'localhost',
    '127.0.0.1',
    'yh-review-filter.vercel.app',
    'yh-review-filter.firebaseapp.com'
  ];
  
  return allowedDomains.some(domain => 
    currentDomain === domain || currentDomain.endsWith(`.${domain}`)
  );
};

// 카카오 SDK 상태 확인
export const checkKakaoSDKStatus = (): {
  loaded: boolean;
  initialized: boolean;
  error?: string;
} => {
  if (typeof window === 'undefined') {
    return { loaded: false, initialized: false, error: 'Not in browser environment' };
  }

  if (!window.Kakao) {
    return { loaded: false, initialized: false, error: 'Kakao SDK not loaded' };
  }

  if (!window.Kakao.isInitialized()) {
    return { loaded: true, initialized: false, error: 'Kakao SDK not initialized' };
  }

  return { loaded: true, initialized: true };
};