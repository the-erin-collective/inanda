import { ApplicationConfig, provideZoneChangeDetection, ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from '../../common/services/global-error-handler';
import { provideRouter, UrlSerializer } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { clientRepositoryProviders } from '../../infrastructure/providers/repository/client-repository.providers';
import { clientCacheProvider } from '../../infrastructure/providers/cache/client-cache.provider';
import { provideClientHydration } from '@angular/platform-browser';
import { SourcecodeLinkComponent } from 'src/presentation/app/ui/sourcecode-link/sourcecode-link.component';
import { PlatformComponent } from 'src/presentation/app/platform/platform.component';
import { CustomUrlSerializer } from '../../infrastructure/routing/custom-url-serializer';
import {appConfigProvider} from '../../infrastructure/providers/config/app-config.provider';
import { githubBannerConfigProvider } from '../../infrastructure/providers/config/github-banner-config.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),    
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(),
    ...clientRepositoryProviders,
    clientCacheProvider,
    appConfigProvider,
    githubBannerConfigProvider,
    { provide: 'UiZoneToken', useClass: SourcecodeLinkComponent },
    { provide: 'EngineZoneToken', useClass: PlatformComponent },
    { provide: UrlSerializer, useClass: CustomUrlSerializer },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};