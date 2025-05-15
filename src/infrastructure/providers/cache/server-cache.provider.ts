import { ClassProvider } from '@angular/core';
import { CACHE_PROVIDER } from './cache.tokens';
import { ServerCacheService } from '../../data/cache/server-cache.service';

/**
 * Provider for the server-side cache implementation.
 * This uses LevelDB and should only be used in server-side contexts.
 */
export const serverCacheProvider: ClassProvider = {
  provide: CACHE_PROVIDER,
  useClass: ServerCacheService
}; 