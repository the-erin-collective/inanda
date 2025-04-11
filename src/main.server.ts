import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import * as dotenv from 'dotenv';

dotenv.config(); 

const bootstrap = () => bootstrapApplication(AppComponent, {
  ...config,
  providers: [
    ...config.providers,  // Spread existing providers
    provideClientHydration(),  // Add the hydration provider here
  ],
});

export default bootstrap;