import { ApplicationConfig } from '@angular/core';
import { clientRepositoryFactoryProviders } from '../../infrastructure/providers/repository/client-repository-factory.providers';
import { clientCacheProvider } from '../../infrastructure/providers/cache/client-cache.provider';

export const appConfig: ApplicationConfig = {  providers: [
    ...clientRepositoryFactoryProviders,
    clientCacheProvider
  ],
}; 