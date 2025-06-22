import { FactoryProvider, Optional } from '@angular/core';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { APP_CONFIG, AppConfig } from '../config/app-config.token';
import { CACHE_PROVIDER } from '../cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';
import { ServerSiteRepository } from '../../repository/server/site.repository.server';
import { ServerPageRepository } from '../../repository/server/page.repository.server';
import { MONGO_CONNECTION_FACTORY, MongoConnectionFactory } from '../../data/db/mongo.factory';
import { FileFetchService } from '../../../infrastructure/services/file-fetch.service';
import { environment } from '../../../infrastructure/environments/environment.server';

/**
 * Factory provider for the page repository.
 * Uses configuration to determine which implementation to use (MongoDB or File-based).
 */
import { FilePageRepository } from '../../repository/file/page.repository.file';
import { FileSiteRepository } from '../../repository/file/site.repository.file';

export const configPageRepositoryProvider: FactoryProvider = {
  provide: PAGE_REPOSITORY,
  useFactory: (config: AppConfig, cache: CacheData, fileFetchService :FileFetchService, mongoConnectionFactory?: MongoConnectionFactory) => {
    console.log('[configPageRepositoryProvider] Factory called');
    console.log('[configPageRepositoryProvider] config:', config);
    console.log('[configPageRepositoryProvider] cache:', cache);
    console.log('[configPageRepositoryProvider] fileFetchService:', fileFetchService);
    console.log('[configPageRepositoryProvider] mongoConnectionFactory:', mongoConnectionFactory);
    console.log(`[configPageRepositoryProvider] Creating page repository with PERSISTENT_STORAGE=${environment.PERSISTENT_STORAGE}`);
    
    // Create the appropriate repository based on config
    if (environment.PERSISTENT_STORAGE === 'FILE') {
      console.log('[configPageRepositoryProvider] Using FilePageRepository');
      return new FilePageRepository(cache, config, fileFetchService);
    } else {
      console.log('[configPageRepositoryProvider] Using ServerPageRepository with MongoDB');
      return new ServerPageRepository(cache, mongoConnectionFactory);
    }
  },
  deps: [APP_CONFIG, CACHE_PROVIDER, FileFetchService, [new Optional(), MONGO_CONNECTION_FACTORY]]
};

/**
 * Factory provider for the site repository.
 * Uses configuration to determine which implementation to use (MongoDB or File-based).
 */
export const configSiteRepositoryProvider: FactoryProvider = {
  provide: SITE_REPOSITORY,
  useFactory: (
    config: AppConfig, 
    cache: CacheData, 
    fileFetchService: FileFetchService,
    pageRepository: any,  // Use any type to support both repo types
    mongoConnectionFactory?: MongoConnectionFactory
  ) => {
    console.log('[configSiteRepositoryProvider] Factory called');
    console.log('[configSiteRepositoryProvider] config:', config);
    console.log('[configSiteRepositoryProvider] cache:', cache);
    console.log('[configSiteRepositoryProvider] fileFetchService:', fileFetchService);
    console.log('[configSiteRepositoryProvider] pageRepository:', pageRepository);
    console.log('[configSiteRepositoryProvider] mongoConnectionFactory:', mongoConnectionFactory);
    console.log(`[configSiteRepositoryProvider] Creating site repository with PERSISTENT_STORAGE=${environment.PERSISTENT_STORAGE}`);
    
    // Create the appropriate repository based on config
    if (environment.PERSISTENT_STORAGE === 'FILE') {
      console.log('[configSiteRepositoryProvider] Using FileSiteRepository');
      return new FileSiteRepository(cache, config, fileFetchService);
    } else {
      console.log('[configSiteRepositoryProvider] Using ServerSiteRepository with MongoDB');
      // The ServerSiteRepository expects a ServerPageRepository specifically
      return new ServerSiteRepository(pageRepository, cache, mongoConnectionFactory);
    }
  },
  deps: [APP_CONFIG, CACHE_PROVIDER, FileFetchService, PAGE_REPOSITORY, [new Optional(), MONGO_CONNECTION_FACTORY]]
};

/**
 * Standalone provider for ServerPageRepository
 */
export const serverPageRepositoryProvider: FactoryProvider = {
  provide: ServerPageRepository,
  useFactory: (config: AppConfig, cache: CacheData, mongoConnectionFactory?: MongoConnectionFactory) => {
    console.log(`Creating standalone ServerPageRepository with PERSISTENT_STORAGE=${environment.PERSISTENT_STORAGE}`);
    
    // Still create this regardless of config for compatibility
    // The dependency injection system will only use this when needed
    return new ServerPageRepository(cache, mongoConnectionFactory);
  },
  deps: [APP_CONFIG, CACHE_PROVIDER, [new Optional(), MONGO_CONNECTION_FACTORY]]
};
