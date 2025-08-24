import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

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

export async function GET(request: NextRequest) {
  // Verify this is a cron request from Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting cleanup of expired summaries...');
    
    const now = new Date();
    const expiredSummariesQuery = db
      .collection('reviewSummaries')
      .where('expiresAt', '<=', now);
    
    const expiredSummaries = await expiredSummariesQuery.get();
    
    if (expiredSummaries.empty) {
      console.log('No expired summaries found');
      return NextResponse.json({ 
        success: true, 
        message: 'No expired summaries found',
        deletedCount: 0 
      });
    }
    
    const batch = db.batch();
    expiredSummaries.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    const deletedCount = expiredSummaries.size;
    console.log(`Cleaned up ${deletedCount} expired summaries`);
    
    // Log the cleanup operation
    await db.collection('logs').add({
      level: 1, // INFO
      message: `Cleaned up ${deletedCount} expired summaries`,
      timestamp: new Date(),
      context: 'cron',
      metadata: {
        deletedCount,
        operation: 'cleanup-expired-summaries',
      },
      source: 'server',
    });

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} expired summaries`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error cleaning up expired summaries:', error);
    
    // Log the error
    await db.collection('logs').add({
      level: 3, // ERROR
      message: 'Failed to cleanup expired summaries',
      timestamp: new Date(),
      context: 'cron',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'cleanup-expired-summaries',
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