import { Site } from '../entities/site/site.entity';
import { InjectionToken } from '@angular/core';
import { SiteContent } from '../aggregates/site-content.aggregate';

export interface SiteRepository {
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Site | null>;
  findByIdWithPages(id: string): Promise<SiteContent | null>;
  save(page: Site): Promise<Site>;
}

export const SITE_REPOSITORY = new InjectionToken<SiteRepository>('SiteRepository');