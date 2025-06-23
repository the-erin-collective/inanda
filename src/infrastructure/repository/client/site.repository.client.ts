import { Injectable } from '@angular/core';
import { TransferState } from '@angular/core';
import { Site } from '../../../domain/entities/site/site.entity';
import { SiteRepository } from 'src/domain/repository/site.repository.interface';
import { SiteContent } from 'src/domain/aggregates/site-content.aggregate';
import { SITE_CONTENT_KEY } from '../../../common/tokens/transfer-state.tokens';

@Injectable({
  providedIn: 'root',
})
export class ClientSiteRepository implements SiteRepository {
  constructor(private transferState: TransferState) {
    console.log('ClientSiteRepository constructor - SITE_CONTENT_KEY:', SITE_CONTENT_KEY);
  }
  async findById(id: string): Promise<Site | null> {
    console.log(`ClientSiteRepository: Finding site by ID: ${id}`);
    
    if (!this.transferState.hasKey(SITE_CONTENT_KEY)) {
      console.warn('ClientSiteRepository: No preloaded site content found. Key not present:', SITE_CONTENT_KEY);
      return null;
    }
    
    const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
    
    if (!siteContent) {
      console.warn('ClientSiteRepository: Preloaded site content is null');
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