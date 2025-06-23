import { APP_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ConfigService } from '../../services/config.service';

export function initializeAppConfig(configService: ConfigService) {
  return () => configService.init();
}

export function provideConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppConfig,
      deps: [ConfigService],
      multi: true
    }
  ]);
}
