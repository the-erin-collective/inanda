import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { SiteContent } from '../../domain/aggregates/site-content.aggregate';
import { EngineComponent } from './engine/engine.component';
import { UiComponent } from './ui/ui.component';

@Component({
  selector: 'app-root',
  standalone: true, // Standalone component
  imports: [EngineComponent, UiComponent], // Import required components
  styleUrls: ['./app.component.scss'],
  templateUrl: './app.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  site: SiteContent | null = null;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const siteId = params['id'];
      this.http.get<SiteContent>(`/api/site/${siteId}`).subscribe({
        next: (data) => {
          this.site = data;
        },
        error: (err) => {
          console.error('Error fetching site data:', err);
        },
      });
    });
  }
}

