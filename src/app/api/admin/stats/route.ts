import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth';

interface AdminStats {
  totalUsers: number;
  totalReviews: number;
  totalRoadmaps: number;
  pendingReviews: number;
  pendingRoadmaps: number;
  blockedUsers: number;
  recentActivity: {
    newUsers: number;
    newReviews: number;
    newRoadmaps: number;
  };
}

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
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

    // Calculate date for recent activity (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

    // Get total users
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    const totalUsers = usersSnapshot.size;

    // Get blocked users count
    const blockedUsersQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('role', '==', 'BLOCKED_LOGIN')
    );
    const blockedUsersSnapshot = await getDocs(blockedUsersQuery);
    const blockedUsers = blockedUsersSnapshot.size;

    // Get new users (last 7 days)
    const newUsersQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('createdAt', '>=', sevenDaysAgoTimestamp)
    );
    const newUsersSnapshot = await getDocs(newUsersQuery);
    const newUsers = newUsersSnapshot.size;

    // Get total reviews
    const reviewsSnapshot = await getDocs(collection(db, COLLECTIONS.REVIEWS));
    const totalReviews = reviewsSnapshot.size;

    // Get pending reviews
    const pendingReviewsQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('status', '==', 'PENDING')
    );
    const pendingReviewsSnapshot = await getDocs(pendingReviewsQuery);
    const pendingReviews = pendingReviewsSnapshot.size;

    // Get new reviews (last 7 days)
    const newReviewsQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('createdAt', '>=', sevenDaysAgoTimestamp)
    );
    const newReviewsSnapshot = await getDocs(newReviewsQuery);
    const newReviews = newReviewsSnapshot.size;

    // Get total roadmaps
    const roadmapsSnapshot = await getDocs(collection(db, COLLECTIONS.ROADMAPS));
    const totalRoadmaps = roadmapsSnapshot.size;

    // Get pending roadmaps
    const pendingRoadmapsQuery = query(
      collection(db, COLLECTIONS.ROADMAPS),
      where('status', '==', 'PENDING')
    );
    const pendingRoadmapsSnapshot = await getDocs(pendingRoadmapsQuery);
    const pendingRoadmaps = pendingRoadmapsSnapshot.size;

    // Get new roadmaps (last 7 days)
    const newRoadmapsQuery = query(
      collection(db, COLLECTIONS.ROADMAPS),
      where('createdAt', '>=', sevenDaysAgoTimestamp)
    );
    const newRoadmapsSnapshot = await getDocs(newRoadmapsQuery);
    const newRoadmaps = newRoadmapsSnapshot.size;

    const stats: AdminStats = {
      totalUsers,
      totalReviews,
      totalRoadmaps,
      pendingReviews,
      pendingRoadmaps,
      blockedUsers,
      recentActivity: {
        newUsers,
        newReviews,
        newRoadmaps,
      },
    };

    const response: ApiResponse<AdminStats> = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}