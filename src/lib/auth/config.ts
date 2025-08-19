import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { SocialProvider } from '@/types';

// Custom OAuth providers for Kakao and Naver
class KakaoAuthProvider {
  providerId = 'kakao.com';
  
  constructor() {
    // Kakao OAuth configuration will be handled via custom implementation
  }
}

class NaverAuthProvider {
  providerId = 'naver.com';
  
  constructor() {
    // Naver OAuth configuration will be handled via custom implementation
  }
}

// Provider instances
export const googleProvider = new GoogleAuthProvider();
export const kakaoProvider = new KakaoAuthProvider();
export const naverProvider = new NaverAuthProvider();

// Configure Google provider
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Auth state observer
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Wait for auth to initialize
export const waitForAuth = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};