import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  limit as firestoreLimit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getApps } from 'firebase-admin/app';
import { reviewConverter } from '@/lib/firebase/converters';
import { Review, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// GET /api/users/me/reviews - Get current user's reviews
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('userId', '==', decodedToken.uid),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Review[];

    const response: ApiResponse<Review[]> = {
      success: true,
      data: reviews,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}