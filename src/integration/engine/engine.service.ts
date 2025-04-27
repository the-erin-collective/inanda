import { Injectable, ElementRef } from '@angular/core';
import { PlatformService } from '../engine/platform/platform.service';
import { PageLayoutService } from '../engine/render/page-layout.service';
import { RenderService } from '../engine/render/render.service';
import { SiteContent } from '../models/site-content.aggregate.model';

@Injectable({ providedIn: 'root' })
export class EngineService {
  constructor(
    private platformService: PlatformService,
    private pageLayoutService: PageLayoutService,
    private renderService: RenderService
  ) {}

  public initializeEngine(canvas: ElementRef<HTMLCanvasElement>, siteContent: SiteContent | null): void {
    // Step 1: Initialize the platform (Babylon.js engine, scene, camera, lights)
    const scene = this.platformService.initializePlatform(canvas);

    // Step 2: Delegate grid creation and rendering to PageLayoutService
    this.pageLayoutService.renderGrid(scene, siteContent);

    // Step 3: Start the render loop
    this.renderService.setPlatform(this.platformService.engine, scene);
    this.renderService.startRendering();
  }
}