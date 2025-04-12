import { Site } from '../entities/site/site.entity';
import { InjectionToken } from '@angular/core';

export interface SiteRepository {
  findById(id: string): Promise<Site | null>;
  save(page: Site): Promise<Site>;
  delete(id: string): Promise<void>;
}

export const SITE_REPOSITORY = new InjectionToken<SiteRepository>('SiteRepository');