import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FirebaseConfig } from '@/types';

// Get Firebase configuration from environment variables
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Validate configuration
const isConfigValid = Object.values(firebaseConfig).every(value => value !== '');

if (!isConfigValid) {
  console.warn('Firebase configuration is incomplete. Some features may not work properly.');
  console.warn('Missing environment variables:', {
    apiKey: !firebaseConfig.apiKey,
    authDomain: !firebaseConfig.authDomain,
    projectId: !firebaseConfig.projectId,
    storageBucket: !firebaseConfig.storageBucket,
    messagingSenderId: !firebaseConfig.messagingSenderId,
    appId: !firebaseConfig.appId,
  });
}

// Debug: Log current configuration (without sensitive data)
console.log('Firebase Config Status:', {
  hasApiKey: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  isValid: isConfigValid
});

// Initialize Firebase only if configuration is valid
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isConfigValid) {
  try {
    if (getApps().length === 0) {
      console.log('Initializing Firebase app...');
      app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
    } else {
      app = getApps()[0];
      console.log('Using existing Firebase app');
    }

    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('Firebase services initialized successfully');
  } catch (error: any) {
    console.error('Failed to initialize Firebase:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  }
} else {
  console.warn('Skipping Firebase initialization due to missing configuration');
}

// Export services (may be null if not initialized)
export { auth, db, storage };

// Connect to emulator in development if specified
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && typeof window !== 'undefined') {
  try {
    if (db) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firestore emulator');
    }
    
    if (auth) {
      import('firebase/auth').then(({ connectAuthEmulator }) => {
        connectAuthEmulator(auth!, 'http://localhost:9099', { disableWarnings: true });
        console.log('Connected to Auth emulator');
      }).catch(error => {
        console.warn('Failed to connect to Auth emulator:', error);
      });
    }
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
  }
}

export default app;