import { Injectable, Inject } from '@angular/core';
import { makeStateKey } from '@angular/core';
import { TransferState } from '@angular/core';
import { Site } from '../../../domain/entities/site/site.entity';
import { SiteRepository } from 'src/domain/repository/site.repository.interface';
import { SiteContent } from 'src/domain/aggregates/site-content.aggregate';

const SITE_CONTENT_KEY = makeStateKey<SiteContent>('siteContent');

@Injectable({
  providedIn: 'root',
})
export class ClientSiteRepository implements SiteRepository {
  constructor(@Inject(TransferState) private transferState: TransferState) {}

  async findById(id: string): Promise<Site | null> {
    const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
    
    if (!siteContent) {
      console.warn('ClientSiteRepository: No preloaded site content found.');
      return null;
    }

    if(siteContent.site.id !== id) {
      console.warn(`ClientSiteRepository: Site ID ${id} does not match preloaded site ID ${siteContent.site.id}.`);
      return null;
    }

    console.log('ClientSiteRepository: Returning preloaded site content:', siteContent);
    return siteContent.site;
  }

  async findByIdWithPages(id: string): Promise<SiteContent | null> {
    const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
    if (!siteContent) {
      console.warn('ClientSiteRepository: No preloaded site content found.');
      return null;
    }
    
    if(siteContent.site.id !== id) {
      console.warn(`ClientSiteRepository: Site ID ${id} does not match preloaded site ID ${siteContent.site.id}.`);
      return null;
    }

    return siteContent;
  }

  async save(site: Site): Promise<Site> {
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