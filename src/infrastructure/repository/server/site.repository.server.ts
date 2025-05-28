import { Injectable, Inject, Optional } from '@angular/core';
import { SiteRepository } from '../../../domain/repository/site.repository.interface';
import { Site } from '../../../domain/entities/site/site.entity';
import { SiteContent } from '../../../domain/aggregates/site-content.aggregate';
import { ServerPageRepository } from './page.repository.server';
import { SiteModel } from '../../data/schemas/site.schema'; // Mongoose model
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';
import { MONGO_CONNECTION_FACTORY, MongoConnectionFactory } from '../../data/db/mongo.factory';

@Injectable({
  providedIn: 'root',
})
export class ServerSiteRepository implements SiteRepository {
  private mongoConnected: boolean | null = null;
  
  constructor(
    private readonly pageRepository: ServerPageRepository,
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData,
    @Optional() @Inject(MONGO_CONNECTION_FACTORY) private readonly mongoConnectionFactory?: MongoConnectionFactory
  ) {}

  private readonly defaultSiteId: string = 'site-001';

  private async ensureMongoConnection(): Promise<boolean> {
    // If we've already checked the connection status, return it
    if (this.mongoConnected !== null) {
      return this.mongoConnected;
    }
    
    // If no connection factory is provided, assume no connection
    if (!this.mongoConnectionFactory) {
      this.mongoConnected = false;
      return false;
    }
    
    // Get connection status from the factory (which should now return the already determined status)
    this.mongoConnected = await this.mongoConnectionFactory();
    return this.mongoConnected;
  }

  async findById(id: string): Promise<Site | null> {
    const cacheKey = `site:${id}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // If we have cached data, use it
    if (hasCachedData) {
      console.log(`Site data for ID ${id} found in cache`);
      return this.cache.getData(cacheKey, async () => {
        // This should only run if the cache is invalid
        console.log(`Cache miss for site ${id}, fetching from MongoDB`);
        return this.fetchSiteFromMongoDB(id);
      });
    }
    
    // No cache, check if we can use MongoDB
    const dbAvailable = await this.ensureMongoConnection();
    if (!dbAvailable) {
      const errorMsg = `No cached site data for ID: ${id} and MongoDB is not available`;
      console.error(`FATAL ERROR: ${errorMsg}`);
      
      // Force process to exit
      process.exit(1);
      
      // This is only for TypeScript and will never execute
      throw new Error(errorMsg);
    }
    
    // Use MongoDB to fetch the data and cache it
    console.log(`Fetching site data for ID: ${id} from MongoDB`);
    const site = await this.fetchSiteFromMongoDB(id);
    
    if (site) {
      // Cache the site data
      await this.cache.put(cacheKey, site);
      console.log(`Site data for ID: ${id} cached successfully`);
    } else {
      console.log(`No site found for ID: ${id} in MongoDB`);
    }
    
    return site;
  }
  
  // Helper method to fetch site data from MongoDB
  private async fetchSiteFromMongoDB(id: string): Promise<Site | null> {
    const siteIdToFetch = id || this.defaultSiteId;
    
    try {
      console.log(`Fetching site from MongoDB: ${siteIdToFetch}`);
      const siteModel = await SiteModel.findById(siteIdToFetch).exec();
      
      if (!siteModel) {
        console.log(`No site found in MongoDB for ID: ${siteIdToFetch}`);
        return null;
      }
        console.log(`Site found in MongoDB for ID: ${siteIdToFetch}`);
      const site = Site.fromJSON({
        id: siteModel._id,
        name: siteModel.name,
        description: siteModel.description ?? '',
        pageOrder: siteModel.pageOrder,
        sitemapType: siteModel.sitemapType,
        defaultPage: siteModel.defaultPage,
        backdrop: siteModel.backdrop
      });
      
      return site;
    } catch (err) {
      console.error(`Error fetching site from MongoDB: ${err.message}`);
      return null;
    }
  }

  async findByIdWithPages(id: string): Promise<SiteContent | null> {
    const cacheKey = `site-content:${id}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // If we have the site content in cache, use it
    if (hasCachedData) {
      console.log(`Site content for ID ${id} found in cache`);
      return this.cache.getData(cacheKey, async () => {
        // This should only run if the cache is invalid
        console.log(`Cache miss for site content ${id}, building from scratch`);
        return this.buildSiteContent(id);
      });
    }
    
    console.log(`Finding site with pages by ID: ${id}`);

    // No cached site content, check if MongoDB is available
    const dbAvailable = await this.ensureMongoConnection();
    if (!dbAvailable) {
      const errorMsg = `Site content for ID: ${id} not found in cache and MongoDB is not available`;
      console.error(`FATAL ERROR: ${errorMsg}`);
      
      // Force process to exit
      process.exit(1);
      
      // This is only for TypeScript and will never execute
      throw new Error(errorMsg);
    }
    
    // Use MongoDB to fetch data and cache it
    try {
      console.log(`Fetching site content for ID: ${id} from MongoDB and pages`);
      
      // Build site content from MongoDB data
      const siteContent = await this.buildSiteContent(id);
      
      if (!siteContent) {
        console.log(`No site content found for ID: ${id}`);
        return null;
      }
      
      // Explicitly cache the site content using direct put
      console.log(`Caching site content for ID: ${id}`);
      await this.cache.put(cacheKey, siteContent);
      console.log(`Site content for ID: ${id} successfully cached`);
      
      return siteContent;
    } catch (err) {
      console.error(`Error fetching site content for ID: ${id}:`, err);
      throw err;
    }
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
      return new SiteContent(site, pages);
    } catch (err) {
      console.error(`Error building site content: ${err.message}`);
      return null;
    }
  }

  async save(site: Site): Promise<Site> {
    // Check MongoDB connection before trying to save
    const dbAvailable = await this.ensureMongoConnection();
    if (!dbAvailable) {
      throw new Error('Cannot save site: MongoDB is not available');
    }
      const siteData = {
      _id: site.id, // Use the string ID directly
      name: site.name,
      description: site.description,
      pageOrder: site.pageOrder,
      sitemapType: site.sitemapType,
      defaultPage: site.defaultPage,
      backdrop: site.backdrop
    };

    const siteModel = site.id
      ? await SiteModel.findByIdAndUpdate(site.id, siteData, { new: true, upsert: true }).exec()
      : await new SiteModel(siteData).save();

    // Invalidate cache after save
    await this.cache.invalidate(`site:${site.id}`);
    await this.cache.invalidate(`site-content:${site.id}`);    return Site.fromJSON({
      id: siteModel._id, // Use the string ID directly
      name: siteModel.name,
      description: siteModel.description ?? '',
      pageOrder: siteModel.pageOrder,
      sitemapType: siteModel.sitemapType,
      defaultPage: siteModel.defaultPage,
      backdrop: siteModel.backdrop
    });
  }

  async delete(id: string): Promise<void> {
    // Check MongoDB connection before trying to delete
    const dbAvailable = await this.ensureMongoConnection();
    if (!dbAvailable) {
      throw new Error('Cannot delete site: MongoDB is not available');
    }
    
    await SiteModel.findByIdAndDelete(id).exec(); // Use the string ID directly
    // Invalidate cache after delete
    await this.cache.invalidate(`site:${id}`);
    await this.cache.invalidate(`site-content:${id}`);
  }
}
