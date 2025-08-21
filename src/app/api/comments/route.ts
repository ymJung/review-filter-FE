import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getApps } from 'firebase-admin/app';
import { commentConverter } from '@/lib/firebase/converters';
import { Comment, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// GET /api/comments - Get comments for a review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: '리뷰 ID가 필요합니다.' } },
        { status: 400 }
      );
    }

    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('reviewId', '==', reviewId),
      where('status', '==', 'APPROVED'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const comments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[];

    const response: ApiResponse<Comment[]> = {
      success: true,
      data: comments.slice(0, limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting comments:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create new comment
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

    const { reviewId, content } = await request.json();

    if (!reviewId || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: '리뷰 ID와 댓글 내용이 필요합니다.' } },
        { status: 400 }
      );
    }

    // Create comment data
    const commentData: Omit<Comment, 'id'> = {
      reviewId,
      userId: decodedToken.uid,
      content: content.trim(),
      status: 'PENDING', // 검수 대기 상태
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const commentsRef = collection(db, 'comments');
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newComment: Comment = {
      id: docRef.id,
      ...commentData,
    };

    const response: ApiResponse<Comment> = {
      success: true,
      data: newComment,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}