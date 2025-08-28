import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getCountFromServer 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getApps } from 'firebase-admin/app';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

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
    // Check if Firestore is initialized
    if (!db) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: '데이터베이스 연결이 초기화되지 않았습니다.' } },
        { status: 500 }
      );
    }

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

    // Get review counts
    const reviewsRef = collection(db, 'reviews');
    const allReviewsQuery = query(reviewsRef, where('userId', '==', decodedToken.uid));
    const approvedReviewsQuery = query(reviewsRef, where('userId', '==', decodedToken.uid), where('status', '==', 'APPROVED'));
    const pendingReviewsQuery = query(reviewsRef, where('userId', '==', decodedToken.uid), where('status', '==', 'PENDING'));

    const [allReviewsCount, approvedReviewsCount, pendingReviewsCount] = await Promise.all([
      getCountFromServer(allReviewsQuery),
      getCountFromServer(approvedReviewsQuery),
      getCountFromServer(pendingReviewsQuery)
    ]);

    // Get roadmap counts
    const roadmapsRef = collection(db, 'roadmaps');
    const allRoadmapsQuery = query(roadmapsRef, where('userId', '==', decodedToken.uid));
    const approvedRoadmapsQuery = query(roadmapsRef, where('userId', '==', decodedToken.uid), where('status', '==', 'APPROVED'));
    const pendingRoadmapsQuery = query(roadmapsRef, where('userId', '==', decodedToken.uid), where('status', '==', 'PENDING'));

    const [allRoadmapsCount, approvedRoadmapsCount, pendingRoadmapsCount] = await Promise.all([
      getCountFromServer(allRoadmapsQuery),
      getCountFromServer(approvedRoadmapsQuery),
      getCountFromServer(pendingRoadmapsQuery)
    ]);

    // Get comment count
    const commentsRef = collection(db, 'comments');
    const commentsQuery = query(commentsRef, where('userId', '==', decodedToken.uid));
    const commentsCount = await getCountFromServer(commentsQuery);

    // Calculate total views (sum of viewCount from approved reviews and roadmaps)
    const approvedReviewsSnapshot = await getDocs(approvedReviewsQuery);
    const approvedRoadmapsSnapshot = await getDocs(approvedRoadmapsQuery);

    let totalViews = 0;
    approvedReviewsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalViews += data.viewCount || 0;
    });
    approvedRoadmapsSnapshot.docs.forEach(doc => {
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