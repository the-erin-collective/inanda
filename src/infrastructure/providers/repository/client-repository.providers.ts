import { StaticProvider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { ClientPageRepository } from '../../repository/client/page.repository.client';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { ClientSiteRepository } from '../../repository/client/site.repository.client';
import { TransferState } from '@angular/core';

export const repositoryProviders: StaticProvider[] = [
  {
    provide: PAGE_REPOSITORY,
    useValue: new ClientPageRepository(new TransferState()),
  },
  {
    provide: SITE_REPOSITORY,
    useValue: new ClientSiteRepository(new TransferState()),
  },
];