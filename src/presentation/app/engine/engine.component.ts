import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation, Inject, PLATFORM_ID, AfterViewInit  } from '@angular/core';
import { EngineService } from './engine.service';
import { isPlatformBrowser, CommonModule} from '@angular/common';

@Component({
  selector: 'app-engine',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './engine.component.html',
  styleUrl: './engine.component.scss',
  imports: [CommonModule]
})
export class EngineComponent implements OnInit, AfterViewInit {

  @ViewChild('rendererCanvas', { static: false })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;

  public isBabylonJsAvailable = false;

  public constructor(private engServ: EngineService, @Inject(PLATFORM_ID) private platformId: object) { }

  public ngOnInit(): void {
    this.isBabylonJsAvailable = isPlatformBrowser(this.platformId); 
  }

  public ngAfterViewInit(): void {
    if (this.isBabylonJsAvailable && this.rendererCanvas) {
      this.engServ.createScene(this.rendererCanvas);
      this.engServ.animate();
    }
  }
}
