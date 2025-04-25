import { enableProdMode } from '@angular/core';
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { environment } from './../../integration/bootstrap/app.environment';
import { provideRouter } from '@angular/router';
import { routes } from '../../integration/bootstrap/app.routes';
import { repositoryProviders } from '../../integration/providers/client-repository.provider'; 

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(withEventReplay()),
    provideRouter(routes),
    ...repositoryProviders, 
  ],
}).catch(err => console.log(err));