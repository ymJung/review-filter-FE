import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { ReviewSummary, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// GET /api/summaries - Get cached review summaries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Check if Firebase Admin is properly configured
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: true, data: [] }, // Return empty array instead of error
        { status: 200 }
      );
    }

    // Use Firebase Admin SDK for server-side queries
    // Simplified query to avoid index requirements for now
    const summariesRef = adminDb.collection('reviewSummaries');
    const query = summariesRef
      .orderBy('createdAt', 'desc')
      .limit(limit * 2); // Get more to filter out expired ones

    const querySnapshot = await query.get();

    // Helper to normalize Firestore Timestamp | Date | number to Date
    const toDate = (val: any): Date => {
      if (!val) return new Date(0);
      if (val instanceof Date) return val;
      if (typeof val?.toDate === 'function') return val.toDate();
      if (typeof val?.seconds === 'number') return new Date(val.seconds * 1000);
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? new Date(0) : parsed;
    };

    // Filter out expired summaries in memory
    const now = new Date();
    const validSummaries = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: toDate(data.createdAt),
          expiresAt: toDate(data.expiresAt),
        };
      })
      .filter(summary => summary.expiresAt > now)
      .slice(0, limit);
    const summaries: ReviewSummary[] = validSummaries as ReviewSummary[];

    const response: ApiResponse<ReviewSummary[]> = {
      success: true,
      data: summaries,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting summaries:', error);
    
    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes('permission-denied') || error.message.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          { success: false, error: { code: 'PERMISSION_DENIED', message: 'Missing or insufficient permissions.' } },
          { status: 403 }
        );
      }
      if (error.message.includes('not-found')) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '최근 요약이 없습니다.' } },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
