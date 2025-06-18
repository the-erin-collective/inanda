import {Routes} from '@angular/router';
import { SiteContentResolver } from '../../enactment/resolvers/site-content.resolver';
import { AppComponent } from '../../presentation/app/app.component';
import { DEFAULT_SITE_ID } from '../../domain/constants/site.constants';

export const routes: Routes = [
    {
        path: '',
        redirectTo: DEFAULT_SITE_ID,
        pathMatch: 'full'
    },
    // Dynamic routes for site and pages
    {
        path: ':siteId/:pageId', // This will match /site-001/page-1
        component: AppComponent,
        resolve: {
          siteContent: SiteContentResolver // Resolver will use siteId
        }
    },
    {
        path: ':siteId',
        component: AppComponent,
        resolve: {
          siteContent: SiteContentResolver
        }
    }
];