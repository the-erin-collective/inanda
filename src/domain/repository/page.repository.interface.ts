import { Page } from '../entities/page/page.entity';
import { InjectionToken } from '@angular/core';

export interface PageRepository {
  delete(siteId: string, id: string): Promise<void>;
  findById(siteId: string, id: string): Promise<Page | null>;
  findByIds(siteId: string, ids: string[]): Promise<Page[]>;
  save(siteId: string, page: Page): Promise<Page>;
}


export const PAGE_REPOSITORY = new InjectionToken<PageRepository>('PageRepository');