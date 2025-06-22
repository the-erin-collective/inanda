
import { TransferState, FactoryProvider, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import * as fs from 'fs';
import * as path from 'path';
import { GITHUB_BANNER_CONFIG, GithubBannerConfig } from './github-banner-config.token';

const GITHUB_BANNER_CONFIG_KEY = 'github.banner.config';

export function githubBannerConfigFactory(platformId: Object, transferState: TransferState): GithubBannerConfig {
  if (isPlatformServer(platformId)) {
    const isProd = process.env['NODE_ENV'] === 'production';
    const configPath = isProd
      ? path.join(process.cwd(), 'config.prod.json')
      : path.join(process.cwd(), 'config.dev.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    const bannerConfig: GithubBannerConfig = {
      SHOW_GITHUB_BANNER: !!config.SHOW_GITHUB_BANNER,
      GITHUB_BANNER_URL: config.GITHUB_BANNER_URL || ''
    };
    transferState.set(GITHUB_BANNER_CONFIG_KEY as any, bannerConfig);
    return bannerConfig;
  } else {
    return transferState.get(GITHUB_BANNER_CONFIG_KEY as any, {
      SHOW_GITHUB_BANNER: false,
      GITHUB_BANNER_URL: ''
    });
  }
}

export const githubBannerConfigProvider: FactoryProvider = {
  provide: GITHUB_BANNER_CONFIG,
  useFactory: githubBannerConfigFactory,
  deps: [PLATFORM_ID, TransferState]
};
