// App constants
export const APP_NAME = 'Review Filter';
export const APP_DESCRIPTION = '강의 후기를 모으는 플랫폼';

// API endpoints
export const API_ENDPOINTS = {
  REVIEWS: '/api/reviews',
  ROADMAPS: '/api/roadmaps',
  USERS: '/api/users',
  ADMIN: '/api/admin',
  UPLOAD: '/api/upload',
  SUMMARY: '/api/summary',
  AUTH: '/api/auth',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  REVIEWS: '/reviews',
  ROADMAPS: '/roadmaps',
  WRITE_REVIEW: '/write/review',
  WRITE_ROADMAP: '/write/roadmap',
  MYPAGE: '/mypage',
  LOGIN: '/login',
  ADMIN: '/admin',
} as const;

// User roles
export const USER_ROLES = {
  NOT_ACCESS: 'NOT_ACCESS',
  LOGIN_NOT_AUTH: 'LOGIN_NOT_AUTH',
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_PREMIUM: 'AUTH_PREMIUM',
  BLOCKED_LOGIN: 'BLOCKED_LOGIN',
  ADMIN: 'ADMIN',
} as const;

// Content status
export const CONTENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

// Social providers
export const SOCIAL_PROVIDERS = {
  KAKAO: 'kakao',
  NAVER: 'naver',
} as const;

// File constraints
export const FILE_CONSTRAINTS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic'],
  MAX_IMAGES_PER_REVIEW: 3,
} as const;

// Content constraints
export const CONTENT_CONSTRAINTS = {
  MIN_REVIEW_LENGTH: 10,
  MAX_REVIEW_LENGTH: 2000,
  MIN_ROADMAP_DESCRIPTION_LENGTH: 20,
  MAX_ROADMAP_DESCRIPTION_LENGTH: 1000,
  MIN_COMMENT_LENGTH: 2,
  MAX_COMMENT_LENGTH: 500,
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_SEARCH_QUERY_LENGTH: 100,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  DEFAULT_PAGE: 1,
} as const;

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
  REVIEW_SUMMARY: 24 * 60 * 60 * 1000, // 24 hours
  CATEGORY_STATS: 60 * 60 * 1000, // 1 hour
  USER_STATS: 30 * 60 * 1000, // 30 minutes
} as const;

// Rating
export const RATING = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 3,
} as const;

// Categories (can be extended)
export const CATEGORIES = [
  '프로그래밍',
  '디자인',
  '마케팅',
  '비즈니스',
  '언어',
  '음악',
  '사진/영상',
  '요리',
  '건강/피트니스',
  '기타',
] as const;

// Platforms (can be extended)
export const PLATFORMS = [
  '인프런',
  '유데미',
  '패스트캠퍼스',
  '코드잇',
  '프로그래머스',
  '노마드코더',
  '드림코딩',
  '생활코딩',
  '기타',
] as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다.',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
  CONTENT_INAPPROPRIATE: '부적절한 내용이 포함되어 있습니다.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  REVIEW_CREATED: '리뷰가 성공적으로 작성되었습니다. 검수 후 공개됩니다.',
  ROADMAP_CREATED: '로드맵이 성공적으로 작성되었습니다. 검수 후 공개됩니다.',
  COMMENT_CREATED: '댓글이 성공적으로 작성되었습니다.',
  PROFILE_UPDATED: '프로필이 성공적으로 업데이트되었습니다.',
  LOGIN_SUCCESS: '로그인되었습니다.',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  DRAFT_REVIEW: 'draft_review',
  DRAFT_ROADMAP: 'draft_roadmap',
  SEARCH_HISTORY: 'search_history',
} as const;

// Theme
export const THEME = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#64748B',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4',
  },
} as const;

// Animation durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// OpenAI settings
export const OPENAI_SETTINGS = {
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 150,
  TEMPERATURE: 0.7,
  SUMMARY_PROMPT: '다음 리뷰들을 한국어로 간단히 요약해주세요. 주요 장점과 단점을 포함하여 2-3문장으로 정리해주세요:',
} as const;