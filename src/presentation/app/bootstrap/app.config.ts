import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import { repositoryProviders } from '../../../infrastructure/providers/repository.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    repositoryProviders
  ]
};