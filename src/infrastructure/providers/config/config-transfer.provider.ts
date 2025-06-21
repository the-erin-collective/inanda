import { APP_INITIALIZER, Provider, PLATFORM_ID } from '@angular/core';
import { APP_CONFIG, AppConfig } from './app-config.token';
import { isPlatformServer } from '@angular/common';

/**
 * Factory that sets up application config transfer from server to client
 * by injecting it into the window object
 */
export function configTransferFactory(config: AppConfig, platformId: Object): () => void {
  return () => {
    if (isPlatformServer(platformId)) {
      // When rendering on server, prepare to inject config in HTML
      console.log('Preparing to transfer configuration to client');
      
      // In server.ts or similar server bootstrap file, this will be used
      // to inject the config into the rendered HTML
      (global as any).__APP_CONFIG__ = config;
    }
  };
}

/**
 * Provider that ensures the config is transferred from server to client
 */
export const configTransferProvider: Provider = {
  provide: APP_INITIALIZER,
  useFactory: configTransferFactory,
  deps: [APP_CONFIG, PLATFORM_ID],
  multi: true
};
