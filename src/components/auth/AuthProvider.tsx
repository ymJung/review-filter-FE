'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/auth/config';
import { getUser } from '@/lib/auth/user';
import { User, UserRole } from '@/types';
import { USER_ROLES } from '@/lib/constants';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FIREBASE_USER'; payload: FirebaseUser | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTH_STATE'; payload: { firebaseUser: FirebaseUser | null; user: User | null; loading: boolean } };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_FIREBASE_USER':
      return { ...state, firebaseUser: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTH_STATE':
      return action.payload;
    default:
      return state;
  }
};

const initialState: AuthState = {
  firebaseUser: null,
  user: null,
  loading: true,
};

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canAccessContent: boolean;
  canCreateContent: boolean;
  canModerateContent: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { firebaseUser, user, loading } = state;

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      console.log('No firebase user, setting user to null');
      dispatch({ type: 'SET_USER', payload: null });
      return;
    }

    try {
      console.log('Calling getUser for uid:', firebaseUser.uid);
      const userData = await getUser(firebaseUser.uid);
      console.log('User data retrieved:', userData);
      dispatch({ type: 'SET_USER', payload: userData });
    } catch (error) {
      console.error('Error fetching user data:', error);

      // In development/testing, use mock data when Firebase is not available
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.warn('Using mock user data due to Firebase connection issues');
        const { getMockUser } = await import('@/lib/auth/mockUser');
        const mockUser = getMockUser('admin'); // Use admin for testing
        dispatch({ type: 'SET_USER', payload: {
          ...mockUser,
          id: firebaseUser.uid, // Use actual Firebase user ID
        }});
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    console.log('RefreshUser called with firebaseUser:', firebaseUser);
    if (firebaseUser) {
      console.log('Fetching user data for:', firebaseUser.uid);
      await fetchUserData(firebaseUser);
      console.log('User data fetch completed');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid || 'null');
      dispatch({ type: 'SET_FIREBASE_USER', payload: firebaseUser });
      await fetchUserData(firebaseUser);
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    return unsubscribe;
  }, []);

  // Computed properties
  const isAuthenticated = !!firebaseUser && !!user;
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const canAccessContent = user ?
    [USER_ROLES.AUTH_LOGIN, USER_ROLES.AUTH_PREMIUM, USER_ROLES.ADMIN].includes(user.role as any) :
    false;

  const canCreateContent = user ?
    ![USER_ROLES.NOT_ACCESS, USER_ROLES.BLOCKED_LOGIN].includes(user.role as any) :
    false;

  const canModerateContent = isAdmin;

  const value: AuthContextType = {
    firebaseUser,
    user,
    loading,
    isAuthenticated,
    isAdmin,
    canAccessContent,
    canCreateContent,
    canModerateContent,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole
) => {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-4">이 페이지에 접근하려면 로그인해주세요.</p>
            <a
              href="/login"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              로그인하기
            </a>
          </div>
        </div>
      );
    }

    if (requiredRole && user?.role !== requiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h2>
            <p className="text-gray-600 mb-4">이 페이지에 접근할 권한이 없습니다.</p>
            <a
              href="/"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              홈으로 돌아가기
            </a>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};