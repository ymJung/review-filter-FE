import {
  MemoryCache,
  StorageCache,
  QueryCache,
  queryCache,
  imageCache,
  generateCacheKey,
  withCache,
} from '../cache';

describe('cache utilities', () => {
  describe('MemoryCache', () => {
    let cache: MemoryCache<string>;

    beforeEach(() => {
      cache = new MemoryCache<string>({ maxSize: 3, ttl: 1000 });
    });

    it('should store and retrieve items', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBe(null);
    });

    it('should respect TTL', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('key1')).toBe(null);
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete items', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBe(null);
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all items', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should enforce max size with LRU eviction', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1

      expect(cache.get('key1')).toBe(null);
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should update access order on get', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it most recently used
      cache.get('key1');
      
      // Add key4, should evict key2 (least recently used)
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe(null);
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should track hit counts', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');
      cache.get('key1');

      const stats = cache.getStats();
      const item = stats.items.find(item => item.key === 'key1');
      expect(item?.hits).toBe(3);
    });

    it('should provide cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1');

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.items).toHaveLength(2);
    });

    it('should cleanup expired items automatically', async () => {
      cache.set('key1', 'value1', 100);
      cache.set('key2', 'value2', 1000);

      expect(cache.size()).toBe(2);

      // Wait for key1 to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Accessing size should trigger cleanup
      expect(cache.size()).toBe(1);
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('StorageCache', () => {
    let mockStorage: Storage;
    let cache: StorageCache;

    beforeEach(() => {
      const storage: Record<string, string> = {};
      mockStorage = {
        getItem: jest.fn((key) => storage[key] || null),
        setItem: jest.fn((key, value) => { storage[key] = value; }),
        removeItem: jest.fn((key) => { delete storage[key]; }),
        clear: jest.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); }),
        length: 0,
        key: jest.fn(),
      };

      cache = new StorageCache(mockStorage, 'test_', false); // Disable compression for testing
    });

    it('should store and retrieve items', async () => {
      await cache.set('key1', 'value1');
      const result = await cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('nonexistent');
      expect(result).toBe(null);
    });

    it('should respect TTL', async () => {
      await cache.set('key1', 'value1', 100); // 100ms TTL
      let result = await cache.get('key1');
      expect(result).toBe('value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      result = await cache.get('key1');
      expect(result).toBe(null);
    });

    it('should delete items', async () => {
      await cache.set('key1', 'value1');
      cache.delete('key1');
      const result = await cache.get('key1');
      expect(result).toBe(null);
    });

    it('should clear all items with prefix', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      // Mock storage keys
      (mockStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'test_key1' || key === 'test_key2') {
          return JSON.stringify({
            data: key === 'test_key1' ? 'value1' : 'value2',
            timestamp: Date.now(),
            ttl: 1000,
          });
        }
        return null;
      });

      Object.defineProperty(mockStorage, 'length', { value: 2 });
      (mockStorage.key as jest.Mock)
        .mockReturnValueOnce('test_key1')
        .mockReturnValueOnce('test_key2');

      // Mock Object.keys to return storage keys
      const originalKeys = Object.keys;
      Object.keys = jest.fn(() => ['test_key1', 'test_key2']);

      cache.clear();

      expect(mockStorage.removeItem).toHaveBeenCalledWith('test_key1');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test_key2');

      // Restore
      Object.keys = originalKeys;
    });

    it('should handle storage errors gracefully', async () => {
      (mockStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      await expect(cache.set('key1', 'value1')).resolves.toBeUndefined();
    });

    it('should handle retrieval errors gracefully', async () => {
      (mockStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await cache.get('key1');
      expect(result).toBe(null);
    });

    it('should handle invalid JSON gracefully', async () => {
      (mockStorage.getItem as jest.Mock).mockReturnValue('invalid json');

      const result = await cache.get('key1');
      expect(result).toBe(null);
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test_key1');
    });
  });

  describe('QueryCache', () => {
    let queryCache: QueryCache;

    beforeEach(() => {
      queryCache = new QueryCache();
    });

    it('should get from memory cache first', async () => {
      await queryCache.set('key1', 'value1');
      const result = await queryCache.get('key1');
      expect(result).toBe('value1');
    });

    it('should fallback to storage cache', async () => {
      // Mock memory cache miss but storage cache hit
      const memoryCache = queryCache['memoryCache'];
      const storageCache = queryCache['storageCache'];
      
      jest.spyOn(memoryCache, 'get').mockReturnValue(null);
      jest.spyOn(storageCache, 'get').mockResolvedValue('value1');
      jest.spyOn(memoryCache, 'set').mockImplementation();

      const result = await queryCache.get('key1');
      expect(result).toBe('value1');
      expect(memoryCache.set).toHaveBeenCalledWith('key1', 'value1');
    });

    it('should invalidate from both caches', () => {
      const memoryCache = queryCache['memoryCache'];
      const storageCache = queryCache['storageCache'];
      
      jest.spyOn(memoryCache, 'delete').mockReturnValue(true);
      jest.spyOn(storageCache, 'delete').mockImplementation();

      queryCache.invalidate('key1');

      expect(memoryCache.delete).toHaveBeenCalledWith('key1');
      expect(storageCache.delete).toHaveBeenCalledWith('key1');
    });

    it('should invalidate by pattern', () => {
      const memoryCache = queryCache['memoryCache'];
      
      jest.spyOn(memoryCache, 'getStats').mockReturnValue({
        size: 2,
        maxSize: 100,
        hitRate: 0.5,
        items: [
          { key: 'user:123', hits: 1, age: 1000 },
          { key: 'post:456', hits: 2, age: 2000 },
        ],
      });

      jest.spyOn(queryCache, 'invalidate').mockImplementation();

      queryCache.invalidatePattern('user');

      expect(queryCache.invalidate).toHaveBeenCalledWith('user:123');
      expect(queryCache.invalidate).not.toHaveBeenCalledWith('post:456');
    });

    it('should clear both caches', () => {
      const memoryCache = queryCache['memoryCache'];
      const storageCache = queryCache['storageCache'];
      
      jest.spyOn(memoryCache, 'clear').mockImplementation();
      jest.spyOn(storageCache, 'clear').mockImplementation();

      queryCache.clear();

      expect(memoryCache.clear).toHaveBeenCalled();
      expect(storageCache.clear).toHaveBeenCalled();
    });
  });

  describe('global cache instances', () => {
    it('should provide singleton query cache instance', () => {
      const instance1 = queryCache.instance;
      const instance2 = queryCache.instance;
      expect(instance1).toBe(instance2);
    });

    it('should provide singleton image cache instance', () => {
      const instance1 = imageCache.instance;
      const instance2 = imageCache.instance;
      expect(instance1).toBe(instance2);
    });

    it('should proxy methods to query cache instance', async () => {
      await queryCache.set('test', 'value');
      const result = await queryCache.get('test');
      expect(result).toBe('value');

      queryCache.invalidate('test');
      const result2 = await queryCache.get('test');
      expect(result2).toBe(null);
    });

    it('should proxy methods to image cache instance', () => {
      imageCache.set('test', 'value');
      const result = imageCache.get('test');
      expect(result).toBe('value');

      imageCache.delete('test');
      const result2 = imageCache.get('test');
      expect(result2).toBe(null);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const params = { userId: '123', page: 1, limit: 10 };
      const key1 = generateCacheKey('users', params);
      const key2 = generateCacheKey('users', params);
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different params', () => {
      const params1 = { userId: '123', page: 1 };
      const params2 = { userId: '123', page: 2 };
      const key1 = generateCacheKey('users', params1);
      const key2 = generateCacheKey('users', params2);
      expect(key1).not.toBe(key2);
    });

    it('should sort parameters for consistency', () => {
      const params1 = { page: 1, userId: '123', limit: 10 };
      const params2 = { userId: '123', limit: 10, page: 1 };
      const key1 = generateCacheKey('users', params1);
      const key2 = generateCacheKey('users', params2);
      expect(key1).toBe(key2);
    });
  });

  describe('withCache', () => {
    it('should cache function results', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const keyGenerator = jest.fn().mockReturnValue('cache-key');
      
      const cachedFn = withCache(mockFn, keyGenerator, 1000);

      // First call should execute function
      const result1 = await cachedFn('arg1', 'arg2');
      expect(result1).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(keyGenerator).toHaveBeenCalledWith('arg1', 'arg2');

      // Second call should use cache
      const result2 = await cachedFn('arg1', 'arg2');
      expect(result2).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should handle function errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Function error'));
      const keyGenerator = jest.fn().mockReturnValue('cache-key');
      
      const cachedFn = withCache(mockFn, keyGenerator);

      await expect(cachedFn('arg1')).rejects.toThrow('Function error');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should not cache errors', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce('success');
      const keyGenerator = jest.fn().mockReturnValue('cache-key');
      
      const cachedFn = withCache(mockFn, keyGenerator);

      // First call fails
      await expect(cachedFn('arg1')).rejects.toThrow('First error');
      
      // Second call should try again and succeed
      const result = await cachedFn('arg1');
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});