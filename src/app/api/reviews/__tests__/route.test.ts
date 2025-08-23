import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}));

// Mock Firebase Admin
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

// Mock Firebase Auth
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

// Mock services
jest.mock('@/lib/services/reviewService', () => ({
  getReviews: jest.fn(),
  createReview: jest.fn(),
}));

import { getReviews, createReview } from '@/lib/services/reviewService';

const mockGetReviews = getReviews as jest.MockedFunction<typeof getReviews>;
const mockCreateReview = createReview as jest.MockedFunction<typeof createReview>;

describe('/api/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return reviews with default parameters', async () => {
      const mockReviews = {
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
      };

      mockGetReviews.mockResolvedValue(mockReviews);

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockReviews);
      expect(mockGetReviews).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: undefined,
        userId: undefined,
        courseId: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
    });

    it('should return reviews with query parameters', async () => {
      const mockReviews = {
        data: [],
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 50,
          hasNext: true,
          hasPrev: true,
        },
      };

      mockGetReviews.mockResolvedValue(mockReviews);

      const url = new URL('http://localhost:3000/api/reviews');
      url.searchParams.set('page', '2');
      url.searchParams.set('limit', '20');
      url.searchParams.set('status', 'APPROVED');
      url.searchParams.set('userId', 'user123');
      url.searchParams.set('sortBy', 'createdAt');
      url.searchParams.set('sortOrder', 'desc');

      const request = new NextRequest(url);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGetReviews).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        status: 'APPROVED',
        userId: 'user123',
        courseId: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should handle invalid query parameters', async () => {
      const mockReviews = {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockGetReviews.mockResolvedValue(mockReviews);

      const url = new URL('http://localhost:3000/api/reviews');
      url.searchParams.set('page', 'invalid');
      url.searchParams.set('limit', 'invalid');

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetReviews).toHaveBeenCalledWith({
        page: 1, // Should default to 1
        limit: 10, // Should default to 10
        status: undefined,
        userId: undefined,
        courseId: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
    });

    it('should handle service errors', async () => {
      mockGetReviews.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toEqual({
        code: 'INTERNAL_ERROR',
        message: '리뷰를 가져오는 중 오류가 발생했습니다.',
      });
    });

    it('should return empty result when service returns null', async () => {
      mockGetReviews.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reviews');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    });
  });

  describe('POST', () => {
    const mockReviewData = {
      courseTitle: 'Test Course',
      coursePlatform: 'Test Platform',
      content: 'Great course content',
      rating: 5,
    };

    const mockCreatedReview = {
      id: '1',
      courseId: 'course1',
      userId: 'user1',
      content: 'Great course content',
      rating: 5,
      status: 'PENDING' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create review successfully', async () => {
      mockCreateReview.mockResolvedValue(mockCreatedReview);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(mockReviewData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCreatedReview);
    });

    it('should handle missing authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockReviewData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_JSON');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        courseTitle: '', // Missing required field
        content: 'short', // Too short
        rating: 0, // Invalid rating
      };

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service creation errors', async () => {
      mockCreateReview.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(mockReviewData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        courseTitle: 'Test Course',
        // Missing other required fields
      };

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(incompleteData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle invalid rating values', async () => {
      const invalidRatingData = {
        ...mockReviewData,
        rating: 6, // Invalid rating (should be 1-5)
      };

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(invalidRatingData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle content length validation', async () => {
      const shortContentData = {
        ...mockReviewData,
        content: 'short', // Too short content
      };

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(shortContentData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});