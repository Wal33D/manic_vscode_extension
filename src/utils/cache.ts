/**
 * Cache utility for performance optimization
 * Implements various caching strategies for frequently accessed data
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  onEvict?: (key: string, value: any) => void;
}

/**
 * Simple LRU (Least Recently Used) cache implementation
 */
export class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private accessOrder: string[] = [];
  private ttl: number;
  private maxSize: number;
  private onEvict?: (key: string, value: T) => void;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 0; // 0 means no expiration
    this.maxSize = options.maxSize || 100;
    this.onEvict = options.onEvict;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // Check if expired
    if (this.ttl > 0 && Date.now() - item.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    // Update access order
    this.updateAccessOrder(key);

    return item.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // Remove if already exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Evict LRU item if at capacity
    if (this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder[0];
      this.delete(lruKey);
    }

    // Add new item
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
    this.accessOrder.push(key);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    // Check expiration
    if (this.ttl > 0 && Date.now() - item.timestamp > this.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const item = this.cache.get(key);

    if (item) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);

      if (this.onEvict) {
        this.onEvict(key, item.value);
      }

      return true;
    }

    return false;
  }

  /**
   * Clear all items
   */
  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((item, key) => {
        this.onEvict!(key, item.value);
      });
    }

    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);

    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}

/**
 * Memoization decorator for methods
 */
export function memoize(options: CacheOptions = {}) {
  const cache = new LRUCache(options);

  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);

      if (cached !== undefined) {
        return cached;
      }

      const result = originalMethod.apply(this, args);
      cache.set(key, result);

      return result;
    };

    return descriptor;
  };
}

/**
 * Async memoization decorator
 */
export function memoizeAsync(options: CacheOptions = {}) {
  const cache = new LRUCache<Promise<any>>(options);

  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);

      if (cached !== undefined) {
        return cached;
      }

      const promise = originalMethod.apply(this, args);
      cache.set(key, promise);

      try {
        const result = await promise;
        return result;
      } catch (error) {
        // Remove from cache on error
        cache.delete(key);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Specialized caches for Manic Miners data
 */
export class MapDataCache {
  private tileCache = new LRUCache<any>({ maxSize: 50, ttl: 300000 }); // 5 min TTL
  private mapCache = new LRUCache<any>({ maxSize: 20, ttl: 600000 }); // 10 min TTL
  private validationCache = new LRUCache<any>({ maxSize: 30, ttl: 60000 }); // 1 min TTL

  getTileData(mapId: string, x: number, y: number): any {
    const key = `${mapId}-${x}-${y}`;
    return this.tileCache.get(key);
  }

  setTileData(mapId: string, x: number, y: number, data: any): void {
    const key = `${mapId}-${x}-${y}`;
    this.tileCache.set(key, data);
  }

  getMapData(mapId: string): any {
    return this.mapCache.get(mapId);
  }

  setMapData(mapId: string, data: any): void {
    this.mapCache.set(mapId, data);
  }

  getValidationResult(mapId: string): any {
    return this.validationCache.get(mapId);
  }

  setValidationResult(mapId: string, result: any): void {
    this.validationCache.set(mapId, result);
  }

  invalidateMap(mapId: string): void {
    // Clear all related caches
    this.mapCache.delete(mapId);
    this.validationCache.delete(mapId);

    // Clear tile data for this map
    const tileCacheKeys = this.tileCache.keys();
    tileCacheKeys.forEach(key => {
      if (key.startsWith(mapId + '-')) {
        this.tileCache.delete(key);
      }
    });
  }

  clearAll(): void {
    this.tileCache.clear();
    this.mapCache.clear();
    this.validationCache.clear();
  }

  getStats(): Record<string, any> {
    return {
      tileCache: this.tileCache.getStats(),
      mapCache: this.mapCache.getStats(),
      validationCache: this.validationCache.getStats(),
    };
  }
}

/**
 * Request deduplication cache
 * Prevents duplicate async requests for the same resource
 */
export class RequestCache<T> {
  private pending = new Map<string, Promise<T>>();
  private cache: LRUCache<T>;

  constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache<T>(options);
  }

  async get(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Check if request is already pending
    const pending = this.pending.get(key);
    if (pending) {
      return pending;
    }

    // Make new request
    const promise = fetcher().then(
      result => {
        this.cache.set(key, result);
        this.pending.delete(key);
        return result;
      },
      error => {
        this.pending.delete(key);
        throw error;
      }
    );

    this.pending.set(key, promise);
    return promise;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.pending.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }
}

/**
 * Global cache instance for the extension
 */
export const globalCache = {
  mapData: new MapDataCache(),
  requests: new RequestCache({ ttl: 300000, maxSize: 50 }),
  // Generic get method for backward compatibility
  get(key: string): any {
    // Try to parse the key to determine which cache to use
    if (key === 'activeProcesses' || key === 'performanceMetrics') {
      // Return mock data for now
      return key === 'activeProcesses' ? [] : { fps: 60, memoryUsage: 0, cpuUsage: 0 };
    }
    return undefined;
  },
  // Generic set method
  set(_key: string, _value: any): void {
    // Store in a generic way if needed
  },
};
