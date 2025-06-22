import { InjectionToken } from '@angular/core';

export interface AppConfig {
  DATA_PATH?: string; // Optional, used if PERSISTENT_STORAGE is 'FILE'
  USE_LEVEL_DB: boolean;
  PERSISTENT_STORAGE: 'FILE' | 'MONGODB';
  SHOW_GITHUB_BANNER: boolean;
  GITHUB_BANNER_URL: string;
  MONGO_URI?: string; // Optional, used if PERSISTENT_STORAGE is 'MONGODB'
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
