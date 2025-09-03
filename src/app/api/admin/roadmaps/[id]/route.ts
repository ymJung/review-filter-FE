import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// PATCH /api/admin/roadmaps/[id] - Approve or reject roadmap
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

    // Check if roadmap exists
    const roadmapRef = adminDb.collection(COLLECTIONS.ROADMAPS).doc(id);
    const roadmapDoc = await roadmapRef.get();
    if (!roadmapDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '로드맵을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const roadmapData = roadmapDoc.data() as any;

    // Update roadmap status
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

    await roadmapRef.update(updateData);

    // If approving roadmap, update user role if needed
    if (action === 'approve' && roadmapData.userId) {
      try {
        const userRef = adminDb.collection(COLLECTIONS.USERS).doc(roadmapData.userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const updatedUser = userDoc.data() as any;
          if (updatedUser.role === 'LOGIN_NOT_AUTH') {
            await userRef.update({ role: 'AUTH_LOGIN', updatedAt: new Date() });
          }
        }
      } catch (error) {
        console.warn('Failed to update user role:', error);
      }
    }

    const response: ApiResponse<{ status: string }> = {
      success: true,
      data: { status: newStatus },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing roadmap:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
