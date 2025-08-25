import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { promoteToAuthenticated } from '@/lib/auth/user';
import { createOrGetCourse } from '@/lib/services/courseService';
import { Review, ApiResponse, PaginatedResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { 
  getDocs, 
  where, 
  collection, 
  query, 
  addDoc 
} from 'firebase/firestore';
import { COLLECTIONS, db, reviewConverter } from '@/lib/firebase';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// GET /api/reviews - Get reviews with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'APPROVED';
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Check if Firebase Admin is properly configured
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { 
          success: true, 
          data: {
            data: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              hasNext: false,
              hasPrev: false
            }
          }
        },
        { status: 200 }
      );
    }

    // Build query using Firebase Admin SDK with simplified approach
    let reviewsQuery = adminDb.collection('reviews');

    // Add filters
    if (status) {
      reviewsQuery = reviewsQuery.where('status', '==', status);
    }
    
    if (userId) {
      reviewsQuery = reviewsQuery.where('userId', '==', userId);
    }
    
    if (courseId) {
      reviewsQuery = reviewsQuery.where('courseId', '==', courseId);
    }

    // Add pagination without sorting for now to avoid index issues
    reviewsQuery = reviewsQuery.limit(pageSize);

    const snapshot = await reviewsQuery.get();
    const reviews: Review[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      studyPeriod: doc.data().studyPeriod?.toDate(),
    })) as Review[];

    // Get total count (simplified)
    const totalQuery = adminDb.collection('reviews').where('status', '==', status);
    const totalSnapshot = await totalQuery.get();
    const totalItems = totalSnapshot.size;
    const totalPages = Math.ceil(totalItems / pageSize);

    const response: ApiResponse<PaginatedResponse<Review>> = {
      success: true,
      data: {
        data: reviews,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting reviews:', error);
    
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
          { success: false, error: { code: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' } },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch reviews' } },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create new review
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Authentication service unavailable' } },
        { status: 500 }
      );
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const {
      courseTitle,
      coursePlatform,
      courseInstructor,
      courseCategory,
      content,
      rating,
      studyPeriod,
      positivePoints,
      negativePoints,
      changes,
      recommendedFor,
    } = await request.json();

    // Validate required fields
    if (!courseTitle || !coursePlatform || !content || !rating) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '필수 정보를 모두 입력해주세요.' } },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '평점은 1~5점 사이여야 합니다.' } },
        { status: 400 }
      );
    }

    if (content.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '리뷰 내용은 최소 10자 이상이어야 합니다.' } },
        { status: 400 }
      );
    }

    // Create or get course
    const course = await createOrGetCourse({
      title: courseTitle.trim(),
      platform: coursePlatform.trim(),
      instructor: courseInstructor?.trim(),
      category: courseCategory?.trim(),
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: '강의 정보 처리 중 오류가 발생했습니다.' } },
        { status: 500 }
      );
    }

    // Create review
    const reviewData: Omit<Review, 'id'> = {
      courseId: course.id,
      userId: decodedToken.uid,
      content: content.trim(),
      rating: parseInt(rating),
      status: 'PENDING',
      studyPeriod: studyPeriod ? new Date(studyPeriod) : undefined,
      positivePoints: positivePoints?.trim(),
      negativePoints: negativePoints?.trim(),
      changes: changes?.trim(),
      recommendedFor: recommendedFor?.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(
      collection(db, COLLECTIONS.REVIEWS).withConverter(reviewConverter),
      reviewData as Review
    );

    // Check if this is user's first review and promote them
    const userReviewsQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('userId', '==', decodedToken.uid)
    );
    const userReviewsSnapshot = await getDocs(userReviewsQuery);
    
    if (userReviewsSnapshot.size === 1) { // This is their first review
      await promoteToAuthenticated(decodedToken.uid);
    }

    const newReview: Review = {
      id: docRef.id,
      ...reviewData,
    };

    const response: ApiResponse<Review> = {
      success: true,
      data: newReview,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}