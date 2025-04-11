import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { config } from '../../enactment/app.config.server';
import { registerBootstrap } from '../../enactment/bootstrap';
import * as dotenv from 'dotenv';

dotenv.config(); 

const bootstrapFn = () => 
  bootstrapApplication(AppComponent, {
    ...config,
    providers: [
      ...config.providers,
      provideClientHydration(),
    ],
  });

registerBootstrap(bootstrapFn);

export default bootstrapFn;