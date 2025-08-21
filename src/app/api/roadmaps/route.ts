import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  limit as firestoreLimit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getApps } from 'firebase-admin/app';
import { roadmapConverter } from '@/lib/firebase/converters';
import { Roadmap, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// GET /api/roadmaps - Get roadmaps list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'APPROVED';
    const category = searchParams.get('category');

    const roadmapsRef = collection(db, 'roadmaps');
    let q = query(
      roadmapsRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    // Add category filter if provided
    if (category) {
      q = query(
        roadmapsRef,
        where('status', '==', status),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
    }

    const querySnapshot = await getDocs(q);
    const roadmaps = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Roadmap[];

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

// POST /api/roadmaps - Create new roadmap
export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is properly initialized
    if (getApps().length === 0) {
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
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    const {
      title,
      description,
      courseTitle,
      coursePlatform,
      nextCourseTitle,
      nextCoursePlatform,
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
      nextCourseTitle: nextCourseTitle?.trim(),
      nextCoursePlatform: nextCoursePlatform?.trim(),
      category: category?.trim(),
      userId: decodedToken.uid,
      status: 'PENDING', // 검수 대기 상태
      viewCount: 0,
      createdAt: new Date(),
    };

    const roadmapsRef = collection(db, 'roadmaps');
    const docRef = await addDoc(roadmapsRef, {
      ...roadmapData,
      createdAt: serverTimestamp(),
    });

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