import { NextRequest, NextResponse } from 'next/server';
import { Course, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS, getCourseDoc } from '@/lib/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { getDoc, updateDoc } from 'firebase/firestore';

// Ensure Node.js runtime for firebase-admin compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/courses/[id] - Get specific course and increment view count
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const adminDb = getAdminDb();
    let course: Course | null = null;
    if (adminDb) {
      try {
        const docRef = adminDb.collection(COLLECTIONS.COURSES).doc(id);
        const courseSnap = await docRef.get();
        if (!courseSnap.exists) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: '강의를 찾을 수 없습니다.' } },
            { status: 404 }
          );
        }
        const data = courseSnap.data() as any;
        course = {
          id: courseSnap.id,
          title: data.title,
          platform: data.platform,
          instructor: data.instructor,
          category: data.category,
          viewCount: data.viewCount || 0,
          // Be robust to different createdAt shapes (Timestamp | Date | string)
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
        };
        // Increment view count atomically (best-effort)
        try {
          await docRef.update({ viewCount: FieldValue.increment(1) });
          course.viewCount += 1;
        } catch (e) {
          console.warn('Failed to increment course viewCount via Admin SDK:', e);
        }
      } catch (e: any) {
        console.warn('Admin SDK failed, falling back to client SDK for course fetch:', e?.message || e);
        // fall through to client SDK path below
      }
    }

    if (!course) {
      // Fallback: avoid throwing 500 when client SDK isn't initialized on server
      try {
        const courseRef = getCourseDoc(id);
        const snap = await getDoc(courseRef);
        if (!snap.exists()) {
          return NextResponse.json(
            { success: false, error: { code: 'NOT_FOUND', message: '강의를 찾을 수 없습니다.' } },
            { status: 404 }
          );
        }
        const data = snap.data() as any;
        course = {
          id: snap.id,
          title: data.title,
          platform: data.platform,
          instructor: data.instructor,
          category: data.category,
          viewCount: data.viewCount || 0,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
        };
      } catch (e: any) {
        console.warn('Client Firestore fallback unavailable in API route. Returning graceful null.', e?.message || e);
        return NextResponse.json(
          { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: '데이터베이스 연결이 초기화되지 않았습니다.' } },
          { status: 200 }
        );
      }
    }

    const response: ApiResponse<Course> = {
      success: true,
      data: course!,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting course:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update course (admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    // TODO: Verify admin role
    
    const { id } = params;
    const { title, platform, instructor, category } = await request.json();

    const courseRef = getCourseDoc(id);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '강의를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const updates: Partial<Course> = {};
    if (title) updates.title = title.trim();
    if (platform) updates.platform = platform.trim();
    if (instructor !== undefined) updates.instructor = instructor?.trim();
    if (category !== undefined) updates.category = category?.trim();

    await updateDoc(courseRef, updates);

    // Get updated course
    const updatedSnap = await getDoc(courseRef);
    const updatedCourse = { id, ...(updatedSnap.data() as any) } as Course;

    const response: ApiResponse<Course> = {
      success: true,
      data: updatedCourse,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
