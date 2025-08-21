// User Types
export type UserRole = 
  | 'NOT_ACCESS' 
  | 'LOGIN_NOT_AUTH' 
  | 'AUTH_LOGIN' 
  | 'AUTH_PREMIUM' 
  | 'BLOCKED_LOGIN' 
  | 'ADMIN';

export type SocialProvider = 'google' | 'kakao' | 'naver';

export interface User {
  id: string;
  socialProvider: SocialProvider;
  socialId: string;
  nickname: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Course Types
export interface Course {
  id: string;
  platform: string;
  title: string;
  instructor?: string;
  category?: string;
  viewCount: number;
  createdAt: Date;
}

// Review Types
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  content: string;
  rating: number;
  status: ReviewStatus;
  studyPeriod?: Date;
  positivePoints?: string;
  negativePoints?: string;
  changes?: string;
  recommendedFor?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Review Image Types
export interface ReviewImage {
  id: string;
  reviewId: string;
  storageUrl: string;
  createdAt: Date;
}

// Comment Types
export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Comment {
  id: string;
  reviewId: string;
  userId: string;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Roadmap Types
export type RoadmapStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  authorId: string;
  courseId: string;
  nextCourseId?: string;
  status: RoadmapStatus;
  createdAt: Date;
}

// Review Summary Types (for AI cache)
export interface ReviewSummary {
  id: string;
  summary: string;
  reviewIds: string[];
  createdAt: Date;
  expiresAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Form Types
export interface ReviewFormData {
  courseTitle: string;
  coursePlatform: string;
  courseInstructor?: string;
  courseCategory?: string;
  content: string;
  rating: number;
  studyPeriod?: string;
  positivePoints?: string;
  negativePoints?: string;
  changes?: string;
  recommendedFor?: string;
  certificationImage: File | null;
}

export interface RoadmapFormData {
  title: string;
  description: string;
  courseTitle: string;
  coursePlatform: string;
  nextCourseTitle?: string;
  nextCoursePlatform?: string;
}

// Auth Types
export interface AuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  providerId: string;
}

// Firebase Types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter Types
export interface ReviewFilters {
  category?: string;
  platform?: string;
  rating?: number;
  status?: ReviewStatus;
  userId?: string;
}

export interface RoadmapFilters {
  category?: string;
  authorId?: string;
  status?: RoadmapStatus;
}

// Statistics Types
export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
}

export interface UserStats {
  reviewCount: number;
  roadmapCount: number;
  role: UserRole;
  joinDate: Date;
}

// Error Types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message, code, 401);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, code, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: string = 'NOT_FOUND') {
    super(message, code, 404);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string, code: string = 'PERMISSION_DENIED') {
    super(message, code, 403);
    this.name = 'PermissionError';
  }
}