import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { TransferState } from '@angular/core';
import { Page } from '../../../domain/entities/page/page.entity';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { SITE_CONTENT_KEY } from '../../../common/tokens/transfer-state.tokens';
import { ConfigService } from '../../services/config.service';
import { FileFetchService } from '../../services/file-fetch.service';
import { isPlatformBrowser } from '@angular/common';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';

@Injectable({
  providedIn: 'root',
})
export class ClientPageRepository implements PageRepository {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private transferState: TransferState,
    private readonly configService: ConfigService,
    private readonly fileFetchService: FileFetchService,
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData
  ) {
    console.log('ClientPageRepository constructor - SITE_CONTENT_KEY:', SITE_CONTENT_KEY);
  }

  async findById(siteId: string, id: string): Promise<Page | null> {
    // First try from TransferState
    if (this.transferState.hasKey(SITE_CONTENT_KEY)) {
      const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
      if (siteContent && siteContent.pages) {
        const page = siteContent.pages.find(p => p.id === id);
        if (page) {
          return page;
        }
      }
    }
    
    // Fallback to file loading
    try {
      const cacheKey = `page:${siteId}:${id}`;
      return this.cache.getData(cacheKey, async () => {
        return await this.loadPageFromFile(siteId, id);
      });
    } catch (error) {
      console.error(`Error loading page from file: ${error.message}`);
      return null;
    }
  }

  async findByIds(siteId: string, ids: string[]): Promise<Page[]> {
    console.log(`ClientPageRepository: Finding pages by IDs: ${ids.join(', ')}`);
    
    // First try from TransferState
    if (this.transferState.hasKey(SITE_CONTENT_KEY)) {
      const siteContent = this.transferState.get(SITE_CONTENT_KEY, null);
      if (siteContent && siteContent.pages) {
        console.log('ClientPageRepository: Returning preloaded pages from TransferState');
        return siteContent.pages;
      }
    }
    
    console.log('ClientPageRepository: No preloaded pages found in TransferState');
    
    // Fallback to file loading
    try {
      const cacheKey = `pages:${siteId}:${ids.join(',')}`;
      return this.cache.getData(cacheKey, async () => {
        const pages: Page[] = [];
        
        for (const id of ids) {
          try {
            const page = await this.loadPageFromFile(siteId, id);
            if (page) {
              pages.push(page);
            }
          } catch (pageError) {
            console.error(`Error loading page ${id} from file:`, pageError);
          }
        }
        
        return pages;
      });
    } catch (error) {
      console.error(`Error loading pages from files: ${error.message}`);
      return [];  // Return empty array instead of null to prevent "r is null" errors
    }
  }

  private async loadPageFromFile(siteId: string, pageId: string): Promise<Page | null> {
    try {
      const dataPath = this.configService.get<string>('DATA_PATH');
      let baseHref = '/';
      
      if(isPlatformBrowser(this.platformId)){
        baseHref = document.querySelector('base')?.getAttribute('href') || '/';
      }
      
      const fileUrl = `${dataPath}/${siteId}/pages/${pageId}.json`;
      const fullUrl = baseHref.replace(/\/$/, '') + '/' + fileUrl;
      console.log(`Loading page data for ID ${pageId} from file: ${fullUrl}`);
      
      const pageData = await this.fileFetchService.fetchJson<any>(fullUrl);
      return Page.fromJSON(pageData);
    } catch (error) {
      console.error(`Page file not found for page: ${pageId}`, error);
      return null;
    }
  }

  async save(siteId: string, page: Page): Promise<Page> {
    console.warn('ClientPageRepository: Save operation is not supported on the client.');
    throw new Error('Save operation is not supported on the client.');
  }

  async delete(siteId: string, id: string): Promise<void> {
    console.warn('ClientPageRepository: Delete operation is not supported on the client.');
    throw new Error('Delete operation is not supported on the client.');
  }
}