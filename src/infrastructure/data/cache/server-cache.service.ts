import { CacheData } from '../../../domain/data/cache.interface';
import { getLevelDB } from './level-db.factory';
import { Level } from 'level';
import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  version: number;
  timestamp: number;
}

/**
 * Server-side implementation of CacheData that uses LevelDB.
 * This is strictly for server-side use only.
 */
@Injectable({ providedIn: 'root' })
export class ServerCacheService implements CacheData {
  private db: Level<string, any>;
  
  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    // Ensure this service is only used on the server
    if (!isPlatformServer(platformId)) {
      throw new Error('ServerCacheService can only be used on the server side');
    }
    
    // Get the LevelDB instance that was initialized during server bootstrap
    this.db = getLevelDB();
    console.log('ServerCacheService initialized');
  }

  /**
   * Check if a key exists in the cache and has valid data
   * @param key The key to check
   * @returns True if the key exists and has valid data in the cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.db.get(key);
      // Check if the value exists and has the correct structure with data
      return value && 
             typeof value === 'object' && 
             'data' in value && 
             value.data !== null && 
             value.data !== undefined;
    } catch (err) {
      return false;
    }
  }

  async getData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    try {
      // Try to get cached data
      console.log(`Attempting to get data for key: ${key} from cache`);
      const cached = await this.db.get(key);
      
      // Ensure the cached value exists and has the correct structure with data
      if (!cached || typeof cached !== 'object' || !('data' in cached) || 
          cached.data === null || cached.data === undefined) {
        console.log(`Invalid cache entry for key: ${key}, fetching fresh data`);
        throw new Error('Cache miss - invalid or empty data');
      }
      
      const { data, version } = cached;
      const currentVersion = await this.getCurrentVersion(key);
      
      console.log(`Cache hit for key: ${key}, version: ${version}, current version: ${currentVersion}`);
      
      if (version === currentVersion) {
        return data;
      } else {
        console.log(`Cache version mismatch for key: ${key}, cached: ${version}, current: ${currentVersion}`);
      }
    } catch (err) {
      // Key doesn't exist or is invalid - this is expected
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

  private async storeInCache<T>(key: string, data: T): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion(key);
      
      const cacheEntry: CacheEntry<T> = {
        data,
        version: currentVersion,
        timestamp: Date.now()
      };
      
      console.log(`Storing data in cache for key: ${key}, version: ${currentVersion}`);
      await this.db.put(key, cacheEntry);
      console.log(`Successfully stored data in cache for key: ${key}`);
    } catch (err) {
      console.error(`Error storing data in cache for key: ${key}:`, err);
    }
  }

  private async getCurrentVersion(key: string): Promise<number> {
    try {
      const versionKey = `version:${key}`;
      console.log(`Getting version for key: ${key}`);
      
      try {
        const versionData = await this.db.get(versionKey);
        if (typeof versionData === 'number') {
          console.log(`Found version for key ${key}: ${versionData}`);
          return versionData;
        } else if (versionData && typeof versionData === 'object' && 'version' in versionData) {
          // Handle case where version is stored as an object
          console.log(`Found object version for key ${key}: ${versionData.version}`);
          return versionData.version;
        } else {
          console.log(`Invalid version data for key ${key}: ${JSON.stringify(versionData)}, using 0`);
          // Initialize version for this key
          await this.db.put(versionKey, 0);
          return 0;
        }
      } catch (err) {
        // Version key doesn't exist yet
        console.log(`No version found for key ${key}, initializing to 0`);
        // Create an initial version
        await this.db.put(versionKey, 0);
        return 0;
      }
    } catch (err) {
      console.error(`Error getting version for key ${key}:`, err);
      return 0;
    }
  }

  async invalidate(key: string): Promise<void> {
    console.log(`Invalidating cache for key: ${key}`);
    try {
      const versionKey = `version:${key}`;
    const currentVersion = await this.getCurrentVersion(key);
      const newVersion = currentVersion + 1;
      await this.db.put(versionKey, newVersion);
      console.log(`Cache invalidated for key: ${key}, new version: ${newVersion}`);
    } catch (err) {
      console.error(`Error invalidating cache for key: ${key}:`, err);
    }
  }
  
  /**
   * Explicitly stores a value in the cache.
   * This is useful when you want to store data without going through the getData mechanism.
   */
  async put<T>(key: string, data: T): Promise<void> {
    await this.storeInCache(key, data);
  }
}
