import { Injectable, Inject } from '@angular/core';
import { SiteRepository } from '../../../domain/repository/site.repository.interface';
import { Site } from '../../../domain/entities/site/site.entity';
import { SiteContent } from '../../../domain/aggregates/site-content.aggregate';
import { FileRepositoryBase } from './file-repository.base';
import { FilePageRepository } from './page.repository.file';
import { CacheData } from '../../../domain/data/cache.interface';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FileSiteRepository extends FileRepositoryBase<Site> implements SiteRepository {
  private readonly pageRepository: FilePageRepository;  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: CacheData
  ) {
    // Use 'sites' entityType, but we'll override the file access method
    super({ siteId: 'site-001', entityType: 'sites' });
    this.pageRepository = new FilePageRepository(this.cache);
  }async findById(id: string): Promise<Site | null> {
    // Use the site ID directly as the filename, no special cases
    console.log(`FileSiteRepository: Looking for site with ID ${id}, using filename ${id}.json`);
    
    const data = await this.readJson(id);
    if (data) {
      console.log(`FileSiteRepository: Found site data for ${id}`);
    } else {
      console.log(`FileSiteRepository: No site data found for ${id}`);
    }
    
    return data ? Site.fromJSON(data as any) : null;
  }

  async findByIdWithPages(id: string): Promise<SiteContent | null> {
    const site = await this.findById(id);
    if (!site) return null;

    const pages = await this.pageRepository.findByIds(site.pageOrder);
    return new SiteContent(site, pages);
  }

  async save(site: Site): Promise<Site> {
    await this.writeJson(site.id, site.toJSON());
    return site;
  }

  async delete(id: string): Promise<void> {
    await this.deleteJson(id);
  }
  // Override the readJson method to look for site data in the parent directory
  protected override async readJson<TData = Record<string, unknown>>(id: string): Promise<TData | null> {
    try {
      // For site data, look in the parent directory (directly in /site-001/)
      const parentDir = path.dirname(this.basePath);
      const filePath = path.join(parentDir, `${id}.json`);
      console.log(`FileSiteRepository: Looking for site file at path: ${filePath}`);
      
      const content = await fs.promises.readFile(filePath, 'utf-8');
      console.log(`FileSiteRepository: Successfully read site file: ${filePath}`);
      return JSON.parse(content) as TData;
    } catch (err) {
      console.log(`FileSiteRepository: Error reading site file: ${err.code || err.message}`);
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }
  // Override writeJson to save site data in the parent directory
  protected override async writeJson(id: string, data: Record<string, unknown>): Promise<void> {
    const parentDir = path.dirname(this.basePath);
    const filePath = path.join(parentDir, `${id}.json`);
    console.log(`FileSiteRepository: Saving site data to: ${filePath}`);
    await fs.promises.writeFile(
      filePath, 
      JSON.stringify(data, null, 2), 
      'utf-8'
    );
  }
}
