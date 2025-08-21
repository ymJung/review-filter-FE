import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc,
  serverTimestamp,
  limit as firestoreLimit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { OpenAIService, ReviewSummaryRequest } from '@/lib/openai/client';
import { Review, ReviewSummary, ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// POST /api/summaries/generate - Generate review summary using OpenAI
export async function POST(request: NextRequest) {
  try {
    const { category, platform, limit = 10 } = await request.json();

    // Build query for approved reviews
    const reviewsRef = collection(db, 'reviews');
    let q = query(
      reviewsRef,
      where('status', '==', 'APPROVED'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    // Add category filter if provided
    if (category) {
      // Note: This would require a category field in reviews or joining with courses
      // For now, we'll fetch all approved reviews and filter later
    }

    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Review[];

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
    const summaryText = `
📊 **전체 요약**
${summaryData.summary}

⭐ **평균 평점**: ${summaryData.averageRating}/5 (총 ${summaryData.totalReviews}개 리뷰)

🎯 **핵심 포인트**
${summaryData.keyPoints.map(point => `• ${point}`).join('\n')}

��� **추천 대상**
${summaryData.recommendedFor.map(target => `• ${target}`).join('\n')}

✅ **공통 장점**
${summaryData.commonPositives.map(positive => `• ${positive}`).join('\n')}

⚠️ **공통 단점**
${summaryData.commonNegatives.map(negative => `• ${negative}`).join('\n')}
    `.trim();

    // Save summary to cache
    const reviewIds = reviews.map(review => review.id);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

    const summaryDoc: Omit<ReviewSummary, 'id'> = {
      summary: summaryText,
      reviewIds,
      createdAt: new Date(),
      expiresAt,
    };

    const summariesRef = collection(db, 'reviewSummaries');
    const docRef = await addDoc(summariesRef, {
      ...summaryDoc,
      createdAt: serverTimestamp(),
      expiresAt: serverTimestamp(), // Will be updated with actual expiry
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