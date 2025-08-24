// System health monitoring and diagnostics

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  details?: Record<string, any>;
  timestamp: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheckResult[];
  score: number; // 0-100
  timestamp: number;
}

class HealthMonitor {
  private checks: Map<string, () => Promise<HealthCheckResult>> = new Map();

  constructor() {
    this.registerDefaultChecks();
  }

  private registerDefaultChecks() {
    // API Health Check
    this.registerCheck('api', async () => {
      const start = performance.now();
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const responseTime = performance.now() - start;
        
        if (response.ok) {
          const data = await response.json();
          return {
            service: 'api',
            status: 'healthy',
            responseTime,
            details: data,
            timestamp: Date.now(),
          };
        } else {
          return {
            service: 'api',
            status: 'unhealthy',
            responseTime,
            error: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: Date.now(),
          };
        }
      } catch (error) {
        const responseTime = performance.now() - start;
        return {
          service: 'api',
          status: 'unhealthy',
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        };
      }
    });

    // Firebase Health Check
    this.registerCheck('firebase', async () => {
      const start = performance.now();
      try {
        // Test Firebase connection by making a simple query
        const response = await fetch('/api/health/firebase', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const responseTime = performance.now() - start;
        
        if (response.ok) {
          return {
            service: 'firebase',
            status: 'healthy',
            responseTime,
            timestamp: Date.now(),
          };
        } else {
          return {
            service: 'firebase',
            status: 'unhealthy',
            responseTime,
            error: `Firebase connection failed: ${response.status}`,
            timestamp: Date.now(),
          };
        }
      } catch (error) {
        const responseTime = performance.now() - start;
        return {
          service: 'firebase',
          status: 'unhealthy',
          responseTime,
          error: error instanceof Error ? error.message : 'Firebase connection error',
          timestamp: Date.now(),
        };
      }
    });

    // OpenAI Health Check
    this.registerCheck('openai', async () => {
      const start = performance.now();
      try {
        const response = await fetch('/api/health/openai', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const responseTime = performance.now() - start;
        
        if (response.ok) {
          return {
            service: 'openai',
            status: 'healthy',
            responseTime,
            timestamp: Date.now(),
          };
        } else {
          return {
            service: 'openai',
            status: responseTime > 5000 ? 'degraded' : 'unhealthy',
            responseTime,
            error: `OpenAI API issue: ${response.status}`,
            timestamp: Date.now(),
          };
        }
      } catch (error) {
        const responseTime = performance.now() - start;
        return {
          service: 'openai',
          status: 'degraded', // OpenAI is not critical for core functionality
          responseTime,
          error: error instanceof Error ? error.message : 'OpenAI API error',
          timestamp: Date.now(),
        };
      }
    });

    // Client-side Performance Check
    this.registerCheck('performance', async () => {
      const start = performance.now();
      
      try {
        // Check memory usage
        const memory = this.getMemoryUsage();
        
        // Check network connection
        const connection = this.getNetworkInfo();
        
        // Check page load performance
        const navigation = this.getNavigationTiming();
        
        const responseTime = performance.now() - start;
        
        // Determine status based on performance metrics
        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        
        if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          status = 'degraded';
        }
        
        if (navigation && navigation.loadEventEnd - navigation.fetchStart > 5000) {
          status = 'degraded';
        }
        
        return {
          service: 'performance',
          status,
          responseTime,
          details: {
            memory,
            connection,
            navigation: navigation ? {
              totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            } : null,
          },
          timestamp: Date.now(),
        };
      } catch (error) {
        const responseTime = performance.now() - start;
        return {
          service: 'performance',
          status: 'degraded',
          responseTime,
          error: error instanceof Error ? error.message : 'Performance check error',
          timestamp: Date.now(),
        };
      }
    });
  }

  registerCheck(name: string, checkFn: () => Promise<HealthCheckResult>) {
    this.checks.set(name, checkFn);
  }

  async runHealthCheck(): Promise<SystemHealth> {
    const results: HealthCheckResult[] = [];
    
    // Run all health checks in parallel
    const checkPromises = Array.from(this.checks.entries()).map(async ([name, checkFn]) => {
      try {
        return await checkFn();
      } catch (error) {
        return {
          service: name,
          status: 'unhealthy' as const,
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Health check failed',
          timestamp: Date.now(),
        };
      }
    });

    const checkResults = await Promise.all(checkPromises);
    results.push(...checkResults);

    // Calculate overall health
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    // Calculate health score
    const score = Math.round((healthyCount / results.length) * 100);

    return {
      overall,
      services: results,
      score,
      timestamp: Date.now(),
    };
  }

  private getMemoryUsage() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }

  private getNetworkInfo() {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return null;
  }

  private getNavigationTiming() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation;
    }
    return null;
  }
}

// Singleton instance
export const healthMonitor = new HealthMonitor();

// Automated health monitoring
export const startHealthMonitoring = (intervalMs: number = 60000) => {
  if (typeof window === 'undefined') return;

  const runCheck = async () => {
    try {
      const health = await healthMonitor.runHealthCheck();
      
      // Log health status
      if (health.overall === 'unhealthy') {
        console.error('System Health: UNHEALTHY', health);
      } else if (health.overall === 'degraded') {
        console.warn('System Health: DEGRADED', health);
      } else {
        console.log('System Health: HEALTHY', health);
      }

      // Send to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/monitoring/health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(health),
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Health monitoring error:', error);
    }
  };

  // Run initial check
  runCheck();

  // Set up periodic monitoring
  const interval = setInterval(runCheck, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
};

// Health check API endpoints for server-side checks
export const createHealthCheckEndpoints = () => {
  return {
    // Main health endpoint
    '/api/health': async () => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };
    },

    // Firebase health check
    '/api/health/firebase': async () => {
      try {
        // Test Firebase connection
        const { getFirestore } = await import('firebase/firestore');
        const db = getFirestore();
        
        // Simple query to test connection - just check if db exists
        if (!db) {
          throw new Error('Firebase not initialized');
        }
        
        return {
          status: 'healthy',
          service: 'firebase',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(`Firebase health check failed: ${error}`);
      }
    },

    // OpenAI health check
    '/api/health/openai': async () => {
      try {
        // Test OpenAI API connection
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`OpenAI API returned ${response.status}`);
        }

        return {
          status: 'healthy',
          service: 'openai',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(`OpenAI health check failed: ${error}`);
      }
    },
  };
};