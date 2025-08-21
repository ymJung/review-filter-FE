import { ReviewSummary, ApiResponse } from '@/types';

const API_BASE = '/api/summaries';

export interface SummaryGenerateRequest {
  category?: string;
  platform?: string;
  limit?: number;
}

export class SummaryService {
  // Generate new review summary
  static async generateSummary(request: SummaryGenerateRequest = {}): Promise<ReviewSummary> {
    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ApiResponse<ReviewSummary> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to generate summary');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  // Get cached summaries
  static async getCachedSummaries(limit = 5): Promise<ReviewSummary[]> {
    try {
      const response = await fetch(`${API_BASE}?limit=${limit}`);
      const data: ApiResponse<ReviewSummary[]> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch summaries');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching cached summaries:', error);
      throw error;
    }
  }

  // Get specific summary
  static async getSummary(summaryId: string): Promise<ReviewSummary> {
    try {
      const response = await fetch(`${API_BASE}/${summaryId}`);
      const data: ApiResponse<ReviewSummary> = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to fetch summary');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  }

  // Check if summary is expired
  static isSummaryExpired(summary: ReviewSummary): boolean {
    return new Date() > summary.expiresAt;
  }

  // Format summary for display
  static formatSummaryForDisplay(summary: ReviewSummary): {
    title: string;
    content: string;
    metadata: {
      reviewCount: number;
      createdAt: Date;
      expiresAt: Date;
    };
  } {
    const lines = summary.summary.split('\n').filter(line => line.trim());
    const title = lines.find(line => line.includes('전체 요약'))?.replace(/[📊*]/g, '').trim() || '리뷰 요약';
    
    return {
      title,
      content: summary.summary,
      metadata: {
        reviewCount: summary.reviewIds.length,
        createdAt: summary.createdAt,
        expiresAt: summary.expiresAt,
      },
    };
  }
}