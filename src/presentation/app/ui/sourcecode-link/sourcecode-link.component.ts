import { ChangeDetectionStrategy, Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GITHUB_BANNER_CONFIG, GithubBannerConfig } from '../../../../infrastructure/providers/config/github-banner-config.token';
import { githubBannerConfigProvider } from '../../../../infrastructure/providers/config/github-banner-config.provider';

@Component({
    selector: 'sourcecode-link',
    standalone: true,
    templateUrl: './sourcecode-link.component.html',
    styleUrl: './sourcecode-link.component.scss',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule
    ],
    providers: [
        githubBannerConfigProvider
    ]
})
export class SourcecodeLinkComponent implements OnInit {
  public showGithubBanner = false;
  public githubBannerUrl = '';

  constructor(
    @Inject(GITHUB_BANNER_CONFIG) private bannerConfig: GithubBannerConfig,
  ) {
    console.debug('SourcecodeLinkComponent constructor called', bannerConfig);
  }

  public ngOnInit(): void {
    this.showGithubBanner = !!this.bannerConfig.SHOW_GITHUB_BANNER;
    this.githubBannerUrl = this.bannerConfig.GITHUB_BANNER_URL || '';
    console.debug('SourcecodeLinkComponent ngOnInit called', {
      showGithubBanner: this.showGithubBanner,
      githubBannerUrl: this.githubBannerUrl
    });
  }

}
