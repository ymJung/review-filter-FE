import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { SocialProvider } from '@/types';
import { generateRandomNickname } from '@/lib/utils';

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();

export async function POST(request: NextRequest) {
  try {
    const { provider, socialData } = await request.json();

    if (!provider || !socialData) {
      return NextResponse.json(
        { error: 'Missing provider or social data' },
        { status: 400 }
      );
    }

    // Create unique user ID based on provider and social ID
    const uid = `${provider}_${socialData.id}`;
    
    // Prepare user claims
    const claims = {
      provider,
      socialId: socialData.id,
      email: socialData.email,
      name: socialData.name || socialData.nickname,
    };

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUser(uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          uid,
          email: socialData.email,
          displayName: socialData.name || socialData.nickname || generateRandomNickname(),
          emailVerified: true,
        });
      } else {
        throw error;
      }
    }

    // Create custom token
    const customToken = await auth.createCustomToken(uid, claims);

    return NextResponse.json({ customToken });
    
  } catch (error) {
    console.error('Error creating custom token:', error);
    return NextResponse.json(
      { error: 'Failed to create custom token' },
      { status: 500 }
    );
  }
}