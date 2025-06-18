import { Injectable, Inject } from '@angular/core';
import { StylesheetRepository } from '../../../domain/repository/stylesheet.repository.interface';
import { Stylesheet } from '../../../domain/entities/style/stylesheet.entity';
import { StylesheetModel } from '../../../infrastructure/data/schemas/stylesheet.schema';
import { CacheData } from '../../../domain/data/cache.interface';
import { CACHE_PROVIDER } from '../../providers/cache/cache.tokens';

@Injectable({ providedIn: 'root' })
export class ServerStylesheetRepository implements StylesheetRepository {
  constructor(
    @Inject(CACHE_PROVIDER) private cache: CacheData
  ) {}

  async getStylesheetById(id: string): Promise<Stylesheet | null> {
    const cacheKey = `stylesheet:${id}`;
    return this.cache.getData<Stylesheet | null>(cacheKey, async () => {
      try {
        const doc = await StylesheetModel.findById(id).lean();
        if (!doc) {
          console.log(`No stylesheet found in MongoDB for ID: ${id}`);
          return null;
        }
        console.log(`Found stylesheet in MongoDB: ${id}`);
        return {
          _id: doc._id,
          name: doc.name,
          styles: doc.styles,
          importedStylesheetIds: doc.importedStylesheetIds || []
        };
      } catch (err) {
        console.error(`Error fetching stylesheet from MongoDB: ${err.message}`);
        return null;
      }
    });
  }
}
