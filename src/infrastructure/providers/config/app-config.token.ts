import { InjectionToken } from '@angular/core';

export interface AppConfig {
  DATA_PATH?: string; // Optional, used if PERSISTENT_STORAGE is 'FILE'
  SHOW_GITHUB_BANNER: boolean;
  GITHUB_BANNER_URL: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
