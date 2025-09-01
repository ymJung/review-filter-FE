import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { User, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth/verifyServer';

interface UserWithStats extends User {
  stats?: {
    reviewCount: number;
    roadmapCount: number;
    lastActivity: Date;
  };
}

// GET /api/admin/users - Get users for management
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

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Firebase Admin not configured' } },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query (Admin SDK)
    let q: any = adminDb.collection(COLLECTIONS.USERS).orderBy('createdAt', 'desc').limit(limit);
    if (role && role !== 'ALL') {
      q = adminDb.collection(COLLECTIONS.USERS).where('role', '==', role).orderBy('createdAt', 'desc').limit(limit);
    }

    const snap = await q.get();
    const toDate = (v: any) => (v?.toDate ? v.toDate() : (v ? new Date(v) : undefined));
    let users: UserWithStats[] = snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        socialProvider: data.socialProvider,
        socialId: data.socialId,
        nickname: data.nickname,
        role: data.role,
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
      } as UserWithStats;
    });

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.nickname.toLowerCase().includes(searchLower)
      );
    }

    // Get stats for each user
    for (const user of users) {
      try {
        // Get review count
        const reviewsSnap = await adminDb.collection(COLLECTIONS.REVIEWS).where('userId', '==', user.id).get();
        const reviewCount = reviewsSnap.size;

        // Get roadmap count
        const roadmapsSnap = await adminDb.collection(COLLECTIONS.ROADMAPS).where('userId', '==', user.id).get();
        const roadmapCount = roadmapsSnap.size;

        // Get last activity (most recent review or roadmap)
        let lastActivity = user.createdAt;
        if (!lastActivity) lastActivity = new Date();

        const latestReview = reviewsSnap.docs
          .map(d => (d.data() as any).createdAt)
          .map(v => (v?.toDate ? v.toDate() : (v ? new Date(v) : undefined)))
          .filter(Boolean)
          .sort((a: any, b: any) => b.getTime() - a.getTime())[0] as Date | undefined;

        if (latestReview && latestReview > lastActivity) {
          lastActivity = latestReview;
        }

        const latestRoadmap = roadmapsSnap.docs
          .map(d => (d.data() as any).createdAt)
          .map(v => (v?.toDate ? v.toDate() : (v ? new Date(v) : undefined)))
          .filter(Boolean)
          .sort((a: any, b: any) => b.getTime() - a.getTime())[0] as Date | undefined;

        if (latestRoadmap && latestRoadmap > lastActivity) {
          lastActivity = latestRoadmap;
        }

        user.stats = {
          reviewCount,
          roadmapCount,
          lastActivity,
        };
      } catch (error) {
        console.warn(`Failed to get stats for user ${user.id}:`, error);
        user.stats = {
          reviewCount: 0,
          roadmapCount: 0,
          lastActivity: user.createdAt || new Date(),
        };
      }
    }

    const response: ApiResponse<UserWithStats[]> = {
      success: true,
      data: users,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting admin users:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
