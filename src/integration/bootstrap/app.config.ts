import { ApplicationConfig, provideZoneChangeDetection, ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from '../../common/services/global-error-handler';
import { provideRouter, UrlSerializer } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { repositoryProviders } from '../../infrastructure/providers/repository/client-repository.providers';
import { clientCacheProvider } from '../../infrastructure/providers/cache/client-cache.provider';
import { provideClientHydration } from '@angular/platform-browser';
import { UiComponent } from 'src/presentation/app/ui/ui.component';
import { PlatformComponent } from 'src/presentation/app/platform/platform.component';
import { CustomUrlSerializer } from '../../infrastructure/routing/custom-url-serializer';

import { clientStylesheetProviders } from '../../infrastructure/providers/repository/client-stylesheet.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),    
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(),
    repositoryProviders,
    clientCacheProvider,
    ...clientStylesheetProviders,
    { provide: 'UiZoneToken', useClass: UiComponent },
    { provide: 'EngineZoneToken', useClass: PlatformComponent },
    { provide: UrlSerializer, useClass: CustomUrlSerializer },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};