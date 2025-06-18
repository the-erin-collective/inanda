import { Injectable, Inject } from '@angular/core';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { Page } from '../../../domain/entities/page/page.entity';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import { CacheData } from '../../../domain/data/cache.interface';
import { PageModel } from '../../data/schemas/page.schema';

@Injectable({
  providedIn: 'root',
})
export class ServerPageRepository implements PageRepository {
  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData
  ) {}

  async findById(id: string): Promise<Page | null> {
    const cacheKey = `page:${id}`;
    return this.cache.getData(cacheKey, async () => {
      try {
        const doc = await PageModel.findById(id).lean();
        if (!doc) {
          console.log(`No page found in MongoDB for ID: ${id}`);
          return null;
        }
        console.log(`Found page in MongoDB: ${id}`);
        return new Page(
          doc._id,
          doc.title || '',
          doc.root,
          doc.siteId
        );
      } catch (err) {
        console.error(`Error fetching page from MongoDB: ${err.message}`);
        return null;
      }
    });
  }

  async save(page: Page): Promise<Page> {
    try {
      // Save to MongoDB
      await PageModel.findByIdAndUpdate(
        page.id,
        {
          _id: page.id,
          title: page.title,
          root: page.root,
          siteId: page.siteId
        },
        { upsert: true, new: true }
      );
      // Save to cache
      await this.cache.put(`page:${page.id}`, page);
      return page;
    } catch (err) {
      console.error(`Error saving page: ${err.message}`);
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Delete from MongoDB
      await PageModel.findByIdAndDelete(id);
      // Remove from cache
      await this.cache.invalidate(`page:${id}`);
    } catch (err) {
      console.error(`Error deleting page: ${err.message}`);
      throw err;
    }
  }

  async findByIds(ids: string[]): Promise<Page[]> {
    // An early return if there are no IDs to avoid expensive operations
    if (!ids || ids.length === 0) {
      return [];
    }
    
    console.log(`Finding pages by IDs: ${ids.join(', ')}`);
    
    const pages: Page[] = [];
    
    // Process each ID
    for (const id of ids) {
      // Try to get the page from cache/MongoDB
      const page = await this.findById(id);
      if (page) {
        pages.push(page);
      }
    }
    
    // Log summary
    if (pages.length < ids.length) {
      console.warn(`Only found ${pages.length} of ${ids.length} requested pages`);
    } else {
      console.log(`Successfully retrieved all ${pages.length} requested pages`);
    }
    
    return pages;
  }
}