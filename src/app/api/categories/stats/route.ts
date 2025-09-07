import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { CategoryStats, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Cache for category stats (in production, use Redis or similar)
const statsCache = new Map<string, { data: CategoryStats[], timestamp: number }>();
// Shorter cache in development to avoid stale/dummy-looking data
const CACHE_DURATION = process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 0;

// GET /api/categories/stats - Get category statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const source = searchParams.get('source') || 'reviews'; // 'reviews' or 'courses'
    
    // Check if Firebase Admin is properly configured
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: true, data: [] }, // Return empty array instead of error
        { status: 200 }
      );
    }
    
    const cacheKey = `${source}-${limit}`;
    const cached = statsCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const response: ApiResponse<CategoryStats[]> = {
        success: true,
        data: cached.data,
      };
      return NextResponse.json(response);
    }

    let stats: CategoryStats[] = [];

    if (source === 'reviews') {
      // Get category stats from recent reviews with simplified approach
      const reviewsQuery = adminDb.collection('reviews')
        .where('status', '==', 'APPROVED')
        .orderBy('createdAt', 'desc')
        .limit(100); // Get most recent 100 approved reviews

      let reviewsSnapshot: any;
      try {
        reviewsSnapshot = await reviewsQuery.get();
      } catch (e) {
        // Fallback without orderBy if index is missing
        const fallbackQuery = adminDb.collection('reviews')
          .where('status', '==', 'APPROVED')
          .limit(100);
        reviewsSnapshot = await fallbackQuery.get();
      }
      const categoryCount: Record<string, number> = {};
      let totalReviews = 0;

      // Get all unique course IDs first
      const courseIds = [...new Set(reviewsSnapshot.docs.map(doc => doc.data().courseId))];
      
      // Batch fetch course data
      const courseData: Record<string, any> = {};
      for (const courseId of courseIds) {
        try {
          const courseDoc = await adminDb.collection('courses').doc(courseId).get();
          if (courseDoc.exists) {
            courseData[courseId] = courseDoc.data();
          }
        } catch (error) {
          console.warn(`Failed to fetch course ${courseId}:`, error);
        }
      }

      // Count categories from reviews
      reviewsSnapshot.docs.forEach(doc => {
        const review = doc.data();
        const course = courseData[review.courseId];
        
        if (course) {
          const category = course.category || '기타';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
          totalReviews++;
        }
      });

      // Convert to stats array
      stats = Object.entries(categoryCount)
        .map(([category, count]) => ({
          category,
          count,
          percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    } else if (source === 'courses') {
      // Get category stats from all courses
      const coursesQuery = adminDb.collection('courses');
      const coursesSnapshot = await coursesQuery.get();
      
      const categoryCount: Record<string, number> = {};
      let totalCourses = 0;

      coursesSnapshot.docs.forEach(doc => {
        const course = doc.data();
        const category = course.category || '기타';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        totalCourses++;
      });

      // Convert to stats array
      stats = Object.entries(categoryCount)
        .map(([category, count]) => ({
          category,
          count,
          percentage: totalCourses > 0 ? Math.round((count / totalCourses) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    }

    // Cache the results
    statsCache.set(cacheKey, { data: stats, timestamp: Date.now() });

    const response: ApiResponse<CategoryStats[]> = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting category stats:', error);
    
    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        return NextResponse.json(
          { success: false, error: { code: 'PERMISSION_DENIED', message: 'Missing or insufficient permissions.' } },
          { status: 403 }
        );
      }
      if (error.message.includes('not-found')) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '카테고리 통계를 찾을 수 없습니다.' } },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch category stats' } },
      { status: 500 }
    );
  }
}
