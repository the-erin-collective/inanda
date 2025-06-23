import { FactoryProvider, Optional, PLATFORM_ID } from '@angular/core';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { AppConfig, ConfigService } from '../../services/config.service';
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
  useFactory: (platformId: Object, configService: ConfigService, cache: CacheData, fileFetchService :FileFetchService) => {
    // Create the appropriate repository based on config
    if (environment.PERSISTENT_STORAGE === 'FILE') {
      console.log('[configPageRepositoryProvider] Using FilePageRepository');
      return new FilePageRepository(platformId, cache, configService, fileFetchService);
    } else {
      console.log('[configPageRepositoryProvider] Using ServerPageRepository with MongoDB');
      return new ServerPageRepository(cache);
    }
  },
  deps: [PLATFORM_ID, ConfigService, CACHE_PROVIDER, FileFetchService]
};

/**
 * Factory provider for the site repository.
 * Uses configuration to determine which implementation to use (MongoDB or File-based).
 */
export const configSiteRepositoryProvider: FactoryProvider = {
  provide: SITE_REPOSITORY,
  useFactory: (
    platformId: Object,
    configService: ConfigService, 
    cache: CacheData, 
    fileFetchService: FileFetchService,
    pageRepository: any
  ) => {
    // Create the appropriate repository based on config
    if (environment.PERSISTENT_STORAGE === 'FILE') {
      console.log('[configSiteRepositoryProvider] Using FileSiteRepository');
      return new FileSiteRepository(platformId, cache, configService, fileFetchService);
    } else {
      console.log('[configSiteRepositoryProvider] Using ServerSiteRepository with MongoDB');
      // The ServerSiteRepository expects a ServerPageRepository specifically
      return new ServerSiteRepository(pageRepository, cache);
    }
  },
  deps: [PLATFORM_ID, ConfigService, CACHE_PROVIDER, FileFetchService, PAGE_REPOSITORY]
};

/**
 * Standalone provider for ServerPageRepository
 */
export const serverPageRepositoryProvider: FactoryProvider = {
  provide: ServerPageRepository,
  useFactory: (config: AppConfig, cache: CacheData) => {
    console.log(`Creating standalone ServerPageRepository with PERSISTENT_STORAGE=${environment.PERSISTENT_STORAGE}`);
    
    // Still create this regardless of config for compatibility
    // The dependency injection system will only use this when needed
    return new ServerPageRepository(cache);
  },
  deps: [ConfigService, CACHE_PROVIDER]
};
