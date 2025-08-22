import { User } from '@/types';

/**
 * Security utility functions for client-side validation
 * These should match the Firebase Security Rules logic
 */

export class SecurityValidator {
  /**
   * Check if user can read a review
   */
  static canReadReview(review: any, currentUser?: User | null): boolean {
    // Public can read approved reviews
    if (review.status === 'APPROVED') {
      return true;
    }
    
    // Owner can read their own reviews
    if (currentUser && review.userId === currentUser.id) {
      return true;
    }
    
    // Admin can read all reviews
    if (currentUser?.role === 'ADMIN') {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user can create a review
   */
  static canCreateReview(currentUser?: User | null): boolean {
    if (!currentUser) return false;
    
    // Blocked users cannot create content
    if (currentUser.role === 'BLOCKED_LOGIN') return false;
    
    // Must be authenticated
    return ['AUTH_LOGIN', 'AUTH_PREMIUM', 'ADMIN'].includes(currentUser.role);
  }

  /**
   * Check if user can update a review
   */
  static canUpdateReview(review: any, currentUser?: User | null): boolean {
    if (!currentUser) return false;
    
    // Admin can update all reviews
    if (currentUser.role === 'ADMIN') return true;
    
    // Owner can update their own pending reviews
    if (review.userId === currentUser.id && review.status === 'PENDING') {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user can delete a review
   */
  static canDeleteReview(review: any, currentUser?: User | null): boolean {
    if (!currentUser) return false;
    
    // Admin can delete all reviews
    if (currentUser.role === 'ADMIN') return true;
    
    // Owner can delete their own reviews
    if (review.userId === currentUser.id) return true;
    
    return false;
  }

  /**
   * Check if user can read a roadmap
   */
  static canReadRoadmap(roadmap: any, currentUser?: User | null): boolean {
    // Public can read approved roadmaps
    if (roadmap.status === 'APPROVED') {
      return true;
    }
    
    // Owner can read their own roadmaps
    if (currentUser && roadmap.userId === currentUser.id) {
      return true;
    }
    
    // Admin can read all roadmaps
    if (currentUser?.role === 'ADMIN') {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user can create a roadmap
   */
  static canCreateRoadmap(currentUser?: User | null): boolean {
    if (!currentUser) return false;
    
    // Blocked users cannot create content
    if (currentUser.role === 'BLOCKED_LOGIN') return false;
    
    // Must be authenticated
    return ['AUTH_LOGIN', 'AUTH_PREMIUM', 'ADMIN'].includes(currentUser.role);
  }

  /**
   * Check if user can update a roadmap
   */
  static canUpdateRoadmap(roadmap: any, currentUser?: User | null): boolean {
    if (!currentUser) return false;
    
    // Admin can update all roadmaps
    if (currentUser.role === 'ADMIN') return true;
    
    // Owner can update their own pending roadmaps
    if (roadmap.userId === currentUser.id && roadmap.status === 'PENDING') {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user can create a comment
   */
  static canCreateComment(currentUser?: User | null): boolean {
    if (!currentUser) return false;
    
    // Blocked users cannot create content
    if (currentUser.role === 'BLOCKED_LOGIN') return false;
    
    // Must be authenticated
    return ['AUTH_LOGIN', 'AUTH_PREMIUM', 'ADMIN'].includes(currentUser.role);
  }

  /**
   * Check if user can read a comment
   */
  static canReadComment(comment: any, currentUser?: User | null): boolean {
    // Public can read approved comments
    if (comment.status === 'APPROVED') {
      return true;
    }
    
    // Owner can read their own comments
    if (currentUser && comment.userId === currentUser.id) {
      return true;
    }
    
    // Admin can read all comments
    if (currentUser?.role === 'ADMIN') {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user can access admin features
   */
  static canAccessAdmin(currentUser?: User | null): boolean {
    return currentUser?.role === 'ADMIN';
  }

  /**
   * Check if user can moderate content
   */
  static canModerateContent(currentUser?: User | null): boolean {
    return currentUser?.role === 'ADMIN';
  }

  /**
   * Check if user can manage other users
   */
  static canManageUsers(currentUser?: User | null): boolean {
    return currentUser?.role === 'ADMIN';
  }

  /**
   * Check if user can view full content (not restricted)
   */
  static canViewFullContent(currentUser?: User | null): boolean {
    if (!currentUser) return false;
    
    return ['AUTH_LOGIN', 'AUTH_PREMIUM', 'ADMIN'].includes(currentUser.role);
  }

  /**
   * Check if user can upload files
   */
  static canUploadFiles(currentUser?: User | null): boolean {
    if (!currentUser) return false;
    
    // Blocked users cannot upload files
    if (currentUser.role === 'BLOCKED_LOGIN') return false;
    
    return true;
  }

  /**
   * Validate file upload constraints
   */
  static validateFileUpload(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: '지원되지 않는 파일 형식입니다. JPEG, PNG, GIF, HEIC 파일만 업로드 가능합니다.'
      };
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: '파일 크기가 너무 큽니다. 5MB 이하의 파일만 업로드 가능합니다.'
      };
    }
    
    return { valid: true };
  }

  /**
   * Check if user is blocked
   */
  static isUserBlocked(currentUser?: User | null): boolean {
    return currentUser?.role === 'BLOCKED_LOGIN';
  }

  /**
   * Check if user has premium access
   */
  static hasPremiumAccess(currentUser?: User | null): boolean {
    return currentUser?.role === 'AUTH_PREMIUM' || currentUser?.role === 'ADMIN';
  }

  /**
   * Get user access level for content
   */
  static getUserAccessLevel(currentUser?: User | null): 'none' | 'limited' | 'full' | 'admin' {
    if (!currentUser) return 'none';
    
    switch (currentUser.role) {
      case 'BLOCKED_LOGIN':
        return 'none';
      case 'LOGIN_NOT_AUTH':
        return 'limited';
      case 'AUTH_LOGIN':
      case 'AUTH_PREMIUM':
        return 'full';
      case 'ADMIN':
        return 'admin';
      default:
        return 'none';
    }
  }
}