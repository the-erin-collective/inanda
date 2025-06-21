import { ApplicationConfig, importProvidersFrom, ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from '../../common/services/global-error-handler';
import { provideRouter, UrlSerializer } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { CustomUrlSerializer } from '../../infrastructure/routing/custom-url-serializer';
import { provideClientHydration } from '@angular/platform-browser';

// Import config-driven providers
import { appConfigProvider } from '../../infrastructure/providers/config/app-config.provider';
import { configCacheProvider } from '../../infrastructure/providers/cache/config-cache.provider';
import { configPageRepositoryProvider, configSiteRepositoryProvider, serverPageRepositoryProvider } from '../../infrastructure/providers/repository/config-repository.providers';
import { mongoConnectionProvider } from '../../infrastructure/data/db/mongo-connection.provider';
import { provideServerRendering } from '@angular/platform-server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideClientHydration(),
    provideServerRendering(), 
    // Config provider must be first since other providers depend on it
    appConfigProvider,
    // Cache provider comes next
    configCacheProvider,
    // Database connection provider
    mongoConnectionProvider,
    // Repository providers that depend on the above
    serverPageRepositoryProvider,
    configPageRepositoryProvider, 
    configSiteRepositoryProvider,
    // Other providers
    { provide: UrlSerializer, useClass: CustomUrlSerializer },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};

// Only export a single name for clarity
export const appConfig = serverConfig;
