import { StaticProvider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { ClientPageRepository } from '../../repository/client/page.repository.client';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { ClientSiteRepository } from '../../repository/client/site.repository.client';
import { TransferState } from '@angular/core';

/**
 * Client-side repository providers that use the TransferState to get data
 * from the server. These aren't affected by PERSISTENT_STORAGE since they 
 * always use the client repositories regardless of the backend storage.
 */
export const clientRepositoryFactoryProviders: StaticProvider[] = [
  {
    provide: PAGE_REPOSITORY,
    useValue: new ClientPageRepository(new TransferState()),
  },
  {
    provide: SITE_REPOSITORY,
    useValue: new ClientSiteRepository(new TransferState()),
  }
];
