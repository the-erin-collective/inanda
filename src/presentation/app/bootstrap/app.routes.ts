import {Routes} from '@angular/router';
import { SiteContentResolver } from '../../../enactment/resolvers/site-content.resolver';
import { AppComponent } from './../app.component';

export const routes: Routes = [
    {
        path: '',
        component: AppComponent,
        resolve: {
          siteContent: SiteContentResolver
        }
      }
];