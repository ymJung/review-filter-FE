import { Comment, ApiResponse } from '@/types';

const API_BASE = '/api/comments';

export class CommentService {
  // Get comments for a review
  static async getComments(reviewId: string, limit = 20): Promise<Comment[]> {
    try {
      const response = await fetch(`${API_BASE}?reviewId=${reviewId}&limit=${limit}`);
      const data: ApiResponse<Comment[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch comments');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // Create a new comment
  static async createComment(reviewId: string, content: string, token: string): Promise<Comment> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reviewId,
          content,
        }),
      });

      const data: ApiResponse<Comment> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to create comment');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  // Update a comment
  static async updateComment(
    commentId: string,
    updates: { content?: string; status?: string },
    token: string
  ): Promise<Comment> {
    try {
      const response = await fetch(`${API_BASE}/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data: ApiResponse<Comment> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to update comment');
      }

      return data.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  // Delete a comment
  static async deleteComment(commentId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse<{ success: boolean }> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Get a specific comment
  static async getComment(commentId: string): Promise<Comment> {
    try {
      const response = await fetch(`${API_BASE}/${commentId}`);
      const data: ApiResponse<Comment> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to fetch comment');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching comment:', error);
      throw error;
    }
  }
}