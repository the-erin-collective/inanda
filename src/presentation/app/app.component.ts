import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SiteContent } from '../../integration/models/site-content.aggregate.model';
import { EngineComponent } from './engine/engine.component';
import { UiComponent } from './ui/ui.component';

@Component({
  selector: 'app-root',
  standalone: true, // Standalone component
  imports: [EngineComponent, UiComponent], // Import required components
  styleUrls: [],
  templateUrl: './app.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  site: SiteContent | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    console.log('AppComponent initialized');

    this.route.data.subscribe((data) => {
      console.log('data', data);

      this.site = data['siteContent']; // 'siteContent' is the key used in the resolver
    });
  }
}

