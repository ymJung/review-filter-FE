import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { User, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth';

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

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    if (role && role !== 'ALL') {
      usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('role', '==', role),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
    }

    const usersSnapshot = await getDocs(usersQuery);
    let users: UserWithStats[] = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as UserWithStats));

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
        const reviewsQuery = query(
          collection(db, COLLECTIONS.REVIEWS),
          where('userId', '==', user.id)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewCount = reviewsSnapshot.size;

        // Get roadmap count
        const roadmapsQuery = query(
          collection(db, COLLECTIONS.ROADMAPS),
          where('userId', '==', user.id)
        );
        const roadmapsSnapshot = await getDocs(roadmapsQuery);
        const roadmapCount = roadmapsSnapshot.size;

        // Get last activity (most recent review or roadmap)
        let lastActivity = user.createdAt;
        
        if (reviewsSnapshot.docs.length > 0) {
          const latestReview = reviewsSnapshot.docs
            .map(doc => doc.data().createdAt.toDate())
            .sort((a, b) => b.getTime() - a.getTime())[0];
          
          if (latestReview > lastActivity) {
            lastActivity = latestReview;
          }
        }

        if (roadmapsSnapshot.docs.length > 0) {
          const latestRoadmap = roadmapsSnapshot.docs
            .map(doc => doc.data().createdAt.toDate())
            .sort((a, b) => b.getTime() - a.getTime())[0];
          
          if (latestRoadmap > lastActivity) {
            lastActivity = latestRoadmap;
          }
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
          lastActivity: user.createdAt,
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