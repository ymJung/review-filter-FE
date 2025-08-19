import { UserRole, Review, Roadmap, Comment } from '@/types';
import { USER_ROLES } from '@/lib/constants';

// Content access levels
export enum ContentAccessLevel {
  NONE = 'NONE',
  LIMITED = 'LIMITED',
  FULL = 'FULL',
  PREMIUM = 'PREMIUM',
}

// Get user's content access level
export const getUserAccessLevel = (userRole?: UserRole): ContentAccessLevel => {
  switch (userRole) {
    case USER_ROLES.NOT_ACCESS:
    case USER_ROLES.BLOCKED_LOGIN:
      return ContentAccessLevel.NONE;
    
    case USER_ROLES.LOGIN_NOT_AUTH:
      return ContentAccessLevel.LIMITED;
    
    case USER_ROLES.AUTH_LOGIN:
      return ContentAccessLevel.FULL;
    
    case USER_ROLES.AUTH_PREMIUM:
    case USER_ROLES.ADMIN:
      return ContentAccessLevel.PREMIUM;
    
    default:
      return ContentAccessLevel.NONE;
  }
};

// Check if user can access specific content
export const canAccessContent = (
  userRole?: UserRole,
  contentType: 'review' | 'roadmap' | 'comment' = 'review'
): boolean => {
  const accessLevel = getUserAccessLevel(userRole);
  
  switch (contentType) {
    case 'review':
    case 'roadmap':
      return accessLevel !== ContentAccessLevel.NONE;
    
    case 'comment':
      return accessLevel === ContentAccessLevel.FULL || accessLevel === ContentAccessLevel.PREMIUM;
    
    default:
      return false;
  }
};

// Check if user can create content
export const canCreateContent = (userRole?: UserRole): boolean => {
  const accessLevel = getUserAccessLevel(userRole);
  return accessLevel !== ContentAccessLevel.NONE;
};

// Check if user can moderate content
export const canModerateContent = (userRole?: UserRole): boolean => {
  return userRole === USER_ROLES.ADMIN;
};

// Filter reviews based on user access level
export const filterReviewsForUser = (
  reviews: Review[],
  userRole?: UserRole,
  userId?: string
): Review[] => {
  const accessLevel = getUserAccessLevel(userRole);
  
  switch (accessLevel) {
    case ContentAccessLevel.NONE:
      // Show only the first approved review
      return reviews.filter(review => review.status === 'APPROVED').slice(0, 1);
    
    case ContentAccessLevel.LIMITED:
      // Show only the first approved review
      return reviews.filter(review => review.status === 'APPROVED').slice(0, 1);
    
    case ContentAccessLevel.FULL:
    case ContentAccessLevel.PREMIUM:
      // Show all approved reviews + user's own reviews
      return reviews.filter(review => 
        review.status === 'APPROVED' || review.userId === userId
      );
    
    default:
      return [];
  }
};

// Filter roadmaps based on user access level
export const filterRoadmapsForUser = (
  roadmaps: Roadmap[],
  userRole?: UserRole,
  userId?: string
): Roadmap[] => {
  const accessLevel = getUserAccessLevel(userRole);
  
  switch (accessLevel) {
    case ContentAccessLevel.NONE:
      return [];
    
    case ContentAccessLevel.LIMITED:
      // Show limited roadmaps
      return roadmaps.filter(roadmap => roadmap.status === 'APPROVED').slice(0, 3);
    
    case ContentAccessLevel.FULL:
    case ContentAccessLevel.PREMIUM:
      // Show all approved roadmaps + user's own roadmaps
      return roadmaps.filter(roadmap => 
        roadmap.status === 'APPROVED' || roadmap.authorId === userId
      );
    
    default:
      return [];
  }
};

// Get content preview for limited access users
export const getContentPreview = (
  content: string,
  userRole?: UserRole,
  maxLength: number = 200
): { content: string; isPreview: boolean } => {
  const accessLevel = getUserAccessLevel(userRole);
  
  if (accessLevel === ContentAccessLevel.FULL || accessLevel === ContentAccessLevel.PREMIUM) {
    return { content, isPreview: false };
  }
  
  if (content.length <= maxLength) {
    return { content, isPreview: false };
  }
  
  return {
    content: content.substring(0, maxLength) + '...',
    isPreview: true,
  };
};

// Check if user should see ads
export const shouldShowAds = (userRole?: UserRole): boolean => {
  const accessLevel = getUserAccessLevel(userRole);
  return accessLevel !== ContentAccessLevel.PREMIUM;
};

// Get upgrade message for users
export const getUpgradeMessage = (userRole?: UserRole): string | null => {
  const accessLevel = getUserAccessLevel(userRole);
  
  switch (accessLevel) {
    case ContentAccessLevel.NONE:
      return '로그인하여 더 많은 콘텐츠를 확인하세요.';
    
    case ContentAccessLevel.LIMITED:
      return '리뷰를 작성하여 모든 콘텐츠에 접근하세요.';
    
    case ContentAccessLevel.FULL:
      return '프리미엄으로 업그레이드하여 광고 없는 경험을 즐기세요.';
    
    default:
      return null;
  }
};

// Content visibility rules
export const getContentVisibilityRules = (userRole?: UserRole) => {
  const accessLevel = getUserAccessLevel(userRole);
  
  return {
    canViewAllReviews: accessLevel === ContentAccessLevel.FULL || accessLevel === ContentAccessLevel.PREMIUM,
    canViewAllRoadmaps: accessLevel === ContentAccessLevel.FULL || accessLevel === ContentAccessLevel.PREMIUM,
    canCreateReviews: canCreateContent(userRole),
    canCreateRoadmaps: canCreateContent(userRole),
    canCreateComments: accessLevel === ContentAccessLevel.FULL || accessLevel === ContentAccessLevel.PREMIUM,
    canModerate: canModerateContent(userRole),
    showAds: shouldShowAds(userRole),
    maxReviewsVisible: accessLevel === ContentAccessLevel.LIMITED ? 1 : Infinity,
    maxRoadmapsVisible: accessLevel === ContentAccessLevel.LIMITED ? 3 : Infinity,
    upgradeMessage: getUpgradeMessage(userRole),
  };
};

// Role-based feature flags
export const getFeatureFlags = (userRole?: UserRole) => {
  const accessLevel = getUserAccessLevel(userRole);
  
  return {
    // Content access
    fullReviewAccess: accessLevel === ContentAccessLevel.FULL || accessLevel === ContentAccessLevel.PREMIUM,
    fullRoadmapAccess: accessLevel === ContentAccessLevel.FULL || accessLevel === ContentAccessLevel.PREMIUM,
    commentAccess: accessLevel === ContentAccessLevel.FULL || accessLevel === ContentAccessLevel.PREMIUM,
    
    // Creation permissions
    canCreateReviews: canCreateContent(userRole),
    canCreateRoadmaps: canCreateContent(userRole),
    canCreateComments: accessLevel === ContentAccessLevel.FULL || accessLevel === ContentAccessLevel.PREMIUM,
    
    // Premium features
    adFree: accessLevel === ContentAccessLevel.PREMIUM,
    prioritySupport: accessLevel === ContentAccessLevel.PREMIUM,
    advancedFilters: accessLevel === ContentAccessLevel.PREMIUM,
    
    // Admin features
    moderationAccess: canModerateContent(userRole),
    userManagement: canModerateContent(userRole),
    analytics: canModerateContent(userRole),
    
    // UI features
    showUpgradePrompts: accessLevel !== ContentAccessLevel.PREMIUM && userRole !== USER_ROLES.ADMIN,
    showLoginPrompts: !userRole || userRole === USER_ROLES.NOT_ACCESS,
  };
};