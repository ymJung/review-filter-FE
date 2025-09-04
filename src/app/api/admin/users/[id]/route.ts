import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// PATCH /api/admin/users/[id] - Manage user (block, unblock, promote, demote)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const adminUserDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    if (!adminUserDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const adminUserData = adminUserDoc.data() as any;
    if (adminUserData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' } },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !['block', 'unblock', 'promote', 'demote', 'setRole'].includes(action)) {
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

    // Prevent users from managing themselves
    if (decodedToken.uid === id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '자신의 계정을 관리할 수 없습니다.' } },
        { status: 403 }
      );
    }

    // Determine new role based on action
    let newRole = userData.role;
    switch (action) {
      case 'block':
        newRole = 'BLOCKED_LOGIN';
        break;
      case 'unblock':
        // Unblock to appropriate role based on content history
        newRole = userData.reviewCount > 0 || userData.roadmapCount > 0 
          ? 'AUTH_LOGIN' 
          : 'LOGIN_NOT_AUTH';
        break;
      case 'promote':
        if (userData.role === 'LOGIN_NOT_AUTH') {
          newRole = 'AUTH_LOGIN';
        } else if (userData.role === 'AUTH_LOGIN') {
          newRole = 'AUTH_PREMIUM';
        }
        break;
      case 'demote':
        if (userData.role === 'AUTH_PREMIUM') {
          newRole = 'AUTH_LOGIN';
        } else if (userData.role === 'AUTH_LOGIN') {
          newRole = 'LOGIN_NOT_AUTH';
        }
        break;
      case 'setRole': {
        const requestedRole = (body?.role as string) || '';
        const allowed = ['NOT_ACCESS','LOGIN_NOT_AUTH','AUTH_LOGIN','AUTH_PREMIUM','BLOCKED_LOGIN','ADMIN'];
        if (!allowed.includes(requestedRole)) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_ROLE', message: '유효하지 않은 권한입니다.' } },
            { status: 400 }
          );
        }
        // Prevent changing own role
        if (decodedToken.uid === id) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: '자신의 권한은 변경할 수 없습니다.' } },
            { status: 403 }
          );
        }
        newRole = requestedRole;
        break;
      }
    }

    // Update user
    const updateData: any = {
      role: newRole,
      updatedAt: new Date(),
    };

    if (reason) {
      updateData.managementReason = reason;
      updateData.managedBy = decodedToken.uid;
      updateData.managedAt = new Date();
    }

    await userRef.update(updateData);

    const response: ApiResponse<{ role: string }> = {
      success: true,
      data: { role: newRole },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error managing user:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
