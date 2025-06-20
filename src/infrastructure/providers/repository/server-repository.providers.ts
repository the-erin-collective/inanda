import { StaticProvider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { ServerPageRepository } from '../../repository/server/page.repository.server';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { ServerSiteRepository } from '../../repository/server/site.repository.server';
import { CACHE_PROVIDER } from '../cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';

export const repositoryProviders: StaticProvider[] = [
  {
    provide: PAGE_REPOSITORY,
    useFactory: (cache: CacheData) => {
      return new ServerPageRepository(cache);
    },
    deps: [CACHE_PROVIDER]
  },
  {
    provide: SITE_REPOSITORY,
    useFactory: (cache: CacheData, pageRepo: ServerPageRepository) => {
      return new ServerSiteRepository(pageRepo, cache);
    },
    deps: [CACHE_PROVIDER, ServerPageRepository]
  },
  // Provide the ServerPageRepository as a standalone provider
  {
    provide: ServerPageRepository,
    useFactory: (cache: CacheData) => {
      return new ServerPageRepository(cache);
    },
    deps: [CACHE_PROVIDER]
  }
];