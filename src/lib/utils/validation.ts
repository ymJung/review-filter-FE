import { ReviewFormData, RoadmapFormData, UserRole } from '@/types';

// Review validation
export const validateReview = (data: Partial<ReviewFormData>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.courseTitle?.trim()) {
    errors.push('강의명을 입력해주세요.');
  }

  if (!data.coursePlatform?.trim()) {
    errors.push('강의 플랫폼을 입력해주세요.');
  }

  if (!data.content?.trim()) {
    errors.push('리뷰 내용을 입력해주세요.');
  } else if (data.content.trim().length < 10) {
    errors.push('리뷰 내용은 최소 10자 이상 입력해주세요.');
  }

  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.push('평점을 1~5점 사이로 선택해주세요.');
  }

  if (!data.certificationImage) {
    errors.push('결제 인증 이미지를 업로드해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Roadmap validation
export const validateRoadmap = (data: Partial<RoadmapFormData>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('로드맵 제목을 입력해주세요.');
  }

  if (!data.description?.trim()) {
    errors.push('로드맵 설명을 입력해주세요.');
  } else if (data.description.trim().length < 20) {
    errors.push('로드맵 설명은 최소 20자 이상 입력해주세요.');
  }

  if (!data.courseTitle?.trim()) {
    errors.push('현재 강의명을 입력해주세요.');
  }

  if (!data.coursePlatform?.trim()) {
    errors.push('현재 강의 플랫폼을 입력해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Comment validation
export const validateComment = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!content?.trim()) {
    errors.push('댓글 내용을 입력해주세요.');
  } else if (content.trim().length < 2) {
    errors.push('댓글은 최소 2자 이상 입력해주세요.');
  } else if (content.trim().length > 500) {
    errors.push('댓글은 최대 500자까지 입력 가능합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// User role validation
export const canAccessContent = (userRole: UserRole, contentType: 'review' | 'roadmap' = 'review'): boolean => {
  switch (userRole) {
    case 'NOT_ACCESS':
    case 'LOGIN_NOT_AUTH':
      return false; // Limited access only
    case 'AUTH_LOGIN':
    case 'AUTH_PREMIUM':
    case 'ADMIN':
      return true;
    case 'BLOCKED_LOGIN':
      return false;
    default:
      return false;
  }
};

export const canCreateContent = (userRole: UserRole): boolean => {
  switch (userRole) {
    case 'NOT_ACCESS':
    case 'BLOCKED_LOGIN':
      return false;
    case 'LOGIN_NOT_AUTH':
    case 'AUTH_LOGIN':
    case 'AUTH_PREMIUM':
    case 'ADMIN':
      return true;
    default:
      return false;
  }
};

export const canModerateContent = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN';
};

export const canManageUsers = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN';
};

// Content filtering validation
export const containsInappropriateContent = (text: string): boolean => {
  const inappropriateWords = [
    // 욕설/비방 키워드 (실제 운영시에는 더 포괄적인 필터링 필요)
    '바보', '멍청', '쓰레기', '개새끼', '시발', '씨발', '병신', '미친',
    // 광고성 키워드
    '할인', '무료', '이벤트', '프로모션', '쿠폰', '링크', 'http', 'www',
    // 스팸성 키워드
    '클릭', '방문', '가입', '추천인', '초대코드'
  ];

  const lowerText = text.toLowerCase();
  return inappropriateWords.some(word => lowerText.includes(word));
};

// File validation
export const validateImageFile = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic'];

  if (!allowedTypes.includes(file.type)) {
    errors.push('JPEG, JPG, PNG, GIF, HEIC 형식의 이미지만 업로드 가능합니다.');
  }

  if (file.size > maxSize) {
    errors.push('이미지 크기는 5MB 이하여야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rating validation
export const validateRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// Search query validation
export const validateSearchQuery = (query: string): { isValid: boolean; sanitizedQuery: string } => {
  const sanitized = query.trim().replace(/[<>]/g, '');
  
  return {
    isValid: sanitized.length >= 2 && sanitized.length <= 100,
    sanitizedQuery: sanitized
  };
};

// Pagination validation
export const validatePaginationParams = (page: number, limit: number): { page: number; limit: number } => {
  const validPage = Math.max(1, Math.floor(page) || 1);
  const validLimit = Math.min(50, Math.max(1, Math.floor(limit) || 10));
  
  return { page: validPage, limit: validLimit };
};