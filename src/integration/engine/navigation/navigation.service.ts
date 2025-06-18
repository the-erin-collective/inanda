import { Injectable } from '@angular/core';
import { Scene, Vector3, Animation, ArcRotateCamera, PointerInfo, PointerEventTypes, EasingFunction, CubicEase, AnimationGroup, Mesh, AbstractMesh } from '@babylonjs/core';
import { Page } from 'src/domain/entities/page/page.entity';
import { DEFAULT_SITE_ID } from 'src/domain/constants/site.constants';
import { GuiService } from '../render/gui.service';

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
  private pointerDownTime: number = 0;
  private readonly CLICK_THRESHOLD = 200; // milliseconds
  private isPointerDown: boolean = false;
  private currentPickedMesh: AbstractMesh | null = null;
  private currentPickedPage: Page | null = null;
  private hoveredMesh: AbstractMesh | null = null;

  // Camera positions
  private readonly SITEMAP_POSITION = new Vector3(0, 200, 0);
  private readonly SITEMAP_TARGET = new Vector3(0, 0, 0);
  private readonly SITEMAP_ALPHA = -Math.PI / 2; // -90 degrees for horizontal orientation
  private readonly SITEMAP_BETA = 0; // 0 degrees for vertical orientation
  private readonly SITEMAP_RADIUS = 200; // Adjusted radius for better visibility

  // Page view settings
  private readonly PAGE_RADIUS = 60; // Increased radius for less zoom-in
  private readonly ANIMATION_DURATION = 1.5; // Increased duration for smoother transitions

  constructor(private guiService: GuiService) {}

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
  }  private setupEventHandlers(): void {
    // Set up all pointer events
    this.scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
      // Handle pointer down for clicking
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        this.pointerDownTime = Date.now();
        this.isPointerDown = true;
        
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

        // Store the picked mesh and page for potential use in handlePointerUp
        this.currentPickedMesh = pickedMesh;
        this.currentPickedPage = page;
      } else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
        this.isPointerDown = false;
        const pointerUpTime = Date.now();
        const holdDuration = pointerUpTime - this.pointerDownTime;

        // Check if it's a right click (button 2) or Mac right click (button 0 with ctrl/cmd)
        const isRightClick = pointerInfo.event.button === 2 || 
                           (pointerInfo.event.button === 0 && 
                            (pointerInfo.event.ctrlKey || pointerInfo.event.metaKey));
        
        if (isRightClick) {
          // Show custom context menu
          this.showContextMenu(pointerInfo.event.clientX, pointerInfo.event.clientY);
          return;
        }

        // If it's a quick click (less than CLICK_THRESHOLD milliseconds)
        if (holdDuration < this.CLICK_THRESHOLD && this.currentPickedMesh && this.currentPickedPage) {
          console.log('Quick click detected, navigating to page');
          this.navigateToPage(this.currentPickedPage, this.currentPickedMesh);
        } else if (holdDuration >= this.CLICK_THRESHOLD) {
          console.log('Long press detected, duration:', holdDuration);
          // Handle long press here if needed
        }

        // Clear the stored mesh and page
        this.currentPickedMesh = null;
        this.currentPickedPage = null;      } else if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        // Handle hover effects
        const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        
        if (pickResult.hit && pickResult.pickedMesh) {
          const hoveredMesh = pickResult.pickedMesh;
          const pageId = hoveredMesh.metadata?.pageId;
          // Only process meshes with pageId metadata (hexagonal panels)
          if (pageId) {
            // Only update if the hovered mesh is different
            if (this.currentPickedMesh !== hoveredMesh) {
              // Remove border from previous mesh
              if (this.currentPickedMesh && this.currentPickedMesh instanceof Mesh) {
                this.guiService.applyNormalStyle(this.currentPickedMesh);
              }
              // Apply hover style to new mesh
              if (this.currentViewMode !== ViewMode.PAGE || pageId !== this.currentPageId) {
                console.log(`Hover on mesh: ${hoveredMesh.name}, applying hover style`);
                if (hoveredMesh instanceof Mesh) {
                  this.guiService.applyHoverStyle(hoveredMesh);
                  this.currentPickedMesh = hoveredMesh;
                }
              }
            }
          } else if (this.currentPickedMesh && this.currentPickedMesh instanceof Mesh) {
            // We've moved off a page mesh, reapply normal style
            console.log('Moved off page mesh, restoring normal style');
            this.guiService.applyNormalStyle(this.currentPickedMesh);
            this.currentPickedMesh = null;
          }
        } else if (this.currentPickedMesh && this.currentPickedMesh instanceof Mesh) {
          // We're not hovering over any mesh, reapply normal style
          console.log('No mesh under pointer, restoring normal style');
          this.guiService.applyNormalStyle(this.currentPickedMesh);
          this.currentPickedMesh = null;
        }
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

  /**
   * Handle pointer movement for hover effects
   */
  private handlePointerMove(pointerInfo: PointerInfo): void {
    // Skip if we're not in sitemap view
    if (this.currentViewMode !== ViewMode.SITEMAP) {
      return;
    }
    
    const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
    if (!pickResult.hit || !pickResult.pickedMesh) {
      // If we moved off all meshes, clear any hover effects
      this.clearCurrentHover();
      return;
    }

    const pickedMesh = pickResult.pickedMesh;
    
    // Skip if this is the same mesh we're already hovering over
    if (this.currentPickedMesh === pickedMesh) {
      return;
    }
    
    // Clear hover effect on previous mesh
    this.clearCurrentHover();
    
    // Apply hover effect to new mesh if it has a page ID
    const pageId = pickedMesh.metadata?.pageId;
    if (pageId && pickedMesh instanceof Mesh) {
      this.applyHoverStyle(pickedMesh);
      this.currentPickedMesh = pickedMesh;
    }
  }

  /**
   * Clear hover effect from current mesh
   */
  private clearCurrentHover(): void {
    if (this.currentPickedMesh instanceof Mesh) {
      this.applyNormalStyle(this.currentPickedMesh);
    }
    this.currentPickedMesh = null;
  }
  private createHexToPageMap(): void {
    // Create a mapping of hex coordinates to pages
    this.pages.forEach((page, index) => {
      // Get all meshes in the scene that have pageId metadata (excluding backdrop and other non-page meshes)
      const meshes = this.scene.meshes.filter(mesh => mesh.metadata?.pageId);
      
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

    // Get current URL path and preserve site ID
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(Boolean);
    const siteId = pathParts[0] || DEFAULT_SITE_ID;
    
    // Update browser history with both site ID and page ID
    const newUrl = `/${siteId}/${page._id}`;
    console.log('Updating URL to:', newUrl);
    window.history.pushState({ siteId, pageId: page._id }, '', newUrl);

    // Switch to core content
    this.guiService.showCoreContent(mesh);

    // Remove border from any hovered hex before switching to page view
    if (this.currentPickedMesh && this.currentPickedMesh instanceof Mesh) {
      this.currentPickedMesh = null;
    }

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

    // Remove border from any hovered hex before switching view modes
    if (this.currentPickedMesh && this.currentPickedMesh instanceof Mesh) {
      this.guiService.applyNormalStyle(this.currentPickedMesh);
      this.currentPickedMesh = null;
    }

    // Store the current page ID before clearing it
    const previousPageId = this.currentPageId;
    
    this.currentViewMode = ViewMode.SITEMAP;
    this.currentPageId = undefined;

    // Get current URL path and preserve site ID
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(Boolean);
    const siteId = pathParts[0] || DEFAULT_SITE_ID;
    
    // Update browser history to keep site ID but remove page ID
    const newUrl = `/${siteId}`;
    console.log('Updating URL to sitemap view:', newUrl);
    window.history.pushState({ siteId }, '', newUrl);

    // Find the previous page's mesh and transition it back to preview
    if (previousPageId) {
      const currentMesh = this.scene.meshes.find(mesh => {
        const meshPageId = mesh.metadata?.pageId;
        return meshPageId === previousPageId;
      });
      
      if (currentMesh instanceof Mesh) {
        this.guiService.showPreviewContent(currentMesh);
      }
    }

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

  private showContextMenu(x: number, y: number): void {
    // Remove any existing context menu
    const existingMenu = document.getElementById('custom-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create an invisible but clickable div
    const menu = document.createElement('div');
    menu.id = 'custom-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = `${x - 5}px`;
    menu.style.top = `${y - 5}px`;
    menu.style.width = '10px';
    menu.style.height = '10px';
    menu.style.backgroundColor = 'transparent';
    menu.style.zIndex = '1000';
    menu.style.pointerEvents = 'auto';
    menu.style.willChange = 'transform'; // Optimize for animations

    let animationFrameId: number;
    let lastX = x;
    let lastY = y;

    // Add mousemove handler to update position using requestAnimationFrame
    const updatePosition = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
          menu.style.left = `${lastX - 5}px`;
          menu.style.top = `${lastY - 5}px`;
          animationFrameId = 0;
        });
      }
    };
    document.addEventListener('mousemove', updatePosition);

    document.body.appendChild(menu);
    
    // Remove it after a short delay to ensure the browser's context menu has time to appear
    setTimeout(() => {
      menu.remove();
      document.removeEventListener('mousemove', updatePosition);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }, 200);
  }

  /**
   * Apply hover style to a mesh
   */
  private applyHoverStyle(mesh: Mesh): void {
    if (!mesh || !mesh.metadata?.pageId) return;
    
    const pageId = mesh.metadata.pageId;
    const page = this.pages.find(p => p._id === pageId || p.id === pageId);
    if (!page) return;

    // Extract index from page ID (assuming format like "page-1")
    const pageIndex = page.id.split('-')[1] || '1';
    this.guiService.applyStyleById(mesh, `panel-preview-hover-${pageIndex}`);
  }

  /**
   * Apply normal style to a mesh
   */
  private applyNormalStyle(mesh: Mesh): void {
    if (!mesh || !mesh.metadata?.pageId) return;
    
    const pageId = mesh.metadata.pageId;
    const page = this.pages.find(p => p._id === pageId || p.id === pageId);
    if (!page) return;

    // Extract index from page ID (assuming format like "page-1")
    const pageIndex = page.id.split('-')[1] || '1';
    this.guiService.applyStyleById(mesh, `panel-preview-${pageIndex}`);
  }
}