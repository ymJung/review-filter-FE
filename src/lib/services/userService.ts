import { User, UserStats, ApiResponse } from '@/types';

// Get current user from API
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await fetch('/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Authorization header will be added by auth interceptor
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated
        return null;
      }
      throw new Error('Failed to get user');
    }

    const result: ApiResponse<User> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update current user
export const updateCurrentUser = async (updates: { nickname: string }, token: string): Promise<User | null> => {
  try {
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to update user');
    }

    const result: ApiResponse<User> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Get user statistics
export const getUserStatistics = async (): Promise<UserStats | null> => {
  try {
    const response = await fetch('/api/users/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Authorization header will be added by auth interceptor or need to be handled manually
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error('Failed to get user stats');
    }

    const result: ApiResponse<UserStats> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

// Validate nickname
export const validateNickname = (nickname: string): { isValid: boolean; error?: string } => {
  if (!nickname || typeof nickname !== 'string') {
    return { isValid: false, error: '닉네임을 입력해주세요.' };
  }

  const trimmed = nickname.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, error: '닉네임은 2자 이상이어야 합니다.' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: '닉네임은 20자 이하여야 합니다.' };
  }

  // Check for inappropriate content
  const inappropriateWords = ['관리자', 'admin', '운영자', '시스템'];
  const lowerNickname = trimmed.toLowerCase();
  
  if (inappropriateWords.some(word => lowerNickname.includes(word))) {
    return { isValid: false, error: '사용할 수 없는 닉네임입니다.' };
  }

  return { isValid: true };
};