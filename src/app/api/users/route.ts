import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getUser, updateUser } from '@/lib/auth/user';
import { ApiResponse, User } from '@/types';
import { handleError } from '@/lib/utils';

// GET /api/users - Get current user info
export async function GET(request: NextRequest) {
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
    
    const user = await getUser(decodedToken.uid);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update current user info
export async function PUT(request: NextRequest) {
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
    
    const { nickname } = await request.json();
    
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '닉네임은 2자 이상이어야 합니다.' } },
        { status: 400 }
      );
    }

    await updateUser(decodedToken.uid, { nickname: nickname.trim() });
    
    const updatedUser = await getUser(decodedToken.uid);
    
    const response: ApiResponse<User> = {
      success: true,
      data: updatedUser!
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}