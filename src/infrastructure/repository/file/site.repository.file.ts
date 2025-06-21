import { Injectable, Inject } from '@angular/core';
import { SiteRepository } from '../../../domain/repository/site.repository.interface';
import { Site } from '../../../domain/entities/site/site.entity';
import { SiteContent } from '../../../domain/aggregates/site-content.aggregate';
import { CacheData } from '../../../domain/data/cache.interface';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import * as fs from 'fs/promises';
import * as path from 'path';
import { APP_CONFIG, AppConfig } from '../../providers/config/app-config.token';

@Injectable({
  providedIn: 'root',
})
export class FileSiteRepository implements SiteRepository {
  private readonly defaultSiteId: string = 'site-001';
  private dataPath: string;
  
  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData,
    @Inject(APP_CONFIG) private readonly config: AppConfig
  ) {
    this.dataPath = this.config.DATA_PATH || 'data/repository/sites';
  }

  async findById(id: string): Promise<Site | null> {
    const cacheKey = `site:${id}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // If we have cached data, use it
    if (hasCachedData) {
      console.log(`Site data for ID ${id} found in cache`);
      return this.cache.getData(cacheKey, () => this.loadSiteFromFile(id));
    }
    
    // Otherwise load from file and cache it
    console.log(`Loading site data for ID ${id} from file`);
    const site = await this.loadSiteFromFile(id);
    if (site) {
      await this.cache.put(cacheKey, site);
    }
    
    return site;
  }

  async findByIdWithPages(id: string): Promise<SiteContent | null> {
    const cacheKey = `site-content:${id}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // If we have cached data, use it
    if (hasCachedData) {
      console.log(`Site content for ID ${id} found in cache`);
      return this.cache.getData(cacheKey, () => this.loadSiteContentFromFile(id));
    }
    
    // Otherwise load from file and cache it
    console.log(`Loading site content for ID ${id} from file`);
    const siteContent = await this.loadSiteContentFromFile(id);
    if (siteContent) {
      await this.cache.put(cacheKey, siteContent);
    }
    
    return siteContent;
  }
  async save(site: Site): Promise<Site> {
    const siteId = site.id || this.defaultSiteId;
    const siteDirPath = path.join(process.cwd(), this.dataPath, siteId);
    const filePath = path.join(siteDirPath, `${siteId}.json`);
    
    try {
      // Ensure directory exists
      await fs.mkdir(siteDirPath, { recursive: true });
      
      // Write site data to file
      await fs.writeFile(filePath, JSON.stringify(site, null, 2));
      
      // Invalidate cache
      await this.cache.invalidate(`site:${siteId}`);
      await this.cache.invalidate(`site-content:${siteId}`);
      
      console.log(`Site ${siteId} saved to file: ${filePath}`);
      return site;
    } catch (error) {
      console.error(`Error saving site ${siteId} to file:`, error);
      throw error;
    }
  }
  async delete(id: string): Promise<void> {
    const filePath = path.join(process.cwd(), this.dataPath, id, `${id}.json`);
    
    try {
      await fs.unlink(filePath);
      
      // Invalidate cache
      await this.cache.invalidate(`site:${id}`);
      await this.cache.invalidate(`site-content:${id}`);
      
      console.log(`Site ${id} deleted from file: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting site ${id} from file:`, error);
      throw error;
    }
  }

  // Private helper methods
  private async loadSiteFromFile(id: string): Promise<Site | null> {
    // Use site ID as both folder name and file name
    const filePath = path.join(process.cwd(), this.dataPath, id, `${id}.json`);
    
    try {
      const fileData = await fs.readFile(filePath, 'utf8');
      const siteData = JSON.parse(fileData);
      
      return siteData as Site;
    } catch (error) {
      // File not found or invalid JSON
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log(`Site file not found: ${filePath}`);
        return null;
      }
      
      console.error(`Error loading site from file ${filePath}:`, error);
      throw error;
    }
  }

  private async loadSiteContentFromFile(id: string): Promise<SiteContent | null> {
    // This is a simplified implementation. In a real scenario, you'd load pages from separate files
    // or implement logic to extract pages from the site file
    const site = await this.loadSiteFromFile(id);
    if (!site) {
      return null;
    }
    
    return {
      site: site,
      pages: [] // In a real implementation, load the associated pages
    };
  }
}
