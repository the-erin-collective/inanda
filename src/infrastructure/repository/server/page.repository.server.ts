import { Injectable, Inject, Optional } from '@angular/core';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { Page } from '../../../domain/entities/page/page.entity';
import { PageModel } from '../../data/schemas/page.schema'; // Mongoose model
import { Types } from 'mongoose';
import { RootNode } from 'src/domain/entities/page/root.entity';
import { MONGO_CONNECTION_FACTORY, MongoConnectionFactory } from '../../data/db/mongo.factory';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';

@Injectable({
  providedIn: 'root',
})
export class ServerPageRepository implements PageRepository {
  private mongoConnected: boolean | null = null;
  
  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData,
    @Optional() @Inject(MONGO_CONNECTION_FACTORY) private readonly mongoConnectionFactory?: MongoConnectionFactory
  ) {}

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

  async findById(id: string): Promise<Page | null> {
    const cacheKey = `page:${id}`;
    const hasCachedData = await this.cache.exists(cacheKey);
    
    // Use cache if available
    if (hasCachedData) {
      return this.cache.getData(cacheKey, async () => null);
    }
    
    console.log(`Finding page by ID: ${id}`);

    // Check MongoDB connection
    const dbAvailable = await this.ensureMongoConnection();
    if (!dbAvailable) {
      throw new Error(`No cached page data for ID: ${id} and MongoDB is not available`);
    }
  
    // Use MongoDB to fetch the data and cache it
    return this.cache.getData(cacheKey, async () => {
    if (!Types.ObjectId.isValid(id)) return null; // Validate ObjectId
    const pageModel = await PageModel.findById(id).exec();
    if (!pageModel) return null;

    return Page.fromJSON({
      id: pageModel._id.toString(), // Convert ObjectId to string
      title: pageModel.title ?? '',
      root: RootNode.fromJSON({
        base: { children: pageModel.root.base.children ?? [] },
        core: { children: pageModel.root.core.children ?? [] },
        preview: { children: pageModel.root.preview.children ?? [] },
        script: { children: pageModel.root.script.children ?? [] },
        type: pageModel.root.type,
      }), // Ensure the structure matches RootNode.fromJSON
      siteId: pageModel.siteId,
      });
    });
  }

  async save(page: Page): Promise<Page> {
    // Check MongoDB connection
    const dbAvailable = await this.ensureMongoConnection();
    if (!dbAvailable) {
      throw new Error('Cannot save page: MongoDB is not available');
    }
    
    const pageData = {
      _id: page.id, // Use the string ID directly
      title: page.title,
      root: {
        base: { children: page.root.base.children ?? [] },
        core: { children: page.root.core.children ?? [] },
        preview: { children: page.root.preview.children ?? [] },
        script: { children: page.root.script.children ?? [] },
        type: page.root.type,
      },
      siteId: page.siteId,
    };

    const pageModel = page.id
      ? await PageModel.findByIdAndUpdate(page.id, pageData, { new: true, upsert: true }).exec()
      : await new PageModel(pageData).save();

    // Invalidate cache
    await this.cache.invalidate(`page:${page.id}`);
    
    // Explicitly store in cache with a put operation to ensure it's cached
    const cacheKey = `page:${page.id}`;
    try {
      // Store the page in cache for future use
      await this.cache.put(cacheKey, page);
      console.log(`Page ${page.id} successfully cached`);
    } catch (err) {
      console.error(`Failed to cache page ${page.id}:`, err.message);
    }

    return Page.fromJSON({
      id: pageModel._id, // Use the string ID directly
      title: pageModel.title ?? '',
      root: RootNode.fromJSON(pageModel.root),
      siteId: pageModel.siteId,
    });
  }

  async delete(id: string): Promise<void> {
    // Check MongoDB connection
    const dbAvailable = await this.ensureMongoConnection();
    if (!dbAvailable) {
      throw new Error('Cannot delete page: MongoDB is not available');
    }
    
    await PageModel.findByIdAndDelete(id).exec();
    // Invalidate cache
    await this.cache.invalidate(`page:${id}`);
  }

  async findByIds(ids: string[]): Promise<Page[]> {
    // An early return if there are no IDs to avoid expensive operations
    if (!ids || ids.length === 0) {
      return [];
    }
    
    console.log(`Finding pages by IDs: ${ids.join(', ')}`);
    
    // Try to get each page from cache first
    const cachedPages: Page[] = [];
    const uncachedIds: string[] = [];
    
    // Check which pages are in the cache
    for (const id of ids) {
      const cacheKey = `page:${id}`;
      const hasCachedData = await this.cache.exists(cacheKey);
      if (hasCachedData) {
        console.log(`Page ${id} found in cache`);
        const page = await this.cache.getData(cacheKey, async () => null);
        if (page) {
          cachedPages.push(page);
        } else {
          uncachedIds.push(id);
        }
      } else {
        console.log(`Page ${id} not found in cache`);
        uncachedIds.push(id);
      }
    }
    
    // If all pages are cached, return them
    if (uncachedIds.length === 0) {
      console.log('All pages found in cache, returning cached pages');
      return cachedPages;
    }
    
    console.log(`Finding pages by IDs (uncached): ${uncachedIds.join(', ')}`);
    
    // If some pages are missing from cache, check if MongoDB is available
    const dbAvailable = await this.ensureMongoConnection();
    if (!dbAvailable) {
      // If MongoDB is not available, and we have some pages missing from cache, throw an error
      if (uncachedIds.length > 0) {
        const errorMsg = `Some pages not found in cache (${uncachedIds.join(',')}) and MongoDB is not available`;
        console.error(`FATAL ERROR: ${errorMsg}`);
        
        // We need to force the process to exit here because the error might be caught
        // and prevented from reaching our global error handlers
        process.exit(1);
        
        // This is only for TypeScript and will never execute
        throw new Error(errorMsg);
      }
      return cachedPages;
    }
    
    // Use MongoDB to fetch the uncached pages
    const pageModels = await PageModel.find({ _id: { $in: uncachedIds } }).exec();
    console.log(`Found ${pageModels.length} pages in MongoDB out of ${uncachedIds.length} requested`);

    // Store each page in cache for future use
    const dbPages = await Promise.all(pageModels.map(async pageModel => {
      const page = Page.fromJSON({
        id: pageModel._id.toString(), // Ensure ID is a string
        title: pageModel.title || '',
        root: RootNode.fromJSON({
          base: { children: pageModel.root.base.children || [] },
          core: { children: pageModel.root.core.children || [] },
          preview: { children: pageModel.root.preview.children || [] },
          script: { children: pageModel.root.script.children || [] },
          type: pageModel.root.type,
        }),
        siteId: pageModel.siteId,
      });
      
      // Explicitly store in cache with a put operation to ensure it's cached
      const cacheKey = `page:${page.id}`;
      try {
        // Store the page in cache for future use
        await this.cache.put(cacheKey, page);
        console.log(`Page ${page.id} successfully cached`);
      } catch (err) {
        console.error(`Failed to cache page ${page.id}:`, err.message);
      }
      
      return page;
    }));

    // For any pages that weren't found in MongoDB, log a warning
    const foundIds = new Set(dbPages.map(page => page.id));
    for (const id of uncachedIds) {
      if (!foundIds.has(id)) {
        console.warn(`Page ${id} not found in MongoDB or cache`);
      }
    }

    return [...cachedPages, ...dbPages];
  }
}