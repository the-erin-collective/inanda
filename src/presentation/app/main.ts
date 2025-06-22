import { enableProdMode } from '@angular/core';
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { appConfig} from '../../integration/bootstrap/app.config';

const isProd = process.env['NODE_ENV'] === 'production';
if (isProd) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers
  ],
}).catch(err => console.log(err));