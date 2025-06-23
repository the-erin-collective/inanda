import { makeStateKey } from '@angular/core';
import { SiteContent } from '../../domain/aggregates/site-content.aggregate';

// Define a consistent key to be used by both server and client
export const SITE_CONTENT_KEY = makeStateKey<SiteContent>('siteContent');
