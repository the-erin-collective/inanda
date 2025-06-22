
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { GITHUB_BANNER_CONFIG, GithubBannerConfig } from './github-banner-config.token';
import { ConfigService } from '../../services/config.service';

export function githubBannerConfigFactory(configService: ConfigService): GithubBannerConfig {
  return {
    SHOW_GITHUB_BANNER: !!configService.get('SHOW_GITHUB_BANNER'),
    GITHUB_BANNER_URL: configService.get('GITHUB_BANNER_URL')
  };
}

export function provideGithubBannerConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: GITHUB_BANNER_CONFIG,
      useFactory: githubBannerConfigFactory,
      deps: [ConfigService]
    }
  ]);
}
