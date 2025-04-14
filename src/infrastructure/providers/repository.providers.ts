import { Provider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../domain/repository/page.repository.interface';
import { AppPageRepository } from '../data/repository/page.repository';
import { SITE_REPOSITORY } from '../../domain/repository/site.repository.interface';
import { AppSiteRepository } from '../data/repository/site.repository';

export const repositoryProviders: Provider[] = [
  {
    provide: PAGE_REPOSITORY,
    useClass: AppPageRepository,
  },
  {
    provide: SITE_REPOSITORY,
    useClass: AppSiteRepository,
  },
];