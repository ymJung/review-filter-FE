import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

// PATCH /api/admin/reviews/[id] - Approve or reject review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Verify admin role
    const adminUserDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    if (!adminUserDoc.exists || adminUserDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' } },
        { status: 403 }
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
    const reviewRef = adminDb.collection(COLLECTIONS.REVIEWS).doc(id);
    const reviewDoc = await reviewRef.get();
    if (!reviewDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const reviewData = reviewDoc.data() as any;

    // Update review status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
      moderatedBy: decodedToken.uid,
      moderatedAt: new Date(),
    };

    if (reason) {
      updateData.moderationReason = reason;
    }

    await reviewRef.update(updateData);

    // If approving review, update user role if needed
    if (action === 'approve' && reviewData.userId) {
      try {
        const userRef = adminDb.collection(COLLECTIONS.USERS).doc(reviewData.userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
          const userData = userDoc.data() as any;
          // Promote user to AUTH_LOGIN if they're LOGIN_NOT_AUTH
          if (userData.role === 'LOGIN_NOT_AUTH') {
            await userRef.update({
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
export const dynamic = 'force-dynamic';
