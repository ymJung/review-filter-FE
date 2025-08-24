// Temporary mock user data for development/testing when Firebase is not available
import { User, UserRole } from '@/types';
import { USER_ROLES } from '@/lib/constants';

// Mock admin user for testing
export const mockAdminUser: User = {
  id: 'mock-admin-123',
  socialProvider: 'google',
  socialId: 'mock-google-123',
  nickname: '테스트 관리자',
  role: USER_ROLES.ADMIN as UserRole,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

// Mock regular user for testing
export const mockRegularUser: User = {
  id: 'mock-user-456',
  socialProvider: 'google',
  socialId: 'mock-google-456',
  nickname: '테스트 사용자',
  role: USER_ROLES.AUTH_LOGIN as UserRole,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

// Mock premium user for testing
export const mockPremiumUser: User = {
  id: 'mock-premium-789',
  socialProvider: 'google',
  socialId: 'mock-google-789',
  nickname: '테스트 프리미엄',
  role: USER_ROLES.AUTH_PREMIUM as UserRole,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

// Get mock user based on environment or testing needs
export const getMockUser = (type: 'admin' | 'regular' | 'premium' = 'admin'): User => {
  switch (type) {
    case 'admin':
      return mockAdminUser;
    case 'premium':
      return mockPremiumUser;
    case 'regular':
    default:
      return mockRegularUser;
  }
};

// Check if we should use mock data (development/testing environment)
export const shouldUseMockData = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'
  );
};