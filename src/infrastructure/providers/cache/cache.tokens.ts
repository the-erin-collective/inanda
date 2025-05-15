import { InjectionToken } from '@angular/core';
import { CacheData } from '../../../domain/data/cache.interface';

export const CACHE_PROVIDER = new InjectionToken<CacheData>('CACHE_PROVIDER'); 