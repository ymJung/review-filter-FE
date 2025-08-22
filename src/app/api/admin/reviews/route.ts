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
import { Review, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth';

interface ReviewWithDetails extends Review {
  course?: {
    id: string;
    title: string;
    platform: string;
    category?: string;
    instructor?: string;
  };
  author?: {
    id: string;
    nickname: string;
  };
}

// GET /api/admin/reviews - Get reviews for moderation
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let reviewsQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    if (status && status !== 'ALL') {
      reviewsQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
    }

    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews: ReviewWithDetails[] = [];

    // Get additional data for each review
    for (const reviewDoc of reviewsSnapshot.docs) {
      const reviewData = reviewDoc.data() as Review;
      const reviewWithDetails: ReviewWithDetails = {
        ...reviewData,
        id: reviewDoc.id,
      };

      // Get course information
      try {
        const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, reviewData.courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          reviewWithDetails.course = {
            id: courseDoc.id,
            title: courseData.title,
            platform: courseData.platform,
            category: courseData.category,
            instructor: courseData.instructor,
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch course ${reviewData.courseId}:`, error);
      }

      // Get author information
      try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, reviewData.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          reviewWithDetails.author = {
            id: userDoc.id,
            nickname: userData.nickname,
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch user ${reviewData.userId}:`, error);
      }

      reviews.push(reviewWithDetails);
    }

    const response: ApiResponse<ReviewWithDetails[]> = {
      success: true,
      data: reviews,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting admin reviews:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}