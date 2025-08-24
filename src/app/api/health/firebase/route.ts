import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, limit, query, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    // Test Firebase connection with a simple query
    const testQuery = query(collection(db, 'users'), limit(1));
    await getDocs(testQuery);
    
    return NextResponse.json({
      status: 'healthy',
      service: 'firebase',
      timestamp: new Date().toISOString(),
      details: {
        database: 'connected',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      }
    });
  } catch (error) {
    console.error('Firebase health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      service: 'firebase',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}