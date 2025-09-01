import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth/verifyServer';

// PATCH /api/admin/roadmaps/[id] - Approve or reject roadmap
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

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Firebase Admin not configured' } },
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

    // Check if roadmap exists
    const roadmapRef = adminDb.collection(COLLECTIONS.ROADMAPS).doc(id);
    const roadmapDoc = await roadmapRef.get();

    if (!roadmapDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '로드맵을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    // Update roadmap status
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

    await roadmapRef.update(updateData);

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
