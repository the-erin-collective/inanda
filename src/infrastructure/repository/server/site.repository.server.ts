import { Injectable, Inject } from '@angular/core';
import { SiteRepository } from '../../../domain/repository/site.repository.interface';
import { Site } from '../../../domain/entities/site/site.entity';
import { SiteContent } from '../../../domain/aggregates/site-content.aggregate';
import { ServerPageRepository } from './page.repository.server';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';
import { SiteModel } from '../../data/schemas/site.schema';
import { SitemapType } from '../../../domain/entities/site/sitemap-type.enum';

@Injectable({
  providedIn: 'root',
})
export class ServerSiteRepository implements SiteRepository {
  constructor(
    private readonly pageRepository: ServerPageRepository,
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData
  ) {}

  private readonly defaultSiteId: string = 'site-001';
  
  async findById(id: string): Promise<Site | null> {
    const cacheKey = `site:${id}`;
    return this.cache.getData(cacheKey, async () => {
      try {
        const doc = await SiteModel.findById(id).lean();
        if (!doc) {
          console.log(`No site found in MongoDB for ID: ${id}`);
          return null;
        }
        console.log(`Found site in MongoDB: ${id}`);
        return Site.fromJSON({
          id: doc._id,
          name: doc.name,
          description: doc.description,
          pageOrder: doc.pageOrder || [],
          sitemapType: (doc.sitemapType as SitemapType) || SitemapType.HEX_FLOWER,
          defaultPage: doc.defaultPage,
          backdrop: doc.backdrop,
          backgroundType: doc.backgroundType as 'solid' | 'gradient' | 'image' | 'material',
          materialType: doc.materialType,
          borderType: doc.borderType as 'solid' | 'gradient' | 'material'
        });
      } catch (err) {
        console.error(`Error fetching site from MongoDB: ${err.message}`);
        return null;
      }
    });
  }

  async findByIdWithPages(id: string): Promise<SiteContent | null> {
    const cacheKey = `site-content:${id}`;
    return this.cache.getData(cacheKey, async () => {
      return this.buildSiteContent(id);
    });
  }
  
  // Helper method to build site content from a site ID
  private async buildSiteContent(id: string): Promise<SiteContent | null> {
    const siteIdToFetch = id || this.defaultSiteId;
    try {
      const site = await this.findById(siteIdToFetch);
      
      if (!site) {
        console.log(`Site not found for ID: ${siteIdToFetch}`);
        return null;
      }
      
      console.log(`Found site: ${JSON.stringify(site)}`);

      // Fetch pages based on the pageOrder array from the Site
      const pages = await this.pageRepository.findByIds(site.pageOrder);
      console.log(`Fetched ${pages.length} of ${site.pageOrder.length} pages for site ${siteIdToFetch}`);

      if (pages.length !== site.pageOrder.length) {
        console.warn(`Some pages could not be found: requested ${site.pageOrder.length}, got ${pages.length}`);
      }
      
      // Create and return the SiteContent aggregate
      const siteContent = new SiteContent(site, pages);
      // Cache the result
      await this.cache.put(`site-content:${siteIdToFetch}`, siteContent);
      return siteContent;
    } catch (err) {
      console.error(`Error building site content: ${err.message}`);
      return null;
    }
  }

  async save(site: Site): Promise<Site> {
    try {
      // Use site's toJSON method to get the data for MongoDB
      const siteData = site.toJSON();
      
      // Save to MongoDB
      await SiteModel.findByIdAndUpdate(
        site.id,
        {
          _id: site.id,
          ...siteData
        },
        { upsert: true, new: true }
      );
      
      // Save to cache
      await this.cache.put(`site:${site.id}`, site);
      return site;
    } catch (err) {
      console.error(`Error saving site: ${err.message}`);
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Delete from MongoDB
      await SiteModel.findByIdAndDelete(id);
      // Remove from cache
      await this.cache.invalidate(`site:${id}`);
      await this.cache.invalidate(`site-content:${id}`);
    } catch (err) {
      console.error(`Error deleting site: ${err.message}`);
      throw err;
    }
  }
}
