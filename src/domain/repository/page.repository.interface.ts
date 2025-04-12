import { Page } from '../entities/page/page.entity';
import { InjectionToken } from '@angular/core';

export interface PageRepository {
  findById(id: string): Promise<Page | null>;
  save(page: Page): Promise<Page>;
  delete(id: string): Promise<void>;
  // Add other method contracts as needed
}


export const PAGE_REPOSITORY = new InjectionToken<PageRepository>('PageRepository');