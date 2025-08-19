'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { 
  getFeatureFlags, 
  getContentVisibilityRules,
  getUserAccessLevel,
  ContentAccessLevel 
} from '@/lib/services/accessControlService';
import { UserRole } from '@/types';

export const usePermissions = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const userRole = user?.role;
  
  const featureFlags = getFeatureFlags(userRole);
  const visibilityRules = getContentVisibilityRules(userRole);
  const accessLevel = getUserAccessLevel(userRole);

  return {
    // User info
    user,
    userRole,
    isAuthenticated,
    isAdmin,
    accessLevel,

    // Content access permissions
    canViewAllReviews: featureFlags.fullReviewAccess,
    canViewAllRoadmaps: featureFlags.fullRoadmapAccess,
    canViewComments: featureFlags.commentAccess,

    // Creation permissions
    canCreateReviews: featureFlags.canCreateReviews,
    canCreateRoadmaps: featureFlags.canCreateRoadmaps,
    canCreateComments: featureFlags.canCreateComments,

    // Premium features
    isAdFree: featureFlags.adFree,
    hasPrioritySupport: featureFlags.prioritySupport,
    hasAdvancedFilters: featureFlags.advancedFilters,

    // Admin features
    canModerate: featureFlags.moderationAccess,
    canManageUsers: featureFlags.userManagement,
    canViewAnalytics: featureFlags.analytics,

    // UI features
    shouldShowUpgradePrompts: featureFlags.showUpgradePrompts,
    shouldShowLoginPrompts: featureFlags.showLoginPrompts,
    shouldShowAds: visibilityRules.showAds,

    // Content limits
    maxReviewsVisible: visibilityRules.maxReviewsVisible,
    maxRoadmapsVisible: visibilityRules.maxRoadmapsVisible,
    upgradeMessage: visibilityRules.upgradeMessage,

    // Visibility rules
    visibilityRules,
    featureFlags,
  };
};

// Specific permission hooks for common use cases
export const useContentAccess = () => {
  const permissions = usePermissions();
  
  return {
    canAccessReviews: permissions.canViewAllReviews,
    canAccessRoadmaps: permissions.canViewAllRoadmaps,
    canAccessComments: permissions.canViewComments,
    hasLimitedAccess: permissions.accessLevel === ContentAccessLevel.LIMITED,
    hasFullAccess: permissions.accessLevel === ContentAccessLevel.FULL || permissions.accessLevel === ContentAccessLevel.PREMIUM,
    isPremium: permissions.accessLevel === ContentAccessLevel.PREMIUM,
  };
};

export const useCreationPermissions = () => {
  const permissions = usePermissions();
  
  return {
    canCreateReviews: permissions.canCreateReviews,
    canCreateRoadmaps: permissions.canCreateRoadmaps,
    canCreateComments: permissions.canCreateComments,
    needsAuth: !permissions.isAuthenticated,
    needsUpgrade: permissions.shouldShowUpgradePrompts,
  };
};

export const useAdminPermissions = () => {
  const permissions = usePermissions();
  
  return {
    isAdmin: permissions.isAdmin,
    canModerate: permissions.canModerate,
    canManageUsers: permissions.canManageUsers,
    canViewAnalytics: permissions.canViewAnalytics,
  };
};

export const useUIPermissions = () => {
  const permissions = usePermissions();
  
  return {
    showAds: permissions.shouldShowAds,
    showUpgradePrompts: permissions.shouldShowUpgradePrompts,
    showLoginPrompts: permissions.shouldShowLoginPrompts,
    isAdFree: permissions.isAdFree,
    upgradeMessage: permissions.upgradeMessage,
  };
};