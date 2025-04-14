import 'core-js/features/async-iterator';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { URL } from 'url';
globalThis.URL = URL as unknown as typeof globalThis.URL;

if (!globalThis.AsyncIteratorPrototype) {
    try {
        const asyncGenFunction = async function* () {};
        globalThis.AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(asyncGenFunction.prototype));
        console.log('Patched AsyncIteratorPrototype:', globalThis.AsyncIteratorPrototype);
    } catch (error) {
        console.error('Failed to patch AsyncIteratorPrototype:', error);
        globalThis.AsyncIteratorPrototype = null; // Fallback
    }
}

import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { config } from '../app/bootstrap/app.config.server';
import { registerBootstrap } from '../../infrastructure/bootstrap/bootstrap';
import { provideRouter } from '@angular/router';
import { routes } from '../app/bootstrap/app.routes';
import { repositoryProviders } from './../../infrastructure/providers/repository.providers';

const bootstrapFn = () => 
  bootstrapApplication(AppComponent, {
    ...config,
    providers: [
      ...config.providers,
      provideClientHydration(),
      provideRouter(routes),
      repositoryProviders
    ],
  });

registerBootstrap(bootstrapFn);

export default bootstrapFn;