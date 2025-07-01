import { Injectable, NgZone } from '@angular/core';
import { Engine, Scene } from '@babylonjs/core';
import { WindowRefService } from '../../../../common/services/window-ref.service';

@Injectable({ providedIn: 'root' })
export class RenderService {
  private engine: Engine;
  private scene: Scene;

  constructor(private ngZone: NgZone, private windowRef: WindowRefService) {}

  setPlatform(engine: Engine, scene: Scene): void {
    this.engine = engine;
    this.scene = scene;
  }

  startRendering(): void {
    this.ngZone.runOutsideAngular(() => {
      const renderLoop = () => {
        this.scene.render();
      };

      if (this.windowRef.document.readyState !== 'loading') {
        this.engine.runRenderLoop(renderLoop);
      } else {
        this.windowRef.window.addEventListener('DOMContentLoaded', () => {
          this.engine.runRenderLoop(renderLoop);
        });
      }

      this.windowRef.window.addEventListener('resize', () => {
        this.engine.resize();
      });
    });
  }
}