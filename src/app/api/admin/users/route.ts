import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { User, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth/verifyServer';
=======
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { User, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
>>>>>>> origin/main

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
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Firebase Admin not configured' } },
        { status: 500 }
      );
    }

=======
>>>>>>> origin/main
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const role = searchParams.get('role');

<<<<<<< HEAD
    // Build query (Admin SDK)
    let q: any = adminDb.collection(COLLECTIONS.USERS).orderBy('createdAt', 'desc').limit(limit);
    if (role && role !== 'ALL') {
      q = adminDb.collection(COLLECTIONS.USERS).where('role', '==', role).orderBy('createdAt', 'desc').limit(limit);
=======
    // Build query using Firebase Admin SDK
    let usersQuery: any = adminDb.collection(COLLECTIONS.USERS);
    
    if (role && role !== 'ALL') {
      usersQuery = usersQuery.where('role', '==', role);
>>>>>>> origin/main
    }
    
    usersQuery = usersQuery
      .orderBy('createdAt', 'desc')
      .limit(limit);

<<<<<<< HEAD
    const snap = await q.get();
    const toDate = (v: any) => (v?.toDate ? v.toDate() : (v ? new Date(v) : undefined));
    let users: UserWithStats[] = snap.docs.map((d: any) => {
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
=======
    const usersSnapshot = await usersQuery.get();
    const users: UserWithStats[] = [];
>>>>>>> origin/main

    // Get additional data for each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data() as User;
      const userWithStats: UserWithStats = {
        ...userData,
        id: userDoc.id,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
      };

      // Get user statistics (simplified for now)
      try {
<<<<<<< HEAD
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
=======
        // Count user's reviews
        const reviewsQuery = adminDb.collection(COLLECTIONS.REVIEWS)
          .where('userId', '==', userDoc.id);
        const reviewsSnapshot = await reviewsQuery.count().get();
        const reviewCount = reviewsSnapshot.data().count;

        // Count user's roadmaps
        const roadmapsQuery = adminDb.collection(COLLECTIONS.ROADMAPS)
          .where('userId', '==', userDoc.id);
        const roadmapsSnapshot = await roadmapsQuery.count().get();
        const roadmapCount = roadmapsSnapshot.data().count;

        userWithStats.stats = {
>>>>>>> origin/main
          reviewCount,
          roadmapCount,
          lastActivity: userData.updatedAt?.toDate() || userData.createdAt?.toDate() || new Date(),
        };
      } catch (error) {
<<<<<<< HEAD
        console.warn(`Failed to get stats for user ${user.id}:`, error);
        user.stats = {
          reviewCount: 0,
          roadmapCount: 0,
          lastActivity: user.createdAt || new Date(),
        };
=======
        console.warn(`Failed to fetch stats for user ${userDoc.id}:`, error);
        // Continue without stats if there's an error
>>>>>>> origin/main
      }

      users.push(userWithStats);
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
