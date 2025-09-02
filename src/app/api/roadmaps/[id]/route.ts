import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Roadmap, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

// GET /api/roadmaps/[id] - Get specific roadmap and increment view count
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check if Firebase Admin is properly configured
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: '데이터베이스 연결이 초기화되지 않았습니다.' } },
        { status: 500 }
      );
    }

    // Get roadmap document
    const roadmapDoc = await adminDb.collection(COLLECTIONS.ROADMAPS).doc(id).get();

    if (!roadmapDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '로드맵을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const data = roadmapDoc.data() as any;
    const roadmap: Roadmap = {
      id: roadmapDoc.id,
      title: data.title,
      description: data.description,
      courseTitle: data.courseTitle,
      coursePlatform: data.coursePlatform,
      nextCourses: data.nextCourses,
      category: data.category,
      userId: data.userId,
      status: data.status,
      viewCount: data.viewCount ?? 0,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    };

    // Get user information (nickname only for privacy)
    let author: { id: string; nickname: string } | null = null;
    if (roadmap.userId) {
      const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(roadmap.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data() as any;
        author = { id: userDoc.id, nickname: userData.nickname };
      }
    }

    // Check if user can view this roadmap
    const authHeader = request.headers.get('authorization');
    let canViewFullContent = roadmap.status === 'APPROVED';
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const adminAuth = getAdminAuth();
        if (adminAuth) {
          const decodedToken = await adminAuth.verifyIdToken(token);
          
          // User can view their own roadmaps regardless of status
          if (decodedToken.uid === roadmap.userId) {
            canViewFullContent = true;
          }
          
          // Admin can view all roadmaps
          const requestingUserDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
          if (requestingUserDoc.exists) {
            const requestingUserData = requestingUserDoc.data() as any;
            if (requestingUserData && requestingUserData.role === 'ADMIN') {
              canViewFullContent = true;
            }
          }
        }
      } catch (error) {
        // Invalid token, continue with public access
        console.error('Token verification error:', error);
      }
    }

    // Increment view count for approved roadmaps
    if (roadmap.status === 'APPROVED') {
      await adminDb.collection(COLLECTIONS.ROADMAPS).doc(id).update({
        viewCount: roadmap.viewCount + 1
      });
    }

    // Filter content based on access level
    const responseData = {
      ...roadmap,
      viewCount: roadmap.status === 'APPROVED' ? roadmap.viewCount + 1 : roadmap.viewCount,
      author,
      // Hide detailed content for non-approved roadmaps from other users
      ...(canViewFullContent ? {} : {
        description: '검수 중인 로드맵입니다.',
        courseTitle: '검수 중',
        coursePlatform: '검수 중',
        nextCourses: [],
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
    
    const { id } = params;
    const updateData = await request.json();

    // Get roadmap document
    const roadmapDoc = await adminDb.collection(COLLECTIONS.ROADMAPS).doc(id).get();

    if (!roadmapDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '로드맵을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const roadmapData = roadmapDoc.data() as any;
    const roadmap: Roadmap = {
      id: roadmapDoc.id,
      title: roadmapData.title,
      description: roadmapData.description,
      courseTitle: roadmapData.courseTitle,
      coursePlatform: roadmapData.coursePlatform,
      nextCourses: roadmapData.nextCourses,
      category: roadmapData.category,
      userId: roadmapData.userId,
      status: roadmapData.status,
      viewCount: roadmapData.viewCount ?? 0,
      createdAt: roadmapData.createdAt?.toDate ? roadmapData.createdAt.toDate() : new Date(),
    };

    // Check permissions
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    const user = userDoc.exists ? userDoc.data() : null;

    const isOwner = roadmap.userId === decodedToken.uid;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '수정 권한이 없습니다.' } },
        { status: 403 }
      );
    }

    // Prepare update data
    const updates: any = {};

    // Only allow certain fields to be updated by owner
    if (isOwner) {
      if (updateData.title) updates.title = updateData.title.trim();
      if (updateData.description) updates.description = updateData.description.trim();
      if (updateData.courseTitle) updates.courseTitle = updateData.courseTitle.trim();
      if (updateData.coursePlatform) updates.coursePlatform = updateData.coursePlatform.trim();
      if (updateData.nextCourses !== undefined) {
        updates.nextCourses = updateData.nextCourses;
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

    await adminDb.collection(COLLECTIONS.ROADMAPS).doc(id).update(updates);

    // Get updated roadmap
    const updatedDoc = await adminDb.collection(COLLECTIONS.ROADMAPS).doc(id).get();
    const updatedData = updatedDoc.data() as any;
    const updatedRoadmap: Roadmap = {
      id: updatedDoc.id,
      title: updatedData.title,
      description: updatedData.description,
      courseTitle: updatedData.courseTitle,
      coursePlatform: updatedData.coursePlatform,
      nextCourses: updatedData.nextCourses,
      category: updatedData.category,
      userId: updatedData.userId,
      status: updatedData.status,
      viewCount: updatedData.viewCount ?? 0,
      createdAt: updatedData.createdAt?.toDate ? updatedData.createdAt.toDate() : new Date(),
    };

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
    
    const { id } = params;

    // Get roadmap document
    const roadmapDoc = await adminDb.collection(COLLECTIONS.ROADMAPS).doc(id).get();

    if (!roadmapDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '로드맵을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const roadmapData = roadmapDoc.data() as any;
    const roadmap: Roadmap = {
      id: roadmapDoc.id,
      title: roadmapData.title,
      description: roadmapData.description,
      courseTitle: roadmapData.courseTitle,
      coursePlatform: roadmapData.coursePlatform,
      nextCourses: roadmapData.nextCourses,
      category: roadmapData.category,
      userId: roadmapData.userId,
      status: roadmapData.status,
      viewCount: roadmapData.viewCount ?? 0,
      createdAt: roadmapData.createdAt?.toDate ? roadmapData.createdAt.toDate() : new Date(),
    };

    // Check permissions
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    const user = userDoc.exists ? userDoc.data() : null;

    const isOwner = roadmap.userId === decodedToken.uid;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '삭제 권한이 없습니다.' } },
        { status: 403 }
      );
    }

    // Soft delete by updating status to REJECTED
    await adminDb.collection(COLLECTIONS.ROADMAPS).doc(id).update({
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
