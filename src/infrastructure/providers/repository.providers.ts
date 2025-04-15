import { Provider, StaticProvider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../domain/repository/page.repository.interface';
import { AppPageRepository } from '../repository/page.repository';
import { SITE_REPOSITORY } from '../../domain/repository/site.repository.interface';
import { AppSiteRepository } from '../repository/site.repository';

export const repositoryProviders: StaticProvider[] = [
  {
    provide: PAGE_REPOSITORY,
    useValue: new AppPageRepository(),
  },
  {
    provide: SITE_REPOSITORY,
    useValue: new AppSiteRepository(new AppPageRepository()),
  },
];