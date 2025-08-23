// Performance-optimized service layer with caching and batching

import { 
  fetchDocumentOptimized, 
  fetchCollectionOptimized, 
  OptimizedQueryBuilder,
  BatchOperations
} from '@/lib/utils/queryOptimization';
import { queryCache, generateCacheKey, withCache } from '@/lib/utils/cache';
import { performanceMonitor } from '@/lib/utils/performance';
import { Review, Roadmap, User, Course, ApiResponse } from '@/types';

// Optimized review service
export class OptimizedReviewService {
  private static instance: OptimizedReviewService;
  private batchOperations = new BatchOperations(10);

  static getInstance(): OptimizedReviewService {
    if (!OptimizedReviewService.instance) {
      OptimizedReviewService.instance = new OptimizedReviewService();
    }
    return OptimizedReviewService.instance;
  }

  // Get reviews with advanced caching and optimization
  async getReviews(options: {
    status?: string;
    userId?: string;
    courseId?: string;
    limit?: number;
    page?: number;
    useCache?: boolean;
  } = {}): Promise<Review[]> {
    const { 
      status = 'APPROVED', 
      userId, 
      courseId, 
      limit = 10, 
      page = 1,
      useCache = true 
    } = options;

    // Generate cache key
    const cacheKey = generateCacheKey('reviews', {
      status,
      userId: userId || 'all',
      courseId: courseId || 'all',
      limit,
      page,
    });

    // Try cache first
    if (useCache) {
      const cached = await queryCache.get<Review[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Build optimized query
    const builder = new OptimizedQueryBuilder<Review>('reviews');
    
    if (status) builder.where('status', '==', status);
    if (userId) builder.where('userId', '==', userId);
    if (courseId) builder.where('courseId', '==', courseId);
    
    builder
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .cache(useCache, 5 * 60 * 1000); // 5 minutes cache

    const snapshot = await builder.execute();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));

    // Cache the result
    if (useCache) {
      await queryCache.set(cacheKey, reviews, 5 * 60 * 1000);
    }

    return reviews;
  }

  // Get single review with caching
  async getReview(id: string, useCache: boolean = true): Promise<Review | null> {
    return fetchDocumentOptimized<Review>('reviews', id, useCache);
  }

  // Batch get multiple reviews
  async getReviewsBatch(ids: string[]): Promise<(Review | null)[]> {
    const operations = ids.map(id => () => this.getReview(id));
    operations.forEach(op => this.batchOperations.add(op));
    return this.batchOperations.execute();
  }

  // Get reviews with related data (courses, users) in a single optimized query
  async getReviewsWithRelatedData(options: {
    limit?: number;
    status?: string;
  } = {}): Promise<Array<Review & { course?: Course; author?: User }>> {
    const reviews = await this.getReviews(options);
    
    // Extract unique course and user IDs
    const courseIds = [...new Set(reviews.map(r => r.courseId))];
    const userIds = [...new Set(reviews.map(r => r.userId))];

    // Batch fetch related data
    const [courses, users] = await Promise.all([
      this.batchFetchCourses(courseIds),
      this.batchFetchUsers(userIds),
    ]);

    // Create lookup maps
    const courseMap = new Map(courses.map(c => c ? [c.id, c] : [null, null]));
    const userMap = new Map(users.map(u => u ? [u.id, u] : [null, null]));

    // Combine data
    return reviews.map(review => ({
      ...review,
      course: courseMap.get(review.courseId) || undefined,
      author: userMap.get(review.userId) || undefined,
    }));
  }

  private async batchFetchCourses(ids: string[]): Promise<(Course | null)[]> {
    const batchOps = new BatchOperations(10);
    const operations = ids.map(id => () => fetchDocumentOptimized<Course>('courses', id));
    operations.forEach(op => batchOps.add(op));
    return batchOps.execute();
  }

  private async batchFetchUsers(ids: string[]): Promise<(User | null)[]> {
    const batchOps = new BatchOperations(10);
    const operations = ids.map(id => () => fetchDocumentOptimized<User>('users', id));
    operations.forEach(op => batchOps.add(op));
    return batchOps.execute();
  }

  // Invalidate cache for specific patterns
  invalidateCache(pattern?: string): void {
    if (pattern) {
      queryCache.invalidatePattern(pattern);
    } else {
      queryCache.invalidatePattern('reviews');
    }
  }
}

// Optimized roadmap service
export class OptimizedRoadmapService {
  private static instance: OptimizedRoadmapService;

  static getInstance(): OptimizedRoadmapService {
    if (!OptimizedRoadmapService.instance) {
      OptimizedRoadmapService.instance = new OptimizedRoadmapService();
    }
    return OptimizedRoadmapService.instance;
  }

  // Get roadmaps with caching
  async getRoadmaps(options: {
    status?: string;
    userId?: string;
    category?: string;
    limit?: number;
    useCache?: boolean;
  } = {}): Promise<Roadmap[]> {
    const { 
      status = 'APPROVED', 
      userId, 
      category, 
      limit = 10,
      useCache = true 
    } = options;

    const cacheKey = generateCacheKey('roadmaps', {
      status,
      userId: userId || 'all',
      category: category || 'all',
      limit,
    });

    if (useCache) {
      const cached = await queryCache.get<Roadmap[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const builder = new OptimizedQueryBuilder<Roadmap>('roadmaps');
    
    if (status) builder.where('status', '==', status);
    if (userId) builder.where('userId', '==', userId);
    if (category) builder.where('category', '==', category);
    
    builder
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .cache(useCache);

    const snapshot = await builder.execute();
    const roadmaps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Roadmap));

    if (useCache) {
      await queryCache.set(cacheKey, roadmaps, 5 * 60 * 1000);
    }

    return roadmaps;
  }

  // Get single roadmap with caching
  async getRoadmap(id: string, useCache: boolean = true): Promise<Roadmap | null> {
    return fetchDocumentOptimized<Roadmap>('roadmaps', id, useCache);
  }

  // Get popular roadmaps with advanced caching
  async getPopularRoadmaps(limit: number = 5): Promise<Roadmap[]> {
    const cacheKey = `popular-roadmaps:${limit}`;
    
    const cached = await queryCache.get<Roadmap[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const builder = new OptimizedQueryBuilder<Roadmap>('roadmaps');
    const snapshot = await builder
      .where('status', '==', 'APPROVED')
      .orderBy('viewCount', 'desc')
      .limit(limit)
      .execute();

    const roadmaps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Roadmap));
    
    // Cache for longer since popular content changes less frequently
    await queryCache.set(cacheKey, roadmaps, 15 * 60 * 1000); // 15 minutes

    return roadmaps;
  }
}

// Optimized statistics service
export class OptimizedStatsService {
  private static instance: OptimizedStatsService;

  static getInstance(): OptimizedStatsService {
    if (!OptimizedStatsService.instance) {
      OptimizedStatsService.instance = new OptimizedStatsService();
    }
    return OptimizedStatsService.instance;
  }

  // Get category statistics with aggressive caching
  async getCategoryStats(): Promise<Array<{ category: string; count: number; percentage: number }>> {
    const cacheKey = 'category-stats';
    
    // Try cache first (longer TTL for stats)
    const cached = await queryCache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    performanceMonitor.startTiming('category-stats-calculation');

    // This would typically be a more complex aggregation query
    // For now, we'll simulate the calculation
    const reviews = await fetchCollectionOptimized<Review>('reviews', {
      where: [{ field: 'status', operator: '==', value: 'APPROVED' }],
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes
    });

    // Calculate category statistics
    const categoryCount = new Map<string, number>();
    reviews.forEach(review => {
      // This assumes we have category info in reviews or need to join with courses
      const category = 'General'; // Placeholder
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });

    const total = reviews.length;
    const stats = Array.from(categoryCount.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100),
    }));

    performanceMonitor.endTiming('category-stats-calculation');

    // Cache for 30 minutes since stats don't change frequently
    await queryCache.set(cacheKey, stats, 30 * 60 * 1000);

    return stats;
  }

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    reviewCount: number;
    roadmapCount: number;
    totalViews: number;
  }> {
    const cacheKey = `user-stats:${userId}`;
    
    const cached = await queryCache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Batch fetch user's reviews and roadmaps
    const [reviews, roadmaps] = await Promise.all([
      fetchCollectionOptimized<Review>('reviews', {
        where: [{ field: 'userId', operator: '==', value: userId }],
        cache: true,
      }),
      fetchCollectionOptimized<Roadmap>('roadmaps', {
        where: [{ field: 'userId', operator: '==', value: userId }],
        cache: true,
      }),
    ]);

    const stats = {
      reviewCount: reviews.length,
      roadmapCount: roadmaps.length,
      totalViews: roadmaps.reduce((sum, roadmap) => sum + (roadmap.viewCount || 0), 0),
    };

    // Cache for 5 minutes
    await queryCache.set(cacheKey, stats, 5 * 60 * 1000);

    return stats;
  }
}

// Service factory with singleton pattern
export class ServiceFactory {
  private static reviewService: OptimizedReviewService;
  private static roadmapService: OptimizedRoadmapService;
  private static statsService: OptimizedStatsService;

  static getReviewService(): OptimizedReviewService {
    if (!this.reviewService) {
      this.reviewService = OptimizedReviewService.getInstance();
    }
    return this.reviewService;
  }

  static getRoadmapService(): OptimizedRoadmapService {
    if (!this.roadmapService) {
      this.roadmapService = OptimizedRoadmapService.getInstance();
    }
    return this.roadmapService;
  }

  static getStatsService(): OptimizedStatsService {
    if (!this.statsService) {
      this.statsService = OptimizedStatsService.getInstance();
    }
    return this.statsService;
  }

  // Clear all service caches
  static clearAllCaches(): void {
    queryCache.clear();
  }

  // Get performance metrics for all services
  static getPerformanceMetrics(): any {
    return {
      cacheStats: queryCache.getStats(),
      performanceMetrics: performanceMonitor.getAllMetrics(),
      webVitals: performanceMonitor.getWebVitals(),
    };
  }
}

// Export service instances
export const optimizedReviewService = ServiceFactory.getReviewService();
export const optimizedRoadmapService = ServiceFactory.getRoadmapService();
export const optimizedStatsService = ServiceFactory.getStatsService();

// Performance monitoring wrapper for methods
const withMethodPerformance = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  methodName: string
): T => {
  return (async (...args: any[]) => {
    performanceMonitor.startTiming(methodName);
    
    try {
      const result = await fn(...args);
      performanceMonitor.endTiming(methodName);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(methodName);
      throw error;
    }
  }) as T;
};