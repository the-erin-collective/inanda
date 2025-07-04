import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { Page } from '../../../domain/entities/page/page.entity';
import { CacheData } from '../../../domain/data/cache.interface';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import { FileFetchService } from '../../services/file-fetch.service';
import { ConfigService } from '../../services/config.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class FilePageRepository implements PageRepository {
 
  constructor(   
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData,
    private readonly configService: ConfigService,
    private readonly fileFetchService: FileFetchService
  ) {
  }

  async findById(siteId: string, id: string): Promise<Page | null> {
    const cacheKey = `page:${id}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // If we have cached data, use it
    if (hasCachedData) {
      return this.cache.getData(cacheKey, () => this.loadPageFromFile(siteId, id));
    }
    
    const page = await this.loadPageFromFile(siteId, id);
    if (page) {
      await this.cache.put(cacheKey, page);
    }
    
    return page;
  }

  async findByIds(siteId: string, ids: string[]): Promise<Page[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    
    const cacheKey = `pages:${ids.join(',')}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // If we have cached data, use it
    if (hasCachedData) {
      return this.cache.getData(cacheKey, () => this.loadPagesFromFile(siteId, ids));
    }
    
    const pages = await this.loadPagesFromFile(siteId, ids);
    if (pages && pages.length > 0) {
      await this.cache.put(cacheKey, pages);
    }
    
    return pages;
  }  async save(siteId: string, page: Page): Promise<Page> {
    throw new Error('FilePageRepository.save is not implemented in read-only mode.');
  }

  async delete(id: string): Promise<void> {
    throw new Error('FilePageRepository.delete is not implemented in read-only mode.');
  }

  // Private helper methods
  private getFilePath(siteId: string, id: string): string {
    // Build the relative URL for HTTP fetch
    const dataPath = this.configService.get<string>('DATA_PATH');

     let baseHref = '/';

    if(isPlatformBrowser(this.platformId)){
      baseHref = document.querySelector('base')?.getAttribute('href') || '/';
    }
    
    const fullDataPath = baseHref.replace(/\/$/, '') + '/' + dataPath;
    return `${fullDataPath}/${siteId}/pages/${id}.json`;
  }

  private async loadPageFromFile(siteId: string, id: string): Promise<Page | null> {
    const fileUrl = this.getFilePath(siteId, id);
    try {
      const pageData = await this.fileFetchService.fetchJson<Page>(fileUrl);
      return pageData as Page;
    } catch (error: any) {
      // File not found or invalid JSON
      if (error.status === 404) {
        console.error(`Page file not found: ${fileUrl}`);
        return null;
      }
      console.error(`Error loading page from file ${fileUrl}:`, error);
      throw error;
    }
  }

  private async loadPagesFromFile(siteId: string, ids: string[]): Promise<Page[]> {
    const pages: Page[] = [];
    
    for (const id of ids) {
      const page = await this.loadPageFromFile(siteId, id);
      if (page) {
        pages.push(page);
      }
    }
    
    return pages;
  }
}
