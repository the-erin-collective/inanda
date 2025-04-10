import { enableProdMode } from '@angular/core';
import { bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [provideClientHydration(withEventReplay())]
}).catch(err => console.log(err));