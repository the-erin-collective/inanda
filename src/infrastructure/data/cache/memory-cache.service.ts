import { CacheData } from '../../../domain/data/cache.interface';
import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  version: number;
  timestamp: number;
}

/**
 * In-memory implementation of CacheData.
 * This is used when LevelDB is disabled.
 */
@Injectable({ providedIn: 'root' })
export class MemoryCacheService implements CacheData {
  private cache = new Map<string, CacheEntry<any>>();
    constructor() {
    console.log('MemoryCacheService initialized (in-memory cache)');
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async getData<T>(key: string, defaultValueFn: () => Promise<T | null>): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      const value = await defaultValueFn();
      if (value !== null) {
        this.cache.set(key, {
          data: value,
          version: 1,
          timestamp: Date.now()
        });
      }
      return value;
    }
    return entry.data;
  }

  async put<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, {
      data: value,
      version: 1,
      timestamp: Date.now()
    });
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}
