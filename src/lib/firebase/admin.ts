import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin(): App | null {
  try {
    // Check if already initialized
    if (getApps().length > 0) {
      return getApps()[0];
    }

    // Check for required environment variables
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!clientEmail || !privateKey || !projectId) {
      console.warn('Firebase Admin SDK environment variables missing. Some features may not work.');
      return null;
    }

    // Initialize with service account
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      projectId,
    });

    console.log('Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

/**
 * Get Firebase Admin App instance
 */
export function getAdminApp(): App | null {
  if (!adminApp) {
    adminApp = initializeFirebaseAdmin();
  }
  return adminApp;
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth(): Auth | null {
  try {
    if (!adminAuth) {
      const app = getAdminApp();
      if (app) {
        adminAuth = getAuth(app);
      }
    }
    return adminAuth;
  } catch (error) {
    console.error('Failed to get Admin Auth:', error);
    return null;
  }
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminDb(): Firestore | null {
  try {
    if (!adminDb) {
      const app = getAdminApp();
      if (app) {
        adminDb = getFirestore(app);
      }
    }
    return adminDb;
  } catch (error) {
    console.error('Failed to get Admin Firestore:', error);
    return null;
  }
}

/**
 * Check if Firebase Admin is properly configured
 */
export function isAdminConfigured(): boolean {
  return getAdminApp() !== null;
}