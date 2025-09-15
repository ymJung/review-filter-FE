import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { OpenAIService, ReviewSummaryRequest } from '@/lib/openai/client';
import { Review, ReviewSummary, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { CACHE_DURATION } from '@/lib/constants';

// Force dynamic to avoid caching issues
export const dynamic = 'force-dynamic';

// POST /api/summaries/generate - Generate review summary using OpenAI
export async function POST(request: NextRequest) {
  try {
    // Use Firebase Admin for server-side privileged access
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: '서버 데이터베이스(Admin) 초기화에 실패했습니다.' } },
        { status: 500 }
      );
    }

    const { category, platform, limit = 10 } = await request.json();

    // Build query for approved reviews (Admin SDK)
    const reviewsQuery = adminDb
      .collection('reviews')
      .where('status', '==', 'APPROVED')
      .orderBy('createdAt', 'desc')
      .limit(Math.max(1, Math.min(50, Number(limit) || 10)));

    // Note: category/platform filtering requires fields on review docs or a join with courses.
    const querySnapshot = await reviewsQuery.get();
    const reviews = querySnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })) as Review[];

    if (reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_REVIEWS', message: '요약할 리뷰가 없습니다.' } },
        { status: 400 }
      );
    }

    // Prepare reviews for OpenAI
    const reviewsForSummary: ReviewSummaryRequest['reviews'] = reviews.map(review => ({
      id: review.id,
      content: review.content,
      rating: review.rating,
      positivePoints: review.positivePoints,
      negativePoints: review.negativePoints,
      changes: review.changes,
      recommendedFor: review.recommendedFor,
    }));

    // Generate summary using OpenAI
    const summaryData = await OpenAIService.generateReviewSummary({
      reviews: reviewsForSummary,
      category,
      platform,
    });

    // Create summary text
    const sections: string[] = [];
    sections.push(`📊 전체 요약\n${summaryData.summary}`);
    sections.push(`⭐ 평균 평점: ${summaryData.averageRating}/5 (총 ${summaryData.totalReviews}개 리뷰)`);
    if (summaryData.keyPoints?.length) {
      sections.push(`🎯 핵심 포인트\n${summaryData.keyPoints.map((p) => `• ${p}`).join('\n')}`);
    }
    if (summaryData.recommendedFor?.length) {
      sections.push(`👥 추천 대상\n${summaryData.recommendedFor.map((t) => `• ${t}`).join('\n')}`);
    }
    if (summaryData.commonPositives?.length) {
      sections.push(`✅ 공통 장점\n${summaryData.commonPositives.map((p) => `• ${p}`).join('\n')}`);
    }
    if (summaryData.commonNegatives?.length) {
      sections.push(`⚠️ 공통 단점\n${summaryData.commonNegatives.map((n) => `• ${n}`).join('\n')}`);
    }
    const summaryText = sections.join('\n\n');

    // Save summary to cache
    const reviewIds = reviews.map(review => review.id);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + (CACHE_DURATION?.REVIEW_SUMMARY || 24 * 60 * 60 * 1000));

    const summaryDoc: Omit<ReviewSummary, 'id'> = {
      summary: summaryText,
      reviewIds,
      createdAt,
      expiresAt,
    };

    const docRef = await adminDb.collection('reviewSummaries').add({
      ...summaryDoc,
    });

    const newSummary: ReviewSummary = {
      id: docRef.id,
      ...summaryDoc,
    };

    const response: ApiResponse<ReviewSummary> = {
      success: true,
      data: newSummary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API key')) {
        return NextResponse.json(
          { success: false, error: { code: 'API_KEY_ERROR', message: 'OpenAI API 설정이 필요합니다.' } },
          { status: 500 }
        );
      }
      if (error.message.includes('No reviews provided')) {
        return NextResponse.json(
          { success: false, error: { code: 'NO_REVIEWS', message: '요약할 리뷰가 없습니다.' } },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
