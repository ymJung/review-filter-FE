import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { reviewsCollection, getUserDoc } from '@/lib/firebase/collections';
import { reviewConverter } from '@/lib/firebase/converters';
import { promoteToAuthenticated } from '@/lib/auth/user';
import { createOrGetCourse } from '@/lib/services/courseService';
import { Review, ApiResponse, PaginatedResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

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

    // Build query
    let reviewsQuery = query(
      collection(db, COLLECTIONS.REVIEWS).withConverter(reviewConverter)
    );

    // Add filters
    if (status) {
      reviewsQuery = query(reviewsQuery, where('status', '==', status));
    }
    
    if (userId) {
      reviewsQuery = query(reviewsQuery, where('userId', '==', userId));
    }
    
    if (courseId) {
      reviewsQuery = query(reviewsQuery, where('courseId', '==', courseId));
    }

    // Add sorting
    reviewsQuery = query(
      reviewsQuery,
      orderBy(sortBy as any, sortOrder as 'asc' | 'desc')
    );

    // Add pagination
    reviewsQuery = query(reviewsQuery, firestoreLimit(pageSize));

    const snapshot = await getDocs(reviewsQuery);
    const reviews = snapshot.docs.map(doc => doc.data());

    // Get total count (simplified)
    const totalQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('status', '==', status)
    );
    const totalSnapshot = await getDocs(totalQuery);
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
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
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
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
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