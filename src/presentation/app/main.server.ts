import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { config } from '../../infrastructure/bootstrap/app.config.server';
import { registerBootstrap } from '../../infrastructure/bootstrap/bootstrap';

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