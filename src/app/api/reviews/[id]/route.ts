import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getDoc, updateDoc, increment } from 'firebase/firestore';
import { getReviewDoc, getCourseDoc, getUserDoc } from '@/lib/firebase/collections';
import { reviewConverter, courseConverter, userConverter } from '@/lib/firebase/converters';
import { Review, Course, User, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// GET /api/reviews/[id] - Get specific review with course and user info
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const reviewRef = getReviewDoc(id).withConverter(reviewConverter);
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const review = reviewSnap.data();

    // Get course information
    const courseRef = getCourseDoc(review.courseId).withConverter(courseConverter);
    const courseSnap = await getDoc(courseRef);
    const course = courseSnap.exists() ? courseSnap.data() : null;

    // Get user information (nickname only for privacy)
    const userRef = getUserDoc(review.userId).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    const user = userSnap.exists() ? userSnap.data() : null;

    // Check if user can view this review
    const authHeader = request.headers.get('authorization');
    let canViewFullContent = review.status === 'APPROVED';
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(token);
        
        // User can view their own reviews regardless of status
        if (decodedToken.uid === review.userId) {
          canViewFullContent = true;
        }
        
        // Admin can view all reviews
        const requestingUser = await getDoc(getUserDoc(decodedToken.uid).withConverter(userConverter));
        if (requestingUser.exists() && requestingUser.data().role === 'ADMIN') {
          canViewFullContent = true;
        }
      } catch (error) {
        // Invalid token, continue with public access
      }
    }

    // Filter content based on access level
    const responseData = {
      ...review,
      course,
      author: user ? {
        id: user.id,
        nickname: user.nickname,
      } : null,
      // Hide detailed content for non-approved reviews from other users
      ...(canViewFullContent ? {} : {
        positivePoints: undefined,
        negativePoints: undefined,
        changes: undefined,
        recommendedFor: undefined,
      }),
    };

    const response: ApiResponse<any> = {
      success: true,
      data: responseData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting review:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[id] - Update review (owner or admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    
    const { id } = params;
    const updateData = await request.json();

    const reviewRef = getReviewDoc(id).withConverter(reviewConverter);
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const review = reviewSnap.data();

    // Check permissions
    const userRef = getUserDoc(decodedToken.uid).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    const user = userSnap.exists() ? userSnap.data() : null;

    const isOwner = review.userId === decodedToken.uid;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '수정 권한이 없습니다.' } },
        { status: 403 }
      );
    }

    // Prepare update data
    const updates: Partial<Review> = {
      updatedAt: new Date(),
    };

    // Only allow certain fields to be updated by owner
    if (isOwner) {
      if (updateData.content) updates.content = updateData.content;
      if (updateData.rating) updates.rating = updateData.rating;
      if (updateData.positivePoints !== undefined) updates.positivePoints = updateData.positivePoints;
      if (updateData.negativePoints !== undefined) updates.negativePoints = updateData.negativePoints;
      if (updateData.changes !== undefined) updates.changes = updateData.changes;
      if (updateData.recommendedFor !== undefined) updates.recommendedFor = updateData.recommendedFor;
      if (updateData.studyPeriod !== undefined) {
        updates.studyPeriod = updateData.studyPeriod ? new Date(updateData.studyPeriod) : undefined;
      }
      
      // Reset status to pending if content is modified
      if (updateData.content || updateData.rating) {
        updates.status = 'PENDING';
      }
    }

    // Admin can update status
    if (isAdmin && updateData.status) {
      updates.status = updateData.status;
    }

    await updateDoc(getReviewDoc(id), updates);

    // Get updated review
    const updatedSnap = await getDoc(reviewRef);
    const updatedReview = updatedSnap.data()!;

    const response: ApiResponse<Review> = {
      success: true,
      data: updatedReview,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Delete review (owner or admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    
    const { id } = params;

    const reviewRef = getReviewDoc(id).withConverter(reviewConverter);
    const reviewSnap = await getDoc(reviewRef);

    if (!reviewSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const review = reviewSnap.data();

    // Check permissions
    const userRef = getUserDoc(decodedToken.uid).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    const user = userSnap.exists() ? userSnap.data() : null;

    const isOwner = review.userId === decodedToken.uid;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '삭제 권한이 없습니다.' } },
        { status: 403 }
      );
    }

    // Soft delete by updating status
    await updateDoc(getReviewDoc(id), {
      status: 'REJECTED',
      updatedAt: new Date(),
    });

    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}