import { FactoryProvider, PLATFORM_ID } from '@angular/core';
import { CACHE_PROVIDER } from './cache.tokens';
import { ServerCacheService } from '../../data/cache/server-cache.service';
import { MemoryCacheService } from '../../data/cache/memory-cache.service';
import { environment } from '../../environments/environment.server';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

/**
 * Provider for cache implementation based on configuration
 * When USE_LEVEL_DB is true, uses ServerCacheService (LevelDB)
 * When USE_LEVEL_DB is false, uses MemoryCacheService (in-memory implementation)
 */
export const configCacheProvider: FactoryProvider = {
  provide: CACHE_PROVIDER,
  useFactory: (platformId: Object) => {
    // Only use ServerCacheService on server-side AND when USE_LEVEL_DB=true
    if (isPlatformBrowser(platformId)){
      return new MemoryCacheService();
    } 
    
    if(environment.USE_LEVEL_DB === true) {
      console.log('Using LevelDB cache implementation (ServerCacheService)');
      try {
        // Pass both platformId and config to ServerCacheService
        return new ServerCacheService(platformId);
      } catch (err) {
        // If there's any error creating ServerCacheService, fall back to memory
        console.error('Error creating ServerCacheService, falling back to MemoryCacheService:', err);
        return new MemoryCacheService();
      }
    } else {
      console.log('Using in-memory cache implementation (MemoryCacheService)');
      return new MemoryCacheService();
    }
  },
  deps: [PLATFORM_ID]
};
