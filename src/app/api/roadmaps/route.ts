import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Roadmap, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

// GET /api/roadmaps - Get roadmaps list
export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin is properly configured
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: '데이터베이스 연결이 초기화되지 않았습니다.' } },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'APPROVED';
    const category = searchParams.get('category');

    // Build query using Firebase Admin SDK
    let roadmapsQuery: any = adminDb.collection(COLLECTIONS.ROADMAPS);

    // Add filters
    roadmapsQuery = roadmapsQuery.where('status', '==', status);
    
    if (category) {
      roadmapsQuery = roadmapsQuery.where('category', '==', category);
    }

    // Add sorting and limit
    roadmapsQuery = roadmapsQuery
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const querySnapshot = await roadmapsQuery.get();
    const roadmaps: Roadmap[] = querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    const response: ApiResponse<Roadmap[]> = {
      success: true,
      data: roadmaps,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting roadmaps:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// POST /api/roadmaps - Create a new roadmap
export async function POST(request: NextRequest) {
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

    const {
      title,
      description,
      courseTitle,
      coursePlatform,
      nextCourses,
      category
    } = await request.json();

    // Validation
    if (!title?.trim() || !description?.trim() || !courseTitle?.trim() || !coursePlatform?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: '필수 필드를 모두 입력해주세요.' } },
        { status: 400 }
      );
    }

    // Create roadmap data
    const roadmapData: Omit<Roadmap, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      courseTitle: courseTitle.trim(),
      coursePlatform: coursePlatform.trim(),
      nextCourses: nextCourses?.map((course: any) => ({
        title: course.title?.trim() || '',
        platform: course.platform?.trim() || ''
      })).filter((course: any) => course.title && course.platform) || [],
      userId: decodedToken.uid,
      status: 'PENDING', // 검수 대기 상태
      viewCount: 0,
      createdAt: new Date(),
    };

    // Only add category if it's provided
    if (category && category.trim()) {
      (roadmapData as any).category = category.trim();
    }

    const docRef = await adminDb.collection(COLLECTIONS.ROADMAPS).add(roadmapData);

    const newRoadmap: Roadmap = {
      id: docRef.id,
      ...roadmapData,
    };

    const response: ApiResponse<Roadmap> = {
      success: true,
      data: newRoadmap,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating roadmap:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}