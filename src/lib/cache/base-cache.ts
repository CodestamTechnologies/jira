/**
 * Base Cache Utility
 * 
 * Generic in-memory cache implementation following DRY principle.
 * All cache implementations should extend or use this base pattern.
 * 
 * This provides a consistent caching mechanism across the application,
 * reducing code duplication and ensuring uniform behavior.
 * 
 * @module lib/cache/base-cache
 */

/**
 * Generic cache entry with timestamp
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Base cache configuration
 */
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
}

/**
 * Generic in-memory cache implementation
 * 
 * @template T - Type of cached data
 */
export class BaseCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = config;
  }

  /**
   * Get cached value if it exists and is not expired
   * 
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get(key: string): T | null {
    if (!key) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp >= this.config.ttl) {
      // Expired - remove from cache
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached value
   * 
   * @param key - Cache key
   * @param value - Value to cache
   */
  set(key: string, value: T): void {
    if (!key) return;

    // Evict oldest entry if cache is full (FIFO strategy)
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired
   * 
   * @param key - Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete cached value
   * 
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp >= this.config.ttl) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
    };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}
