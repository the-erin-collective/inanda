import { Injectable } from '@angular/core';
import { SiteContentData } from '../../../domain/data/site-content.data.interface';
import { SiteContent } from '../../../domain/aggregates/site-content.aggregate';

@Injectable({
  providedIn: 'root',
})
export class AppSiteContentData implements SiteContentData {
  private site: SiteContent | null = null;

  setSiteData(site: SiteContent | null): void {
    this.site = site;
  }

  async getData(): Promise<SiteContent | null> {
    return this.site;
  }
}