import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

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

    const userData = userDoc.data() as any;
    if (userData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' } },
        { status: 403 }
      );
    }
    // Admin SDK ready

    // Calculate date for recent activity (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Counters with safe fallbacks
    const safeCount = async (q: any): Promise<number> => {
      try {
        const snap = await q.get();
        return snap.size;
      } catch {
        return 0;
      }
    };

    const totalUsers = await safeCount(adminDb.collection(COLLECTIONS.USERS));
    const blockedUsers = await safeCount(
      adminDb.collection(COLLECTIONS.USERS).where('role', '==', 'BLOCKED_LOGIN')
    );
    const newUsers = await safeCount(
      adminDb.collection(COLLECTIONS.USERS).where('createdAt', '>=', sevenDaysAgo)
    );

    const totalReviews = await safeCount(adminDb.collection(COLLECTIONS.REVIEWS));
    const pendingReviews = await safeCount(
      adminDb.collection(COLLECTIONS.REVIEWS).where('status', '==', 'PENDING')
    );
    const newReviews = await safeCount(
      adminDb.collection(COLLECTIONS.REVIEWS).where('createdAt', '>=', sevenDaysAgo)
    );

    const totalRoadmaps = await safeCount(adminDb.collection(COLLECTIONS.ROADMAPS));
    const pendingRoadmaps = await safeCount(
      adminDb.collection(COLLECTIONS.ROADMAPS).where('status', '==', 'PENDING')
    );
    const newRoadmaps = await safeCount(
      adminDb.collection(COLLECTIONS.ROADMAPS).where('createdAt', '>=', sevenDaysAgo)
    );

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
