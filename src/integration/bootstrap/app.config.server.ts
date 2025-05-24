import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { repositoryProviders } from '../../infrastructure/providers/repository/server-repository.providers';
import { serverCacheProvider } from '../../infrastructure/providers/cache/server-cache.provider';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    ...repositoryProviders,
    serverCacheProvider
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
