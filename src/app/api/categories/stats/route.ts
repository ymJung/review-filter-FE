import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit as firestoreLimit,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { CategoryStats, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// Cache for category stats (in production, use Redis or similar)
const statsCache = new Map<string, { data: CategoryStats[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/categories/stats - Get category statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const source = searchParams.get('source') || 'reviews'; // 'reviews' or 'courses'
    
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
      // Get category stats from recent reviews with optimized approach
      const reviewsQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('status', '==', 'APPROVED'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(100) // Get recent 100 reviews
      );

      const reviewsSnapshot = await getDocs(reviewsQuery);
      const categoryCount: Record<string, number> = {};
      let totalReviews = 0;

      // Get all unique course IDs first
      const courseIds = [...new Set(reviewsSnapshot.docs.map(doc => doc.data().courseId))];
      
      // Batch fetch course data
      const courseData: Record<string, any> = {};
      for (const courseId of courseIds) {
        try {
          const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
          if (courseDoc.exists()) {
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
      const coursesQuery = query(collection(db, COLLECTIONS.COURSES));
      const coursesSnapshot = await getDocs(coursesQuery);
      
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
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}