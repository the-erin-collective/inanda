import { FactoryProvider, PLATFORM_ID } from '@angular/core';
import { APP_CONFIG, AppConfig } from './app-config.token';
import { isPlatformServer } from '@angular/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Factory that loads the appropriate config file based on environment
 */
export function configFactory(platformId: Object): AppConfig {
  if (isPlatformServer(platformId)) {
    try {
      // Server-side loading
      const isProd = process.env['NODE_ENV'] === 'production';
      const configPath = isProd 
        ? path.join(process.cwd(), 'config.prod.json')
        : path.join(process.cwd(), 'config.dev.json');
      
      console.log(`Loading config from ${configPath}`);
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (err) {
      console.error(`Error loading config:`, err);
      throw new Error(`Failed to load configuration: ${err.message}`);
    }
  } else {
    // Client-side - use config provided during SSR
    if (!(window as any).__APP_CONFIG__) {
      console.warn('Client-side config not found in window.__APP_CONFIG__');
    }
    return (window as any).__APP_CONFIG__;
  }
}

/**
 * Provider for the application configuration
 */
export const appConfigProvider: FactoryProvider = {
  provide: APP_CONFIG,
  useFactory: configFactory,
  deps: [PLATFORM_ID]
};
