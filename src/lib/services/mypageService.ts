import { Review, Roadmap, Comment, ApiResponse } from '@/types';

const API_BASE = '/api/users/me';

export interface UserStats {
  reviewCount: number;
  roadmapCount: number;
  commentCount: number;
  totalViews: number;
  approvedReviews: number;
  pendingReviews: number;
  approvedRoadmaps: number;
  pendingRoadmaps: number;
}

export class MypageService {
  // Get user's reviews
  static async getMyReviews(token: string, limit = 20): Promise<Review[]> {
    try {
      const response = await fetch(`${API_BASE}/reviews?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse<Review[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch reviews');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching my reviews:', error);
      throw error;
    }
  }

  // Get user's roadmaps
  static async getMyRoadmaps(token: string, limit = 20): Promise<Roadmap[]> {
    try {
      const response = await fetch(`${API_BASE}/roadmaps?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse<Roadmap[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch roadmaps');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching my roadmaps:', error);
      throw error;
    }
  }

  // Get user's comments
  static async getMyComments(token: string, limit = 20): Promise<Comment[]> {
    try {
      const response = await fetch(`${API_BASE}/comments?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse<Comment[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch comments');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching my comments:', error);
      throw error;
    }
  }

  // Get user statistics
  static async getMyStats(token: string): Promise<UserStats> {
    try {
      const response = await fetch(`${API_BASE}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse<UserStats> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to fetch stats');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching my stats:', error);
      throw error;
    }
  }
}