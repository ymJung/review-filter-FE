// Performance monitoring and optimization utilities

export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface WebVitalsMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

// Performance monitor class
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private webVitals: WebVitalsMetrics = {};

  constructor() {
    this.initializeWebVitalsTracking();
  }

  // Start timing a performance metric
  startTiming(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetrics = {
      name,
      startTime: performance.now(),
      metadata,
    };
    
    this.metrics.set(name, metric);
    
    // Also use Performance API mark
    if ('mark' in performance) {
      performance.mark(`${name}-start`);
    }
  }

  // End timing and calculate duration
  endTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    
    if (!metric) {
      console.warn(`Performance metric "${name}" was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    
    // Use Performance API measure
    if ('mark' in performance && 'measure' in performance) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`, metric.metadata);
    }

    return duration;
  }

  // Get metric by name
  getMetric(name: string): PerformanceMetrics | null {
    return this.metrics.get(name) || null;
  }

  // Get all metrics
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  // Get Web Vitals metrics
  getWebVitals(): WebVitalsMetrics {
    return { ...this.webVitals };
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
    
    if ('clearMarks' in performance) {
      performance.clearMarks();
    }
    
    if ('clearMeasures' in performance) {
      performance.clearMeasures();
    }
  }

  // Initialize Web Vitals tracking
  private initializeWebVitalsTracking(): void {
    if (typeof window === 'undefined') return;

    // Track First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.webVitals.FCP = fcpEntry.startTime;
      }
    });

    // Track Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lcpEntry = entries[entries.length - 1]; // Latest LCP
      if (lcpEntry) {
        this.webVitals.LCP = lcpEntry.startTime;
      }
    });

    // Track First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      const fidEntry = entries[0] as any;
      if (fidEntry && fidEntry.processingStart) {
        this.webVitals.FID = fidEntry.processingStart - fidEntry.startTime;
      }
    });

    // Track Cumulative Layout Shift (CLS)
    this.observePerformanceEntry('layout-shift', (entries) => {
      let clsValue = 0;
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      this.webVitals.CLS = clsValue;
    });

    // Track Time to First Byte (TTFB)
    this.observePerformanceEntry('navigation', (entries) => {
      const navEntry = entries[0] as PerformanceNavigationTiming;
      if (navEntry) {
        this.webVitals.TTFB = navEntry.responseStart - navEntry.requestStart;
      }
    });
  }

  // Helper to observe performance entries
  private observePerformanceEntry(
    type: string,
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Failed to observe ${type} performance entries:`, error);
    }
  }

  // Disconnect all observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance timing decorator
export const withPerformanceTiming = <T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T => {
  return ((...args: any[]) => {
    const metricName = name || fn.name || 'anonymous-function';
    
    performanceMonitor.startTiming(metricName);
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.endTiming(metricName);
        });
      }
      
      performanceMonitor.endTiming(metricName);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(metricName);
      throw error;
    }
  }) as T;
};

// Resource loading optimization
export class ResourceLoader {
  private loadedResources = new Set<string>();
  private loadingPromises = new Map<string, Promise<any>>();

  // Preload critical resources
  preloadResource(href: string, as: string, crossorigin?: string): Promise<void> {
    if (this.loadedResources.has(href)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(href)) {
      return this.loadingPromises.get(href)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      
      if (crossorigin) {
        link.crossOrigin = crossorigin;
      }

      link.onload = () => {
        this.loadedResources.add(href);
        resolve();
      };
      
      link.onerror = reject;
      
      document.head.appendChild(link);
    });

    this.loadingPromises.set(href, promise);
    return promise;
  }

  // Prefetch resources for future navigation
  prefetchResource(href: string): Promise<void> {
    if (this.loadedResources.has(href)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      
      link.onload = () => {
        this.loadedResources.add(href);
        resolve();
      };
      
      link.onerror = reject;
      
      document.head.appendChild(link);
    });
  }

  // Load script dynamically
  loadScript(src: string, async: boolean = true): Promise<void> {
    if (this.loadedResources.has(src)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      
      script.onload = () => {
        this.loadedResources.add(src);
        resolve();
      };
      
      script.onerror = reject;
      
      document.head.appendChild(script);
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  // Check if resource is loaded
  isResourceLoaded(href: string): boolean {
    return this.loadedResources.has(href);
  }
}

// Global resource loader instance
export const resourceLoader = new ResourceLoader();

// Bundle analyzer helper
export const analyzeBundleSize = () => {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  const analysis = {
    scripts: scripts.map(script => ({
      src: (script as HTMLScriptElement).src,
      async: (script as HTMLScriptElement).async,
      defer: (script as HTMLScriptElement).defer,
    })),
    styles: styles.map(style => ({
      href: (style as HTMLLinkElement).href,
    })),
    totalScripts: scripts.length,
    totalStyles: styles.length,
  };

  console.table(analysis.scripts);
  console.table(analysis.styles);
  
  return analysis;
};

// Memory usage monitoring
export const getMemoryUsage = (): any => {
  if ('memory' in performance) {
    return {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    };
  }
  
  return null;
};

// Connection quality detection
export const getConnectionInfo = (): any => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  
  return null;
};

// Performance recommendations based on metrics
export const getPerformanceRecommendations = (metrics: WebVitalsMetrics): string[] => {
  const recommendations: string[] = [];

  if (metrics.FCP && metrics.FCP > 2500) {
    recommendations.push('First Contentful Paint is slow. Consider optimizing critical resources.');
  }

  if (metrics.LCP && metrics.LCP > 4000) {
    recommendations.push('Largest Contentful Paint is slow. Optimize images and critical resources.');
  }

  if (metrics.FID && metrics.FID > 300) {
    recommendations.push('First Input Delay is high. Reduce JavaScript execution time.');
  }

  if (metrics.CLS && metrics.CLS > 0.25) {
    recommendations.push('Cumulative Layout Shift is high. Ensure proper sizing for dynamic content.');
  }

  if (metrics.TTFB && metrics.TTFB > 800) {
    recommendations.push('Time to First Byte is slow. Optimize server response time.');
  }

  return recommendations;
};