import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { ApiResponse, ReviewSummary } from '@/types';
import { handleError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const toDate = (val: any): Date => {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (typeof val?.toDate === 'function') return val.toDate();
  if (typeof val?.seconds === 'number') return new Date(val.seconds * 1000);
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

// GET /api/summaries/[id] - Get a specific review summary
export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params || {};
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: '요약 ID가 필요합니다.' } },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: '서버 데이터베이스(Admin) 초기화에 실패했습니다.' } },
        { status: 500 }
      );
    }

    const docSnap = await adminDb.collection('reviewSummaries').doc(id).get();
    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '요약을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    const data = docSnap.data() as any;
    const summary: ReviewSummary = {
      id: docSnap.id,
      summary: data.summary || '',
      reviewIds: Array.isArray(data.reviewIds) ? data.reviewIds : [],
      createdAt: toDate(data.createdAt),
      expiresAt: toDate(data.expiresAt),
    };

    const response: ApiResponse<ReviewSummary> = {
      success: true,
      data: summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting summary by id:', error);

    if (error instanceof Error) {
      const message = error.message || '';
      if (message.includes('permission-denied') || message.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          { success: false, error: { code: 'PERMISSION_DENIED', message: 'Missing or insufficient permissions.' } },
          { status: 403 }
        );
      }
      if (message.includes('not-found')) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '요약을 찾을 수 없습니다.' } },
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

