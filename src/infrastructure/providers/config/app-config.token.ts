import { InjectionToken } from '@angular/core';

export interface AppConfig {
  USE_LEVEL_DB: boolean;
  PERSISTENT_STORAGE: 'FILE' | 'MONGODB';
  FILE_DATA_PATH?: string; // Optional, used if PERSISTENT_STORAGE is 'FILE'
  MONGO_URI?: string; // Optional, used if PERSISTENT_STORAGE is 'MONGODB'
  SHOW_GIHUTB_BANNER: boolean;
  GITHUB_BANNER_URL: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
