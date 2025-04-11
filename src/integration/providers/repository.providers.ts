import { Provider } from '@angular/core';
import { PAGE_REPOSITORY } from '../../domain/repository/page.repository.interface';
import { AppPageRepository } from '../repository/page.repository';

export const repositoryProviders: Provider[] = [
  {
    provide: PAGE_REPOSITORY,
    useClass: AppPageRepository,
  },
];