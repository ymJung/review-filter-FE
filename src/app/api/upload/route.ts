import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, getAdminStorage } from '@/lib/firebase/admin';
import { randomUUID } from 'crypto';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';
import { COLLECTIONS } from '@/lib/firebase/collections';

// POST /api/upload - Upload certification image
export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin services are properly configured
    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();
    const adminStorage = getAdminStorage();
    
    if (!adminDb || !adminAuth || !adminStorage) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Firebase Admin services not initialized' } },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const reviewId = formData.get('reviewId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '파일을 선택해주세요.' } },
        { status: 400 }
      );
    }

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '리뷰 ID가 필요합니다.' } },
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'JPEG, JPG, PNG, GIF, HEIC 형식의 이미지만 업로드 가능합니다.' } },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '파일 크기는 5MB 이하여야 합니다.' } },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `review-images/${decodedToken.uid}/${reviewId}/${timestamp}.${fileExtension}`;

    // Get Firebase Storage bucket
    const bucket = adminStorage.bucket();
    
    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Generate a public download token and upload with metadata
    const downloadToken = randomUUID();
    await bucket.file(fileName).save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: file.type,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    // Build Firebase Storage download URL (token-based)
    const encodedPath = encodeURIComponent(fileName);
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    // Save image info to Firestore
    const imageData = {
      reviewId,
      storageUrl: downloadURL,
      path: fileName,
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection(COLLECTIONS.REVIEW_IMAGES).add(imageData);

    const response: ApiResponse<{ id: string; url: string }> = {
      success: true,
      data: {
        id: docRef.id,
        url: downloadURL,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: handleError(error) } },
      { status: 500 }
    );
  }
}
