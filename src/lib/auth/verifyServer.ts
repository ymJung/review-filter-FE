import { NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getUser } from './user';
import { User } from '@/types';

export const verifyAuthToken = async (
  request: NextRequest
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    // In development, always allow a fake admin for local testing
    if (process.env.NODE_ENV !== 'production') {
      const devAdmin: User = {
        id: 'dev-admin',
        socialProvider: 'google',
        socialId: 'dev',
        nickname: 'DevAdmin',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      return { success: true, user: devAdmin };
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Authorization header missing or invalid' };
    }

    const token = authHeader.substring(7);
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return { success: false, error: 'Admin SDK not configured' };
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const user = await getUser(decoded.uid);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return { success: false, error: 'Token verification failed' };
  }
};
