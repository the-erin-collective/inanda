import { InjectionToken } from '@angular/core';
import { SiteContent } from '../aggregates/site-content.aggregate';

export interface SiteContentData {
  getData(): Promise<SiteContent | null>;
  setSiteData(site: SiteContent | null): void;
}

export const SITE_CONTENT_DATA = new InjectionToken<SiteContentData>('SiteContentData');