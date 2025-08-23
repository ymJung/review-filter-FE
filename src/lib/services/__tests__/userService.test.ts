import {
  getCurrentUser,
  updateCurrentUser,
  getUserStatistics,
  validateNickname,
} from '../userService';
import { User, UserStats, ApiResponse } from '@/types';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('userService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getCurrentUser', () => {
    const mockUser: User = {
      id: 'user123',
      socialProvider: 'kakao',
      socialId: 'kakao123',
      nickname: 'TestUser',
      role: 'AUTH_LOGIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should fetch current user successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockUser,
        }),
      });

      const result = await getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith('/api/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null for 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null for other HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null for network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null for unsuccessful API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
        }),
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('updateCurrentUser', () => {
    const mockUpdatedUser: User = {
      id: 'user123',
      socialProvider: 'kakao',
      socialId: 'kakao123',
      nickname: 'UpdatedUser',
      role: 'AUTH_LOGIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update user successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockUpdatedUser,
        }),
      });

      const updates = { nickname: 'UpdatedUser' };
      const result = await updateCurrentUser(updates);

      expect(mockFetch).toHaveBeenCalledWith('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw error for HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Update failed' },
        }),
      });

      const updates = { nickname: 'UpdatedUser' };

      await expect(updateCurrentUser(updates)).rejects.toThrow('Update failed');
    });

    it('should throw error for network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const updates = { nickname: 'UpdatedUser' };

      await expect(updateCurrentUser(updates)).rejects.toThrow('Network error');
    });

    it('should handle missing error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      });

      const updates = { nickname: 'UpdatedUser' };

      await expect(updateCurrentUser(updates)).rejects.toThrow('Failed to update user');
    });
  });

  describe('getUserStatistics', () => {
    const mockStats: UserStats = {
      reviewCount: 5,
      roadmapCount: 2,
      role: 'AUTH_LOGIN',
      joinDate: new Date(),
    };

    it('should fetch user statistics successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockStats,
        }),
      });

      const result = await getUserStatistics();

      expect(mockFetch).toHaveBeenCalledWith('/api/users/stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockStats);
    });

    it('should return null for 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await getUserStatistics();

      expect(result).toBeNull();
    });

    it('should return null for other HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await getUserStatistics();

      expect(result).toBeNull();
    });

    it('should return null for network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getUserStatistics();

      expect(result).toBeNull();
    });

    it('should return null for unsuccessful API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
        }),
      });

      const result = await getUserStatistics();

      expect(result).toBeNull();
    });
  });

  describe('validateNickname', () => {
    it('should validate correct nicknames', () => {
      const result = validateNickname('ValidUser');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should require nickname', () => {
      const result = validateNickname('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('닉네임을 입력해주세요.');
    });

    it('should handle null/undefined nickname', () => {
      const result1 = validateNickname(null as any);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('닉네임을 입력해주세요.');

      const result2 = validateNickname(undefined as any);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('닉네임을 입력해주세요.');
    });

    it('should handle non-string nickname', () => {
      const result = validateNickname(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('닉네임을 입력해주세요.');
    });

    it('should enforce minimum length', () => {
      const result = validateNickname('a');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('닉네임은 2자 이상이어야 합니다.');
    });

    it('should enforce maximum length', () => {
      const longNickname = 'a'.repeat(21);
      const result = validateNickname(longNickname);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('닉네임은 20자 이하여야 합니다.');
    });

    it('should trim whitespace', () => {
      const result = validateNickname('  ValidUser  ');
      expect(result.isValid).toBe(true);
    });

    it('should reject inappropriate words', () => {
      const inappropriateNicknames = [
        '관리자',
        'admin',
        'ADMIN',
        '운영자',
        '시스템',
        'system',
      ];

      inappropriateNicknames.forEach(nickname => {
        const result = validateNickname(nickname);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('사용할 수 없는 닉네임입니다.');
      });
    });

    it('should reject nicknames containing inappropriate words', () => {
      const result1 = validateNickname('관리자123');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('사용할 수 없는 닉네임입니다.');

      const result2 = validateNickname('MyAdmin');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('사용할 수 없는 닉네임입니다.');
    });

    it('should be case insensitive for inappropriate words', () => {
      const result = validateNickname('ADMIN');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('사용할 수 없는 닉네임입니다.');
    });

    it('should allow valid nicknames with Korean characters', () => {
      const result = validateNickname('한글닉네임');
      expect(result.isValid).toBe(true);
    });

    it('should allow valid nicknames with numbers', () => {
      const result = validateNickname('User123');
      expect(result.isValid).toBe(true);
    });

    it('should allow valid nicknames with special characters', () => {
      const result = validateNickname('User_123');
      expect(result.isValid).toBe(true);
    });

    it('should handle edge case lengths', () => {
      // Exactly 2 characters (minimum)
      const result1 = validateNickname('ab');
      expect(result1.isValid).toBe(true);

      // Exactly 20 characters (maximum)
      const result2 = validateNickname('a'.repeat(20));
      expect(result2.isValid).toBe(true);
    });
  });
});