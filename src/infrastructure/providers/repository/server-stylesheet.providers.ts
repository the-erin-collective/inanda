import { ClassProvider, StaticProvider } from '@angular/core';
import { STYLESHEET_REPOSITORY } from '../../../domain/repository/stylesheet.repository.token';
import { ServerStylesheetRepository } from '../../repository/server/stylesheet.repository.server';

export const serverStylesheetProvider: ClassProvider = {
  provide: STYLESHEET_REPOSITORY,
  useClass: ServerStylesheetRepository
};

// Also provide the concrete implementation
export const serverStylesheetProviders: StaticProvider[] = [
  serverStylesheetProvider,
  {
    provide: ServerStylesheetRepository,
    useClass: ServerStylesheetRepository
  }
];
