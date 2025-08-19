import { NextRequest, NextResponse } from 'next/server';
import { getDoc, updateDoc, increment } from 'firebase/firestore';
import { getCourseDoc } from '@/lib/firebase/collections';
import { courseConverter } from '@/lib/firebase/converters';
import { Course, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/courses/[id] - Get specific course and increment view count
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const courseRef = getCourseDoc(id).withConverter(courseConverter);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '강의를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const course = courseSnap.data();

    // Increment view count
    await updateDoc(getCourseDoc(id), {
      viewCount: increment(1)
    });

    const response: ApiResponse<Course> = {
      success: true,
      data: {
        ...course,
        viewCount: course.viewCount + 1, // Update local data
      },
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
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const updatedSnap = await getDoc(courseRef.withConverter(courseConverter));
    const updatedCourse = updatedSnap.data()!;

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