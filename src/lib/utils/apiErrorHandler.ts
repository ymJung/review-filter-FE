import { NextResponse } from 'next/server';
import { FirebaseError } from 'firebase/app';
import { 
  AppError, 
  AuthError, 
  ValidationError, 
  NotFoundError, 
  PermissionError,
  ApiResponse 
} from '@/types';
import { processError, logError } from './errorHandler';
import { isFirebaseError, convertFirebaseError } from '@/lib/firebase/errors';

// Enhanced API error handler for Next.js API routes
export const handleApiError = (
  error: unknown,
  context?: string
): NextResponse<ApiResponse> => {
  // Log the error for debugging
  logError(error, context);

  // Process the error to get standardized information
  const processedError = processError(error);

  // Handle Firebase errors specifically
  if (isFirebaseError(error)) {
    const appError = convertFirebaseError(error as FirebaseError);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: appError.code,
          message: appError.message,
        },
      },
      { status: appError.statusCode }
    );
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle validation errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: 400 }
    );
  }

  // Handle authentication errors
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: 401 }
    );
  }

  // Handle permission errors
  if (error instanceof PermissionError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: 403 }
    );
  }

  // Handle not found errors
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: 404 }
    );
  }

  // Default error response
  return NextResponse.json(
    {
      success: false,
      error: {
        code: processedError.code,
        message: processedError.userMessage,
      },
    },
    { status: processedError.statusCode }
  );
};

// Wrapper for API route handlers with automatic error handling
export const withErrorHandling = <T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<ApiResponse<R>>>
) => {
  return async (...args: T): Promise<NextResponse<ApiResponse<R>>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, 'api_route');
    }
  };
};

// Validation helper for API routes
export const validateRequired = (
  data: Record<string, any>,
  requiredFields: string[]
): void => {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new ValidationError(
      `다음 필드는 필수입니다: ${missingFields.join(', ')}`,
      'MISSING_REQUIRED_FIELDS'
    );
  }
};

// Authentication helper for API routes
export const requireAuth = (authHeader: string | null): string => {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('인증이 필요합니다.', 'MISSING_AUTH_TOKEN');
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    throw new AuthError('유효하지 않은 인증 토큰입니다.', 'INVALID_AUTH_TOKEN');
  }

  return token;
};

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): void => {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitMap.delete(key);
    }
  }

  const current = rateLimitMap.get(identifier);
  
  if (!current) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now });
    return;
  }

  if (current.resetTime < windowStart) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now });
    return;
  }

  if (current.count >= maxRequests) {
    throw new AppError(
      '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
      'RATE_LIMIT_EXCEEDED',
      429
    );
  }

  current.count++;
};

// Success response helper
export const successResponse = <T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> => {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
};

// Pagination helper
export const parsePaginationParams = (searchParams: URLSearchParams) => {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  return { page, limit, sortBy, sortOrder };
};

// Input sanitization helper
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};