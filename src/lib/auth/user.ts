import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/config';
import { getUsersCollection, getUserDoc } from '@/lib/firebase/collections';
import { userConverter } from '@/lib/firebase/converters';
import { User, SocialProvider, UserRole } from '@/types';
import { generateRandomNickname } from '@/lib/utils';
import { USER_ROLES } from '@/lib/constants';

// Helper function to remove undefined values
const removeUndefinedValues = (obj: any): any => {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// Create new user in Firestore
export const createUser = async (
  firebaseUser: FirebaseUser,
  provider: SocialProvider,
  socialId: string,
  additionalData?: Partial<User>
): Promise<User> => {
  try {
    const userRef = getUserDoc(firebaseUser.uid).withConverter(userConverter);
    
    // Clean additional data to remove undefined values
    const cleanedAdditionalData = additionalData ? removeUndefinedValues(additionalData) : {};
    
    const userData: Omit<User, 'id'> = {
      socialProvider: provider,
      socialId,
      nickname: cleanedAdditionalData.nickname || generateRandomNickname(),
      role: USER_ROLES.LOGIN_NOT_AUTH as UserRole,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...cleanedAdditionalData
    };

    await setDoc(userRef, userData as User);
    
    return {
      id: firebaseUser.uid,
      ...userData
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user from Firestore
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userRef = getUserDoc(userId).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update user in Firestore
export const updateUser = async (
  userId: string, 
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const userRef = getUserDoc(userId);
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  try {
    await updateUser(userId, { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Check if user exists
export const userExists = async (userId: string): Promise<boolean> => {
  try {
    const user = await getUser(userId);
    return user !== null;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
};

// Get or create user (for social login)
export const getOrCreateUser = async (
  firebaseUser: FirebaseUser,
  provider: SocialProvider,
  socialId: string,
  additionalData?: Partial<User>
): Promise<User> => {
  try {
    // Try to get existing user
    let user = await getUser(firebaseUser.uid);
    
    if (!user) {
      // Create new user if doesn't exist
      user = await createUser(firebaseUser, provider, socialId, additionalData);
    } else {
      // Update last login time
      await updateUser(firebaseUser.uid, {
        updatedAt: new Date()
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error getting or creating user:', error);
    throw error;
  }
};

// Update user nickname
export const updateUserNickname = async (userId: string, nickname: string): Promise<void> => {
  try {
    await updateUser(userId, { nickname });
  } catch (error) {
    console.error('Error updating user nickname:', error);
    throw error;
  }
};

// Block user
export const blockUser = async (userId: string): Promise<void> => {
  try {
    await updateUserRole(userId, USER_ROLES.BLOCKED_LOGIN as UserRole);
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

// Unblock user
export const unblockUser = async (userId: string): Promise<void> => {
  try {
    await updateUserRole(userId, USER_ROLES.LOGIN_NOT_AUTH as UserRole);
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

// Promote user to authenticated (after first review)
export const promoteToAuthenticated = async (userId: string): Promise<void> => {
  try {
    const user = await getUser(userId);
    if (user && user.role === USER_ROLES.LOGIN_NOT_AUTH) {
      await updateUserRole(userId, USER_ROLES.AUTH_LOGIN as UserRole);
    }
  } catch (error) {
    console.error('Error promoting user to authenticated:', error);
    throw error;
  }
};

// Promote user to premium
export const promoteToPremium = async (userId: string): Promise<void> => {
  try {
    await updateUserRole(userId, USER_ROLES.AUTH_PREMIUM as UserRole);
  } catch (error) {
    console.error('Error promoting user to premium:', error);
    throw error;
  }
};

// Promote user to admin
export const promoteToAdmin = async (userId: string): Promise<void> => {
  try {
    await updateUserRole(userId, USER_ROLES.ADMIN as UserRole);
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    throw error;
  }
};

// Get user stats
export const getUserStats = async (userId: string): Promise<{
  reviewCount: number;
  roadmapCount: number;
  role: UserRole;
  joinDate: Date;
} | null> => {
  try {
    const user = await getUser(userId);
    if (!user) return null;

    // TODO: Implement actual counting from reviews and roadmaps collections
    // For now, return mock data
    return {
      reviewCount: 0,
      roadmapCount: 0,
      role: user.role,
      joinDate: user.createdAt
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

// Delete user (GDPR compliance)
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = getUserDoc(userId);
    
    // TODO: Also delete user's reviews, roadmaps, comments, etc.
    // This should be done in a Cloud Function for data consistency
    
    // For now, just mark as deleted or remove the document
    await updateUser(userId, {
      role: USER_ROLES.BLOCKED_LOGIN as UserRole,
      nickname: '[삭제된 사용자]'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Verify auth token from request headers
export const verifyAuthToken = async (request: NextRequest): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Authorization header missing or invalid'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // For now, we'll use a simple approach where the token is the user ID
    // In a production environment, you would verify JWT tokens here
    const userId = token;
    
    const user = await getUser(userId);
    
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return {
      success: false,
      error: 'Token verification failed'
    };
  }
};