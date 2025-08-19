import { Review, ReviewFormData, ApiResponse, PaginatedResponse } from '@/types';
import { validateReview } from '@/lib/utils/validation';

// Get reviews with pagination and filtering
export const getReviews = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  userId?: string;
  courseId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<PaginatedResponse<Review> | null> => {
  try {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.status) searchParams.set('status', params.status);
    if (params.userId) searchParams.set('userId', params.userId);
    if (params.courseId) searchParams.set('courseId', params.courseId);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const response = await fetch(`/api/reviews?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }

    const result: ApiResponse<PaginatedResponse<Review>> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return null;
  }
};

// Get specific review by ID
export const getReview = async (id: string): Promise<Review | null> => {
  try {
    const response = await fetch(`/api/reviews/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch review');
    }

    const result: ApiResponse<Review> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error fetching review:', error);
    return null;
  }
};

// Create new review
export const createReview = async (
  reviewData: ReviewFormData,
  authToken: string
): Promise<Review | null> => {
  try {
    // Validate review data
    const validation = validateReview(reviewData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        courseTitle: reviewData.courseTitle,
        coursePlatform: reviewData.coursePlatform,
        courseInstructor: reviewData.courseInstructor,
        courseCategory: reviewData.courseCategory,
        content: reviewData.content,
        rating: reviewData.rating,
        studyPeriod: reviewData.studyPeriod,
        positivePoints: reviewData.positivePoints,
        negativePoints: reviewData.negativePoints,
        changes: reviewData.changes,
        recommendedFor: reviewData.recommendedFor,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create review');
    }

    const result: ApiResponse<Review> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

// Upload certification image
export const uploadCertificationImage = async (
  file: File,
  reviewId: string,
  authToken: string
): Promise<{ id: string; url: string } | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reviewId', reviewId);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image');
    }

    const result: ApiResponse<{ id: string; url: string }> = await response.json();
    return result.success ? result.data! : null;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Get user's reviews
export const getUserReviews = async (
  userId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  }
): Promise<PaginatedResponse<Review> | null> => {
  try {
    return await getReviews({
      userId,
      ...params,
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return null;
  }
};

// Get reviews for a specific course
export const getCourseReviews = async (
  courseId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  }
): Promise<PaginatedResponse<Review> | null> => {
  try {
    return await getReviews({
      courseId,
      status: params?.status || 'APPROVED',
      ...params,
    });
  } catch (error) {
    console.error('Error fetching course reviews:', error);
    return null;
  }
};

// Get recent reviews
export const getRecentReviews = async (limit: number = 10): Promise<Review[]> => {
  try {
    const result = await getReviews({
      limit,
      status: 'APPROVED',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    return result?.data || [];
  } catch (error) {
    console.error('Error fetching recent reviews:', error);
    return [];
  }
};

// Get popular reviews (by rating)
export const getPopularReviews = async (limit: number = 10): Promise<Review[]> => {
  try {
    const result = await getReviews({
      limit,
      status: 'APPROVED',
      sortBy: 'rating',
      sortOrder: 'desc',
    });

    return result?.data || [];
  } catch (error) {
    console.error('Error fetching popular reviews:', error);
    return [];
  }
};

// Validate review form data
export const validateReviewForm = (data: Partial<ReviewFormData>): { isValid: boolean; errors: string[] } => {
  return validateReview(data);
};

// Check if user can write review
export const canUserWriteReview = (userRole?: string): boolean => {
  const allowedRoles = ['LOGIN_NOT_AUTH', 'AUTH_LOGIN', 'AUTH_PREMIUM', 'ADMIN'];
  return userRole ? allowedRoles.includes(userRole) : false;
};

// Get review statistics
export const getReviewStats = async (): Promise<{
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
} | null> => {
  try {
    // This would typically be a separate API endpoint
    // For now, we'll fetch recent reviews and calculate stats
    const result = await getReviews({
      limit: 1000, // Get a large sample
      status: 'APPROVED',
    });

    if (!result?.data) return null;

    const reviews = result.data;
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const ratingDistribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return null;
  }
};