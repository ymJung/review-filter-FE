import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth/verifyServer';
=======
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
>>>>>>> origin/main

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
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (userData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' } },
        { status: 403 }
      );
    }
<<<<<<< HEAD
    // Use Admin SDK if available
    const adminDb = getAdminDb();
    if (!adminDb) {
      const empty: AdminStats = {
        totalUsers: 0,
        totalReviews: 0,
        totalRoadmaps: 0,
        pendingReviews: 0,
        pendingRoadmaps: 0,
        blockedUsers: 0,
        recentActivity: { newUsers: 0, newReviews: 0, newRoadmaps: 0 },
      };
      return NextResponse.json({ success: true, data: empty } as ApiResponse<AdminStats>);
    }
=======
>>>>>>> origin/main

    // Calculate date for recent activity (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

<<<<<<< HEAD
    // Counters with safe fallbacks
    const safeCount = async (q: any): Promise<number> => {
      try { const snap = await q.get(); return snap.size; } catch { return 0; }
    };

    const totalUsers = await safeCount(adminDb.collection(COLLECTIONS.USERS));
    const blockedUsers = await safeCount(adminDb.collection(COLLECTIONS.USERS).where('role', '==', 'BLOCKED_LOGIN'));
    const newUsers = await safeCount(adminDb.collection(COLLECTIONS.USERS).where('createdAt', '>=', sevenDaysAgo));

    const totalReviews = await safeCount(adminDb.collection(COLLECTIONS.REVIEWS));
    const pendingReviews = await safeCount(adminDb.collection(COLLECTIONS.REVIEWS).where('status', '==', 'PENDING'));
    const newReviews = await safeCount(adminDb.collection(COLLECTIONS.REVIEWS).where('createdAt', '>=', sevenDaysAgo));

    const totalRoadmaps = await safeCount(adminDb.collection(COLLECTIONS.ROADMAPS));
    const pendingRoadmaps = await safeCount(adminDb.collection(COLLECTIONS.ROADMAPS).where('status', '==', 'PENDING'));
    const newRoadmaps = await safeCount(adminDb.collection(COLLECTIONS.ROADMAPS).where('createdAt', '>=', sevenDaysAgo));
=======
    // Get total users
    const usersSnapshot = await adminDb.collection(COLLECTIONS.USERS).count().get();
    const totalUsers = usersSnapshot.data().count;

    // Get blocked users count
    const blockedUsersQuery = adminDb.collection(COLLECTIONS.USERS)
      .where('role', '==', 'BLOCKED_LOGIN');
    const blockedUsersSnapshot = await blockedUsersQuery.count().get();
    const blockedUsers = blockedUsersSnapshot.data().count;

    // Get new users (last 7 days)
    const newUsersQuery = adminDb.collection(COLLECTIONS.USERS)
      .where('createdAt', '>=', sevenDaysAgo);
    const newUsersSnapshot = await newUsersQuery.count().get();
    const newUsers = newUsersSnapshot.data().count;

    // Get total reviews
    const reviewsSnapshot = await adminDb.collection(COLLECTIONS.REVIEWS).count().get();
    const totalReviews = reviewsSnapshot.data().count;

    // Get pending reviews
    const pendingReviewsQuery = adminDb.collection(COLLECTIONS.REVIEWS)
      .where('status', '==', 'PENDING');
    const pendingReviewsSnapshot = await pendingReviewsQuery.count().get();
    const pendingReviews = pendingReviewsSnapshot.data().count;

    // Get new reviews (last 7 days)
    const newReviewsQuery = adminDb.collection(COLLECTIONS.REVIEWS)
      .where('createdAt', '>=', sevenDaysAgo);
    const newReviewsSnapshot = await newReviewsQuery.count().get();
    const newReviews = newReviewsSnapshot.data().count;

    // Get total roadmaps
    const roadmapsSnapshot = await adminDb.collection(COLLECTIONS.ROADMAPS).count().get();
    const totalRoadmaps = roadmapsSnapshot.data().count;

    // Get pending roadmaps
    const pendingRoadmapsQuery = adminDb.collection(COLLECTIONS.ROADMAPS)
      .where('status', '==', 'PENDING');
    const pendingRoadmapsSnapshot = await pendingRoadmapsQuery.count().get();
    const pendingRoadmaps = pendingRoadmapsSnapshot.data().count;

    // Get new roadmaps (last 7 days)
    const newRoadmapsQuery = adminDb.collection(COLLECTIONS.ROADMAPS)
      .where('createdAt', '>=', sevenDaysAgo);
    const newRoadmapsSnapshot = await newRoadmapsQuery.count().get();
    const newRoadmaps = newRoadmapsSnapshot.data().count;
>>>>>>> origin/main

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
    // In development, don't block the UI if stats fail – return zeros
    if (process.env.NODE_ENV !== 'production') {
      const fallback: AdminStats = {
        totalUsers: 0,
        totalReviews: 0,
        totalRoadmaps: 0,
        pendingReviews: 0,
        pendingRoadmaps: 0,
        blockedUsers: 0,
        recentActivity: { newUsers: 0, newReviews: 0, newRoadmaps: 0 },
      };
      return NextResponse.json({ success: true, data: fallback } as ApiResponse<AdminStats>);
    }
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
