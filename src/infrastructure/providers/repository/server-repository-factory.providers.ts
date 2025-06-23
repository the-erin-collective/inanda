import { StaticProvider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { PersistentStorageType } from '../../../domain/constants/storage-type.enum';
import { CACHE_PROVIDER } from '../cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';
import { FileSiteRepository } from '../../repository/file/site.repository.file';
import { FilePageRepository } from '../../repository/file/page.repository.file';
import { ServerSiteRepository } from '../../repository/server/site.repository.server';
import { ServerPageRepository } from '../../repository/server/page.repository.server';

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
    useFactory: (cache: CacheData) => {
      const storageType = (process.env['PERSISTENT_STORAGE'] as PersistentStorageType) || PersistentStorageType.MONGODB;
      console.log(`Creating PAGE_REPOSITORY with storage type: ${storageType}`);
      
      if (storageType === PersistentStorageType.FILE) {
        return new FilePageRepository(cache);
      } else {
        return new ServerPageRepository(cache);
      }
    },
    deps: [CACHE_PROVIDER]
  },
  // SITE_REPOSITORY provider that uses environment variable
  {
    provide: SITE_REPOSITORY,
    useFactory: (cache: CacheData, serverPageRepo: ServerPageRepository) => {
      const storageType = (process.env['PERSISTENT_STORAGE'] as PersistentStorageType) || PersistentStorageType.MONGODB;
      console.log(`Creating SITE_REPOSITORY with storage type: ${storageType}`);
      
      if (storageType === PersistentStorageType.FILE) {
        return new FileSiteRepository(cache);
      } else {
        return new ServerSiteRepository(serverPageRepo, cache);
      }
    },
    deps: [CACHE_PROVIDER, ServerPageRepository]
  }
];
