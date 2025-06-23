import 'core-js/features/async-iterator';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config.server';
import { AppComponent } from '../../presentation/app/app.component';

// This is the default export needed for server-side rendering
// The Angular build:application builder will use this to 
// generate the angular-app-engine-manifest.mjs file
export default () => bootstrapApplication(AppComponent, appConfig);
