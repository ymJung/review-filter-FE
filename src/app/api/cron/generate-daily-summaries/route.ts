import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import OpenAI from 'openai';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function GET(request: NextRequest) {
  // Verify this is a cron request from Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting daily summary generation...');
    
    // Get recent approved reviews (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentReviewsQuery = db
      .collection('reviews')
      .where('status', '==', 'APPROVED')
      .where('updatedAt', '>=', yesterday)
      .orderBy('updatedAt', 'desc')
      .limit(50);
    
    const recentReviews = await recentReviewsQuery.get();
    
    if (recentReviews.empty) {
      console.log('No recent reviews found for summary generation');
      return NextResponse.json({ 
        success: true, 
        message: 'No recent reviews found for summary generation',
        summaryGenerated: false 
      });
    }
    
    console.log(`Found ${recentReviews.size} recent reviews for summary`);
    
    let summary = `최근 ${recentReviews.size}개의 리뷰가 등록되었습니다.`;
    
    // Generate AI summary if OpenAI is configured
    if (openai) {
      try {
        const reviewTexts = recentReviews.docs.map(doc => {
          const data = doc.data();
          return `강의: ${data.courseTitle || '제목 없음'}\n평점: ${data.rating}/5\n내용: ${data.content}`;
        }).join('\n\n');

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '당신은 강의 리뷰를 요약하는 전문가입니다. 주어진 리뷰들을 바탕으로 간결하고 유용한 요약을 한국어로 작성해주세요.'
            },
            {
              role: 'user',
              content: `다음 강의 리뷰들을 요약해주세요:\n\n${reviewTexts}`
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        });

        if (completion.choices[0]?.message?.content) {
          summary = completion.choices[0].message.content;
        }
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError);
        // Continue with fallback summary
      }
    }
    
    // Create summary document
    const reviewIds = recentReviews.docs.map(doc => doc.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days
    
    const summaryDoc = await db.collection('reviewSummaries').add({
      summary,
      reviewIds,
      createdAt: new Date(),
      expiresAt,
      type: 'daily',
      reviewCount: recentReviews.size,
    });
    
    console.log('Daily summary generated successfully');
    
    // Log the operation
    await db.collection('logs').add({
      level: 1, // INFO
      message: `Generated daily summary for ${recentReviews.size} reviews`,
      timestamp: new Date(),
      context: 'cron',
      metadata: {
        summaryId: summaryDoc.id,
        reviewCount: recentReviews.size,
        operation: 'generate-daily-summaries',
        aiGenerated: !!openai,
      },
      source: 'server',
    });

    return NextResponse.json({ 
      success: true, 
      message: `Generated daily summary for ${recentReviews.size} reviews`,
      summaryId: summaryDoc.id,
      reviewCount: recentReviews.size,
      summaryGenerated: true 
    });
  } catch (error) {
    console.error('Error generating daily summary:', error);
    
    // Log the error
    await db.collection('logs').add({
      level: 3, // ERROR
      message: 'Failed to generate daily summary',
      timestamp: new Date(),
      context: 'cron',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'generate-daily-summaries',
      },
      source: 'server',
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}