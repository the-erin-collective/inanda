import { FactoryProvider } from '@angular/core';
import { CACHE_PROVIDER } from './cache.tokens';
import { ServerCacheService } from '../../data/cache/server-cache.service';
import { MemoryCacheService } from '../../data/cache/memory-cache.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

/**
 * Provider for the server-side cache implementation.
 * Uses LevelDB if enabled via USE_LEVEL_DB env var, otherwise uses in-memory cache.
 */
export const serverCacheProvider: FactoryProvider = {
  provide: CACHE_PROVIDER,
  useFactory: (platformId: Object) => {
    // Only check env vars if we're on the server
    if (isPlatformServer(platformId)) {
      const useLevelDB = process.env['USE_LEVEL_DB'] !== 'false';
      console.log(`Cache type: ${useLevelDB ? 'LevelDB' : 'In-Memory'}`);
      return useLevelDB ? new ServerCacheService(platformId) : new MemoryCacheService();
    }
    // In browser, always use memory cache
    return new MemoryCacheService();
  },
  deps: [PLATFORM_ID]
};