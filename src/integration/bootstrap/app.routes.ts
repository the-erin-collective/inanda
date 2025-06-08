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
    // Static assets routes - these should not be handled by Angular router
    {
        path: 'favicon.ico',
        redirectTo: '/favicon.ico',
        pathMatch: 'full'
    },    {
        path: 'assets/**',
        redirectTo: '/assets/**',
        pathMatch: 'prefix'
    },
    // Site route - catch-all for site IDs (static assets handled above)
    {
        path: ':siteId',
        component: AppComponent,
        resolve: {
          siteContent: SiteContentResolver
        }
    }
];