import { StaticProvider, Optional } from '@angular/core';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { ServerPageRepository } from '../../repository/server/page.repository.server';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { ServerSiteRepository } from '../../repository/server/site.repository.server';
import { CACHE_PROVIDER } from '../cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';
import { MONGO_CONNECTION_FACTORY, MongoConnectionFactory } from '../../data/db/mongo.factory';
import { ServerStylesheetRepository } from '../../repository/server/stylesheet.repository.server';

export const repositoryProviders: StaticProvider[] = [
  {
    provide: PAGE_REPOSITORY,
    useFactory: (cache: CacheData, mongoConnectionFactory?: MongoConnectionFactory) => {
      return new ServerPageRepository(cache, mongoConnectionFactory);
    },
    deps: [CACHE_PROVIDER, [new Optional(), MONGO_CONNECTION_FACTORY]]
  },
  {
    provide: SITE_REPOSITORY,
    useFactory: (cache: CacheData, pageRepo: ServerPageRepository, mongoConnectionFactory?: MongoConnectionFactory) => {
      return new ServerSiteRepository(
        pageRepo,
        cache,
        mongoConnectionFactory
      );
    },
    deps: [CACHE_PROVIDER, ServerPageRepository, [new Optional(), MONGO_CONNECTION_FACTORY]]
  },
  // Provide the ServerPageRepository as a standalone provider
  {
    provide: ServerPageRepository,
    useFactory: (cache: CacheData, mongoConnectionFactory?: MongoConnectionFactory) => {
      return new ServerPageRepository(cache, mongoConnectionFactory);
    },
    deps: [CACHE_PROVIDER, [new Optional(), MONGO_CONNECTION_FACTORY]]
  },
  // Provide the ServerStylesheetRepository as a standalone provider
  {
    provide: ServerStylesheetRepository,
    useFactory: (cache: CacheData) => {
      return new ServerStylesheetRepository(cache);
    },
    deps: [CACHE_PROVIDER]
  }
];