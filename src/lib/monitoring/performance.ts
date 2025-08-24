/**
 * Performance monitoring utilities
 */

import { analytics, trackPerformance } from './analytics';
import { log } from './logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: string;
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
    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            this.recordMetric('LCP', lastEntry.startTime, 'ms', 'core-web-vitals');
            trackPerformance('lcp', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric('FID', entry.processingStart - entry.startTime, 'ms', 'core-web-vitals');
            trackPerformance('fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.recordMetric('CLS', clsValue, 'score', 'core-web-vitals');
          trackPerformance('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric('TTFB', entry.responseStart - entry.requestStart, 'ms', 'navigation');
            this.recordMetric('DOM_LOAD', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart, 'ms', 'navigation');
            this.recordMetric('LOAD_COMPLETE', entry.loadEventEnd - entry.loadEventStart, 'ms', 'navigation');
            
            trackPerformance('ttfb', entry.responseStart - entry.requestStart);
            trackPerformance('dom_load', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);

        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.initiatorType === 'img') {
              this.recordMetric('IMAGE_LOAD', entry.duration, 'ms', 'resource');
            } else if (entry.initiatorType === 'script') {
              this.recordMetric('SCRIPT_LOAD', entry.duration, 'ms', 'resource');
            } else if (entry.initiatorType === 'css') {
              this.recordMetric('CSS_LOAD', entry.duration, 'ms', 'resource');
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

      } catch (error) {
        log.warn('Failed to initialize performance observers', 'performance', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  }

  recordMetric(name: string, value: number, unit: string = 'ms', context?: string) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      context,
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    log.info(`Performance metric: ${name} = ${value}${unit}`, 'performance', { context });

    // Send critical metrics to analytics
    if (this.isCriticalMetric(name)) {
      trackPerformance(name.toLowerCase(), value, unit);
    }
  }

  private isCriticalMetric(name: string): boolean {
    const criticalMetrics = ['LCP', 'FID', 'CLS', 'TTFB'];
    return criticalMetrics.includes(name);
  }

  // Measure function execution time
  async measureAsync<T>(name: string, fn: () => Promise<T>, context?: string): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_ERROR`, duration, 'ms', context);
      throw error;
    }
  }

  measure<T>(name: string, fn: () => T, context?: string): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_ERROR`, duration, 'ms', context);
      throw error;
    }
  }

  // Mark and measure
  mark(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(name);
    }
  }

  measureBetweenMarks(name: string, startMark: string, endMark: string, context?: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          this.recordMetric(name, measure.duration, 'ms', context);
        }
      } catch (error) {
        log.warn(`Failed to measure between marks: ${startMark} -> ${endMark}`, 'performance');
      }
    }
  }

  // Get performance summary
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    // Group metrics by name
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each metric
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      summary[name] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99),
      };
    });

    return summary;
  }

  private percentile(values: number[], p: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  // Get recent metrics
  getRecentMetrics(count: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const perf = {
  record: (name: string, value: number, unit: string = 'ms', context?: string) =>
    performanceMonitor.recordMetric(name, value, unit, context),
  
  measureAsync: <T>(name: string, fn: () => Promise<T>, context?: string) =>
    performanceMonitor.measureAsync(name, fn, context),
  
  measure: <T>(name: string, fn: () => T, context?: string) =>
    performanceMonitor.measure(name, fn, context),
  
  mark: (name: string) => performanceMonitor.mark(name),
  
  measureBetweenMarks: (name: string, startMark: string, endMark: string, context?: string) =>
    performanceMonitor.measureBetweenMarks(name, startMark, endMark, context),
  
  getSummary: () => performanceMonitor.getSummary(),
  
  getRecentMetrics: (count?: number) => performanceMonitor.getRecentMetrics(count),
};

// API call performance wrapper
export const withApiPerformance = async <T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  const cleanEndpoint = endpoint.replace(/\/\d+/g, '/:id'); // Normalize IDs
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    
    performanceMonitor.recordMetric(`API_${cleanEndpoint}`, duration, 'ms', 'api');
    trackPerformance(`api_${cleanEndpoint.replace(/\//g, '_')}`, duration);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(`API_${cleanEndpoint}_ERROR`, duration, 'ms', 'api');
    throw error;
  }
};