/**
 * Analytics and monitoring utilities
 */

// Google Analytics 4 configuration
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    // Load gtag script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.gtag = window.gtag || function() {
      (window.gtag.q = window.gtag.q || []).push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title,
    });
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track user interactions
export const trackUserAction = (action: string, details?: Record<string, any>) => {
  trackEvent(action, 'user_interaction', JSON.stringify(details));
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('User Action:', action, details);
  }
};

// Track errors
export const trackError = (error: Error, context?: string) => {
  trackEvent('error', 'javascript_error', `${context}: ${error.message}`);
  
  // Log to console
  console.error('Tracked Error:', error, context);
};

// Track performance metrics
export const trackPerformance = (metric: string, value: number, unit: string = 'ms') => {
  trackEvent('performance', metric, `${value}${unit}`, value);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance Metric:', metric, value, unit);
  }
};

// Track business metrics
export const trackBusinessMetric = (metric: string, value: number, category: string = 'business') => {
  trackEvent(metric, category, undefined, value);
};

// Common tracking functions for the app
export const analytics = {
  // User actions
  userLogin: (provider: string) => trackUserAction('login', { provider }),
  userLogout: () => trackUserAction('logout'),
  userSignup: (provider: string) => trackUserAction('signup', { provider }),
  
  // Content actions
  reviewCreate: (courseId: string) => trackUserAction('review_create', { courseId }),
  reviewView: (reviewId: string) => trackUserAction('review_view', { reviewId }),
  reviewLike: (reviewId: string) => trackUserAction('review_like', { reviewId }),
  
  roadmapCreate: (title: string) => trackUserAction('roadmap_create', { title }),
  roadmapView: (roadmapId: string) => trackUserAction('roadmap_view', { roadmapId }),
  
  commentCreate: (reviewId: string) => trackUserAction('comment_create', { reviewId }),
  
  // Search and discovery
  search: (query: string, category?: string) => trackUserAction('search', { query, category }),
  filterApply: (filters: Record<string, any>) => trackUserAction('filter_apply', filters),
  
  // Admin actions
  adminReviewApprove: (reviewId: string) => trackUserAction('admin_review_approve', { reviewId }),
  adminReviewReject: (reviewId: string) => trackUserAction('admin_review_reject', { reviewId }),
  adminUserBlock: (userId: string) => trackUserAction('admin_user_block', { userId }),
  
  // Performance tracking
  pageLoad: (page: string, loadTime: number) => trackPerformance(`page_load_${page}`, loadTime),
  apiCall: (endpoint: string, duration: number) => trackPerformance(`api_${endpoint}`, duration),
  imageLoad: (size: number, duration: number) => trackPerformance('image_load', duration),
  
  // Business metrics
  dailyActiveUsers: (count: number) => trackBusinessMetric('daily_active_users', count),
  reviewsCreated: (count: number) => trackBusinessMetric('reviews_created', count),
  conversionRate: (rate: number) => trackBusinessMetric('conversion_rate', rate),
};

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: {
      (...args: any[]): void;
      q?: any[];
    };
  }
}