import { PLATFORM_ID, StaticProvider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { PersistentStorageType } from '../../../domain/constants/storage-type.enum';
import { CACHE_PROVIDER } from '../cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';
import { FileSiteRepository } from '../../repository/file/site.repository.file';
import { FilePageRepository } from '../../repository/file/page.repository.file';
import { ServerSiteRepository } from '../../repository/server/site.repository.server';
import { ServerPageRepository } from '../../repository/server/page.repository.server';
import { ConfigService } from 'src/infrastructure/services/config.service';
import { FileFetchService } from 'src/infrastructure/services/file-fetch.service';

/**
 * Factory providers for repositories that respect the PERSISTENT_STORAGE environment variable
 * and provide the correct repository implementation based on its value.
 */
export const repositoryFactoryProviders: StaticProvider[] = [
  // Standalone ServerPageRepository provider for internal use
  {
    provide: ServerPageRepository,
    useFactory: (cache: CacheData) => {
      return new ServerPageRepository(cache);
    },
    deps: [CACHE_PROVIDER]
  },
  // PAGE_REPOSITORY provider that uses environment variable
  {
    provide: PAGE_REPOSITORY,
    useFactory: (platformId: Object, cache: CacheData,configService: ConfigService, fileFetchService: FileFetchService) => {
      const storageType = (process.env['PERSISTENT_STORAGE'] as PersistentStorageType) || PersistentStorageType.MONGODB;
      console.log(`Creating PAGE_REPOSITORY with storage type: ${storageType}`);
      
      if (storageType === PersistentStorageType.FILE) {
        return new FilePageRepository(platformId, cache, configService, fileFetchService);
      } else {
        return new ServerPageRepository(cache);
      }
    },
    deps: [PLATFORM_ID, CACHE_PROVIDER, ConfigService, FileFetchService]
  },
  // SITE_REPOSITORY provider that uses environment variable
  {
    provide: SITE_REPOSITORY,
    useFactory: (platformId: Object, cache: CacheData, serverPageRepo: ServerPageRepository, configService: ConfigService, fileFetchService: FileFetchService) => {
      const storageType = (process.env['PERSISTENT_STORAGE'] as PersistentStorageType) || PersistentStorageType.MONGODB;
      console.log(`Creating SITE_REPOSITORY with storage type: ${storageType}`);
      
      if (storageType === PersistentStorageType.FILE) {
        return new FileSiteRepository(platformId, cache, configService, fileFetchService);
      } else {
        return new ServerSiteRepository(serverPageRepo, cache);
      }
    },
    deps: [PLATFORM_ID, CACHE_PROVIDER, ServerPageRepository, ConfigService, FileFetchService]
  }
];
