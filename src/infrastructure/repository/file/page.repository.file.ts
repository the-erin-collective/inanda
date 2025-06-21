import { Injectable, Inject } from '@angular/core';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { Page } from '../../../domain/entities/page/page.entity';
import { CacheData } from '../../../domain/data/cache.interface';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import * as fs from 'fs/promises';
import * as path from 'path';
import { APP_CONFIG, AppConfig } from '../../providers/config/app-config.token';

@Injectable({
  providedIn: 'root',
})
export class FilePageRepository implements PageRepository {
  private dataPath: string;
    constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData,
    @Inject(APP_CONFIG) private readonly config: AppConfig
  ) {
    this.dataPath = this.config.DATA_PATH || 'data/repository/sites';
    // Pages will be loaded from the site's directory structure
  }

  async findById(id: string): Promise<Page | null> {
    const cacheKey = `page:${id}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // If we have cached data, use it
    if (hasCachedData) {
      console.log(`Page data for ID ${id} found in cache`);
      return this.cache.getData(cacheKey, () => this.loadPageFromFile(id));
    }
    
    // Otherwise load from file and cache it
    console.log(`Loading page data for ID ${id} from file`);
    const page = await this.loadPageFromFile(id);
    if (page) {
      await this.cache.put(cacheKey, page);
    }
    
    return page;
  }

  async findByIds(ids: string[]): Promise<Page[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    
    const cacheKey = `pages:${ids.join(',')}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // If we have cached data, use it
    if (hasCachedData) {
      console.log(`Page data for IDs ${ids.join(',')} found in cache`);
      return this.cache.getData(cacheKey, () => this.loadPagesFromFile(ids));
    }
    
    // Otherwise load from file and cache it
    console.log(`Loading page data for IDs ${ids.join(',')} from file`);
    const pages = await this.loadPagesFromFile(ids);
    if (pages && pages.length > 0) {
      await this.cache.put(cacheKey, pages);
    }
    
    return pages;
  }
  async save(page: Page): Promise<Page> {
    if (!page.id) {
      throw new Error('Page ID is required');
    }
    
    const filePath = this.getFilePath(page.id);
    
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write page data to file
      await fs.writeFile(filePath, JSON.stringify(page, null, 2));
      
      // Invalidate cache
      await this.cache.invalidate(`page:${page.id}`);
      
      console.log(`Page ${page.id} saved to file: ${filePath}`);
      return page;
    } catch (error) {
      console.error(`Error saving page ${page.id} to file:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const filePath = this.getFilePath(id);
    
    try {
      await fs.unlink(filePath);
      
      // Invalidate cache
      await this.cache.invalidate(`page:${id}`);
      
      console.log(`Page ${id} deleted from file: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting page ${id} from file:`, error);
      throw error;
    }
  }
  // Private helper methods
  private getFilePath(id: string): string {
    // We need to extract the site ID, but our page IDs don't contain the site ID
    // So we need to get the siteId from the page entity or use a default
    
    // Check if the page ID contains a site ID prefix (for backward compatibility)
    if (id.includes('-page-')) {
      const siteId = id.split('-page-')[0];
      return path.join(process.cwd(), this.dataPath.replace('pages', ''), siteId, 'pages', `${id}.json`);
    }
    
    // If we don't have a site ID in the page ID, use site-001 as default
    // Ideally, we should pass the siteId as a parameter, but for now, we use a workaround
    const siteId = 'site-001'; // Default site ID
    
    console.log(`Using default site ID ${siteId} for page ${id}`);
    return path.join(process.cwd(), this.dataPath.replace('pages', ''), siteId, 'pages', `${id}.json`);
  }

  private async loadPageFromFile(id: string): Promise<Page | null> {
    const filePath = this.getFilePath(id);
    
    try {
      const fileData = await fs.readFile(filePath, 'utf8');
      const pageData = JSON.parse(fileData);
      
      return pageData as Page;
    } catch (error) {
      // File not found or invalid JSON
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log(`Page file not found: ${filePath}`);
        return null;
      }
      
      console.error(`Error loading page from file ${filePath}:`, error);
      throw error;
    }
  }

  private async loadPagesFromFile(ids: string[]): Promise<Page[]> {
    const pages: Page[] = [];
    
    for (const id of ids) {
      const page = await this.loadPageFromFile(id);
      if (page) {
        pages.push(page);
      }
    }
    
    return pages;
  }
}
