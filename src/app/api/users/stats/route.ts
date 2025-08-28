import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { query, where, getDocs, collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUser } from '@/lib/auth/user';
import { ApiResponse, UserStats } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

// GET /api/users/stats - Get current user statistics
export async function GET(request: NextRequest) {
  try {
    // Check if Firestore is initialized
    if (!db) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: '데이터베이스 연결이 초기화되지 않았습니다.' } },
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
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    const user = await getUser(decodedToken.uid);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    // Count user's reviews
    const reviewsQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('userId', '==', decodedToken.uid)
    );
    const reviewsSnapshot = await getCountFromServer(reviewsQuery);
    const reviewCount = reviewsSnapshot.data().count;

    // Count user's roadmaps
    const roadmapsQuery = query(
      collection(db, COLLECTIONS.ROADMAPS),
      where('authorId', '==', decodedToken.uid)
    );
    const roadmapsSnapshot = await getCountFromServer(roadmapsQuery);
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