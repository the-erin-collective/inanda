import { ApplicationConfig } from '@angular/core';
import { repositoryProviders } from '../../infrastructure/providers/repository/client-repository.providers';
import { clientCacheProvider } from '../../infrastructure/providers/cache/client-cache.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    ...repositoryProviders,
    clientCacheProvider
  ],
}; 