import { InjectionToken } from '@angular/core';
import { StylesheetRepository } from './stylesheet.repository.interface';

export const STYLESHEET_REPOSITORY = new InjectionToken<StylesheetRepository>('STYLESHEET_REPOSITORY');
