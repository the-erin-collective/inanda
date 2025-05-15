import { ClassProvider } from '@angular/core';
import { CACHE_PROVIDER } from './cache.tokens';
import { ClientCacheService } from '../../data/cache/client-cache.service';

/**
 * Provider for the client-side cache implementation.
 * This is a simple pass-through that doesn't actually cache data.
 */
export const clientCacheProvider: ClassProvider = {
  provide: CACHE_PROVIDER,
  useClass: ClientCacheService
}; 