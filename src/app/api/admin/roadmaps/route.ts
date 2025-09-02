import { NextRequest, NextResponse } from 'next/server';
<<<<<<< HEAD
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Roadmap, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth/verifyServer';
=======
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Roadmap, ApiResponse, User, Course } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';
>>>>>>> origin/main

interface RoadmapWithDetails extends Roadmap {
  author?: {
    id: string;
    nickname: string;
  };
  course?: {
    id: string;
    title: string;
    platform: string;
    category?: string;
    instructor?: string;
  };
  nextCourse?: {
    id: string;
    title: string;
    platform: string;
    category?: string;
    instructor?: string;
  };
}

// GET /api/admin/roadmaps - Get roadmaps for moderation
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

<<<<<<< HEAD
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Firebase Admin not configured' } },
        { status: 500 }
=======
    const userData = userDoc.data() as User;
    if (userData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' } },
        { status: 403 }
>>>>>>> origin/main
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

<<<<<<< HEAD
    // Build query (Admin SDK)
    let q: any = adminDb.collection(COLLECTIONS.ROADMAPS);
    if (status && status !== 'ALL') {
      q = q.where('status', '==', status);
    }
    q = q.limit(limit);

    const snap = await q.get();
    const toDate = (v: any) => (v?.toDate ? v.toDate() : (v ? new Date(v) : undefined));
    const roadmaps: RoadmapWithDetails[] = [];

    for (const doc of snap.docs) {
      const data = doc.data() as any;
      const rm: Roadmap = {
        id: doc.id,
        title: data.title,
        description: data.description,
        courseTitle: data.courseTitle,
        coursePlatform: data.coursePlatform,
        nextCourses: data.nextCourses,
        category: data.category,
        userId: data.userId,
        status: data.status,
        viewCount: data.viewCount || 0,
        createdAt: toDate(data.createdAt) || new Date(),
=======
    // Build query using Firebase Admin SDK
    let roadmapsQuery: any = adminDb.collection(COLLECTIONS.ROADMAPS);
    
    if (status && status !== 'ALL') {
      roadmapsQuery = roadmapsQuery.where('status', '==', status);
    }
    
    roadmapsQuery = roadmapsQuery
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const roadmapsSnapshot = await roadmapsQuery.get();
    const roadmaps: RoadmapWithDetails[] = [];

    // Get additional data for each roadmap
    for (const roadmapDoc of roadmapsSnapshot.docs) {
      const roadmapData = roadmapDoc.data() as Roadmap;
      const roadmapWithDetails: RoadmapWithDetails = {
        ...roadmapData,
        id: roadmapDoc.id,
        createdAt: roadmapData.createdAt?.toDate() || new Date(),
        updatedAt: roadmapData.updatedAt?.toDate() || new Date(),
>>>>>>> origin/main
      };

      const withDetails: RoadmapWithDetails = { ...rm } as any;

      try {
<<<<<<< HEAD
        if (rm.userId) {
          const udoc = await adminDb.collection(COLLECTIONS.USERS).doc(rm.userId).get();
          if (udoc.exists) {
            const u = udoc.data() as any;
            withDetails.author = { id: udoc.id, nickname: u.nickname };
          }
=======
        const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(roadmapData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          roadmapWithDetails.author = {
            id: userDoc.id,
            nickname: userData.nickname,
          };
>>>>>>> origin/main
        }
      } catch {}

<<<<<<< HEAD
      // Basic course fields already in roadmap document
      withDetails.course = {
        id: '',
        title: rm.courseTitle,
        platform: rm.coursePlatform,
      };

      if (data.nextCourseTitle && data.nextCoursePlatform) {
        withDetails.nextCourse = {
          id: '',
          title: data.nextCourseTitle,
          platform: data.nextCoursePlatform,
        };
=======
      // Get course information
      try {
        const courseDoc = await adminDb.collection(COLLECTIONS.COURSES).doc(roadmapData.courseId).get();
        if (courseDoc.exists) {
          const courseData = courseDoc.data();
          roadmapWithDetails.course = {
            id: courseDoc.id,
            title: courseData.title,
            platform: courseData.platform,
            category: courseData.category,
            instructor: courseData.instructor,
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch course ${roadmapData.courseId}:`, error);
      }

      // Get next course information
      if (roadmapData.nextCourseId) {
        try {
          const nextCourseDoc = await adminDb.collection(COLLECTIONS.COURSES).doc(roadmapData.nextCourseId).get();
          if (nextCourseDoc.exists) {
            const nextCourseData = nextCourseDoc.data();
            roadmapWithDetails.nextCourse = {
              id: nextCourseDoc.id,
              title: nextCourseData.title,
              platform: nextCourseData.platform,
              category: nextCourseData.category,
              instructor: nextCourseData.instructor,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch next course ${roadmapData.nextCourseId}:`, error);
        }
>>>>>>> origin/main
      }

      roadmaps.push(withDetails);
    }

    return NextResponse.json({ success: true, data: roadmaps } as ApiResponse<RoadmapWithDetails[]>);
  } catch (error) {
    console.error('Error getting admin roadmaps:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
