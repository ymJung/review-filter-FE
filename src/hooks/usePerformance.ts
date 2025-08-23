'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  performanceMonitor, 
  getMemoryUsage, 
  getConnectionInfo,
  getPerformanceRecommendations,
  WebVitalsMetrics 
} from '@/lib/utils/performance';
import { queryCache } from '@/lib/utils/cache';

export interface PerformanceData {
  webVitals: WebVitalsMetrics;
  memoryUsage: any;
  connectionInfo: any;
  cacheStats: any;
  recommendations: string[];
  isSlowConnection: boolean;
  isLowMemory: boolean;
}

// Hook for monitoring performance metrics
export const usePerformance = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    webVitals: {},
    memoryUsage: null,
    connectionInfo: null,
    cacheStats: null,
    recommendations: [],
    isSlowConnection: false,
    isLowMemory: false,
  });

  const updatePerformanceData = useCallback(() => {
    const webVitals = performanceMonitor.getWebVitals();
    const memoryUsage = getMemoryUsage();
    const connectionInfo = getConnectionInfo();
    const cacheStats = queryCache.getStats();
    const recommendations = getPerformanceRecommendations(webVitals);

    // Determine if connection is slow
    const isSlowConnection = connectionInfo?.effectiveType === 'slow-2g' || 
                           connectionInfo?.effectiveType === '2g' ||
                           connectionInfo?.downlink < 1;

    // Determine if memory is low
    const isLowMemory = memoryUsage?.usedJSHeapSize > (memoryUsage?.jsHeapSizeLimit * 0.8);

    setPerformanceData({
      webVitals,
      memoryUsage,
      connectionInfo,
      cacheStats,
      recommendations,
      isSlowConnection,
      isLowMemory,
    });
  }, []);

  useEffect(() => {
    // Initial update
    updatePerformanceData();

    // Set up periodic updates
    const interval = setInterval(updatePerformanceData, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [updatePerformanceData]);

  return {
    ...performanceData,
    refreshData: updatePerformanceData,
  };
};

// Hook for timing component render performance
export const useRenderPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - renderStartTime.current;
    setRenderTime(duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎨 ${componentName} render time: ${duration.toFixed(2)}ms`);
    }
  }, [componentName]);

  return renderTime;
};

// Hook for measuring async operation performance
export const useAsyncPerformance = () => {
  const [metrics, setMetrics] = useState<Map<string, number>>(new Map());

  const measureAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      setMetrics(prev => new Map(prev.set(operationName, duration)));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${operationName}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      setMetrics(prev => new Map(prev.set(`${operationName}_error`, duration)));
      throw error;
    }
  }, []);

  const getMetric = useCallback((operationName: string): number | undefined => {
    return metrics.get(operationName);
  }, [metrics]);

  const getAllMetrics = useCallback((): Record<string, number> => {
    return Object.fromEntries(metrics);
  }, [metrics]);

  const clearMetrics = useCallback(() => {
    setMetrics(new Map());
  }, []);

  return {
    measureAsync,
    getMetric,
    getAllMetrics,
    clearMetrics,
  };
};

// Hook for adaptive loading based on performance
export const useAdaptiveLoading = () => {
  const { isSlowConnection, isLowMemory, connectionInfo } = usePerformance();
  
  const shouldReduceQuality = isSlowConnection || isLowMemory;
  const shouldPreload = !isSlowConnection && !isLowMemory;
  const shouldLazyLoad = isSlowConnection || isLowMemory;
  
  // Adaptive image quality
  const getImageQuality = useCallback(() => {
    if (isSlowConnection) return 60;
    if (isLowMemory) return 70;
    return 85;
  }, [isSlowConnection, isLowMemory]);

  // Adaptive chunk loading strategy
  const getLoadingStrategy = useCallback(() => {
    if (isSlowConnection) {
      return {
        priority: 'essential-only',
        batchSize: 3,
        delay: 1000,
      };
    }
    
    if (isLowMemory) {
      return {
        priority: 'memory-conscious',
        batchSize: 5,
        delay: 500,
      };
    }
    
    return {
      priority: 'aggressive',
      batchSize: 10,
      delay: 100,
    };
  }, [isSlowConnection, isLowMemory]);

  return {
    shouldReduceQuality,
    shouldPreload,
    shouldLazyLoad,
    getImageQuality,
    getLoadingStrategy,
    connectionType: connectionInfo?.effectiveType,
    downlink: connectionInfo?.downlink,
  };
};

// Hook for performance budget monitoring
export const usePerformanceBudget = (budgets: {
  maxRenderTime?: number;
  maxMemoryUsage?: number;
  maxBundleSize?: number;
  maxApiResponseTime?: number;
}) => {
  const [violations, setViolations] = useState<string[]>([]);
  const { webVitals, memoryUsage } = usePerformance();

  useEffect(() => {
    const newViolations: string[] = [];

    // Check render time budget
    if (budgets.maxRenderTime && webVitals.FCP && webVitals.FCP > budgets.maxRenderTime) {
      newViolations.push(`First Contentful Paint (${webVitals.FCP}ms) exceeds budget (${budgets.maxRenderTime}ms)`);
    }

    // Check memory usage budget
    if (budgets.maxMemoryUsage && memoryUsage?.usedJSHeapSize) {
      const usedMB = memoryUsage.usedJSHeapSize / (1024 * 1024);
      if (usedMB > budgets.maxMemoryUsage) {
        newViolations.push(`Memory usage (${usedMB.toFixed(2)}MB) exceeds budget (${budgets.maxMemoryUsage}MB)`);
      }
    }

    setViolations(newViolations);
  }, [webVitals, memoryUsage, budgets]);

  return {
    violations,
    isWithinBudget: violations.length === 0,
  };
};

// Hook for resource loading optimization
export const useResourceOptimization = () => {
  const { shouldPreload, getLoadingStrategy } = useAdaptiveLoading();
  const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set());

  const preloadResource = useCallback(async (url: string, type: 'script' | 'style' | 'image') => {
    if (!shouldPreload || loadedResources.has(url)) {
      return;
    }

    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = type;
      
      if (type === 'script') {
        link.crossOrigin = 'anonymous';
      }

      document.head.appendChild(link);
      setLoadedResources(prev => new Set(prev.add(url)));
    } catch (error) {
      console.warn(`Failed to preload resource: ${url}`, error);
    }
  }, [shouldPreload, loadedResources]);

  const prefetchRoute = useCallback(async (route: string) => {
    if (!shouldPreload) return;

    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    } catch (error) {
      console.warn(`Failed to prefetch route: ${route}`, error);
    }
  }, [shouldPreload]);

  return {
    preloadResource,
    prefetchRoute,
    loadingStrategy: getLoadingStrategy(),
    isResourceLoaded: (url: string) => loadedResources.has(url),
  };
};

// Hook for performance debugging
export const usePerformanceDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const collectDebugInfo = useCallback(() => {
    const info = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      performance: {
        navigation: performance.getEntriesByType('navigation')[0],
        resources: performance.getEntriesByType('resource').slice(-10), // Last 10 resources
        measures: performance.getEntriesByType('measure'),
      },
      memory: getMemoryUsage(),
      connection: getConnectionInfo(),
      webVitals: performanceMonitor.getWebVitals(),
      cache: queryCache.getStats(),
    };

    setDebugInfo(info);
    return info;
  }, []);

  const exportDebugInfo = useCallback(() => {
    const info = collectDebugInfo();
    const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [collectDebugInfo]);

  return {
    debugInfo,
    collectDebugInfo,
    exportDebugInfo,
  };
};