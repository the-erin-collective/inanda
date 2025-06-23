import { Injectable, Inject } from '@angular/core';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { Page } from '../../../domain/entities/page/page.entity';
import { CacheData } from '../../../domain/data/cache.interface';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import { FileFetchService } from '../../services/file-fetch.service';
import { APP_CONFIG, AppConfig } from '../../providers/config/app-config.token';

@Injectable({
  providedIn: 'root',
})
export class FilePageRepository implements PageRepository {
  private dataPath: string;
  
  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly fileFetchService: FileFetchService
  ) {
    // Ensure we're using the proper path format without leading ./ which causes path resolution issues
    this.dataPath = this.config.DATA_PATH ? 
      this.config.DATA_PATH.replace(/^\.\//g, '') : 
      'data/repository/sites';
    
    console.log(`FilePageRepository initialized with dataPath: ${this.dataPath}`);
    // Pages will be loaded from the site's directory structure
  }

  async findById(siteId: string, id: string): Promise<Page | null> {
    const cacheKey = `page:${id}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // If we have cached data, use it
    if (hasCachedData) {
      console.log(`Page data for ID ${id} found in cache`);
      return this.cache.getData(cacheKey, () => this.loadPageFromFile(siteId, id));
    }
    
    // Otherwise load from file and cache it
    console.log(`Loading page data for ID ${id} from file`);
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
      console.log(`Page data for IDs ${ids.join(',')} found in cache`);
      return this.cache.getData(cacheKey, () => this.loadPagesFromFile(siteId, ids));
    }
    
    // Otherwise load from file and cache it
    console.log(`Loading page data for IDs ${ids.join(',')} from file`);
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
    return `presentation/assets/${this.dataPath}/${siteId}/pages/${id}.json`;
  }

  private async loadPageFromFile(siteId: string, id: string): Promise<Page | null> {
    const fileUrl = this.getFilePath(siteId, id);
    try {
      const pageData = await this.fileFetchService.fetchJson<Page>(fileUrl);
      return pageData as Page;
    } catch (error: any) {
      // File not found or invalid JSON
      if (error.status === 404) {
        console.log(`Page file not found: ${fileUrl}`);
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
