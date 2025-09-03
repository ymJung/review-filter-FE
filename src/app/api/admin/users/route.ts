import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { User, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

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

    // Verify admin role
    const meDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    if (!meDoc.exists || meDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const role = searchParams.get('role');
    const search = searchParams.get('search')?.trim();

    // Build query (Admin SDK)
    let q: any = adminDb.collection(COLLECTIONS.USERS);
    if (role && role !== 'ALL') {
      q = q.where('role', '==', role);
    }
    // Note: simple search by nickname would require indexes; left out for now
    q = q.orderBy('createdAt', 'desc').limit(limit);

    const snap = await q.get();
    const toDate = (v: any) => (v?.toDate ? v.toDate() : v ? new Date(v) : undefined);
    const users: UserWithStats[] = snap.docs
      .map((d: any) => {
        const data = d.data() as any;
        const user: UserWithStats = {
          id: d.id,
          socialProvider: data.socialProvider,
          socialId: data.socialId,
          nickname: data.nickname,
          role: data.role,
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
        } as any;
        return user;
      })
      .filter((u: UserWithStats) => {
        if (!search) return true;
        return u.nickname?.toLowerCase()?.includes(search.toLowerCase());
      });

    // Get additional data for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      try {
        // Get review count
        const reviewsSnap = await adminDb
          .collection(COLLECTIONS.REVIEWS)
          .where('userId', '==', user.id)
          .get();
        const reviewCount = reviewsSnap.size;

        // Get roadmap count
        const roadmapsSnap = await adminDb
          .collection(COLLECTIONS.ROADMAPS)
          .where('userId', '==', user.id)
          .get();
        const roadmapCount = roadmapsSnap.size;

        // Get last activity (most recent review or roadmap)
        let lastActivity = user.createdAt || new Date();
        const latestReview = reviewsSnap.docs
          .map((d) => (d.data() as any).createdAt)
          .map((v) => (v?.toDate ? v.toDate() : v ? new Date(v) : undefined))
          .filter(Boolean)
          .sort((a: any, b: any) => b.getTime() - a.getTime())[0] as Date | undefined;
        if (latestReview && latestReview > lastActivity) {
          lastActivity = latestReview;
        }

        const latestRoadmap = roadmapsSnap.docs
          .map((d) => (d.data() as any).createdAt)
          .map((v) => (v?.toDate ? v.toDate() : v ? new Date(v) : undefined))
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
export const dynamic = 'force-dynamic';

