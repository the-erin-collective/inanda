import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import { repositoryProviders } from '../../infrastructure/providers/repository/server-repository.providers';
import { UiComponent } from 'src/presentation/app/ui/ui.component';
import { PlatformComponent } from 'src/presentation/app/platform/platform.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    repositoryProviders,
    { provide: 'UiZoneToken', useClass: UiComponent },
    { provide: 'EngineZoneToken', useClass: PlatformComponent },
  ]
};