import { ClassProvider, StaticProvider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { ClientPageRepository } from '../../repository/client/page.repository.client';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { ClientSiteRepository } from '../../repository/client/site.repository.client';
import { TransferState } from '@angular/core';

export const clientRepositoryProviders: StaticProvider[] = [
  {
    provide: PAGE_REPOSITORY,
    useFactory: (transferState: TransferState) => new ClientPageRepository(transferState),
    deps: [TransferState]
  },
  {
    provide: SITE_REPOSITORY,
    useFactory: (transferState: TransferState) => new ClientSiteRepository(transferState),
    deps: [TransferState]
  }
];