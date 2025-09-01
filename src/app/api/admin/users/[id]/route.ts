import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth/verifyServer';

// PATCH /api/admin/users/[id] - Manage user (block, unblock, promote, demote)
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
    const { action } = body;

    if (!action || !['block', 'unblock', 'promote', 'demote'].includes(action)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: '유효하지 않은 액션입니다.' } },
        { status: 400 }
      );
    }

    // Check if user exists
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as any;

    // Prevent admin from modifying other admins
    if (userData.role === 'ADMIN' && authResult.user.id !== id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '다른 관리자를 수정할 수 없습니다.' } },
        { status: 403 }
      );
    }

    // Determine new role based on action
    let newRole: string;
    
    switch (action) {
      case 'block':
        newRole = 'BLOCKED_LOGIN';
        break;
      case 'unblock':
        // Restore to previous role or default to LOGIN_NOT_AUTH
        newRole = userData.previousRole || 'LOGIN_NOT_AUTH';
        break;
      case 'promote':
        if (userData.role === 'LOGIN_NOT_AUTH' || userData.role === 'AUTH_LOGIN') {
          newRole = 'AUTH_PREMIUM';
        } else {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_ACTION', message: '승격할 수 없는 사용자입니다.' } },
            { status: 400 }
          );
        }
        break;
      case 'demote':
        if (userData.role === 'AUTH_PREMIUM') {
          newRole = 'AUTH_LOGIN';
        } else {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_ACTION', message: '강등할 수 없는 사용자입니다.' } },
            { status: 400 }
          );
        }
        break;
      default:
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ACTION', message: '유효하지 않은 액션입니다.' } },
          { status: 400 }
        );
    }

    // Update user role
    const updateData: any = {
      role: newRole,
      updatedAt: new Date(),
      moderatedBy: authResult.user.id,
      moderatedAt: new Date(),
    };

    // Store previous role when blocking
    if (action === 'block') {
      updateData.previousRole = userData.role;
    }

    await userRef.update(updateData);

    const response: ApiResponse<{ role: string }> = {
      success: true,
      data: { role: newRole },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing user:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
