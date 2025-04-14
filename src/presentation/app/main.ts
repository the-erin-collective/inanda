import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

console.log('process.env:', JSON.stringify(process.env, null, 2));
console.log('MONGO_URI:', process.env['MONGO_URI'] || 'MONGO_URI is undefined');

import { enableProdMode } from '@angular/core';
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { environment } from './../../infrastructure/environments/environment';
import { provideRouter } from '@angular/router';
import { routes } from '../app/bootstrap/app.routes';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(withEventReplay()),
    provideRouter(routes)
  ]
}).catch(err => console.log(err));