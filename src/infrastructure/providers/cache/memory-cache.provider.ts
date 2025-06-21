import { ClassProvider } from '@angular/core';
import { CACHE_PROVIDER } from './cache.tokens';
import { MemoryCacheService } from '../../data/cache/memory-cache.service';

/**
 * Provider for the in-memory server-side cache when LevelDB is disabled.
 */
export const memoryCacheProvider: ClassProvider = {
  provide: CACHE_PROVIDER,
  useClass: MemoryCacheService
};
