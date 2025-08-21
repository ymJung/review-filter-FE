import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getCommentDoc, getUserDoc } from '@/lib/firebase/collections';
import { commentConverter, userConverter } from '@/lib/firebase/converters';
import { getApps } from 'firebase-admin/app';
import { Comment, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// GET /api/comments/[id] - Get specific comment
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const commentRef = getCommentDoc(id).withConverter(commentConverter);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const comment = commentSnap.data();

    const response: ApiResponse<Comment> = {
      success: true,
      data: comment,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting comment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// PUT /api/comments/[id] - Update comment (owner or admin only)
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

    const commentRef = getCommentDoc(id).withConverter(commentConverter);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const comment = commentSnap.data();

    // Check permissions
    const userRef = getUserDoc(decodedToken.uid).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    const user = userSnap.exists() ? userSnap.data() : null;

    const isOwner = comment.userId === decodedToken.uid;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '수정 권한이 없습니다.' } },
        { status: 403 }
      );
    }

    // Prepare update data
    const updates: Partial<Comment> = {
      updatedAt: new Date(),
    };

    // Only allow certain fields to be updated by owner
    if (isOwner && updateData.content) {
      updates.content = updateData.content.trim();
      // Reset status to pending if content is modified
      updates.status = 'PENDING';
    }

    // Admin can update status
    if (isAdmin && updateData.status) {
      updates.status = updateData.status;
    }

    await updateDoc(getCommentDoc(id), updates);

    // Get updated comment
    const updatedSnap = await getDoc(commentRef);
    const updatedComment = updatedSnap.data()!;

    const response: ApiResponse<Comment> = {
      success: true,
      data: updatedComment,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Delete comment (owner or admin only)
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

    const commentRef = getCommentDoc(id).withConverter(commentConverter);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const comment = commentSnap.data();

    // Check permissions
    const userRef = getUserDoc(decodedToken.uid).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    const user = userSnap.exists() ? userSnap.data() : null;

    const isOwner = comment.userId === decodedToken.uid;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '삭제 권한이 없습니다.' } },
        { status: 403 }
      );
    }

    // Soft delete by updating status
    await updateDoc(getCommentDoc(id), {
      status: 'REJECTED',
      updatedAt: new Date(),
    });

    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}