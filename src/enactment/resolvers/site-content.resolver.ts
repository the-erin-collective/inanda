import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { SiteContentService } from '../services/site-content.service';
import { SiteContent } from '../../domain/aggregates/site-content.aggregate';

@Injectable({
  providedIn: 'root'
})
export class SiteContentResolver implements Resolve<Promise<SiteContent | null>> {
  constructor(private siteContentService: SiteContentService) {}

  resolve(route: ActivatedRouteSnapshot): Promise<SiteContent | null> {
    const siteId = route.paramMap.get('siteId') ?? 'site-001';
    return this.siteContentService.getSiteContent(siteId);
  }
}