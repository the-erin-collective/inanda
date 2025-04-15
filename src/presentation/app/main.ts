import { enableProdMode } from '@angular/core';
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { environment } from './../../infrastructure/environments/environment';
import { provideRouter } from '@angular/router';
import { routes } from '../app/bootstrap/app.routes';
import { repositoryProviders } from './../../infrastructure/providers/repository.providers'; // Import repositoryProviders

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(withEventReplay()),
    provideRouter(routes),
    ...repositoryProviders, // Register repository providers here
  ],
}).catch(err => console.log(err));