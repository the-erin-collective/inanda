import { Injectable, Inject } from '@angular/core';
import { PageRepository } from '../../../domain/repository/page.repository.interface';
import { Page } from '../../../domain/entities/page/page.entity';
import { FileRepositoryBase } from './file-repository.base';
import { CacheData } from '../../../domain/data/cache.interface';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';

@Injectable()
export class FilePageRepository extends FileRepositoryBase<Page> implements PageRepository {  
  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData
  ) {
    super({ siteId: 'site-001', entityType: 'pages' });
  }
  async findById(id: string): Promise<Page | null> {
    console.log(`FilePageRepository: Looking for page with ID ${id}`);
    const data = await this.readJson(id);
    if (data) {
      console.log(`FilePageRepository: Found page data for ${id}`);
    } else {
      console.log(`FilePageRepository: No page data found for ${id}`);
    }
    return data ? Page.fromJSON(data as Parameters<typeof Page.fromJSON>[0]) : null;
  }

  async findByIds(ids: string[]): Promise<Page[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const pages: Page[] = [];
    for (const id of ids) {
      const page = await this.findById(id);
      if (page) {
        pages.push(page);
      }
    }

    return pages;
  }

  async save(page: Page): Promise<Page> {
    await this.writeJson(page.id, page.toJSON());
    return page;
  }

  async delete(id: string): Promise<void> {
    await this.deleteJson(id);
  }
}
