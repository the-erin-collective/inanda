import { ChangeDetectionStrategy, Component, Inject, OnInit, Optional, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GITHUB_BANNER_CONFIG, GithubBannerConfig } from '../../../../infrastructure/providers/config/github-banner-config.token';
import { ConfigService } from '../../../../infrastructure/services/config.service';
import { githubBannerConfigFactory } from '../../../../infrastructure/providers/config/github-banner-config.provider';

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
        ConfigService,
        {
            provide: GITHUB_BANNER_CONFIG,
            useFactory: (configService: ConfigService) => githubBannerConfigFactory(configService),
            deps: [ConfigService]
        }
    ]
})
export class SourcecodeLinkComponent implements OnInit {
  public showGithubBanner = false;
  public githubBannerUrl = '';
  constructor(
    @Optional() @Inject(GITHUB_BANNER_CONFIG) private bannerConfig: GithubBannerConfig | null,
    @Optional() private configService: ConfigService
  ) {
    console.debug('SourcecodeLinkComponent constructor called', bannerConfig);
  }
  public async ngOnInit(): Promise<void> {
    try {
      // Use bannerConfig if available, otherwise fallback to ConfigService
      if (this.bannerConfig) {
        console.debug('SourcecodeLinkComponent: Using injected banner config');
        this.showGithubBanner = !!this.bannerConfig.SHOW_GITHUB_BANNER;
        this.githubBannerUrl = this.bannerConfig.GITHUB_BANNER_URL || '';
      } else if (this.configService) {
        console.debug('SourcecodeLinkComponent: Using ConfigService');
        
        this.showGithubBanner = !!this.configService.get('SHOW_GITHUB_BANNER');
        this.githubBannerUrl = this.configService.get('GITHUB_BANNER_URL');
      } else {
       throw new Error('no config found');
      }
    } catch (err) {
      console.error('Error in SourcecodeLinkComponent.ngOnInit:', err);
    }
  }

}
