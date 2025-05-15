import { CacheData } from '../../../domain/data/cache.interface';
import { Injectable } from '@angular/core';

/**
 * Client-side implementation of CacheData that is a simple pass-through.
 * This doesn't actually cache data, but it implements the CacheData interface
 * so it can be used in place of ServerCacheService on the client.
 */
@Injectable({ providedIn: 'root' })
export class ClientCacheService implements CacheData {
  constructor() {
    console.log('Initializing ClientCacheService');
  }

  async getData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // On the client, we don't cache data, we just fetch it
    return await fetchFn();
  }

  async invalidate(key: string): Promise<void> {
    // No-op on client side
    console.log(`Client cache invalidation for key ${key} (no-op)`);
  }
  
  async exists(key: string): Promise<boolean> {
    // Client never has cached data
    return false;
  }
  
  async put<T>(key: string, data: T): Promise<void> {
    // No-op on client side
    console.log(`Client cache put for key ${key} (no-op)`);
  }
}
