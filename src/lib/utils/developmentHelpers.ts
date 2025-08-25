/**
 * Development helpers for better error handling and debugging
 */

export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log errors only in development mode
 */
export const devLog = {
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[DEV ERROR] ${message}`, error);
    }
  },
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[DEV WARN] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.info(`[DEV INFO] ${message}`, data);
    }
  }
};

/**
 * Handle Firebase permission errors gracefully
 */
export const handleFirebaseError = (error: any): {
  shouldShowError: boolean;
  userMessage: string;
  logMessage: string;
} => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  // Permission denied errors
  if (errorMessage.includes('permission-denied') || 
      errorMessage.includes('Missing or insufficient permissions')) {
    return {
      shouldShowError: false, // Don't show to user in development
      userMessage: '데이터를 불러올 수 없습니다.',
      logMessage: 'Firebase permission denied - check security rules'
    };
  }
  
  // Not found errors
  if (errorMessage.includes('not-found') || 
      errorMessage.includes('document does not exist')) {
    return {
      shouldShowError: false,
      userMessage: '데이터를 찾을 수 없습니다.',
      logMessage: 'Firebase document not found'
    };
  }
  
  // Network errors
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch')) {
    return {
      shouldShowError: true,
      userMessage: '네트워크 연결을 확인해주세요.',
      logMessage: 'Network error occurred'
    };
  }
  
  // Default error handling
  return {
    shouldShowError: isDevelopment, // Only show in development
    userMessage: '일시적인 오류가 발생했습니다.',
    logMessage: errorMessage
  };
};

/**
 * Create a safe async wrapper that handles errors gracefully
 */
export const safeAsync = <T>(
  asyncFn: () => Promise<T>,
  fallbackValue: T,
  errorContext: string
) => {
  return async (): Promise<T> => {
    try {
      return await asyncFn();
    } catch (error) {
      const { shouldShowError, userMessage, logMessage } = handleFirebaseError(error);
      
      devLog.error(`${errorContext}: ${logMessage}`, error);
      
      if (shouldShowError) {
        throw new Error(userMessage);
      }
      
      return fallbackValue;
    }
  };
};

/**
 * Mock data for development when Firebase is not available
 */
export const mockData = {
  reviews: [],
  summaries: [],
  categoryStats: [],
  courses: [],
  roadmaps: [],
  users: []
};