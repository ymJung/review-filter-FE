import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Review, ApiResponse, User, Course } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

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
    // Check if Firebase Admin is properly configured
    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    
    if (!adminDb || !adminAuth) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Firebase Admin not configured' } },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get user to check if they're admin
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as User;
    if (userData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query using Firebase Admin SDK
    let reviewsQuery: any = adminDb.collection(COLLECTIONS.REVIEWS);
    
    if (status && status !== 'ALL') {
      reviewsQuery = reviewsQuery.where('status', '==', status);
    }
    
    reviewsQuery = reviewsQuery
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const reviewsSnapshot = await reviewsQuery.get();
    const reviews: ReviewWithDetails[] = [];

    // Get additional data for each review
    for (const reviewDoc of reviewsSnapshot.docs) {
      const reviewData = reviewDoc.data() as Review;
      const reviewWithDetails: ReviewWithDetails = {
        ...reviewData,
        id: reviewDoc.id,
        createdAt: reviewData.createdAt?.toDate() || new Date(),
        updatedAt: reviewData.updatedAt?.toDate() || new Date(),
        studyPeriod: reviewData.studyPeriod?.toDate(),
        moderatedAt: reviewData.moderatedAt?.toDate(),
      };

      // Get course information
      try {
        const courseDoc = await adminDb.collection(COLLECTIONS.COURSES).doc(reviewData.courseId).get();
        if (courseDoc.exists) {
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
        const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(reviewData.userId).get();
        if (userDoc.exists) {
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