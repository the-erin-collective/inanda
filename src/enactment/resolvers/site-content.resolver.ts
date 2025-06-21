import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';
import { TransferState } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SiteContentService } from '../services/site-content.service';
import { SiteContent } from '../../domain/aggregates/site-content.aggregate';
import { DEFAULT_SITE_ID } from '../../domain/constants/site.constants';
import { SITE_CONTENT_KEY } from '../../common/tokens/transfer-state.tokens';

@Injectable({
  providedIn: 'root',
})
export class SiteContentResolver implements Resolve<Promise<SiteContent>> {
  private siteContentSubject = new BehaviorSubject<SiteContent | null>(null);
  constructor(
    private siteContentService: SiteContentService,
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    console.log(`SiteContentResolver constructor - Platform: ${isPlatformServer(this.platformId) ? 'SERVER' : 'CLIENT'}`);
  }

  get siteContent$() {
    return this.siteContentSubject.asObservable();
  }
  async resolve(route: ActivatedRouteSnapshot): Promise<SiteContent> {
    console.log(`Resolving site content on: ${isPlatformServer(this.platformId) ? 'SERVER' : 'CLIENT'}`);

    // Check if data is available in TransferState
    if (this.transferState.hasKey(SITE_CONTENT_KEY)) {
      console.log('FOUND site content in TransferState with key:', SITE_CONTENT_KEY);
      const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
      console.log('Using preloaded site content:', siteContent);
      if (siteContent) {
        this.siteContentSubject.next(siteContent); // Emit the data
        return siteContent;
      }
    } else {
      console.log('NO site content found in TransferState with key:', SITE_CONTENT_KEY);
    }

    // Fetch data from the service
    const siteId = route.paramMap.get('siteId') ?? DEFAULT_SITE_ID;
    console.log('Fetching site content for siteId:', siteId);

    // Explicitly handle 'assets' or other static paths being incorrectly routed as site IDs
    if (siteId === 'assets' || siteId === 'css' || siteId === 'js') {
      console.warn(`SiteContentResolver: Ignoring request for static asset path: ${siteId}`);
      // Depending on the expected return type, return null or a minimal valid object
      // Assuming SiteContentResolver expects a SiteContent object, we'll return a dummy one.
      // If the consumer of this resolver handles null, then 'return null;' would be simpler.
      // For now, returning a dummy object to ensure the promise resolves without crashing.
      return Promise.resolve(null); 
    }    try {
      const siteContent = await this.siteContentService.getSiteContent(siteId);
      console.log('Resolved site content:', siteContent);
        // Store data in TransferState for server-side rendering
      if (isPlatformServer(this.platformId) && siteContent) {
        console.log('Setting site content in TransferState for hydration');
        
        // Create a fully serializable version by removing any methods or circular references
        const serializableSiteContent = JSON.parse(JSON.stringify({
          site: siteContent.site,
          pages: siteContent.pages
        }));
          console.log('Serialized site content for TransferState, using key:', SITE_CONTENT_KEY);
        
        // Set the content in TransferState
        this.transferState.set(SITE_CONTENT_KEY, serializableSiteContent);
        
        // Verify it was set correctly
        const verifySet = this.transferState.hasKey(SITE_CONTENT_KEY);
        console.log('Verified TransferState key exists after setting:', verifySet);
      }

      this.siteContentSubject.next(siteContent); // Emit the data
      return siteContent;
    } catch (error) {
      console.error('Error resolving site content:', error);
      throw error; // Ensure the resolver fails if data cannot be fetched
    }
  }
}