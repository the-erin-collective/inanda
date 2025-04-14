import { StaticProvider } from '@angular/core';
import { SITE_CONTENT_DATA } from '../../domain/data/site-content.data.interface';
import { AppSiteContentData } from '../data/data/site-content.data';

export const dataProviders: StaticProvider[] = [
  {
    provide: SITE_CONTENT_DATA,
    useValue: new AppSiteContentData(),
  },
];