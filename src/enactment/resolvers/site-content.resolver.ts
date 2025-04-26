import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { makeStateKey, TransferState } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SiteContentService } from '../services/site-content.service';
import { SiteContent } from '../../domain/aggregates/site-content.aggregate';

const SITE_CONTENT_KEY = makeStateKey<SiteContent | null>('siteContent');

@Injectable({
  providedIn: 'root',
})
export class SiteContentResolver implements Resolve<Promise<SiteContent>> {
  private siteContentSubject = new BehaviorSubject<SiteContent | null>(null);

  constructor(
    private siteContentService: SiteContentService,
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  get siteContent$() {
    return this.siteContentSubject.asObservable();
  }

  async resolve(route: ActivatedRouteSnapshot): Promise<SiteContent> {
    console.log('Resolving site content...');

    // Check if data is available in TransferState
    if (this.transferState.hasKey(SITE_CONTENT_KEY)) {
      const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
      console.log('Using preloaded site content:', siteContent);
      if (siteContent) {
        this.siteContentSubject.next(siteContent); // Emit the data
        return siteContent;
      }
    }

    // Fetch data from the service
    const siteId = route.paramMap.get('siteId') ?? 'site-001';
    console.log('Fetching site content for siteId:', siteId);

    try {
      const siteContent = await this.siteContentService.getSiteContent(siteId);
      console.log('Resolved site content:', siteContent);

      // Store data in TransferState for server-side rendering
      if (isPlatformServer(this.platformId)) {
        this.transferState.set(SITE_CONTENT_KEY, siteContent);
      }

      this.siteContentSubject.next(siteContent); // Emit the data
      return siteContent;
    } catch (error) {
      console.error('Error resolving site content:', error);
      throw error; // Ensure the resolver fails if data cannot be fetched
    }
  }
}