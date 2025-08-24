// Performance monitoring utilities for production optimization

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
}

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordResourceMetric(entry as PerformanceResourceTiming);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordLongTask(entry);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = [
      { name: 'DNS_LOOKUP', value: entry.domainLookupEnd - entry.domainLookupStart },
      { name: 'TCP_CONNECT', value: entry.connectEnd - entry.connectStart },
      { name: 'REQUEST_RESPONSE', value: entry.responseEnd - entry.requestStart },
      { name: 'DOM_PARSE', value: entry.domContentLoadedEventEnd - entry.responseEnd },
      { name: 'LOAD_COMPLETE', value: entry.loadEventEnd - entry.loadEventStart },
      { name: 'TOTAL_LOAD_TIME', value: entry.loadEventEnd - entry.navigationStart },
    ];

    metrics.forEach(metric => this.recordMetric(metric.name, metric.value));
  }

  private recordResourceMetric(entry: PerformanceResourceTiming) {
    const loadTime = entry.responseEnd - entry.startTime;
    
    // Only record significant resources
    if (loadTime > 100) {
      this.recordMetric('RESOURCE_LOAD_TIME', loadTime, entry.name);
    }
  }

  private recordLongTask(entry: PerformanceEntry) {
    this.recordMetric('LONG_TASK', entry.duration);
  }

  recordMetric(name: string, value: number, url?: string) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url,
      userAgent: navigator.userAgent,
    };

    this.metrics.push(metric);

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric);
    }
  }

  recordWebVital(metric: WebVitalsMetric) {
    this.recordMetric(`WEB_VITAL_${metric.name}`, metric.value);
    
    // Log poor web vitals
    if (metric.rating === 'poor') {
      console.warn(`Poor Web Vital: ${metric.name} = ${metric.value}`);
    }
  }

  private async sendToAnalytics(metric: PerformanceMetric) {
    try {
      // Send to your analytics service
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.error('Failed to send performance metric:', error);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Web Vitals integration
export const initWebVitals = async () => {
  if (typeof window === 'undefined') return;

  try {
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');

    getCLS((metric) => performanceMonitor.recordWebVital({
      name: 'CLS',
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    }));

    getFID((metric) => performanceMonitor.recordWebVital({
      name: 'FID',
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    }));

    getFCP((metric) => performanceMonitor.recordWebVital({
      name: 'FCP',
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    }));

    getLCP((metric) => performanceMonitor.recordWebVital({
      name: 'LCP',
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    }));

    getTTFB((metric) => performanceMonitor.recordWebVital({
      name: 'TTFB',
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
};

// Performance timing utilities
export const measureAsync = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(`${name}_ERROR`, duration);
    throw error;
  }
};

export const measureSync = <T>(name: string, fn: () => T): T => {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(`${name}_ERROR`, duration);
    throw error;
  }
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Bundle size analysis
export const analyzeBundleSize = () => {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  return {
    scriptCount: scripts.length,
    styleCount: styles.length,
    scripts: scripts.map(script => ({
      src: (script as HTMLScriptElement).src,
      async: (script as HTMLScriptElement).async,
      defer: (script as HTMLScriptElement).defer,
    })),
    styles: styles.map(style => ({
      href: (style as HTMLLinkElement).href,
    })),
  };
};