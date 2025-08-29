import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { SocialProvider } from '@/types';
import { generateRandomNickname } from '@/lib/utils';

// Initialize Firebase Admin SDK
let firebaseApp;
try {
  if (getApps().length === 0) {
    console.log('Initializing Firebase Admin SDK...');
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      console.error('Missing Firebase environment variables');
    }
  } else {
    firebaseApp = getApps()[0];
    console.log('Using existing Firebase app');
  }
} catch (error) {
  console.error('Firebase Admin initialization failed:', error);
}

export async function POST(request: NextRequest) {
  try {
    console.log('Create token API called');
    
    // Check if Firebase Admin is properly initialized
    if (getApps().length === 0) {
      console.error('Firebase Admin not configured - no apps initialized');
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 500 }
      );
    }

    const auth = getAuth();
    const { provider, socialData } = await request.json();
    
    console.log('Received request data:', { provider, socialData });

    if (!provider || !socialData) {
      console.error('Missing provider or social data');
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
    
    console.log('Creating user with UID:', uid);
    console.log('User claims:', claims);

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUser(uid);
      console.log('User already exists:', userRecord.uid);
    } catch (error: any) {
      console.log('User not found, creating new user...');
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          uid,
          email: socialData.email,
          displayName: socialData.name || socialData.nickname || generateRandomNickname(),
          emailVerified: true,
        });
        console.log('New user created:', userRecord.uid);
      } else {
        console.error('Error getting user:', error);
        throw error;
      }
    }

    // Create custom token
    console.log('Creating custom token for user:', uid);
    const customToken = await auth.createCustomToken(uid, claims);
    console.log('Custom token created successfully');

    return NextResponse.json({ customToken });
    
  } catch (error: any) {
    console.error('Error creating custom token:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    if (error.code === 'auth/insufficient-permission') {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions to create custom token',
          details: 'The Firebase service account does not have the required permissions. Please check the Firebase Console IAM settings.'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create custom token', details: error.message },
      { status: 500 }
    );
  }
}