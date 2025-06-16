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
    // Use getData, which will call fetchFn if not cached
    return this.cache.getData<Stylesheet | null>(cacheKey, async () => {
      const doc = await StylesheetModel.findById(id).lean();
      if (!doc) return null;
      return {
        _id: doc._id,
        name: doc.name,
        styles: doc.styles,
        importedStylesheetIds: doc.importedStylesheetIds || [],
      };
    });
  }
}
