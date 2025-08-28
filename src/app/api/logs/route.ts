import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
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

export async function POST(request: NextRequest) {
    try {
        const logEntry = await request.json();

        // Validate log entry structure
        if (!logEntry.level || !logEntry.message || !logEntry.timestamp) {
            return NextResponse.json(
                { error: 'Invalid log entry format' },
                { status: 400 }
            );
        }

        // Add server timestamp
        logEntry.serverTimestamp = new Date().toISOString();
        logEntry.source = 'client';

        // Store in Firestore (optional - for critical logs only)
        if (logEntry.level >= 2) { // WARN and ERROR levels
            await db.collection('logs').add({
                ...logEntry,
                createdAt: new Date(),
            });
        }

        // In production, you might want to send to external logging service
        if (process.env.NODE_ENV === 'production') {
            // Send to external logging service (e.g., Datadog, New Relic, etc.)
            console.log('Production Log:', JSON.stringify(logEntry));
        } else {
            // Development logging
            console.log('Development Log:', logEntry);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing log entry:', error);
        return NextResponse.json(
            { error: 'Failed to process log entry' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // This endpoint could be used by admins to retrieve logs
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            const decodedToken = await getAuth().verifyIdToken(token);

            // Check if user is admin
            const userDoc = await db.collection('users').doc(decodedToken.uid).get();
            const userData = userDoc.data();

            if (!userData || userData.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'Insufficient permissions' },
                    { status: 403 }
                );
            }

            // Get recent logs
            const logsQuery = db
                .collection('logs')
                .orderBy('createdAt', 'desc')
                .limit(100);

            const logsSnapshot = await logsQuery.get();
            const logs = logsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            return NextResponse.json({ logs });
        } catch (authError) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error retrieving logs:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve logs' },
            { status: 500 }
        );
    }
}