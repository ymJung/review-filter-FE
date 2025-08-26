'use client';

import { useEffect } from 'react';

export const KakaoSDKProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const initKakao = () => {
      if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized()) {
        const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
        if (clientId) {
          try {
            window.Kakao.init(clientId);
            console.log('Kakao SDK initialized in provider');
          } catch (error) {
            console.error('Failed to initialize Kakao SDK in provider:', error);
          }
        }
      }
    };

    // SDK가 이미 로드되어 있으면 바로 초기화
    if (window.Kakao) {
      initKakao();
    } else {
      // SDK 로드를 기다림
      const checkKakao = setInterval(() => {
        if (window.Kakao) {
          initKakao();
          clearInterval(checkKakao);
        }
      }, 100);

      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(checkKakao);
      }, 10000);
    }
  }, []);

  return <>{children}</>;
};