import { ClassProvider, StaticProvider } from '@angular/core';
import { STYLESHEET_REPOSITORY } from '../../../domain/repository/stylesheet.repository.token';
import { ClientStylesheetRepository } from '../../repository/client/stylesheet.repository.client';

export const clientStylesheetProvider: ClassProvider = {
  provide: STYLESHEET_REPOSITORY,
  useClass: ClientStylesheetRepository
};

// Also provide the concrete implementation
export const clientStylesheetProviders: StaticProvider[] = [
  clientStylesheetProvider,
  {
    provide: ClientStylesheetRepository,
    useClass: ClientStylesheetRepository
  }
];
