import { StaticProvider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../../domain/repository/page.repository.interface';
import { ServerPageRepository } from '../../repository/server/page.repository.server';
import { SITE_REPOSITORY } from '../../../domain/repository/site.repository.interface';
import { ServerSiteRepository } from '../../repository/server/site.repository.server';

export const repositoryProviders: StaticProvider[] = [
  {
    provide: PAGE_REPOSITORY,
    useValue: new ServerPageRepository(),
  },
  {
    provide: SITE_REPOSITORY,
    useValue: new ServerSiteRepository(new ServerPageRepository()),
  },
];