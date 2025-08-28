import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit as firestoreLimit,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Roadmap, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth';

interface RoadmapWithDetails extends Roadmap {
  author?: {
    id: string;
    nickname: string;
  };
  course?: {
    id: string;
    title: string;
    platform: string;
  };
  nextCourse?: {
    id: string;
    title: string;
    platform: string;
  };
}

// GET /api/admin/roadmaps - Get roadmaps for moderation
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let roadmapsQuery = query(
      collection(db, COLLECTIONS.ROADMAPS),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    if (status && status !== 'ALL') {
      roadmapsQuery = query(
        collection(db, COLLECTIONS.ROADMAPS),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
    }

    const roadmapsSnapshot = await getDocs(roadmapsQuery);
    const roadmaps: RoadmapWithDetails[] = [];

    // Get additional data for each roadmap
    for (const roadmapDoc of roadmapsSnapshot.docs) {
      const roadmapData = roadmapDoc.data() as Roadmap;
      const roadmapWithDetails: RoadmapWithDetails = {
        ...roadmapData,
        id: roadmapDoc.id,
      };

      // Get author information
      try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, roadmapData.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          roadmapWithDetails.author = {
            id: userDoc.id,
            nickname: userData.nickname,
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch user ${roadmapData.userId}:`, error);
      }

      // Set course information from roadmap data
      roadmapWithDetails.course = {
        id: '', // No specific course ID in current structure
        title: roadmapData.courseTitle,
        platform: roadmapData.coursePlatform,
      };

      // Set next course information if exists
      if (roadmapData.nextCourseTitle && roadmapData.nextCoursePlatform) {
        roadmapWithDetails.nextCourse = {
          id: '', // No specific course ID in current structure
          title: roadmapData.nextCourseTitle,
          platform: roadmapData.nextCoursePlatform,
        };
      }

      roadmaps.push(roadmapWithDetails);
    }

    const response: ApiResponse<RoadmapWithDetails[]> = {
      success: true,
      data: roadmaps,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting admin roadmaps:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}