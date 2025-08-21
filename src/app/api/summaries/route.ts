import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  limit as firestoreLimit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { reviewSummaryConverter } from '@/lib/firebase/converters';
import { ReviewSummary, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// GET /api/summaries - Get cached review summaries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const summariesRef = collection(db, 'reviewSummaries');
    const q = query(
      summariesRef,
      where('expiresAt', '>', new Date()), // Only non-expired summaries
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const querySnapshot = await getDocs(q);
    const summaries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ReviewSummary[];

    const response: ApiResponse<ReviewSummary[]> = {
      success: true,
      data: summaries,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting summaries:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}