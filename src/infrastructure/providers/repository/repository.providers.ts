import { Provider } from '@angular/core';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.token';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.token';

import { RepositoryFactory } from '../../repository/repository.factory';
import { PersistentStorageType } from '../../../domain/constants/storage-type.enum';

export const repositoryProviders: Provider[] = [
  {
    provide: SITE_REPOSITORY,
    useFactory: () => {
      const storageType = (process.env['PERSISTENT_STORAGE'] as PersistentStorageType) || PersistentStorageType.MONGODB;
      return RepositoryFactory.createSiteRepository(storageType);
    }
  },
  {
    provide: PAGE_REPOSITORY,
    useFactory: () => {
      const storageType = (process.env['PERSISTENT_STORAGE'] as PersistentStorageType) || PersistentStorageType.MONGODB;
      return RepositoryFactory.createPageRepository(storageType);
    }
  },
];
