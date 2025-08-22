import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getDoc, updateDoc, increment } from 'firebase/firestore';
import { getRoadmapDoc, getUserDoc } from '@/lib/firebase/collections';
import { roadmapConverter, userConverter } from '@/lib/firebase/converters';
import { getApps } from 'firebase-admin/app';
import { Roadmap, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// GET /api/roadmaps/[id] - Get specific roadmap and increment view count
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const roadmapRef = getRoadmapDoc(id).withConverter(roadmapConverter);
    const roadmapSnap = await getDoc(roadmapRef);

    if (!roadmapSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '로드맵을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const roadmap = roadmapSnap.data();

    // Get user information (nickname only for privacy)
    const userRef = getUserDoc(roadmap.userId).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    const user = userSnap.exists() ? userSnap.data() : null;

    // Check if user can view this roadmap
    const authHeader = request.headers.get('authorization');
    let canViewFullContent = roadmap.status === 'APPROVED';
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(token);
        
        // User can view their own roadmaps regardless of status
        if (decodedToken.uid === roadmap.userId) {
          canViewFullContent = true;
        }
        
        // Admin can view all roadmaps
        const requestingUser = await getDoc(getUserDoc(decodedToken.uid).withConverter(userConverter));
        if (requestingUser.exists() && requestingUser.data().role === 'ADMIN') {
          canViewFullContent = true;
        }
      } catch (error) {
        // Invalid token, continue with public access
      }
    }

    // Increment view count for approved roadmaps
    if (roadmap.status === 'APPROVED') {
      await updateDoc(getRoadmapDoc(id), {
        viewCount: increment(1)
      });
    }

    // Filter content based on access level
    const responseData = {
      ...roadmap,
      viewCount: roadmap.status === 'APPROVED' ? roadmap.viewCount + 1 : roadmap.viewCount,
      author: user ? {
        id: user.id,
        nickname: user.nickname,
      } : null,
      // Hide detailed content for non-approved roadmaps from other users
      ...(canViewFullContent ? {} : {
        description: '검수 중인 로드맵입니다.',
        courseTitle: '검수 중',
        coursePlatform: '검수 중',
        nextCourseTitle: undefined,
        nextCoursePlatform: undefined,
      }),
    };

    const response: ApiResponse<any> = {
      success: true,
      data: responseData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting roadmap:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// PUT /api/roadmaps/[id] - Update roadmap (owner or admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    
    const { id } = params;
    const updateData = await request.json();

    const roadmapRef = getRoadmapDoc(id).withConverter(roadmapConverter);
    const roadmapSnap = await getDoc(roadmapRef);

    if (!roadmapSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '로드맵을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const roadmap = roadmapSnap.data();

    // Check permissions
    const userRef = getUserDoc(decodedToken.uid).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    const user = userSnap.exists() ? userSnap.data() : null;

    const isOwner = roadmap.userId === decodedToken.uid;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '수정 권한이 없습니다.' } },
        { status: 403 }
      );
    }

    // Prepare update data
    const updates: Partial<Roadmap> = {};

    // Only allow certain fields to be updated by owner
    if (isOwner) {
      if (updateData.title) updates.title = updateData.title.trim();
      if (updateData.description) updates.description = updateData.description.trim();
      if (updateData.courseTitle) updates.courseTitle = updateData.courseTitle.trim();
      if (updateData.coursePlatform) updates.coursePlatform = updateData.coursePlatform.trim();
      if (updateData.nextCourseTitle !== undefined) {
        updates.nextCourseTitle = updateData.nextCourseTitle?.trim();
      }
      if (updateData.nextCoursePlatform !== undefined) {
        updates.nextCoursePlatform = updateData.nextCoursePlatform?.trim();
      }
      if (updateData.category !== undefined) {
        updates.category = updateData.category?.trim();
      }
      
      // Reset status to pending if content is modified
      if (updateData.title || updateData.description || updateData.courseTitle || updateData.coursePlatform) {
        updates.status = 'PENDING';
      }
    }

    // Admin can update status
    if (isAdmin && updateData.status) {
      updates.status = updateData.status;
    }

    await updateDoc(getRoadmapDoc(id), updates);

    // Get updated roadmap
    const updatedSnap = await getDoc(roadmapRef);
    const updatedRoadmap = updatedSnap.data()!;

    const response: ApiResponse<Roadmap> = {
      success: true,
      data: updatedRoadmap,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating roadmap:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// DELETE /api/roadmaps/[id] - Delete roadmap (owner or admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    
    const { id } = params;

    const roadmapRef = getRoadmapDoc(id).withConverter(roadmapConverter);
    const roadmapSnap = await getDoc(roadmapRef);

    if (!roadmapSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '로드맵을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const roadmap = roadmapSnap.data();

    // Check permissions
    const userRef = getUserDoc(decodedToken.uid).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    const user = userSnap.exists() ? userSnap.data() : null;

    const isOwner = roadmap.userId === decodedToken.uid;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '삭제 권한이 없습니다.' } },
        { status: 403 }
      );
    }

    // Soft delete by updating status to REJECTED
    await updateDoc(getRoadmapDoc(id), {
      status: 'REJECTED',
    });

    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}