import { Page } from '../entities/page/page.entity';
import { InjectionToken } from '@angular/core';

export interface PageRepository {
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Page | null>;
  findByIds(ids: string[]): Promise<Page[]>;
  save(page: Page): Promise<Page>;
}


export const PAGE_REPOSITORY = new InjectionToken<PageRepository>('PageRepository');