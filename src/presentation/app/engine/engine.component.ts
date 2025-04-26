import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { EngineService } from '../../../integration/engine/engine.service';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { SiteContent } from '../../../integration/models/site-content.aggregate.model';

@Component({
  selector: 'app-engine',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './engine.component.html',
  styleUrl: './engine.component.scss',
  imports: [CommonModule],
})
export class EngineComponent implements OnChanges {
  @ViewChild('rendererCanvas', { static: false })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;

  @Input() initializeEngine: boolean = false; // Input to trigger initialization
  @Input() siteContent: SiteContent | null = null; // Input to receive site content

  public isBabylonJsAvailable = false;

  constructor(
    private engServ: EngineService,
    @Inject(PLATFORM_ID) private platformId: object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log('EngineComponent - ngOnChanges triggered:', changes);

    if (changes['initializeEngine'] && changes['initializeEngine'].currentValue) {
      if (isPlatformBrowser(this.platformId)) {
        this.isBabylonJsAvailable = true;
        this.cdr.detectChanges(); // Ensure the DOM updates
        setTimeout(() => this.StartEngine(), 0); // Wait for the DOM to update
      } else {
        console.log('EngineComponent - Skipping Babylon.js initialization on the server');
      }
    }

    if (changes['siteContent'] && changes['siteContent'].currentValue) {
      console.log('EngineComponent - Received site content:', this.siteContent);
      // Perform any logic with the site content here
    }
  }

  private StartEngine(): void {
    console.log('Starting Babylon.js engine...');

    this.isBabylonJsAvailable = isPlatformBrowser(this.platformId);

    if (this.isBabylonJsAvailable && this.rendererCanvas) {
      this.engServ.createScene(this.rendererCanvas, this.siteContent); // Pass site content to the engine
      this.engServ.animate();
    } else {
      console.warn('EngineComponent - Renderer canvas or babylonjs is not available');
    }
  }
}
