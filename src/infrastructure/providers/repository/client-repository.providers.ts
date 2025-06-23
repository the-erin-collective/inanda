import { PLATFORM_ID, StaticProvider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { ClientPageRepository } from '../../repository/client/page.repository.client';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { ClientSiteRepository } from '../../repository/client/site.repository.client';
import { TransferState } from '@angular/core';
import { ConfigService } from 'src/infrastructure/services/config.service';
import { FileFetchService } from 'src/infrastructure/services/file-fetch.service';
import { CACHE_PROVIDER } from '../cache/cache.tokens';

export const clientRepositoryProviders: StaticProvider[] = [
  {
    provide: PAGE_REPOSITORY,
    useFactory: (
      platformId: Object,
      transferState: TransferState,
      configService: ConfigService,
      fileFetchService: FileFetchService,
      cache: any
    ) => new ClientPageRepository(
      platformId,
      transferState,
      configService,
      fileFetchService,
      cache
    ),
    deps: [
      PLATFORM_ID,
      TransferState,
      ConfigService,
      FileFetchService,
      CACHE_PROVIDER
    ]
  },
  {
    provide: SITE_REPOSITORY,
    useFactory: ( platformId: Object,
      transferState: TransferState,
      configService: ConfigService,
      fileFetchService: FileFetchService,
      cache: any
    ) => new ClientSiteRepository(
      platformId,
      transferState,
      configService,
      fileFetchService,
      cache
    ),
    deps: [
      PLATFORM_ID,
      TransferState,
      ConfigService,
      FileFetchService,
      CACHE_PROVIDER
    ]
  }
];