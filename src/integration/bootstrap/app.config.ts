import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import { repositoryProviders } from '../../infrastructure/providers/repository/client-repository.providers';
import { clientCacheProvider } from '../../infrastructure/providers/cache/client-cache.provider';
import { UiComponent } from 'src/presentation/app/ui/ui.component';
import { PlatformComponent } from 'src/presentation/app/platform/platform.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    repositoryProviders,
    clientCacheProvider,
    { provide: 'UiZoneToken', useClass: UiComponent },
    { provide: 'EngineZoneToken', useClass: PlatformComponent },
  ]
};