import { Injectable } from '@angular/core';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { Page } from '../../../domain/entities/page/page.entity';
import { SiteContent } from 'src/domain/aggregates/site-content.aggregate';
import { makeStateKey } from '@angular/core';
import { TransferState } from '@angular/core';

const SITE_CONTENT_KEY = makeStateKey<SiteContent>('siteContent');

@Injectable({
  providedIn: 'root',
})
export class ClientPageRepository implements PageRepository {
  constructor(private transferState: TransferState) {}
  findById(id: string): Promise<Page | null> {
    const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
    console.log('ClientPageRepository: Fetching page by ID from preloaded site content:', siteContent);

    if (!siteContent) {
      console.warn('ClientPageRepository: No site content found in TransferState.');
      return Promise.resolve(null);
    }

    const page = siteContent.pages.find((page) => page.id === id) || null;
    return Promise.resolve(page);
  }

  findByIds(ids: string[]): Promise<Page[]> {
    const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
    console.log('ClientSiteRepository: Returning preloaded site content:', siteContent);

    const pages = siteContent.pages.filter((page) => ids.includes(page.id));

    return Promise.resolve(pages);
  }

  async save(site: Page): Promise<Page> {
    console.debug('ClientPageRepository save called for site: ', site);

    console.warn('ClientSiteRepository: Save operation is not supported on the client.');
    throw new Error('Save operation is not supported on the client.');
  }

  async delete(id: string): Promise<void> {
    console.debug('ClientPageRepository delete called for site id: ', id);
    
    console.warn('ClientSiteRepository: Delete operation is not supported on the client.');
    throw new Error('Delete operation is not supported on the client.');
  } 
}