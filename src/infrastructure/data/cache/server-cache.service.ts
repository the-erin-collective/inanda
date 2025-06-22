import { CacheData } from '../../../domain/data/cache.interface';
import { createLevelDB, getLevelDB } from './level-db.factory';
import { Level } from 'level';
import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { environment } from '../../environments/environment.server';

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
  private initialized = false;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Ensure this service is only used on the server
    if (!isPlatformServer(platformId)) {
      throw new Error('ServerCacheService can only be used on the server side');
    }
    
    // We'll initialize LevelDB lazily when methods are called to ensure config is respected
    console.log('ServerCacheService constructor called');
  }
  
  /**
   * Initializes the LevelDB connection if needed
   * @private
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Check if we should use LevelDB based on config
    const shouldUseLevelDB = environment.USE_LEVEL_DB !== false;
    
    if (!shouldUseLevelDB) {
      throw new Error('ServerCacheService is configured not to use LevelDB (USE_LEVEL_DB=false), but it was invoked anyway');
    }
    
    try {
      // Try to get existing LevelDB instance first
      try {
        this.db = getLevelDB();
        console.log('ServerCacheService using existing LevelDB instance');
      } catch (err) {
        // If no instance exists, create a new one
        console.log('No existing LevelDB instance, creating new one');
        this.db = await createLevelDB();
      }
      
      this.initialized = true;
    } catch (err) {
      console.error('Error initializing LevelDB in ServerCacheService:', err);
      throw err;
    }
  }

  /**
   * Check if a key exists in the cache and has valid data
   * @param key The key to check
   * @returns True if the key exists and has valid data in the cache
   */  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const value = await this.db.get(key);
      // Check if the value exists and has the correct structure with data
      return value && 
             typeof value === 'object' && 
             'data' in value && 
             value.data !== null && 
             value.data !== undefined;
    } catch (err) {
      // If error is due to initialization issues, rethrow
      if (err.message?.includes('configured not to use LevelDB')) {
        throw err;
      }
      return false;
    }
  }
  async getData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    try {
      await this.ensureInitialized();
      
      // Try to get cached data
      console.log(`Attempting to get data for key: ${key} from LevelDB cache`);
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
      // If error is due to initialization issues, rethrow
      if (err.message?.includes('configured not to use LevelDB')) {
        throw err;
      }
      
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
      await this.ensureInitialized();
      
      const currentVersion = await this.getCurrentVersion(key);
      
      const cacheEntry: CacheEntry<T> = {
        data,
        version: currentVersion,
        timestamp: Date.now()
      };
      
      console.log(`Storing data in LevelDB cache for key: ${key}, version: ${currentVersion}`);
      await this.db.put(key, cacheEntry);
      console.log(`Successfully stored data in LevelDB cache for key: ${key}`);
    } catch (err) {
      // If error is due to initialization issues, rethrow
      if (err.message?.includes('configured not to use LevelDB')) {
        throw err;
      }
      
      console.error(`Error storing data in cache for key: ${key}:`, err);
    }
  }
  private async getCurrentVersion(key: string): Promise<number> {
    try {
      await this.ensureInitialized();
      
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
      // If error is due to initialization issues, rethrow
      if (err.message?.includes('configured not to use LevelDB')) {
        throw err;
      }
      
      console.error(`Error getting version for key ${key}:`, err);
      return 0;
    }
  }
  async invalidate(key: string): Promise<void> {
    console.log(`Invalidating LevelDB cache for key: ${key}`);
    try {
      await this.ensureInitialized();
      
      const versionKey = `version:${key}`;
      const currentVersion = await this.getCurrentVersion(key);
      const newVersion = currentVersion + 1;
      await this.db.put(versionKey, newVersion);
      console.log(`LevelDB cache invalidated for key: ${key}, new version: ${newVersion}`);
    } catch (err) {
      // If error is due to initialization issues, rethrow
      if (err.message?.includes('configured not to use LevelDB')) {
        throw err;
      }
      
      console.error(`Error invalidating LevelDB cache for key: ${key}:`, err);
    }
  }
    /**
   * Explicitly stores a value in the cache.
   * This is useful when you want to store data without going through the getData mechanism.
   */
  async put<T>(key: string, data: T): Promise<void> {
    try {
      await this.ensureInitialized();
      await this.storeInCache(key, data);
    } catch (err) {
      // If error is due to initialization issues, rethrow
      if (err.message?.includes('configured not to use LevelDB')) {
        throw err;
      }
      
      console.error(`Error in put for key ${key}:`, err);
      throw err;
    }
  }
}
