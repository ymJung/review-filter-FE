import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Roadmap, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth/verifyServer';

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

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Firebase Admin not configured' } },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

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
      };

      const withDetails: RoadmapWithDetails = { ...rm } as any;

      try {
        if (rm.userId) {
          const udoc = await adminDb.collection(COLLECTIONS.USERS).doc(rm.userId).get();
          if (udoc.exists) {
            const u = udoc.data() as any;
            withDetails.author = { id: udoc.id, nickname: u.nickname };
          }
        }
      } catch {}

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
