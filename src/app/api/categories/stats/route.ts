import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit as firestoreLimit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { CategoryStats, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// GET /api/categories/stats - Get category statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const source = searchParams.get('source') || 'reviews'; // 'reviews' or 'courses'

    let stats: CategoryStats[] = [];

    if (source === 'reviews') {
      // Get category stats from recent reviews
      const reviewsQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('status', '==', 'APPROVED'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(100) // Get recent 100 reviews
      );

      const reviewsSnapshot = await getDocs(reviewsQuery);
      const categoryCount: Record<string, number> = {};
      let totalReviews = 0;

      // Count categories from reviews (we'll need to join with courses)
      for (const doc of reviewsSnapshot.docs) {
        const review = doc.data();
        
        // Get course info to get category
        const courseQuery = query(
          collection(db, COLLECTIONS.COURSES),
          where('__name__', '==', review.courseId)
        );
        
        const courseSnapshot = await getDocs(courseQuery);
        if (!courseSnapshot.empty) {
          const course = courseSnapshot.docs[0].data();
          const category = course.category || '기타';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
          totalReviews++;
        }
      }

      // Convert to stats array
      stats = Object.entries(categoryCount)
        .map(([category, count]) => ({
          category,
          count,
          percentage: Math.round((count / totalReviews) * 100),
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
          percentage: Math.round((count / totalCourses) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    }

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