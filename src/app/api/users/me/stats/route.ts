import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

interface UserStats {
  reviewCount: number;
  roadmapCount: number;
  commentCount: number;
  totalViews: number;
  approvedReviews: number;
  pendingReviews: number;
  approvedRoadmaps: number;
  pendingRoadmaps: number;
}

// GET /api/users/me/stats - Get current user's statistics
export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin is properly configured
    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    
    if (!adminDb) {
      console.error('Admin DB is not initialized');
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Firebase Admin DB not configured' } },
        { status: 500 }
      );
    }
    
    if (!adminAuth) {
      console.error('Admin Auth is not initialized');
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Firebase Admin Auth not configured' } },
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

    // Get review counts
    const reviewsRef: any = adminDb.collection(COLLECTIONS.REVIEWS);
    const allReviewsQuery = reviewsRef.where('userId', '==', decodedToken.uid);
    const approvedReviewsQuery = reviewsRef
      .where('userId', '==', decodedToken.uid)
      .where('status', '==', 'APPROVED');
    const pendingReviewsQuery = reviewsRef
      .where('userId', '==', decodedToken.uid)
      .where('status', '==', 'PENDING');

    const [allReviewsCount, approvedReviewsCount, pendingReviewsCount] = await Promise.all([
      allReviewsQuery.count().get(),
      approvedReviewsQuery.count().get(),
      pendingReviewsQuery.count().get()
    ]);

    // Get roadmap counts
    const roadmapsRef: any = adminDb.collection(COLLECTIONS.ROADMAPS);
    const allRoadmapsQuery = roadmapsRef.where('userId', '==', decodedToken.uid);
    const approvedRoadmapsQuery = roadmapsRef
      .where('userId', '==', decodedToken.uid)
      .where('status', '==', 'APPROVED');
    const pendingRoadmapsQuery = roadmapsRef
      .where('userId', '==', decodedToken.uid)
      .where('status', '==', 'PENDING');

    const [allRoadmapsCount, approvedRoadmapsCount, pendingRoadmapsCount] = await Promise.all([
      allRoadmapsQuery.count().get(),
      approvedRoadmapsQuery.count().get(),
      pendingRoadmapsQuery.count().get()
    ]);

    // Get comment count
    const commentsRef: any = adminDb.collection(COLLECTIONS.COMMENTS);
    const commentsQuery = commentsRef.where('userId', '==', decodedToken.uid);
    const commentsCount = await commentsQuery.count().get();

    // Calculate total views (sum of viewCount from approved reviews and roadmaps)
    const approvedReviewsSnapshot = await approvedReviewsQuery.get();
    const approvedRoadmapsSnapshot = await approvedRoadmapsQuery.get();

    let totalViews = 0;
    approvedReviewsSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      totalViews += data.viewCount || 0;
    });
    approvedRoadmapsSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      totalViews += data.viewCount || 0;
    });

    const stats: UserStats = {
      reviewCount: allReviewsCount.data().count,
      roadmapCount: allRoadmapsCount.data().count,
      commentCount: commentsCount.data().count,
      totalViews,
      approvedReviews: approvedReviewsCount.data().count,
      pendingReviews: pendingReviewsCount.data().count,
      approvedRoadmaps: approvedRoadmapsCount.data().count,
      pendingRoadmaps: pendingRoadmapsCount.data().count,
    };

    const response: ApiResponse<UserStats> = {
      success: true,
      data: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting user stats:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}