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

  async findById(siteId: string, id: string): Promise<Page | null> {
    const cacheKey = `page:${id}`;
    return this.cache.getData(cacheKey, async () => {
      try {
        const doc = await PageModel.findById(id).lean();
        if (!doc) {
          console.warn(`No page found in MongoDB for ID: ${id}`);
          return null;
        }

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

  async save(siteId: string, page: Page): Promise<Page> {
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

  async delete(siteId: string, id: string): Promise<void> {

  }

  async findByIds(siteId: string, ids: string[]): Promise<Page[]> {
    // An early return if there are no IDs to avoid expensive operations
    if (!ids || ids.length === 0) {
      return [];
    }
    
    console.log(`Finding pages by IDs: ${ids.join(', ')}`);
    
    const pages: Page[] = [];
    
    // Process each ID
    for (const id of ids) {
      // Try to get the page from cache/MongoDB
      const page = await this.findById(siteId, id);
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