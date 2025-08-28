import { FirebaseError } from 'firebase/app';
import { AuthError, AppError } from '@/types';

// Firebase Auth error codes mapping
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': '사용자를 찾을 수 없습니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
  'auth/weak-password': '비밀번호가 너무 약합니다.',
  'auth/invalid-email': '유효하지 않은 이메일 주소입니다.',
  'auth/user-disabled': '비활성화된 계정입니다.',
  'auth/too-many-requests': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  'auth/network-request-failed': '네트워크 오류가 발생했습니다.',
  'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
  'auth/cancelled-popup-request': '로그인 요청이 취소되었습니다.',
  'auth/popup-blocked': '팝업이 차단되었습니다. 팝업을 허용해주세요.',
  'auth/invalid-credential': '인증 정보가 유효하지 않습니다.',
  'auth/account-exists-with-different-credential': '다른 로그인 방식으로 가입된 계정입니다.',
};

// Firestore error codes mapping
const FIRESTORE_ERROR_MESSAGES: Record<string, string> = {
  'permission-denied': '접근 권한이 없습니다.',
  'not-found': '요청한 문서를 찾을 수 없습니다.',
  'already-exists': '이미 존재하는 문서입니다.',
  'resource-exhausted': '할당량을 초과했습니다.',
  'failed-precondition': '작업 조건이 충족되지 않았습니다.',
  'aborted': '작업이 중단되었습니다.',
  'out-of-range': '유효하지 않은 범위입니다.',
  'unimplemented': '구현되지 않은 기능입니다.',
  'internal': '내부 서버 오류가 발생했습니다.',
  'unavailable': '서비스를 일시적으로 사용할 수 없습니다.',
  'data-loss': '데이터 손실이 발생했습니다.',
  'unauthenticated': '인증이 필요합니다.',
  'invalid-argument': '유효하지 않은 인수입니다.',
  'deadline-exceeded': '요청 시간이 초과되었습니다.',
  'cancelled': '작업이 취소되었습니다.',
};

// Storage error codes mapping
const STORAGE_ERROR_MESSAGES: Record<string, string> = {
  'storage/unknown': '알 수 없는 스토리지 오류가 발생했습니다.',
  'storage/object-not-found': '파일을 찾을 수 없습니다.',
  'storage/bucket-not-found': '스토리지 버킷을 찾을 수 없습니다.',
  'storage/project-not-found': '프로젝트를 찾을 수 없습니다.',
  'storage/quota-exceeded': '스토리지 할당량을 초과했습니다.',
  'storage/unauthenticated': '스토리지 접근 권한이 없습니다.',
  'storage/unauthorized': '스토리지 사용 권한이 없습니다.',
  'storage/retry-limit-exceeded': '재시도 한도를 초과했습니다.',
  'storage/invalid-checksum': '파일 체크섬이 유효하지 않습니다.',
  'storage/canceled': '업로드가 취소되었습니다.',
  'storage/invalid-event-name': '유효하지 않은 이벤트 이름입니다.',
  'storage/invalid-url': '유효하지 않은 URL입니다.',
  'storage/invalid-argument': '유효하지 않은 인수입니다.',
  'storage/no-default-bucket': '기본 스토리지 버킷이 설정되지 않았습니다.',
  'storage/cannot-slice-blob': '파일을 분할할 수 없습니다.',
  'storage/server-file-wrong-size': '서버의 파일 크기가 일치하지 않습니다.',
};

// Convert Firebase error to user-friendly message
export const getFirebaseErrorMessage = (error: FirebaseError): string => {
  const { code } = error;

  // Check auth errors
  if (AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  // Check Firestore errors
  if (FIRESTORE_ERROR_MESSAGES[code]) {
    return FIRESTORE_ERROR_MESSAGES[code];
  }

  // Check Storage errors
  if (STORAGE_ERROR_MESSAGES[code]) {
    return STORAGE_ERROR_MESSAGES[code];
  }

  // Default message
  return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
};

// Convert Firebase error to AppError
export const convertFirebaseError = (error: FirebaseError): AppError => {
  const message = getFirebaseErrorMessage(error);

  // Determine status code based on error type
  let statusCode = 500;

  if (error.code.startsWith('auth/')) {
    if (error.code === 'auth/unauthenticated') {
      statusCode = 401;
    } else if (error.code === 'auth/permission-denied') {
      statusCode = 403;
    } else if (error.code === 'auth/not-found') {
      statusCode = 404;
    } else {
      statusCode = 400;
    }
  } else if (error.code === 'permission-denied') {
    statusCode = 403;
  } else if (error.code === 'not-found') {
    statusCode = 404;
  } else if (error.code === 'unauthenticated') {
    statusCode = 401;
  } else if (error.code === 'invalid-argument') {
    statusCode = 400;
  }

  return new AppError(message, error.code, statusCode);
};

// Handle Firebase Auth errors specifically
export const handleAuthError = (error: FirebaseError): AuthError => {
  const message = getFirebaseErrorMessage(error);
  return new AuthError(message, error.code);
};

// Check if error is a Firebase error
export const isFirebaseError = (error: any): error is FirebaseError => {
  return error &&
    error.constructor?.name === 'FirebaseError' &&
    typeof error.code === 'string' &&
    typeof error.message === 'string';
};

// Log Firebase errors for debugging
export const logFirebaseError = (error: FirebaseError, context?: string): void => {
  console.error('Firebase Error:', {
    code: error.code,
    message: error.message,
    context,
    stack: error.stack,
  });
};

// Retry logic for transient Firebase errors
export const isRetryableError = (error: FirebaseError): boolean => {
  const retryableCodes = [
    'unavailable',
    'deadline-exceeded',
    'internal',
    'auth/network-request-failed',
    'storage/retry-limit-exceeded',
  ];

  return retryableCodes.includes(error.code);
};

// Exponential backoff retry utility
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      if (isFirebaseError(error) && !isRetryableError(error)) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};