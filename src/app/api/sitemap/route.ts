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
  try {
    const baseUrl = process.env.SITE_URL || 'https://review-platform.vercel.app';
    
    // Get approved reviews and roadmaps for dynamic sitemap
    const [reviewsSnapshot, roadmapsSnapshot] = await Promise.all([
      db.collection('reviews')
        .where('status', '==', 'APPROVED')
        .orderBy('updatedAt', 'desc')
        .limit(1000)
        .get(),
      db.collection('roadmaps')
        .where('status', '==', 'APPROVED')
        .orderBy('updatedAt', 'desc')
        .limit(1000)
        .get(),
    ]);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/reviews</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/roadmaps</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  ${reviewsSnapshot.docs.map(doc => {
    const data = doc.data();
    return `<url>
    <loc>${baseUrl}/reviews/${doc.id}</loc>
    <lastmod>${data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('')}
  ${roadmapsSnapshot.docs.map(doc => {
    const data = doc.data();
    return `<url>
    <loc>${baseUrl}/roadmaps/${doc.id}</loc>
    <lastmod>${data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
  }).join('')}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}