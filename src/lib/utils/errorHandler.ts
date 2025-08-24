import { FirebaseError } from 'firebase/app';
import { 
  AppError, 
  AuthError, 
  ValidationError, 
  NotFoundError, 
  PermissionError 
} from '@/types';
import { getFirebaseErrorMessage, isFirebaseError } from '@/lib/firebase/errors';

// Error types for better categorization
export type ErrorCategory = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'not_found'
  | 'server'
  | 'client'
  | 'unknown';

export interface ProcessedError {
  message: string;
  category: ErrorCategory;
  code: string;
  statusCode: number;
  isRetryable: boolean;
  userMessage: string;
  technicalMessage: string;
}

// Network error detection
const isNetworkError = (error: any): boolean => {
  return (
    error.name === 'NetworkError' ||
    error.code === 'NETWORK_ERROR' ||
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    !navigator.onLine
  );
};

// Timeout error detection
const isTimeoutError = (error: any): boolean => {
  return (
    error.name === 'TimeoutError' ||
    error.code === 'TIMEOUT' ||
    error.message?.includes('timeout')
  );
};

// Process different types of errors into a standardized format
export const processError = (error: unknown): ProcessedError => {
  // Handle Firebase errors
  if (isFirebaseError(error)) {
    return processFirebaseError(error);
  }

  // Handle custom app errors - check if it's an AppError first, then use name property
  if (error instanceof AppError) {
    return processAppError(error);
  }

  // Handle network errors
  if (isNetworkError(error)) {
    return {
      message: '네트워크 연결을 확인해주세요.',
      category: 'network',
      code: 'NETWORK_ERROR',
      statusCode: 0,
      isRetryable: true,
      userMessage: '인터넷 연결을 확인하고 다시 시도해주세요.',
      technicalMessage: error instanceof Error ? error.message : 'Network error occurred'
    };
  }

  // Handle timeout errors
  if (isTimeoutError(error)) {
    return {
      message: '요청 시간이 초과되었습니다.',
      category: 'network',
      code: 'TIMEOUT',
      statusCode: 408,
      isRetryable: true,
      userMessage: '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
      technicalMessage: error instanceof Error ? error.message : 'Request timeout'
    };
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return {
      message: error.message,
      category: 'client',
      code: 'CLIENT_ERROR',
      statusCode: 400,
      isRetryable: false,
      userMessage: '오류가 발생했습니다. 페이지를 새로고침해주세요.',
      technicalMessage: error.message
    };
  }

  // Handle unknown errors
  return {
    message: '알 수 없는 오류가 발생했습니다.',
    category: 'unknown',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    isRetryable: false,
    userMessage: '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    technicalMessage: String(error)
  };
};

// Process Firebase-specific errors
const processFirebaseError = (error: FirebaseError): ProcessedError => {
  const userMessage = getFirebaseErrorMessage(error);
  let category: ErrorCategory = 'server';
  let statusCode = 500;
  let isRetryable = false;

  // Categorize Firebase errors
  if (error.code.startsWith('auth/')) {
    category = 'authentication';
    statusCode = 401;
    
    if (error.code === 'auth/network-request-failed') {
      category = 'network';
      statusCode = 0;
      isRetryable = true;
    }
  } else if (error.code === 'permission-denied') {
    category = 'authorization';
    statusCode = 403;
  } else if (error.code === 'not-found') {
    category = 'not_found';
    statusCode = 404;
  } else if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
    category = 'network';
    isRetryable = true;
  }

  return {
    message: userMessage,
    category,
    code: error.code,
    statusCode,
    isRetryable,
    userMessage,
    technicalMessage: error.message
  };
};

// Process custom app errors
const processAppError = (error: AppError): ProcessedError => {
  let category: ErrorCategory = 'server';

  // Use both the name property and constructor name to determine the error type
  const errorType = error.name || error.constructor.name;
  
  switch (errorType) {
    case 'AuthError':
      category = 'authentication';
      break;
    case 'PermissionError':
      category = 'authorization';
      break;
    case 'ValidationError':
      category = 'validation';
      break;
    case 'NotFoundError':
      category = 'not_found';
      break;
    default:
      category = 'server';
  }

  return {
    message: error.message,
    category,
    code: error.code,
    statusCode: error.statusCode,
    isRetryable: false,
    userMessage: error.message,
    technicalMessage: error.message
  };
};

// API response error handler
export const handleApiError = async (response: Response): Promise<never> => {
  let errorData: any = {};
  
  try {
    errorData = await response.json();
  } catch {
    // If response is not JSON, create a generic error
    errorData = {
      error: {
        code: `HTTP_${response.status}`,
        message: response.statusText || 'Unknown error occurred'
      }
    };
  }

  const error = errorData.error || {};
  const message = error.message || `HTTP ${response.status} Error`;
  const code = error.code || `HTTP_${response.status}`;

  // Create appropriate error type based on status code
  if (response.status === 401) {
    throw new AuthError(message, code);
  } else if (response.status === 403) {
    throw new PermissionError(message, code);
  } else if (response.status === 404) {
    throw new NotFoundError(message, code);
  } else if (response.status >= 400 && response.status < 500) {
    throw new ValidationError(message, code);
  } else {
    throw new AppError(message, code, response.status);
  }
};

// Retry logic with exponential backoff
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  shouldRetry?: (error: ProcessedError) => boolean
): Promise<T> => {
  let lastError: ProcessedError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const processedError = processError(error);
      lastError = processedError;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      const isRetryable = shouldRetry 
        ? shouldRetry(processedError)
        : processedError.isRetryable;

      if (!isRetryable) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Re-throw the last error
  if (lastError) {
    throw new AppError(
      lastError.userMessage,
      lastError.code,
      lastError.statusCode
    );
  }

  // This should never happen, but just in case
  throw new AppError(
    '알 수 없는 오류가 발생했습니다.',
    'UNKNOWN_ERROR',
    500
  );
};

// Enhanced fetch wrapper with error handling
export const fetchWithErrorHandling = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response;
  } catch (error) {
    // Re-throw processed error
    const processedError = processError(error);
    throw new AppError(
      processedError.userMessage,
      processedError.code,
      processedError.statusCode
    );
  }
};

// Error logging utility
export const logError = (
  error: unknown,
  context?: string,
  additionalData?: Record<string, any>
) => {
  const processedError = processError(error);
  
  const logData = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: processedError.message,
      category: processedError.category,
      code: processedError.code,
      statusCode: processedError.statusCode,
      technical: processedError.technicalMessage,
    },
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    ...additionalData,
  };

  // Always log to console in test and development environments
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error logged:', logData);
  }

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or your own logging endpoint
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // sendToErrorTrackingService(logData);
  }
};

// User-friendly error messages for common scenarios
export const getErrorMessage = (error: unknown, context?: string): string => {
  const processedError = processError(error);
  
  // Provide context-specific messages
  if (context === 'login') {
    if (processedError.category === 'network') {
      return '로그인 중 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
    }
    if (processedError.category === 'authentication') {
      return '로그인에 실패했습니다. 다시 시도해주세요.';
    }
    // Return context-specific message for login context
    return '로그인에 실패했습니다. 다시 시도해주세요.';
  }
  
  if (context === 'upload') {
    if (processedError.category === 'network') {
      return '파일 업로드 중 네트워크 오류가 발생했습니다.';
    }
    if (processedError.category === 'validation') {
      return '업로드할 수 없는 파일 형식입니다.';
    }
    // Return context-specific message for upload context
    return '업로드할 수 없는 파일 형식입니다.';
  }
  
  // Return generic message if no context-specific message found
  if (!context) {
    return '오류가 발생했습니다. 페이지를 새로고침해주세요.';
  }
  
  return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
};