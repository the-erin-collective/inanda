import { enableProdMode } from '@angular/core';
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ConfigService } from './config.service';
import { provideRouter } from '@angular/router';
import { routes } from '../../integration/bootstrap/app.routes';
import { repositoryProviders } from '../../integration/providers/client-repository.provider'; 

const configService = new ConfigService();
if (configService.get('showGithubBanner')) {
  console.log('Production environment detected');
}

if (configService.get('production')) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(withEventReplay()),
    provideRouter(routes),
    ...repositoryProviders, 
  ],
}).catch(err => console.log(err));