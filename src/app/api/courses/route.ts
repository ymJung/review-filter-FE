import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { Course, ApiResponse, PaginatedResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

// Ensure Node.js runtime for firebase-admin compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/courses - Get courses with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin is properly configured
    const adminDb = getAdminDb();
    if (!adminDb) {
      // Graceful fallback: return empty list to avoid client errors in dev without Admin SDK
      const empty: ApiResponse<PaginatedResponse<Course>> = {
        success: true,
        data: {
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      };
      return NextResponse.json(empty, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '10');
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let courses: Course[] = [];
    let totalItems = 0;
    let totalPages = 0;

    try {
      // Build query using Firebase Admin SDK
      let coursesQuery: any = adminDb.collection(COLLECTIONS.COURSES);

      // Add filters
      if (platform) {
        coursesQuery = coursesQuery.where('platform', '==', platform);
      }
      
      if (category) {
        coursesQuery = coursesQuery.where('category', '==', category);
      }

      // Add search (simple title search)
      if (search) {
        // Note: Firestore doesn't support full-text search natively
        // This is a simple prefix search
        coursesQuery = coursesQuery
          .where('title', '>=', search)
          .where('title', '<=', search + '\uf8ff');
      }

      // Add sorting
      coursesQuery = coursesQuery.orderBy(sortBy, sortOrder as any);

      // Add pagination
      const offset = (page - 1) * pageSize;
      coursesQuery = coursesQuery.offset(offset).limit(pageSize);

      const snapshot = await coursesQuery.get();
      courses = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Be robust to different createdAt shapes (Timestamp | Date | string)
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
        } as Course;
      });

      // Get total count (simplified - in production, use a separate count collection)
      const totalQuery: any = adminDb.collection(COLLECTIONS.COURSES);
      const totalSnapshot = await totalQuery.get();
      totalItems = totalSnapshot.size;
      totalPages = Math.ceil(totalItems / pageSize);
    } catch (e: any) {
      console.warn('Admin SDK query failed in /api/courses, returning empty set:', e?.message || e);
      courses = [];
      totalItems = 0;
      totalPages = 0;
    }

    const response: ApiResponse<PaginatedResponse<Course>> = {
      success: true,
      data: {
        data: courses,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting courses:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create or get existing course
export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is properly configured
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: '데이터베이스 연결이 초기화되지 않았습니다.' } },
        { status: 500 }
      );
    }

    const { title, platform, instructor, category } = await request.json();

    if (!title || !platform) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '강의명과 플랫폼은 필수입니다.' } },
        { status: 400 }
      );
    }

    // Check if course already exists
    const existingSnapshot = await adminDb.collection(COLLECTIONS.COURSES)
      .where('title', '==', title)
      .where('platform', '==', platform)
      .get();
    
    if (!existingSnapshot.empty) {
      // Course exists, return it
      const existingDoc = existingSnapshot.docs[0];
      const data = existingDoc.data() as any;
      const existingCourse: Course = {
        id: existingDoc.id,
        platform: data.platform,
        title: data.title,
        instructor: data.instructor,
        category: data.category,
        viewCount: data.viewCount ?? 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
      
      const response: ApiResponse<Course> = {
        success: true,
        data: existingCourse,
      };
      return NextResponse.json(response);
    }

    // Create new course
    const courseData: Omit<Course, 'id'> = {
      title: title.trim(),
      platform: platform.trim(),
      instructor: instructor?.trim(),
      category: category?.trim(),
      viewCount: 0,
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.COURSES).add(courseData);

    const newCourse: Course = {
      id: docRef.id,
      ...courseData,
    };

    const response: ApiResponse<Course> = {
      success: true,
      data: newCourse,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
