import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminStorage } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Review, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { verifyAuthToken } from '@/lib/auth/verifyServer';

interface ReviewWithDetails extends Review {
  course?: {
    id: string;
    title: string;
    platform: string;
    category?: string;
    instructor?: string;
  };
  author?: {
    id: string;
    nickname: string;
  };
}

// GET /api/admin/reviews - Get reviews for moderation
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' } },
        { status: 403 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Firebase Admin not configured' } },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let q: any = adminDb.collection(COLLECTIONS.REVIEWS);
    if (status && status !== 'ALL') {
      q = q.where('status', '==', status);
    }
    q = q.limit(limit);

    const snap = await q.get();
    const toDate = (v: any) => (v?.toDate ? v.toDate() : (v ? new Date(v) : undefined));

    const reviews: ReviewWithDetails[] = [];
    for (const doc of snap.docs) {
      const data = doc.data() as any;
      const review: Review = {
        id: doc.id,
        courseId: data.courseId,
        userId: data.userId,
        content: data.content,
        rating: data.rating,
        status: data.status,
        studyPeriod: toDate(data.studyPeriod),
        positivePoints: data.positivePoints,
        negativePoints: data.negativePoints,
        changes: data.changes,
        recommendedFor: data.recommendedFor,
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
      };

      const withDetails: ReviewWithDetails = { ...review } as any;

      try {
        if (review.courseId) {
          const cdoc = await adminDb.collection(COLLECTIONS.COURSES).doc(review.courseId).get();
          if (cdoc.exists) {
            const c = cdoc.data() as any;
            withDetails.course = {
              id: cdoc.id,
              title: c.title,
              platform: c.platform,
              category: c.category,
              instructor: c.instructor,
            };
          }
        }
      } catch {}

      try {
        if (review.userId) {
          const udoc = await adminDb.collection(COLLECTIONS.USERS).doc(review.userId).get();
          if (udoc.exists) {
            const u = udoc.data() as any;
            withDetails.author = { id: udoc.id, nickname: u.nickname };
          }
        }
      } catch {}

      // Fetch attached images (limit to 3)
      try {
        const imgsSnap = await adminDb
          .collection(COLLECTIONS.REVIEW_IMAGES)
          .where('reviewId', '==', doc.id)
          .limit(3)
          .get();

        const adminStorage = getAdminStorage();
        const bucket = adminStorage?.bucket();

        const imageUrls: string[] = [];
        for (const imgDoc of imgsSnap.docs) {
          const img = imgDoc.data() as any;
          let url = img.storageUrl as string | undefined;
          const path = img.path as string | undefined;

          if (url && url.includes('firebasestorage.googleapis.com')) {
            imageUrls.push(url);
            continue;
          }

          if (bucket && path) {
            try {
              const [signed] = await bucket.file(path).getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
              imageUrls.push(signed);
              continue;
            } catch {}
          }

          // Attempt path extraction from storage.googleapis.com URL
          if (bucket && url && url.includes('storage.googleapis.com')) {
            try {
              const parts = new URL(url);
              // pathname: /<bucket>/<path>
              const segments = parts.pathname.split('/').slice(2); // drop leading '' and bucket
              const inferredPath = decodeURIComponent(segments.join('/'));
              const [signed] = await bucket.file(inferredPath).getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
              imageUrls.push(signed);
              continue;
            } catch {}
          }

          if (url) imageUrls.push(url); // fallback
        }

        if (imageUrls.length > 0) {
          (withDetails as any).imageUrls = imageUrls;
        }
      } catch {}

      reviews.push(withDetails);
    }

    // Compute counts for tabs
    let pendingCount = 0, rejectedCount = 0, allCount = 0;
    try {
      const [pSnap, rSnap, aSnap] = await Promise.all([
        adminDb.collection(COLLECTIONS.REVIEWS).where('status', '==', 'PENDING').get(),
        adminDb.collection(COLLECTIONS.REVIEWS).where('status', '==', 'REJECTED').get(),
        adminDb.collection(COLLECTIONS.REVIEWS).get(),
      ]);
      pendingCount = pSnap.size;
      rejectedCount = rSnap.size;
      allCount = aSnap.size;
    } catch (e) {
      // ignore count errors, keep zeroes
    }

    return NextResponse.json({ 
      success: true, 
      data: reviews,
      meta: { counts: { pending: pendingCount, rejected: rejectedCount, all: allCount } },
    } as any);
  } catch (error) {
    console.error('Error getting admin reviews:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
