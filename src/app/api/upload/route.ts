import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ApiResponse } from '@/types';
import { handleError } from '@/lib/utils';

// POST /api/upload - Upload certification image
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

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

    // Upload to Firebase Storage
    const storageRef = ref(storage, fileName);
    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await uploadBytes(storageRef, fileBuffer, {
      contentType: file.type,
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // Save image info to Firestore
    const imageData = {
      reviewId,
      storageUrl: downloadURL,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.REVIEW_IMAGES), imageData);

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