// Code splitting and lazy loading utilities

import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { resourceLoader } from './performance';

export interface LazyLoadOptions {
  fallback?: ComponentType;
  preload?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export interface RoutePreloadOptions {
  routes: string[];
  priority?: 'high' | 'low';
  delay?: number;
}

// Enhanced lazy loading with retry mechanism
export const lazyWithRetry = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> => {
  const { retryCount = 3, retryDelay = 1000 } = options;

  const retryImport = async (attempt: number = 0): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      if (attempt < retryCount) {
        console.warn(`Failed to load component, retrying... (${attempt + 1}/${retryCount})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        return retryImport(attempt + 1);
      }
      throw error;
    }
  };

  return lazy(() => retryImport());
};

// Preload component for better UX
export const preloadComponent = async <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): Promise<void> => {
  try {
    await importFn();
  } catch (error) {
    console.warn('Failed to preload component:', error);
  }
};

// Route-based code splitting manager
export class RouteSplittingManager {
  private preloadedRoutes = new Set<string>();
  private preloadPromises = new Map<string, Promise<void>>();
  private routeComponents = new Map<string, () => Promise<any>>();

  // Register a route component
  registerRoute(path: string, importFn: () => Promise<any>): void {
    this.routeComponents.set(path, importFn);
  }

  // Preload specific routes
  async preloadRoutes(options: RoutePreloadOptions): Promise<void> {
    const { routes, priority = 'low', delay = 0 } = options;

    // Add delay for low priority preloading
    if (priority === 'low' && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const preloadPromises = routes.map(route => this.preloadRoute(route));
    await Promise.allSettled(preloadPromises);
  }

  // Preload a single route
  async preloadRoute(path: string): Promise<void> {
    if (this.preloadedRoutes.has(path)) {
      return;
    }

    if (this.preloadPromises.has(path)) {
      return this.preloadPromises.get(path)!;
    }

    const importFn = this.routeComponents.get(path);
    if (!importFn) {
      console.warn(`Route component not registered: ${path}`);
      return;
    }

    const preloadPromise = (async () => {
      try {
        await importFn();
        this.preloadedRoutes.add(path);
      } catch (error) {
        console.warn(`Failed to preload route ${path}:`, error);
      }
    })();

    this.preloadPromises.set(path, preloadPromise);
    return preloadPromise;
  }

  // Check if route is preloaded
  isRoutePreloaded(path: string): boolean {
    return this.preloadedRoutes.has(path);
  }

  // Preload routes based on user behavior
  preloadOnHover(element: HTMLElement, routes: string[]): () => void {
    let timeoutId: NodeJS.Timeout;

    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        this.preloadRoutes({ routes, priority: 'high' });
      }, 100); // Small delay to avoid unnecessary preloading
    };

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup function
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }

  // Preload routes when they become visible
  preloadOnVisible(element: HTMLElement, routes: string[]): () => void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.preloadRoutes({ routes, priority: 'low', delay: 500 });
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    // Return cleanup function
    return () => observer.disconnect();
  }
}

// Global route splitting manager
export const routeSplittingManager = new RouteSplittingManager();

// Dynamic import with caching
export class DynamicImportCache {
  private cache = new Map<string, Promise<any>>();

  async import<T = any>(
    importFn: () => Promise<T>,
    cacheKey: string
  ): Promise<T> {
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const importPromise = importFn();
    this.cache.set(cacheKey, importPromise);

    try {
      return await importPromise;
    } catch (error) {
      // Remove failed import from cache
      this.cache.delete(cacheKey);
      throw error;
    }
  }

  clear(): void {
    this.cache.clear();
  }

  has(cacheKey: string): boolean {
    return this.cache.has(cacheKey);
  }
}

// Global dynamic import cache
export const dynamicImportCache = new DynamicImportCache();

// Bundle splitting utilities
export const createChunkName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

// Webpack magic comments for chunk naming
export const withChunkName = (chunkName: string) => {
  return (importFn: () => Promise<any>) => {
    // This is a helper to remind developers to use webpack magic comments
    console.log(`Use /* webpackChunkName: "${chunkName}" */ in your import statement`);
    return importFn;
  };
};

// Critical resource preloader
export class CriticalResourcePreloader {
  private criticalResources: string[] = [];
  private preloadedResources = new Set<string>();

  // Add critical resource
  addCriticalResource(resource: string): void {
    if (!this.criticalResources.includes(resource)) {
      this.criticalResources.push(resource);
    }
  }

  // Preload all critical resources
  async preloadCriticalResources(): Promise<void> {
    const preloadPromises = this.criticalResources
      .filter(resource => !this.preloadedResources.has(resource))
      .map(async (resource) => {
        try {
          if (resource.endsWith('.js')) {
            await resourceLoader.loadScript(resource);
          } else if (resource.endsWith('.css')) {
            await resourceLoader.preloadResource(resource, 'style');
          } else {
            await resourceLoader.preloadResource(resource, 'fetch');
          }
          this.preloadedResources.add(resource);
        } catch (error) {
          console.warn(`Failed to preload critical resource: ${resource}`, error);
        }
      });

    await Promise.allSettled(preloadPromises);
  }

  // Get preload status
  getPreloadStatus(): {
    total: number;
    preloaded: number;
    pending: string[];
  } {
    const pending = this.criticalResources.filter(
      resource => !this.preloadedResources.has(resource)
    );

    return {
      total: this.criticalResources.length,
      preloaded: this.preloadedResources.size,
      pending,
    };
  }
}

// Global critical resource preloader
export const criticalResourcePreloader = new CriticalResourcePreloader();

// Service Worker integration for caching
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Progressive loading strategy
export class ProgressiveLoader {
  private loadingQueue: Array<{
    priority: number;
    loader: () => Promise<any>;
    name: string;
  }> = [];

  private isLoading = false;

  // Add item to loading queue
  add(
    loader: () => Promise<any>,
    name: string,
    priority: number = 0
  ): void {
    this.loadingQueue.push({ priority, loader, name });
    this.loadingQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  // Start progressive loading
  async start(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;

    while (this.loadingQueue.length > 0) {
      const item = this.loadingQueue.shift()!;
      
      try {
        console.log(`Loading: ${item.name} (priority: ${item.priority})`);
        await item.loader();
      } catch (error) {
        console.warn(`Failed to load: ${item.name}`, error);
      }

      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.isLoading = false;
  }

  // Clear loading queue
  clear(): void {
    this.loadingQueue = [];
    this.isLoading = false;
  }

  // Get queue status
  getStatus(): {
    queueLength: number;
    isLoading: boolean;
    nextItem?: string;
  } {
    return {
      queueLength: this.loadingQueue.length,
      isLoading: this.isLoading,
      nextItem: this.loadingQueue[0]?.name,
    };
  }
}

// Global progressive loader
export const progressiveLoader = new ProgressiveLoader();