import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SiteContentResolver } from '../../enactment/resolvers/site-content.resolver';
import { SiteContent } from '../../integration/models/site-content.aggregate.model';
import { PlatformComponent } from './platform/platform.component';
import { SourcecodeLinkComponent } from './ui/sourcecode-link/sourcecode-link.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true, // Standalone component
  imports: [PlatformComponent, SourcecodeLinkComponent], // Import required components
  styleUrls: [],
  templateUrl: './app.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  site: SiteContent | null = null;
  siteDataReady = false;

  constructor(
    private siteContentResolver: SiteContentResolver, 
    private cdr: ChangeDetectorRef,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    console.log('AppComponent initialized');

    // Subscribe to the resolver's custom observable
    this.siteContentResolver.siteContent$.subscribe((siteContent) => {
      if (siteContent) {
        console.log('ngOnInit - Site content resolved:', siteContent);
        this.site = siteContent;
        this.onSiteContentFetched();
      }
    });
  }

  // Method to handle logic after site content is fetched
  private onSiteContentFetched(): void {
    console.log('Performing logic after site content is fetched:', this.site);
    this.titleService.setTitle(this.site.site.name);
    this.siteDataReady = true;
    this.cdr.markForCheck(); // Trigger change detection
  }
}

