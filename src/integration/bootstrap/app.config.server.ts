import { ApplicationConfig, importProvidersFrom, ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from '../../common/services/global-error-handler';
import { provideRouter, UrlSerializer } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { CustomUrlSerializer } from '../../infrastructure/routing/custom-url-serializer';
import { repositoryProviders } from '../../infrastructure/providers/repository/server-repository.providers';
import { serverCacheProvider } from '../../infrastructure/providers/cache/server-cache.provider';
import { provideClientHydration } from '@angular/platform-browser';

const serverConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideClientHydration(),
    repositoryProviders,
    serverCacheProvider,
    { provide: UrlSerializer, useClass: CustomUrlSerializer },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};

export const config = serverConfig;
