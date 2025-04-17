import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { makeStateKey } from '@angular/core';
import { TransferState } from '@angular/core';
import { SiteContentService } from '../services/site-content.service';
import { SiteContent } from '../../domain/aggregates/site-content.aggregate';

const SITE_CONTENT_KEY = makeStateKey<SiteContent | null>('siteContent');

@Injectable({
  providedIn: 'root',
})
export class SiteContentResolver implements Resolve<Promise<SiteContent | null>> {
  constructor(
    private siteContentService: SiteContentService,
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  resolve(route: ActivatedRouteSnapshot): Promise<SiteContent | null> {
    console.log('Resolving site content...');
    
    if (this.transferState.hasKey(SITE_CONTENT_KEY)) {
      // Use preloaded data from TransferState
      const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
      console.log('Using preloaded site content:', siteContent);
      return Promise.resolve(siteContent);
    }

    if (isPlatformServer(this.platformId)) {
      const siteId = route.paramMap.get('siteId') ?? 'site-001';
      console.log('Resolving site content for siteId:', siteId);

      return this.siteContentService.getSiteContent(siteId).then((data) => {
        console.log('Resolved site content:', data);
        this.transferState.set(SITE_CONTENT_KEY, data); // Store data in TransferState
        return data;
      }).catch((err) => {
        console.error('Error resolving site content:', err);
        return null;
      });
    } else {
      console.warn('SiteContentResolver skipped on the client.');
      return Promise.resolve(null);
    }
  }
}