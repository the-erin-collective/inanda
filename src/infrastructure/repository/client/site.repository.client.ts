import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { TransferState } from '@angular/core';
import { Site } from '../../../domain/entities/site/site.entity';
import { Page } from '../../../domain/entities/page/page.entity';
import { SiteRepository } from 'src/domain/repository/site.repository.interface';
import { SiteContent } from 'src/domain/aggregates/site-content.aggregate';
import { SITE_CONTENT_KEY } from '../../../common/tokens/transfer-state.tokens';
import { ConfigService } from '../../services/config.service';
import { FileFetchService } from '../../services/file-fetch.service';
import { isPlatformBrowser } from '@angular/common';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';

@Injectable({
  providedIn: 'root',
})
export class ClientSiteRepository implements SiteRepository {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private transferState: TransferState,
    private readonly configService: ConfigService,
    private readonly fileFetchService: FileFetchService,
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData
  ) {
  }

  async findById(id: string): Promise<Site | null> {
    // First try from TransferState
    if (this.transferState.hasKey(SITE_CONTENT_KEY)) {
      const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
      
      if (siteContent && siteContent.site && siteContent.site.id === id) {
        return siteContent.site;
      }
    }
    
    console.warn('ClientSiteRepository: No preloaded site content found. Key not present:', SITE_CONTENT_KEY);
    
    // Fallback to file loading
    try {
      const cacheKey = `site:${id}`;
      return this.cache.getData(cacheKey, async () => {
        const dataPath = this.configService.get<string>('DATA_PATH');
        let baseHref = '/';
        
        if(isPlatformBrowser(this.platformId)){
          baseHref = document.querySelector('base')?.getAttribute('href') || '/';
        }
        
        const fileUrl = `${dataPath}/${id}/${id}.json`;
        const fullUrl = baseHref.replace(/\/$/, '') + '/' + fileUrl;
        console.log(`Fallback: Loading site data for ID ${id} from file: ${fullUrl}`);
        
        const siteData = await this.fileFetchService.fetchJson<any>(fullUrl);
        return Site.fromJSON({
          id: siteData._id || siteData.id,
          name: siteData.name,
          description: siteData.description,
          pageOrder: siteData.pageOrder || [],
          sitemapType: siteData.sitemapType,
          defaultPage: siteData.defaultPage,
          backdrop: siteData.backdrop,
          backgroundType: siteData.backgroundType,
          materialType: siteData.materialType,
          borderType: siteData.borderType
        });
      });
    } catch (error) {
      console.error(`Error loading site from file: ${error.message}`);
      return null;
    }
  }

  async findByIdWithPages(id: string): Promise<SiteContent | null> {
    // First try from TransferState
    if (this.transferState.hasKey(SITE_CONTENT_KEY)) {
      const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
      
      if (siteContent && siteContent.site && siteContent.site.id === id) {
        return siteContent;
      }
    }
    
    console.warn('ClientSiteRepository: No preloaded site content found in TransferState');
    
    // Fallback to file loading
    try {
      const cacheKey = `site-content:${id}`;
      return this.cache.getData(cacheKey, async () => {
        // First load the site
        const site = await this.findById(id);
        if (!site) {
          return null;
        }
        
        // Then load the pages
        const pages: Page[] = [];
        const dataPath = this.configService.get<string>('DATA_PATH');
        let baseHref = '/';
        
        if(isPlatformBrowser(this.platformId)){
          baseHref = document.querySelector('base')?.getAttribute('href') || '/';
        }
        
        // Load each page
        for (const pageId of site.pageOrder) {
          try {
            const fileUrl = `${dataPath}/${id}/pages/${pageId}.json`;
            const fullUrl = baseHref.replace(/\/$/, '') + '/' + fileUrl;

            const pageData = await this.fileFetchService.fetchJson<any>(fullUrl);
            pages.push(Page.fromJSON(pageData));
          } catch (pageError) {
            console.error(`Error loading page ${pageId} from file:`, pageError);
          }
        }
        
        return new SiteContent(site, pages);
      });
    } catch (error) {
      console.error(`Error loading site content from file: ${error.message}`);
      return null;
    }
  }

  async save(site: Site): Promise<Site> {
    console.warn('ClientSiteRepository: Save operation is not supported on the client.');
    throw new Error('Save operation is not supported on the client.');
  }

  async delete(id: string): Promise<void> {
    console.warn('ClientSiteRepository: Delete operation is not supported on the client.');
    throw new Error('Delete operation is not supported on the client.');
  }
}