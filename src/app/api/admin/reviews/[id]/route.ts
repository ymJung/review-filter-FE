import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth';

// PATCH /api/admin/reviews/[id] - Approve or reject review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if Firestore is initialized
    if (!db) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: '데이터베이스 연결이 초기화되지 않았습니다.' } },
        { status: 500 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: '유효하지 않은 액션입니다.' } },
        { status: 400 }
      );
    }

    // Check if review exists
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, id);
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const reviewData = reviewDoc.data();

    // Update review status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
      moderatedBy: authResult.user.id,
      moderatedAt: new Date(),
    };

    if (reason) {
      updateData.moderationReason = reason;
    }

    await updateDoc(reviewRef, updateData);

    // If approving review, update user role if needed
    if (action === 'approve' && reviewData.userId) {
      try {
        const userRef = doc(db, COLLECTIONS.USERS, reviewData.userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Promote user to AUTH_LOGIN if they're LOGIN_NOT_AUTH
          if (userData.role === 'LOGIN_NOT_AUTH') {
            await updateDoc(userRef, {
              role: 'AUTH_LOGIN',
              updatedAt: new Date(),
            });
          }
        }
      } catch (error) {
        console.warn('Failed to update user role:', error);
        // Don't fail the review approval if user update fails
      }
    }

    const response: ApiResponse<{ status: string }> = {
      success: true,
      data: { status: newStatus },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing review:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}