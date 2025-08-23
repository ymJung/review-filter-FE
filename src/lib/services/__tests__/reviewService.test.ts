import {
  getReviews,
  getReview,
  createReview,
  uploadCertificationImage,
  getUserReviews,
  getCourseReviews,
  getRecentReviews,
  getPopularReviews,
  validateReviewForm,
  canUserWriteReview,
  getReviewStats,
} from '../reviewService';
import { ReviewFormData, Review, PaginatedResponse, ApiResponse } from '@/types';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock validation
jest.mock('@/lib/utils/validation', () => ({
  validateReview: jest.fn(),
}));

import { validateReview } from '@/lib/utils/validation';
const mockValidateReview = validateReview as jest.MockedFunction<typeof validateReview>;

describe('reviewService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockValidateReview.mockClear();
  });

  describe('getReviews', () => {
    const mockReviewsResponse: ApiResponse<PaginatedResponse<Review>> = {
      success: true,
      data: {
        data: [
          {
            id: '1',
            courseId: 'course1',
            userId: 'user1',
            content: 'Great course',
            rating: 5,
            status: 'APPROVED',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    };

    it('should fetch reviews with default parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockReviewsResponse),
      });

      const result = await getReviews({});

      expect(mockFetch).toHaveBeenCalledWith('/api/reviews?', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockReviewsResponse.data);
    });

    it('should fetch reviews with query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockReviewsResponse),
      });

      const params = {
        page: 2,
        limit: 20,
        status: 'APPROVED',
        userId: 'user123',
        courseId: 'course456',
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      await getReviews(params);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?page=2&limit=20&status=APPROVED&userId=user123&courseId=course456&sortBy=createdAt&sortOrder=desc',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await getReviews({});

      expect(result).toBeNull();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getReviews({});

      expect(result).toBeNull();
    });

    it('should handle unsuccessful API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: false }),
      });

      const result = await getReviews({});

      expect(result).toBeNull();
    });
  });

  describe('getReview', () => {
    const mockReview: Review = {
      id: '1',
      courseId: 'course1',
      userId: 'user1',
      content: 'Great course',
      rating: 5,
      status: 'APPROVED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should fetch a specific review', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockReview,
        }),
      });

      const result = await getReview('1');

      expect(mockFetch).toHaveBeenCalledWith('/api/reviews/1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockReview);
    });

    it('should return null for 404 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await getReview('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle other HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await getReview('1');

      expect(result).toBeNull();
    });
  });

  describe('createReview', () => {
    const mockReviewData: ReviewFormData = {
      courseTitle: 'Test Course',
      coursePlatform: 'Test Platform',
      content: 'Great course content',
      rating: 5,
      certificationImage: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    };

    const mockCreatedReview: Review = {
      id: '1',
      courseId: 'course1',
      userId: 'user1',
      content: 'Great course content',
      rating: 5,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a review successfully', async () => {
      mockValidateReview.mockReturnValue({ isValid: true, errors: [] });
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockCreatedReview,
        }),
      });

      const result = await createReview(mockReviewData, 'auth-token');

      expect(mockValidateReview).toHaveBeenCalledWith(mockReviewData);
      expect(mockFetch).toHaveBeenCalledWith('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer auth-token',
        },
        body: JSON.stringify({
          courseTitle: mockReviewData.courseTitle,
          coursePlatform: mockReviewData.coursePlatform,
          courseInstructor: mockReviewData.courseInstructor,
          courseCategory: mockReviewData.courseCategory,
          content: mockReviewData.content,
          rating: mockReviewData.rating,
          studyPeriod: mockReviewData.studyPeriod,
          positivePoints: mockReviewData.positivePoints,
          negativePoints: mockReviewData.negativePoints,
          changes: mockReviewData.changes,
          recommendedFor: mockReviewData.recommendedFor,
        }),
      });
      expect(result).toEqual(mockCreatedReview);
    });

    it('should throw validation errors', async () => {
      mockValidateReview.mockReturnValue({
        isValid: false,
        errors: ['Content is required', 'Rating is required'],
      });

      await expect(createReview(mockReviewData, 'auth-token')).rejects.toThrow(
        'Content is required, Rating is required'
      );
    });

    it('should handle API errors', async () => {
      mockValidateReview.mockReturnValue({ isValid: true, errors: [] });
      mockFetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Server error' },
        }),
      });

      await expect(createReview(mockReviewData, 'auth-token')).rejects.toThrow('Server error');
    });

    it('should handle network errors', async () => {
      mockValidateReview.mockReturnValue({ isValid: true, errors: [] });
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(createReview(mockReviewData, 'auth-token')).rejects.toThrow('Network error');
    });
  });

  describe('uploadCertificationImage', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockUploadResponse = { id: 'img1', url: 'https://example.com/img1.jpg' };

    it('should upload image successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockUploadResponse,
        }),
      });

      const result = await uploadCertificationImage(mockFile, 'review1', 'auth-token');

      expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer auth-token' },
        body: expect.any(FormData),
      });
      expect(result).toEqual(mockUploadResponse);
    });

    it('should handle upload errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Upload failed' },
        }),
      });

      await expect(uploadCertificationImage(mockFile, 'review1', 'auth-token')).rejects.toThrow(
        'Upload failed'
      );
    });
  });

  describe('getUserReviews', () => {
    it('should fetch user reviews', async () => {
      const mockResponse: PaginatedResponse<Review> = {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockResponse,
        }),
      });

      const result = await getUserReviews('user123', { page: 1, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?userId=user123&page=1&limit=10',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCourseReviews', () => {
    it('should fetch course reviews with APPROVED status by default', async () => {
      const mockResponse: PaginatedResponse<Review> = {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockResponse,
        }),
      });

      const result = await getCourseReviews('course123');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?courseId=course123&status=APPROVED',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getRecentReviews', () => {
    it('should fetch recent approved reviews', async () => {
      const mockReviews: Review[] = [
        {
          id: '1',
          courseId: 'course1',
          userId: 'user1',
          content: 'Recent review',
          rating: 5,
          status: 'APPROVED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            data: mockReviews,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 1,
              hasNext: false,
              hasPrev: false,
            },
          },
        }),
      });

      const result = await getRecentReviews(5);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?limit=5&status=APPROVED&sortBy=createdAt&sortOrder=desc',
        expect.any(Object)
      );
      expect(result).toEqual(mockReviews);
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getRecentReviews();

      expect(result).toEqual([]);
    });
  });

  describe('getPopularReviews', () => {
    it('should fetch popular reviews sorted by rating', async () => {
      const mockReviews: Review[] = [
        {
          id: '1',
          courseId: 'course1',
          userId: 'user1',
          content: 'Popular review',
          rating: 5,
          status: 'APPROVED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            data: mockReviews,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 1,
              hasNext: false,
              hasPrev: false,
            },
          },
        }),
      });

      const result = await getPopularReviews(5);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reviews?limit=5&status=APPROVED&sortBy=rating&sortOrder=desc',
        expect.any(Object)
      );
      expect(result).toEqual(mockReviews);
    });
  });

  describe('validateReviewForm', () => {
    it('should delegate to validation utility', () => {
      const mockData = { content: 'test' };
      const mockResult = { isValid: true, errors: [] };
      mockValidateReview.mockReturnValue(mockResult);

      const result = validateReviewForm(mockData);

      expect(mockValidateReview).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockResult);
    });
  });

  describe('canUserWriteReview', () => {
    it('should allow review writing for authorized roles', () => {
      expect(canUserWriteReview('LOGIN_NOT_AUTH')).toBe(true);
      expect(canUserWriteReview('AUTH_LOGIN')).toBe(true);
      expect(canUserWriteReview('AUTH_PREMIUM')).toBe(true);
      expect(canUserWriteReview('ADMIN')).toBe(true);
    });

    it('should deny review writing for unauthorized roles', () => {
      expect(canUserWriteReview('NOT_ACCESS')).toBe(false);
      expect(canUserWriteReview('BLOCKED_LOGIN')).toBe(false);
      expect(canUserWriteReview(undefined)).toBe(false);
    });
  });

  describe('getReviewStats', () => {
    it('should calculate review statistics', async () => {
      const mockReviews: Review[] = [
        {
          id: '1',
          courseId: 'course1',
          userId: 'user1',
          content: 'Review 1',
          rating: 5,
          status: 'APPROVED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          courseId: 'course2',
          userId: 'user2',
          content: 'Review 2',
          rating: 4,
          status: 'APPROVED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          courseId: 'course3',
          userId: 'user3',
          content: 'Review 3',
          rating: 5,
          status: 'APPROVED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            data: mockReviews,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 3,
              hasNext: false,
              hasPrev: false,
            },
          },
        }),
      });

      const result = await getReviewStats();

      expect(result).toEqual({
        totalReviews: 3,
        averageRating: 4.7, // (5 + 4 + 5) / 3 = 4.666... rounded to 4.7
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 1,
          5: 2,
        },
      });
    });

    it('should return null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getReviewStats();

      expect(result).toBeNull();
    });

    it('should return null when no data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: null,
        }),
      });

      const result = await getReviewStats();

      expect(result).toBeNull();
    });
  });
});