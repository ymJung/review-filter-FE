import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { getUser } from '@/lib/auth/user';
import { ApiResponse, UserStats } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

// GET /api/users/stats - Get current user statistics
export async function GET(request: NextRequest) {
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
    
    const user = await getUser(decodedToken.uid);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    // Count user's reviews
    const reviewsQuery: any = adminDb.collection(COLLECTIONS.REVIEWS)
      .where('userId', '==', decodedToken.uid);
    const reviewsSnapshot = await reviewsQuery.count().get();
    const reviewCount = reviewsSnapshot.data().count;

    // Count user's roadmaps
    const roadmapsQuery: any = adminDb.collection(COLLECTIONS.ROADMAPS)
      .where('userId', '==', decodedToken.uid);
    const roadmapsSnapshot = await roadmapsQuery.count().get();
    const roadmapCount = roadmapsSnapshot.data().count;

    const stats: UserStats = {
      reviewCount,
      roadmapCount,
      role: user.role,
      joinDate: user.createdAt
    };

    const response: ApiResponse<UserStats> = {
      success: true,
      data: stats
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting user stats:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}