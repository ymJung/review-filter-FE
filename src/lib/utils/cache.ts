// Advanced caching utilities for performance optimization

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
  serialize?: boolean; // Whether to serialize data
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

// In-memory cache with TTL and LRU eviction
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private accessOrder = new Map<string, number>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const itemTTL = ttl || this.defaultTTL;

    // Remove expired items before adding new one
    this.cleanup();

    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: itemTTL,
      hits: 0,
    };

    this.cache.set(key, item);
    this.accessOrder.set(key, now);
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // Update access time and hit count
    item.hits++;
    this.accessOrder.set(key, Date.now());

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    items: Array<{ key: string; hits: number; age: number }>;
  } {
    this.cleanup();

    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      hits: item.hits,
      age: Date.now() - item.timestamp,
    }));

    const totalHits = items.reduce((sum, item) => sum + item.hits, 0);
    const hitRate = totalHits > 0 ? totalHits / (totalHits + items.length) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      items,
    };
  }

  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }
}

// Browser storage cache with compression
export class StorageCache {
  private storage: Storage | null;
  private prefix: string;
  private compress: boolean;

  constructor(
    storage?: Storage,
    prefix: string = 'app_cache_',
    compress: boolean = true
  ) {
    if (typeof window !== 'undefined') {
      this.storage = storage || localStorage;
    } else {
      this.storage = null;
    }
    this.prefix = prefix;
    this.compress = compress;
  }

  async set<T>(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.storage) return;

    const item = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    try {
      let serialized = JSON.stringify(item);

      if (this.compress) {
        serialized = await this.compressString(serialized);
      }

      this.storage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.storage) return null;

    try {
      let serialized = this.storage.getItem(this.prefix + key);

      if (!serialized) {
        return null;
      }

      if (this.compress) {
        serialized = await this.decompressString(serialized);
      }

      const item = JSON.parse(serialized);

      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      this.delete(key);
      return null;
    }
  }

  delete(key: string): void {
    if (!this.storage) return;
    this.storage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (!this.storage) return;
    const keys = Object.keys(this.storage).filter(key =>
      key.startsWith(this.prefix)
    );

    keys.forEach(key => this.storage!.removeItem(key));
  }

  // Cleanup expired items
  cleanup(): void {
    if (!this.storage) return;
    const keys = Object.keys(this.storage).filter(key =>
      key.startsWith(this.prefix)
    );

    keys.forEach(async (key) => {
      const data = await this.get(key.replace(this.prefix, ''));
      // get() method already handles cleanup of expired items
    });
  }

  private async compressString(str: string): Promise<string> {
    // Simple compression using browser's built-in compression
    if ('CompressionStream' in window) {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new TextEncoder().encode(str));
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }

      return btoa(String.fromCharCode(...compressed));
    }

    return str; // Fallback to no compression
  }

  private async decompressString(compressedStr: string): Promise<string> {
    if ('DecompressionStream' in window && compressedStr !== compressedStr) {
      try {
        const compressed = Uint8Array.from(atob(compressedStr), c => c.charCodeAt(0));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(compressed);
        writer.close();

        const chunks: Uint8Array[] = [];
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }

        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }

        return new TextDecoder().decode(decompressed);
      } catch (error) {
        console.warn('Decompression failed, using original string:', error);
      }
    }

    return compressedStr; // Fallback
  }
}

// Query cache for API responses
export class QueryCache {
  private memoryCache: MemoryCache<any>;
  private storageCache: StorageCache;

  constructor() {
    this.memoryCache = new MemoryCache({ maxSize: 50, ttl: 5 * 60 * 1000 }); // 5 minutes
    this.storageCache = new StorageCache(undefined, 'query_cache_');
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (fastest)
    let data = this.memoryCache.get(key) as T | null;
    if (data) {
      return data;
    }

    // Try storage cache (persistent)
    data = await this.storageCache.get<T>(key);
    if (data) {
      // Populate memory cache for faster subsequent access
      this.memoryCache.set(key, data);
      return data;
    }

    return null;
  }

  async set<T>(key: string, data: T, memoryTTL?: number, storageTTL?: number): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, data, memoryTTL);

    // Set in storage cache for persistence
    await this.storageCache.set(key, data, storageTTL);
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key);
    this.storageCache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    // Invalidate keys matching pattern (simple string matching)
    const memoryStats = this.memoryCache.getStats();
    memoryStats.items.forEach(item => {
      if (item.key.includes(pattern)) {
        this.invalidate(item.key);
      }
    });
  }

  clear(): void {
    this.memoryCache.clear();
    this.storageCache.clear();
  }

  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      storage: {
        // Storage stats would need to be calculated
        size: 0, // Placeholder
      },
    };
  }
}

// Global cache instances (lazy initialization)
let _queryCache: QueryCache | null = null;
let _imageCache: MemoryCache<string> | null = null;

export const queryCache = {
  get instance(): QueryCache {
    if (!_queryCache) {
      _queryCache = new QueryCache();
    }
    return _queryCache;
  },

  // Proxy methods to the actual instance
  async get<T>(key: string): Promise<T | null> {
    return this.instance.get<T>(key);
  },

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    return this.instance.set<T>(key, data, ttl);
  },

  invalidate(key: string): void {
    return this.instance.invalidate(key);
  },

  clear(): void {
    return this.instance.clear();
  },

  invalidatePattern(pattern: string): void {
    return this.instance.invalidatePattern(pattern);
  },

  getStats() {
    return this.instance.getStats();
  }
};

export const imageCache = {
  get instance(): MemoryCache<string> {
    if (!_imageCache) {
      _imageCache = new MemoryCache<string>({ maxSize: 100, ttl: 30 * 60 * 1000 }); // 30 minutes
    }
    return _imageCache;
  },

  // Proxy methods to the actual instance
  get(key: string): string | null {
    return this.instance.get(key);
  },

  set(key: string, value: string, ttl?: number): void {
    return this.instance.set(key, value, ttl);
  },

  delete(key: string): boolean {
    return this.instance.delete(key);
  },

  clear(): void {
    return this.instance.clear();
  },

  getStats() {
    return this.instance.getStats();
  }
};

// Cache key generators
export const generateCacheKey = (prefix: string, params: Record<string, any>): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');

  return `${prefix}:${sortedParams}`;
};

// Cache decorators for functions
export const withCache = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
): T => {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);

    // Try to get from cache
    let result = await queryCache.get(key);
    if (result) {
      return result;
    }

    // Execute function and cache result
    result = await fn(...args);
    await queryCache.set(key, result, ttl);

    return result;
  }) as T;
};