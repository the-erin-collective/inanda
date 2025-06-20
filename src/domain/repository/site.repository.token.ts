import { InjectionToken } from '@angular/core';
import { SiteRepository } from './site.repository.interface';

export const SITE_REPOSITORY = new InjectionToken<SiteRepository>('STYLESHEET_REPOSITORY');
