import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { APP_CONFIG, AppConfig } from './app-config.token';
import { ConfigService } from '../../services/config.service';

/**
 * Factory that uses the ConfigService to get application configuration
 */
export function appConfigFactory(configService: ConfigService): AppConfig {
  return configService.getAll();
}

/**
 * Provider for the application configuration
 */
export function provideAppConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_CONFIG,
      useFactory: appConfigFactory,
      deps: [ConfigService]
    }
  ]);
}
