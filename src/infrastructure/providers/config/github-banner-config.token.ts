import { InjectionToken } from '@angular/core';

export interface GithubBannerConfig {
  SHOW_GITHUB_BANNER: boolean;
  GITHUB_BANNER_URL: string;
}

export const GITHUB_BANNER_CONFIG = new InjectionToken<GithubBannerConfig>('GITHUB_BANNER_CONFIG');
