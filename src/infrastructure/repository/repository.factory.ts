import { PersistentStorageType } from '../../domain/constants/storage-type.enum';
import { SiteRepository } from '../../domain/repository/site.repository.interface';
import { PageRepository } from '../../domain/repository/page.repository.interface';

import { ServerSiteRepository } from './server/site.repository.server';
import { ServerPageRepository } from './server/page.repository.server';

import { FileSiteRepository } from './file/site.repository.file';
import { FilePageRepository } from './file/page.repository.file';

import { CacheData } from '../../domain/data/cache.interface';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Injectable, Inject } from '@angular/core';
import { CACHE_PROVIDER } from '../providers/cache/cache.tokens';

@Injectable()
export class RepositoryFactory {
    constructor(
        @Inject(CACHE_PROVIDER) private readonly cache: CacheData
    ) {}

    createSiteRepository(storageType: PersistentStorageType, siteId: string = 'site-001'): SiteRepository {
        switch (storageType) {
            case PersistentStorageType.FILE:
                return new FileSiteRepository(siteId, this.cache);
            case PersistentStorageType.MONGODB:
                const pageRepository = new ServerPageRepository(this.cache);
                return new ServerSiteRepository(pageRepository, this.cache);
            default:
                throw new Error(`Unsupported storage type: ${storageType}`);
        }
    }

    createPageRepository(storageType: PersistentStorageType, siteId: string = 'site-001'): PageRepository {
        switch (storageType) {
            case PersistentStorageType.FILE:
                return new FilePageRepository(siteId, this.cache);
            case PersistentStorageType.MONGODB:
                return new ServerPageRepository(this.cache);
            default:
                throw new Error(`Unsupported storage type: ${storageType}`);
        }
    }
}
