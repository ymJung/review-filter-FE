import { Roadmap, ApiResponse, RoadmapFormData } from '@/types';

const API_BASE = '/api/roadmaps';

export class RoadmapService {
  // Get roadmaps list
  static async getRoadmaps(
    limit = 20, 
    status = 'APPROVED', 
    category?: string
  ): Promise<Roadmap[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        status,
      });
      
      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`${API_BASE}?${params}`);
      const data: ApiResponse<Roadmap[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch roadmaps');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      throw error;
    }
  }

  // Create a new roadmap
  static async createRoadmap(roadmapData: RoadmapFormData, token: string): Promise<Roadmap> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(roadmapData),
      });

      const data: ApiResponse<Roadmap> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to create roadmap');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error creating roadmap:', error);
      throw error;
    }
  }

  // Get a specific roadmap
  static async getRoadmap(roadmapId: string, token?: string): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/${roadmapId}`, {
        headers,
      });

      const data: ApiResponse<any> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to fetch roadmap');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching roadmap:', error);
      throw error;
    }
  }

  // Update a roadmap
  static async updateRoadmap(
    roadmapId: string, 
    updates: Partial<RoadmapFormData & { status?: string }>, 
    token: string
  ): Promise<Roadmap> {
    try {
      const response = await fetch(`${API_BASE}/${roadmapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data: ApiResponse<Roadmap> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to update roadmap');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error updating roadmap:', error);
      throw error;
    }
  }

  // Delete a roadmap
  static async deleteRoadmap(roadmapId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${roadmapId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse<{ success: boolean }> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete roadmap');
      }
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      throw error;
    }
  }

  // Get roadmaps by user
  static async getUserRoadmaps(userId: string, token: string): Promise<Roadmap[]> {
    try {
      // This would typically be a separate endpoint, but for now we'll use the main endpoint
      // In a real implementation, you'd want /api/users/[id]/roadmaps
      const response = await fetch(`${API_BASE}?userId=${userId}&status=all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data: ApiResponse<Roadmap[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch user roadmaps');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching user roadmaps:', error);
      throw error;
    }
  }
}