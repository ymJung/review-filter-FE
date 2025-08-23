import {
  validateReview,
  validateRoadmap,
  validateComment,
  canAccessContent,
  canCreateContent,
  canModerateContent,
  canManageUsers,
  containsInappropriateContent,
  validateImageFile,
  validateRating,
  validateSearchQuery,
  validatePaginationParams,
} from '../validation';
import { ReviewFormData, RoadmapFormData, UserRole } from '@/types';

describe('validation utilities', () => {
  describe('validateReview', () => {
    const validReviewData: ReviewFormData = {
      courseTitle: 'Test Course',
      coursePlatform: 'Test Platform',
      content: 'This is a great course with lots of valuable content.',
      rating: 5,
      certificationImage: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    };

    it('should validate a complete review', () => {
      const result = validateReview(validReviewData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require course title', () => {
      const result = validateReview({ ...validReviewData, courseTitle: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('강의명을 입력해주세요.');
    });

    it('should require course platform', () => {
      const result = validateReview({ ...validReviewData, coursePlatform: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('강의 플랫폼을 입력해주세요.');
    });

    it('should require content', () => {
      const result = validateReview({ ...validReviewData, content: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('리뷰 내용을 입력해주세요.');
    });

    it('should require minimum content length', () => {
      const result = validateReview({ ...validReviewData, content: 'short' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('리뷰 내용은 최소 10자 이상 입력해주세요.');
    });

    it('should require valid rating', () => {
      const result = validateReview({ ...validReviewData, rating: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('평점을 1~5점 사이로 선택해주세요.');
    });

    it('should require certification image', () => {
      const result = validateReview({ ...validReviewData, certificationImage: null });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('결제 인증 이미지를 업로드해주세요.');
    });

    it('should collect multiple validation errors', () => {
      const result = validateReview({
        courseTitle: '',
        coursePlatform: '',
        content: '',
        rating: 0,
        certificationImage: null,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(5);
    });
  });

  describe('validateRoadmap', () => {
    const validRoadmapData: RoadmapFormData = {
      title: 'Test Roadmap',
      description: 'This is a comprehensive roadmap for learning programming.',
      courseTitle: 'Current Course',
      coursePlatform: 'Test Platform',
    };

    it('should validate a complete roadmap', () => {
      const result = validateRoadmap(validRoadmapData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require title', () => {
      const result = validateRoadmap({ ...validRoadmapData, title: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('로드맵 제목을 입력해주세요.');
    });

    it('should require description', () => {
      const result = validateRoadmap({ ...validRoadmapData, description: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('로드맵 설명을 입력해주세요.');
    });

    it('should require minimum description length', () => {
      const result = validateRoadmap({ ...validRoadmapData, description: 'short' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('로드맵 설명은 최소 20자 이상 입력해주세요.');
    });

    it('should require course title', () => {
      const result = validateRoadmap({ ...validRoadmapData, courseTitle: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('현재 강의명을 입력해주세요.');
    });

    it('should require course platform', () => {
      const result = validateRoadmap({ ...validRoadmapData, coursePlatform: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('현재 강의 플랫폼을 입력해주세요.');
    });
  });

  describe('validateComment', () => {
    it('should validate a valid comment', () => {
      const result = validateComment('This is a good comment');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require content', () => {
      const result = validateComment('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('댓글 내용을 입력해주세요.');
    });

    it('should require minimum length', () => {
      const result = validateComment('a');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('댓글은 최소 2자 이상 입력해주세요.');
    });

    it('should enforce maximum length', () => {
      const longComment = 'a'.repeat(501);
      const result = validateComment(longComment);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('댓글은 최대 500자까지 입력 가능합니다.');
    });
  });

  describe('user role permissions', () => {
    describe('canAccessContent', () => {
      it('should allow access for authenticated users', () => {
        expect(canAccessContent('AUTH_LOGIN')).toBe(true);
        expect(canAccessContent('AUTH_PREMIUM')).toBe(true);
        expect(canAccessContent('ADMIN')).toBe(true);
      });

      it('should deny access for unauthenticated users', () => {
        expect(canAccessContent('NOT_ACCESS')).toBe(false);
        expect(canAccessContent('LOGIN_NOT_AUTH')).toBe(false);
        expect(canAccessContent('BLOCKED_LOGIN')).toBe(false);
      });
    });

    describe('canCreateContent', () => {
      it('should allow content creation for logged in users', () => {
        expect(canCreateContent('LOGIN_NOT_AUTH')).toBe(true);
        expect(canCreateContent('AUTH_LOGIN')).toBe(true);
        expect(canCreateContent('AUTH_PREMIUM')).toBe(true);
        expect(canCreateContent('ADMIN')).toBe(true);
      });

      it('should deny content creation for blocked or not logged in users', () => {
        expect(canCreateContent('NOT_ACCESS')).toBe(false);
        expect(canCreateContent('BLOCKED_LOGIN')).toBe(false);
      });
    });

    describe('canModerateContent', () => {
      it('should only allow admins to moderate', () => {
        expect(canModerateContent('ADMIN')).toBe(true);
        expect(canModerateContent('AUTH_PREMIUM')).toBe(false);
        expect(canModerateContent('AUTH_LOGIN')).toBe(false);
        expect(canModerateContent('LOGIN_NOT_AUTH')).toBe(false);
      });
    });

    describe('canManageUsers', () => {
      it('should only allow admins to manage users', () => {
        expect(canManageUsers('ADMIN')).toBe(true);
        expect(canManageUsers('AUTH_PREMIUM')).toBe(false);
        expect(canManageUsers('AUTH_LOGIN')).toBe(false);
      });
    });
  });

  describe('containsInappropriateContent', () => {
    it('should detect inappropriate words', () => {
      expect(containsInappropriateContent('바보같은 강의')).toBe(true);
      expect(containsInappropriateContent('멍청한 내용')).toBe(true);
      expect(containsInappropriateContent('시발 이게 뭐야')).toBe(true);
    });

    it('should detect advertising keywords', () => {
      expect(containsInappropriateContent('할인 이벤트 참여하세요')).toBe(true);
      expect(containsInappropriateContent('무료 쿠폰 받으세요')).toBe(true);
      expect(containsInappropriateContent('http://example.com')).toBe(true);
    });

    it('should allow clean content', () => {
      expect(containsInappropriateContent('좋은 강의였습니다')).toBe(false);
      expect(containsInappropriateContent('추천합니다')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(containsInappropriateContent('HTTP://EXAMPLE.COM')).toBe(true);
      expect(containsInappropriateContent('바보')).toBe(true);
    });
  });

  describe('validateImageFile', () => {
    it('should validate correct image files', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(validFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = validateImageFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('JPEG, JPG, PNG, GIF, HEIC 형식의 이미지만 업로드 가능합니다.');
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('이미지 크기는 5MB 이하여야 합니다.');
    });
  });

  describe('validateRating', () => {
    it('should validate correct ratings', () => {
      expect(validateRating(1)).toBe(true);
      expect(validateRating(3)).toBe(true);
      expect(validateRating(5)).toBe(true);
    });

    it('should reject invalid ratings', () => {
      expect(validateRating(0)).toBe(false);
      expect(validateRating(6)).toBe(false);
      expect(validateRating(3.5)).toBe(false);
      expect(validateRating(-1)).toBe(false);
    });
  });

  describe('validateSearchQuery', () => {
    it('should validate correct search queries', () => {
      const result = validateSearchQuery('javascript course');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedQuery).toBe('javascript course');
    });

    it('should sanitize HTML tags', () => {
      const result = validateSearchQuery('<script>alert("xss")</script>');
      expect(result.sanitizedQuery).toBe('scriptalert("xss")/script');
    });

    it('should reject too short queries', () => {
      const result = validateSearchQuery('a');
      expect(result.isValid).toBe(false);
    });

    it('should reject too long queries', () => {
      const longQuery = 'a'.repeat(101);
      const result = validateSearchQuery(longQuery);
      expect(result.isValid).toBe(false);
    });

    it('should trim whitespace', () => {
      const result = validateSearchQuery('  test query  ');
      expect(result.sanitizedQuery).toBe('test query');
    });
  });

  describe('validatePaginationParams', () => {
    it('should validate correct pagination params', () => {
      const result = validatePaginationParams(2, 20);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it('should enforce minimum page number', () => {
      const result = validatePaginationParams(0, 10);
      expect(result.page).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const result = validatePaginationParams(1, 100);
      expect(result.limit).toBe(50);
    });

    it('should handle invalid inputs', () => {
      const result = validatePaginationParams(NaN, NaN);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should handle negative values', () => {
      const result = validatePaginationParams(-5, -10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });
  });
});