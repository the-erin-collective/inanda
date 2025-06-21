import { CacheData } from '../../../domain/data/cache.interface';
import { Injectable } from '@angular/core';

/**
 * Interface for cache entries, matching structure of LevelDB cache entries
 */
interface CacheEntry<T> {
  data: T;
  version: number;
  timestamp: number;
}

/**
 * In-memory implementation of CacheData.
 * This is used when LevelDB is disabled in the configuration.
 * It provides the same interface as ServerCacheService but stores data in memory.
 */
@Injectable({ providedIn: 'root' })
export class MemoryCacheService implements CacheData {
  private cache = new Map<string, CacheEntry<any>>();
  private versions = new Map<string, number>();
  
  constructor() {
    console.log('MemoryCacheService initialized (in-memory cache)');
  }

  /**
   * Check if a key exists in the cache and has valid data
   * @param key The key to check
   * @returns True if the key exists and has valid data in the cache
   */
  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  /**
   * Gets data for a key, using the fetchFn if the key doesn't exist in cache
   * or if the cached version is outdated
   * @param key The key to get data for
   * @param fetchFn Function to fetch fresh data if needed
   * @returns The data, either from cache or freshly fetched
   */
  async getData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    try {
      // Try to get cached data
      console.log(`Attempting to get data for key: ${key} from memory cache`);
      const cached = this.cache.get(key);
      
      // Ensure the cached value exists
      if (cached) {
        const { data, version } = cached;
        const currentVersion = this.getCurrentVersion(key);
        
        console.log(`Cache hit for key: ${key}, version: ${version}, current version: ${currentVersion}`);
        
        if (version === currentVersion) {
          return data;
        } else {
          console.log(`Cache version mismatch for key: ${key}, cached: ${version}, current: ${currentVersion}`);
        }
      }
    } catch (err) {
      // This should rarely happen with in-memory implementation
      console.log(`Cache miss for key: ${key}, reason: ${err.message || 'unknown'}`);
    }

    // Fetch fresh data
    console.log(`Fetching fresh data for key: ${key}`);
    let freshData: T;
    try {
      freshData = await fetchFn();
    } catch (err) {
      console.error(`Error fetching data for key: ${key}:`, err);
      throw err;
    }
    
    if (freshData === null || freshData === undefined) {
      console.log(`Fetch function returned null/undefined for key: ${key}, not caching`);
      return freshData;
    }
    
    // Store in cache with current version
    await this.storeInCache(key, freshData);
    
    return freshData;
  }

  /**
   * Explicitly stores a value in the cache.
   * @param key The key to store data under
   * @param data The data to store
   */
  async put<T>(key: string, data: T): Promise<void> {
    await this.storeInCache(key, data);
  }

  /**
   * Invalidates a cache entry by incrementing its version
   * @param key The key to invalidate
   */
  async invalidate(key: string): Promise<void> {
    console.log(`Invalidating memory cache for key: ${key}`);
    try {
      const versionKey = `version:${key}`;
      const currentVersion = this.getCurrentVersion(key);
      const newVersion = currentVersion + 1;
      this.versions.set(versionKey, newVersion);
      console.log(`Memory cache invalidated for key: ${key}, new version: ${newVersion}`);
    } catch (err) {
      console.error(`Error invalidating memory cache for key: ${key}:`, err);
    }
  }

  /**
   * Stores data in the cache with the current version
   * @param key The key to store under
   * @param data The data to store
   */
  private async storeInCache<T>(key: string, data: T): Promise<void> {
    try {
      const currentVersion = this.getCurrentVersion(key);
      
      const cacheEntry: CacheEntry<T> = {
        data,
        version: currentVersion,
        timestamp: Date.now()
      };
      
      console.log(`Storing data in memory cache for key: ${key}, version: ${currentVersion}`);
      this.cache.set(key, cacheEntry);
      console.log(`Successfully stored data in memory cache for key: ${key}`);
    } catch (err) {
      console.error(`Error storing data in memory cache for key: ${key}:`, err);
    }
  }

  /**
   * Gets the current version for a key
   * @param key The key to get the version for
   * @returns The current version
   */
  private getCurrentVersion(key: string): number {
    const versionKey = `version:${key}`;
    const version = this.versions.get(versionKey);
    
    if (version !== undefined) {
      return version;
    }
    
    // Initialize version for this key
    this.versions.set(versionKey, 0);
    return 0;
  }
}
