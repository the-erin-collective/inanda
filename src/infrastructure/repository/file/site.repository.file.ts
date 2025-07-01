import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { SiteRepository } from '../../../domain/repository/site.repository.interface';
import { Site } from '../../../domain/entities/site/site.entity';
import { SiteContent } from '../../../domain/aggregates/site-content.aggregate';
import { CacheData } from '../../../domain/data/cache.interface';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import { FileFetchService } from '../../services/file-fetch.service';
import { ConfigService } from '../../services/config.service';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class FileSiteRepository implements SiteRepository {
 
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData,
    private readonly configService: ConfigService,
    private readonly fileFetchService: FileFetchService
  ) { }

  async findById(id: string): Promise<Site | null> {
    const cacheKey = `site:${id}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // If we have cached data, use it
    if (hasCachedData) {
      return this.cache.getData(cacheKey, () => this.loadSiteFromFile(id));
    }
    
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
      return this.cache.getData(cacheKey, () => this.loadSiteContentFromFile(id));
    }
    
    const siteContent = await this.loadSiteContentFromFile(id);
    if (siteContent) {
      await this.cache.put(cacheKey, siteContent);
    }
    
    return siteContent;
  }

  async save(site: Site): Promise<Site> {
    throw new Error('FileSiteRepository.save is not implemented in read-only mode.');
  }

  async delete(id: string): Promise<void> {
    throw new Error('FileSiteRepository.delete is not implemented in read-only mode.');
  }

  // Private helper methods
  private async loadSiteFromFile(id: string): Promise<Site | null> {
     try 
     {
      const dataPath = this.configService.get<string>('DATA_PATH');
      let baseHref = '/';

      if(isPlatformBrowser(this.platformId)){
        baseHref = document.querySelector('base')?.getAttribute('href') || '/';
      }
      
      // Path should use the correct repository structure
      // The correct path should include /repository/sites/ before the site ID
      const fileUrl = `${dataPath}/${id}/${id}.json`;
      const fullUrl = baseHref.replace(/\/$/, '') + '/' + fileUrl;
    
      const siteData = await this.fileFetchService.fetchJson<Site>(fullUrl);
      return siteData as Site;
    } catch (error: any) {
      // File not found or invalid JSON
      console.error(`Site file not found for site: ${id}`, error);
      
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
