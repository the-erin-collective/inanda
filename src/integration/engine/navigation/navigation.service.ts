import { Injectable } from '@angular/core';
import { Scene, Vector3, Animation, ArcRotateCamera, PointerInfo, PointerEventTypes, EasingFunction, CubicEase, AnimationGroup } from '@babylonjs/core';
import { Page } from 'src/domain/entities/page/page.entity';

export enum ViewMode {
  SITEMAP = 'sitemap',
  PAGE = 'page'
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private currentViewMode: ViewMode = ViewMode.SITEMAP;
  private currentPageId?: string;
  private camera: ArcRotateCamera;
  private scene: Scene;
  private pages: Page[] = [];
  private hexToPageMap: Map<string, Page> = new Map();
  private currentAnimationGroup: AnimationGroup | null = null;

  // Camera positions
  private readonly SITEMAP_POSITION = new Vector3(0, 200, 0);
  private readonly SITEMAP_TARGET = new Vector3(0, 0, 0);
  private readonly SITEMAP_ALPHA = -Math.PI / 2; // -90 degrees for horizontal orientation
  private readonly SITEMAP_BETA = 0; // 0 degrees for vertical orientation
  private readonly SITEMAP_RADIUS = 200; // Adjusted radius for better visibility

  // Page view settings
  private readonly PAGE_RADIUS = 40; // Adjusted radius for better page view
  private readonly ANIMATION_DURATION = 1.5; // Increased duration for smoother transitions

  constructor() {}

  initialize(scene: Scene, camera: ArcRotateCamera, pages: Page[]): void {
    this.scene = scene;
    this.camera = camera;
    this.pages = pages;
    this.setupCamera();
    this.setupEventHandlers();
    this.createHexToPageMap();
  }

  private setupCamera(): void {
    // Set initial camera position for sitemap view
    this.camera.position = this.SITEMAP_POSITION;
    this.camera.setTarget(this.SITEMAP_TARGET);
    this.camera.alpha = this.SITEMAP_ALPHA;
    this.camera.beta = this.SITEMAP_BETA;
    this.camera.radius = this.SITEMAP_RADIUS;

    // Remove camera limits to allow animation
    this.camera.lowerRadiusLimit = null;
    this.camera.upperRadiusLimit = null;
    this.camera.lowerAlphaLimit = null;
    this.camera.upperAlphaLimit = null;
    this.camera.lowerBetaLimit = null;
    this.camera.upperBetaLimit = null;

    // Disable camera controls
    this.camera.inputs.clear();
  }

  private setupEventHandlers(): void {
    // Handle pointer events
    this.scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          this.handlePointerDown(pointerInfo);
          break;
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
      const state = event.state as { pageId?: string } | null;
      if (state?.pageId) {
        const page = this.pages.find(p => p.id === state.pageId);
        if (page) {
          const mesh = this.scene.getMeshByName(`page_${page.id}`);
          if (mesh) {
            this.navigateToPage(page, mesh);
          }
        }
      } else {
        this.navigateToSitemap();
      }
    });
  }

  private createHexToPageMap(): void {
    // Create a mapping of hex coordinates to pages
    this.pages.forEach((page, index) => {
      // Get all meshes in the scene
      const meshes = this.scene.meshes;
      
      // Find the mesh that contains this page's content
      const pageMesh = meshes.find(mesh => {
        const meshPageId = mesh.metadata?.pageId;
        return meshPageId === page._id || meshPageId === page.id;
      });

      if (pageMesh) {
        // Store the mapping using the mesh name
        this.hexToPageMap.set(pageMesh.name, page);
        console.log(`Mapped ${pageMesh.name} to page ${page._id || page.id}`);
      }
    });
  }

  private handlePointerDown(pointerInfo: PointerInfo): void {
    if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) {
      return;
    }

    const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
    if (!pickResult.hit) {
      // If we're in page view and clicked empty space, zoom out to sitemap
      if (this.currentViewMode === ViewMode.PAGE) {
        console.log('Clicked empty space while in page view, zooming out to sitemap');
        this.navigateToSitemap();
      }
      return;
    }

    const pickedMesh = pickResult.pickedMesh;
    console.log('Picked mesh:', pickedMesh.name, 'metadata:', pickedMesh.metadata);

    if (!pickedMesh) {
      return;
    }

    // Get the page ID from the mesh metadata
    const pageId = pickedMesh.metadata?.pageId;
    console.log('Page ID from metadata:', pageId);

    if (!pageId) {
      console.warn('No page ID found in mesh metadata:', pickedMesh.name);
      return;
    }

    // Find the page with this ID
    const page = this.pages.find(p => p._id === pageId || p.id === pageId);
    if (!page) {
      console.warn('No page found with ID:', pageId);
      return;
    }

    console.log('Found page:', page);

    // If we're in page view and clicked a different page, zoom out to sitemap first
    if (this.currentViewMode === ViewMode.PAGE && pageId !== this.currentPageId) {
      console.log('Clicked different page while in page view, zooming out to sitemap');
      this.navigateToSitemap();
      return;
    }

    // If we're in page view and clicked the same page, do nothing
    if (this.currentViewMode === ViewMode.PAGE && pageId === this.currentPageId) {
      console.log('Already viewing this page, no action needed');
      return;
    }

    // Otherwise, navigate to the page
    this.navigateToPage(page, pickedMesh);
  }

  private async navigateBetweenPages(targetPage: Page, targetMesh: any): Promise<void> {
    // First zoom out to sitemap
    await this.navigateToSitemap();
    // Then zoom in to the new page
    await this.navigateToPage(targetPage, targetMesh);
  }

  async navigateToPage(page: Page, mesh: any): Promise<void> {
    if (this.currentViewMode === ViewMode.PAGE && this.currentPageId === page._id) {
      return; // Already viewing this page
    }

    console.log('Starting navigation to page:', page._id);
    console.log('Current camera state:', {
      position: this.camera.position,
      target: this.camera.target,
      alpha: this.camera.alpha,
      beta: this.camera.beta,
      radius: this.camera.radius
    });

    this.currentViewMode = ViewMode.PAGE;
    this.currentPageId = page._id;

    // Update browser history
    window.history.pushState({ pageId: page._id }, '', `#${page._id}`);

    // Calculate target position and rotation based on the mesh
    const targetPosition = new Vector3(
      mesh.position.x,
      mesh.position.y + 50, // Position camera above the mesh
      mesh.position.z
    );
    
    const targetAlpha = -Math.PI / 2; // Match sitemap horizontal orientation
    const targetBeta = 0; // Match sitemap vertical orientation
    const targetRadius = this.PAGE_RADIUS;

    console.log('Target camera state:', {
      position: targetPosition,
      target: mesh.position,
      alpha: targetAlpha,
      beta: targetBeta,
      radius: targetRadius
    });

    await this.animateCamera(targetPosition, mesh.position, targetAlpha, targetBeta, targetRadius);
  }

  async navigateToSitemap(): Promise<void> {
    if (this.currentViewMode === ViewMode.SITEMAP) {
      return; // Already in sitemap view
    }

    this.currentViewMode = ViewMode.SITEMAP;
    this.currentPageId = undefined;

    // Update browser history
    window.history.pushState({}, '', '#');

    console.log('Animating camera to sitemap view:', {
      position: this.SITEMAP_POSITION,
      target: this.SITEMAP_TARGET,
      alpha: this.SITEMAP_ALPHA,
      beta: this.SITEMAP_BETA,
      radius: this.SITEMAP_RADIUS
    });

    await this.animateCamera(
      this.SITEMAP_POSITION,
      this.SITEMAP_TARGET,
      this.SITEMAP_ALPHA,
      this.SITEMAP_BETA,
      this.SITEMAP_RADIUS
    );
  }

  private async animateCamera(
    targetPosition: Vector3,
    targetCameraTarget: Vector3,
    targetAlpha: number,
    targetBeta: number,
    targetRadius: number
  ): Promise<void> {
    console.log('Starting camera animation');
    
    // Create easing function
    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    // Get current camera state
    const currentPosition = this.camera.position.clone();
    const currentTarget = this.camera.target.clone();
    const currentAlpha = this.camera.alpha;
    const currentBeta = this.camera.beta;
    const currentRadius = this.camera.radius;

    console.log('Animation start state:', {
      position: currentPosition,
      target: currentTarget,
      alpha: currentAlpha,
      beta: currentBeta,
      radius: currentRadius
    });

    // Create animations
    const animations = [
      this.createAnimation('position', currentPosition, targetPosition, easingFunction),
      this.createAnimation('target', currentTarget, targetCameraTarget, easingFunction),
      this.createAnimation('alpha', currentAlpha, targetAlpha, easingFunction),
      this.createAnimation('beta', currentBeta, targetBeta, easingFunction),
      this.createAnimation('radius', currentRadius, targetRadius, easingFunction)
    ];

    // Run animations
    console.log('Running camera animations');
    this.scene.beginDirectAnimation(
      this.camera,
      animations,
      0,
      60 * this.ANIMATION_DURATION,
      false,
      1
    );

    // Wait for animation to complete
    return new Promise<void>((resolve) => {
      console.log('Waiting for animation to complete');
      setTimeout(() => {
        // Ensure final camera state is exactly as intended
        this.camera.position = targetPosition;
        this.camera.target = targetCameraTarget;
        this.camera.alpha = targetAlpha;
        this.camera.beta = targetBeta;
        this.camera.radius = targetRadius;
        console.log('Animation completed');
        resolve();
      }, this.ANIMATION_DURATION * 1000);
    });
  }

  private createAnimation(
    property: string,
    startValue: number | Vector3,
    endValue: number | Vector3,
    easingFunction: EasingFunction
  ): Animation {
    const animation = new Animation(
      `camera${property}Animation`,
      property,
      60,
      typeof startValue === 'number' ? Animation.ANIMATIONTYPE_FLOAT : Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: startValue },
      { frame: 60 * this.ANIMATION_DURATION, value: endValue }
    ];

    animation.setKeys(keys);
    animation.setEasingFunction(easingFunction);

    return animation;
  }

  getCurrentViewMode(): ViewMode {
    return this.currentViewMode;
  }

  getCurrentPageId(): string | undefined {
    return this.currentPageId;
  }
} 