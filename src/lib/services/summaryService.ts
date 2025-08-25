import { ReviewSummary, ApiResponse } from '@/types';
import { handleFirebaseError, devLog } from '@/lib/utils/developmentHelpers';

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

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Missing or insufficient permissions.');
                }
                if (response.status === 404) {
                    throw new Error('최근 요약이 없습니다.');
                }
                throw new Error('Failed to fetch summaries');
            }

            const data: ApiResponse<ReviewSummary[]> = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || 'Failed to fetch summaries');
            }

            return data.data || [];
        } catch (error) {
            const { shouldShowError, userMessage, logMessage } = handleFirebaseError(error);
            devLog.error('Error fetching cached summaries', { error, logMessage });

            if (shouldShowError) {
                throw new Error(userMessage);
            }

            // Return empty array for graceful degradation
            return [];
        }
    }

    // Get most recent summary
    static async getRecentSummary(): Promise<ReviewSummary | null> {
        try {
            const summaries = await this.getCachedSummaries(1);
            return summaries.length > 0 ? summaries[0] : null;
        } catch (error) {
            console.error('Error fetching recent summary:', error);
            throw new Error('최근 요약이 없습니다.');
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