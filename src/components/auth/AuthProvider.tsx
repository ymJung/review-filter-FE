'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, getCurrentUser } from '@/lib/auth/config';
import { getUser } from '@/lib/auth/user';
import { User, UserRole } from '@/types';
import { USER_ROLES } from '@/lib/constants';

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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setUser(null);
      return;
    }

    try {
      const userData = await getUser(firebaseUser.uid);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      await fetchUserData(firebaseUser);
      setLoading(false);
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