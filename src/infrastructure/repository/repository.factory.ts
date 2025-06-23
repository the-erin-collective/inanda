import { PersistentStorageType } from '../../domain/constants/storage-type.enum';
import { SiteRepository } from '../../domain/repository/site.repository.interface';
import { PageRepository } from '../../domain/repository/page.repository.interface';

import { ServerSiteRepository } from './server/site.repository.server';
import { ServerPageRepository } from './server/page.repository.server';

import { FileSiteRepository } from './file/site.repository.file';
import { FilePageRepository } from './file/page.repository.file';

import { CacheData } from '../../domain/data/cache.interface';
import { Injectable, Inject } from '@angular/core';
import { CACHE_PROVIDER } from '../providers/cache/cache.tokens';
import { FileFetchService } from '../services/file-fetch.service';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../services/config.service';

@Injectable()
export class RepositoryFactory {
    constructor(
        @Inject(CACHE_PROVIDER) private readonly cache: CacheData,
                private readonly http: HttpClient,
                    private readonly configService: ConfigService
    ) {}

    createSiteRepository(storageType: PersistentStorageType, siteId: string): SiteRepository {
        switch (storageType) {
            case PersistentStorageType.FILE:
                const fetchService = new FileFetchService(this.http);
                return new FileSiteRepository(this.cache, this.configService, fetchService);
            case PersistentStorageType.MONGODB:
                const pageRepository = new ServerPageRepository(this.cache);
                return new ServerSiteRepository(pageRepository, this.cache);
            default:
                throw new Error(`Unsupported storage type: ${storageType}`);
        }
    }

    createPageRepository(storageType: PersistentStorageType, siteId: string): PageRepository {
        switch (storageType) {
            case PersistentStorageType.FILE:
                 const fetchService = new FileFetchService(this.http);
                return new FilePageRepository(this.cache, this.configService, fetchService);
            case PersistentStorageType.MONGODB:
                return new ServerPageRepository(this.cache);
            default:
                throw new Error(`Unsupported storage type: ${storageType}`);
        }
    }
}
