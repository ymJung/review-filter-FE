import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { 
  getDocs, 
  where, 
  collection, 
  query, 
  addDoc,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getCoursesCollection, getCourseDoc } from '@/lib/firebase/collections';
import { courseConverter } from '@/lib/firebase/converters';
import { Course, ApiResponse, PaginatedResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

// GET /api/courses - Get courses with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Check if Firestore is initialized
    if (!db) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: '데이터베이스 연결이 초기화되지 않았습니다.' } },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '10');
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let coursesQuery = query(
      collection(db, COLLECTIONS.COURSES).withConverter(courseConverter)
    );

    // Add filters
    if (platform) {
      coursesQuery = query(coursesQuery, where('platform', '==', platform));
    }
    
    if (category) {
      coursesQuery = query(coursesQuery, where('category', '==', category));
    }

    // Add search (simple title search)
    if (search) {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple prefix search
      coursesQuery = query(
        coursesQuery,
        where('title', '>=', search),
        where('title', '<=', search + '\uf8ff')
      );
    }

    // Add sorting
    coursesQuery = query(
      coursesQuery,
      orderBy(sortBy as any, sortOrder as 'asc' | 'desc')
    );

    // Add pagination
    const offset = (page - 1) * pageSize;
    if (offset > 0) {
      // For proper pagination, we'd need to implement cursor-based pagination
      // This is a simplified version
      coursesQuery = query(coursesQuery, firestoreLimit(pageSize));
    } else {
      coursesQuery = query(coursesQuery, firestoreLimit(pageSize));
    }

    const snapshot = await getDocs(coursesQuery);
    const courses = snapshot.docs.map(doc => doc.data());

    // Get total count (simplified - in production, use a separate count collection)
    const totalQuery = query(collection(db, COLLECTIONS.COURSES));
    const totalSnapshot = await getDocs(totalQuery);
    const totalItems = totalSnapshot.size;
    const totalPages = Math.ceil(totalItems / pageSize);

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
    // Check if Firestore is initialized
    if (!db) {
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
    const existingQuery = query(
      collection(db, COLLECTIONS.COURSES),
      where('title', '==', title),
      where('platform', '==', platform)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      // Course exists, return it
      const existingCourse = existingSnapshot.docs[0].data() as Course;
      const response: ApiResponse<Course> = {
        success: true,
        data: {
          ...existingCourse,
          id: existingSnapshot.docs[0].id,
        },
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

    const docRef = await addDoc(
      collection(db, COLLECTIONS.COURSES).withConverter(courseConverter),
      courseData as Course
    );

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