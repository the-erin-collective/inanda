import { FactoryProvider, PLATFORM_ID } from '@angular/core';
import { CACHE_PROVIDER } from './cache.tokens';
import { ServerCacheService } from '../../data/cache/server-cache.service';
import { MemoryCacheService } from '../../data/cache/memory-cache.service';
import { APP_CONFIG, AppConfig } from '../config/app-config.token';
import { isPlatformServer } from '@angular/common';

/**
 * Provider for cache implementation based on configuration
 * When USE_LEVEL_DB is true, uses ServerCacheService (LevelDB)
 * When USE_LEVEL_DB is false, uses MemoryCacheService (in-memory implementation)
 */
export const configCacheProvider: FactoryProvider = {
  provide: CACHE_PROVIDER,
  useFactory: (config: AppConfig, platformId: Object) => {
    // Log the actual config value to verify it's being read correctly
    console.log(`Creating cache provider based on USE_LEVEL_DB=${config.USE_LEVEL_DB}`);
    
    // Defensive check in case config isn't loaded properly
    if (!config) {
      console.error('No config provided to cache factory! Defaulting to MemoryCacheService');
      return new MemoryCacheService();
    }
    
    // Only use ServerCacheService on server-side AND when USE_LEVEL_DB=true
    if (isPlatformServer(platformId) && config.USE_LEVEL_DB === true) {
      console.log('Using LevelDB cache implementation (ServerCacheService)');
      try {
        // Pass both platformId and config to ServerCacheService
        return new ServerCacheService(platformId, config);
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
  deps: [APP_CONFIG, PLATFORM_ID]
};
