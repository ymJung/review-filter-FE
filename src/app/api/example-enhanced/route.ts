import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { 
  handleApiError, 
  withErrorHandling, 
  validateRequired, 
  requireAuth, 
  successResponse,
  parsePaginationParams,
  sanitizeInput
} from '@/lib/utils/apiErrorHandler';
import { ValidationError, AuthError } from '@/types';

// Example GET endpoint with enhanced error handling
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, sortBy, sortOrder } = parsePaginationParams(searchParams);
  
  // Simulate some data fetching
  const data = {
    items: [],
    pagination: {
      currentPage: page,
      totalPages: 1,
      totalItems: 0,
      hasNext: false,
      hasPrev: false,
    }
  };
  
  return successResponse(data);
});

// Example POST endpoint with validation and authentication
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require authentication
  const authHeader = request.headers.get('authorization');
  const token = requireAuth(authHeader);
  
  // Verify the token
  const auth = getAuth();
  const decodedToken = await auth.verifyIdToken(token);
  
  // Parse and sanitize input
  const rawData = await request.json();
  const data = sanitizeInput(rawData);
  
  // Validate required fields
  validateRequired(data, ['title', 'content']);
  
  // Additional custom validation
  if (data.title.length < 3) {
    throw new ValidationError('제목은 최소 3자 이상이어야 합니다.', 'TITLE_TOO_SHORT');
  }
  
  if (data.content.length < 10) {
    throw new ValidationError('내용은 최소 10자 이상이어야 합니다.', 'CONTENT_TOO_SHORT');
  }
  
  // Simulate creating the resource
  const newResource = {
    id: 'example-id',
    title: data.title,
    content: data.content,
    userId: decodedToken.uid,
    createdAt: new Date().toISOString(),
  };
  
  return successResponse(newResource, 201);
});

// Example PUT endpoint
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const token = requireAuth(authHeader);
  
  const auth = getAuth();
  const decodedToken = await auth.verifyIdToken(token);
  
  const data = sanitizeInput(await request.json());
  validateRequired(data, ['id']);
  
  // Simulate updating the resource
  const updatedResource = {
    id: data.id,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  return successResponse(updatedResource);
});

// Example DELETE endpoint
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const token = requireAuth(authHeader);
  
  const auth = getAuth();
  const decodedToken = await auth.verifyIdToken(token);
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    throw new ValidationError('ID가 필요합니다.', 'MISSING_ID');
  }
  
  // Simulate deletion
  return successResponse({ message: '성공적으로 삭제되었습니다.' });
});