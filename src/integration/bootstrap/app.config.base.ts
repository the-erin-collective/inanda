import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { UiComponent } from '../../presentation/app/ui/ui.component';
import { PlatformComponent } from '../../presentation/app/platform/platform.component';

export const baseConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: 'UiZoneToken', useClass: UiComponent },
    { provide: 'EngineZoneToken', useClass: PlatformComponent },
  ]
}; 