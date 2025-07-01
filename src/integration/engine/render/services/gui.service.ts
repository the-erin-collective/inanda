import { Injectable } from '@angular/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, StackPanel } from '@babylonjs/gui';
import { Scene, Mesh, Animation } from '@babylonjs/core';
import { ElementNode } from 'src/domain/entities/page/element.entity.interface';
import { RootNode } from 'src/domain/entities/page/root.entity';
import { SiteContent } from '../../../models/site-content.aggregate.model';
import { StyleService } from 'src/integration/engine/render/services/style.service';
import { Style } from 'src/domain/entities/style/style.entity';
import { ContainerFactory } from '../elements/container.factory';
import { GuiHelper } from './helpers/gui.helper';

@Injectable({ providedIn: 'root' })
export class GuiService {
  private meshGuiMap: Map<string, { preview: Control; core: Control }> = new Map();
  private currentLayerState: Map<string, 'preview' | 'core'> = new Map();
  private siteContent: SiteContent | null = null;

  constructor(private styleService: StyleService, private containerFactory: ContainerFactory, private guiHelper: GuiHelper) { }

  /**
   * Remove all preview borders (hex) when navigating into a page
   */
  private removeAllPreviewBorders(scene: Scene, sitemapType: string = 'HEX_FLOWER') {
    for (const [meshName, guiElements] of this.meshGuiMap.entries()) {
      // Try to get the mesh from the scene by name
      const mesh = scene.getMeshByName(meshName);
      if (mesh) {
        this.styleService.applyPreviewHoverBorder(mesh, scene, sitemapType, false);
      }
    }
  }

  // Helper method to find a style by ID for a given page
  private findStyleById(pageId: string, styleId: string): Style | undefined {
    const styles = this.styleService.getStylesForPage(pageId);
    return styles.find(style => style._id === styleId);
  }

  // Helper method to apply styles to a control and its children
  private applyStylesToControl(control: Control, style: any): void {
    // Apply style to this control
    this.styleService.applyStyles(control, [style]);

    // If it's a container, apply to children recursively
    if (control instanceof Rectangle || control instanceof StackPanel) {
      for (const child of control._children) {
        this.applyStylesToControl(child, style);
      }
    }
  }

  // Helper method to get a GUI control for a mesh
  private getGuiControlForMesh(mesh: Mesh, layer: 'preview' | 'core'): Control | undefined {
    const guiElements = this.meshGuiMap.get(mesh.name);
    if (!guiElements) return undefined;
    return layer === 'preview' ? guiElements.preview : guiElements.core;
  }

  // Helper method to clone a control
  private cloneControl(control: Control): Control | undefined {
    if (!control) return undefined;

    // Use the Babylon.js clone method if available
    if (typeof control.clone === 'function') {
      return control.clone();
    }

    return control;
  }

  // Helper method to clean up unused textures
  private cleanupUnusedTextures(scene: Scene): void {
    const advancedTextures = AdvancedDynamicTexture['AdvancedDynamicTextureCollection'] ||
      (scene as any)._advancedTextures ||
      [];

    for (let i = advancedTextures.length - 1; i >= 0; i--) {
      const texture = advancedTextures[i];
      if (!texture._mesh || !texture._mesh.isEnabled()) {
        texture.dispose();
      }
    }
  }

  // Helper to set site content
  setSiteContent(siteContent: SiteContent | null): void {
    this.siteContent = siteContent;
    this.styleService.setSiteContent(siteContent);
  }

  initializeGui(scene: Scene): void {
    this.styleService.setScene(scene);
  }

  attachGuiToMesh(mesh: Mesh, guiElement: Control): void {
    if (!guiElement) {
      console.warn(`No GUI element provided for mesh ${mesh.name}`);
      return;
    }

    const advancedTexture = AdvancedDynamicTexture.CreateForMesh(
      mesh,
      1024, // width
      1024, // height
      true // generateMipMaps
    );

    // Set appropriate scaling
    advancedTexture.rootContainer.scaleX = 1.0;
    advancedTexture.rootContainer.scaleY = 1.0;

    // Set initial state
    guiElement.alpha = 1;
    guiElement.isVisible = true;
    // Add control to the texture
    advancedTexture.addControl(guiElement);
  
    const layer = mesh.metadata?.layer;

    // Get existing elements or create new ones
    const existingElements = this.meshGuiMap.get(mesh.name) || { preview: null, core: null };
    const guiElements = { ...existingElements };

    if (layer === 'preview') {
      guiElements.preview = guiElement;
    } else if (layer === 'core') {
      guiElements.core = guiElement;
    }

    this.meshGuiMap.set(mesh.name, guiElements);
  }

  async createGuiFromJson(scene :Scene, coreMesh: Mesh, previewMesh: Mesh, pageId: string, node: ElementNode, siteContent?: SiteContent | null): Promise<{ preview: Control; core: Control } | null> {
    if (!node || !node.type || node.type !== 'root') {
      console.warn(`Invalid node provided to createGuiFromJson`);
      return null;
    }

    // Store site content for material detection
    this.setSiteContent(siteContent);

    const rootNode = node as RootNode;

    // Create preview and core containers with site context
    const previewContainer = await this.containerFactory.createContainer(scene, previewMesh, this.meshGuiMap, pageId, rootNode.preview, siteContent);

    const coreContainer = await this.containerFactory.createContainer(scene, coreMesh, this.meshGuiMap, pageId, rootNode.core, siteContent);

    if (!previewContainer || !coreContainer) {
      console.error('Failed to create containers');
      return null;
    }

    // Make a final pass to ensure text alignment consistency in both containers
    this.ensureConsistentTextAlignment(previewContainer);
    this.ensureConsistentTextAlignment(coreContainer);

    // Initially hide the core content
    coreContainer.isVisible = true;

    return {
      preview: previewContainer,
      core: coreContainer
    };
  }

  showCoreContent(mesh: Mesh): void {
    // Remove all preview borders when entering a page
    const scene = mesh.getScene();
    // Try to get sitemapType from siteContent if available, fallback to HEX_FLOWER
    const sitemapType = this.siteContent?.site?.sitemapType || 'HEX_FLOWER';
    this.removeAllPreviewBorders(scene, sitemapType);

    // For layered approach, we need to find and switch the background meshes
    if (mesh.metadata?.previewBackgroundMesh) {
      // This is a container mesh, use its background mesh to find the layer pair
      const backgroundMesh = mesh.metadata.previewBackgroundMesh;
      const containerMesh = mesh.metadata.previewContainerMesh;

      // Find the preview and core background meshes by pattern matching
      const pageId = mesh.metadata.pageId;

      // Instead of wildcard pattern, search through all meshes
      const previewFadeOut = new Animation(
        "coreContainerVisibilityFadeIn",
        "visibility",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Set keyframes for smooth transition
      previewFadeOut.setKeys([
        { frame: 0, value: 1.0 },
        { frame: 30, value: 0.0 }
      ]);

      const previewPositionDown = new Animation(
        "coreContainerVisibilityFadeIn",
        "position.y",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Set keyframes for smooth transition
      previewPositionDown.setKeys([
        { frame: 0, value: 0.3 },
        { frame: 30, value: 0.05 }
      ]);        // Print the current visibility values before setting up animations

      backgroundMesh.visibility = 1.0;
      containerMesh.visibility = 1.0;

      // Important: Make sure core meshes are visible before starting the animation
      // This ensures they're ready to appear when we animate
      mesh.metadata.coreBackgroundMesh.isVisible = true;
      mesh.metadata.coreContainerMesh.isVisible = true;

      // Force immediate texture refresh on the core mesh
      this.guiHelper.refreshGuiTexture(mesh.metadata.coreContainerMesh, this.meshGuiMap);

      // Attach animations to meshes
      backgroundMesh.animations = [previewFadeOut];
      containerMesh.animations = [previewFadeOut];

      const scene = mesh.getScene();

      let animBg = scene.beginAnimation(backgroundMesh, 0, 30, false, 1.0);
      scene.beginAnimation(containerMesh, 0, 30, false, 1.0); animBg.onAnimationEnd = () => {
        mesh.metadata.previewContainerMesh.isVisible = false;
        mesh.metadata.previewBackgroundMesh.isVisible = false;

        // Force disable any lingering preview textures
        const previewMesh = mesh.metadata.previewContainerMesh;
        if (previewMesh.material) {
          previewMesh.material.alpha = 0;

          // Force any ADT on the preview mesh to be disabled
          const scene = mesh.getScene();
          const advancedTextures = AdvancedDynamicTexture['AdvancedDynamicTextureCollection'] ||
            (scene as any)._advancedTextures || [];
          for (const adt of advancedTextures) {
            if (adt._mesh === previewMesh) {
              adt.rootContainer.isVisible = false;
              adt.dispose();
              break;
            }
          }
        }

        // Now set core meshes to visible
        mesh.metadata.coreBackgroundMesh.isVisible = true;
        mesh.metadata.coreContainerMesh.isVisible = true;

        // Move the core container mesh ABOVE where the preview mesh was
        // This ensures it's not occluded by any invisible geometry
        mesh.metadata.coreContainerMesh.position.y = 0.5; // Even higher than preview (0.3)

        // Fully recreate the core container's ADT with its stored control
        const coreMesh = mesh.metadata.coreContainerMesh;
        const coreControl = this.getGuiControlForMesh(coreMesh, 'core');
        if (coreControl) {
          // Create a fresh new texture and attach the original control
          const texture = AdvancedDynamicTexture.CreateForMesh(coreMesh, 1024, 1024, true);

          // Make sure the texture is using the correct settings
          texture.premulAlpha = false;
          texture.hasAlpha = true;

          // Force a clone of the control to ensure it's fresh
          const clonedControl = this.cloneControl(coreControl);
          if (clonedControl) {
            clonedControl.isVisible = true;
            clonedControl.alpha = 1.0;

            // Set the z-index of the control to ensure it's on top
            if ('zIndex' in clonedControl) {
              clonedControl.zIndex = 10;
            }

            texture.addControl(clonedControl);

            // Force update the texture
            texture.markAsDirty();
            texture.update(true);
          } else {
            coreControl.isVisible = true;
            coreControl.alpha = 1.0;
            texture.addControl(coreControl);
          }
        } else {
          // Fallback to original method if we can't find the control
          this.guiHelper.refreshGuiTexture(mesh.metadata.coreContainerMesh, this.meshGuiMap);
        }

        // Clear any other ADTs that might be interfering
        this.cleanupUnusedTextures(mesh.getScene());
      };
      // Update the current layer state for this page
      this.currentLayerState.set(pageId, 'core');
    } else {
      console.warn(`Could not find all required layered meshes for page: ${mesh.metadata}`);
    }
  }

  showPreviewContent(mesh: Mesh): void {
    // For layered approach, we need to find and switch the background meshes  
    if (mesh.metadata?.previewBackgroundMesh) {
      // This is a container mesh, use its background mesh to find the layer pair
      const backgroundMesh = mesh.metadata.previewBackgroundMesh;
      const containerMesh = mesh.metadata.previewContainerMesh;

      const previewFadeIn = new Animation(
        "previewVisibilityFadeIn",
        "visibility",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      previewFadeIn.setKeys([
        { frame: 0, value: 0.0 },
        { frame: 30, value: 1.0 }
      ]);

      const previewPositionUp = new Animation(
        "coreContainerVisibilityFadeIn",
        "position.y",
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Set keyframes for smooth transition
      previewPositionUp.setKeys([
        { frame: 0, value: 0.05 },
        { frame: 30, value: 0.3 }
      ]);        // Print the current visibility values before setting up animations

      // Set initial visibility for animation (both properties)
      backgroundMesh.visibility = 0.0;
      containerMesh.visibility = 0.0;

      // Make sure meshes are visible for animation
      backgroundMesh.isVisible = true;
      containerMesh.isVisible = true;

      // Attach animations to meshes
      backgroundMesh.animations = [previewFadeIn];
      containerMesh.animations = [previewFadeIn];

      const scene = mesh.getScene();

      let animBg = scene.beginAnimation(backgroundMesh, 0, 30, false, 1.0);
      scene.beginAnimation(containerMesh, 0, 30, false, 1.0); animBg.onAnimationEnd = () => {
        // First, set the visibility states
        mesh.metadata.coreBackgroundMesh.isVisible = false;
        mesh.metadata.coreContainerMesh.isVisible = false;
        mesh.metadata.previewContainerMesh.isVisible = true;
        mesh.metadata.previewBackgroundMesh.isVisible = true;

        // Get the preview container mesh and make sure it's positioned correctly
        const previewContainerMesh = mesh.metadata.previewContainerMesh;

        // Make sure preview mesh is restored to its original position
        previewContainerMesh.position.y = 0.3; // Standard preview position

        // Similar to what we did with the core mesh, recreate the GUI for the preview mesh
        const previewControl = this.getGuiControlForMesh(previewContainerMesh, 'preview');

        if (previewControl) {
          // Create a fresh new texture and attach the original control
          const texture = AdvancedDynamicTexture.CreateForMesh(previewContainerMesh, 1024, 1024, true);

          // Make sure the texture is using the correct settings
          texture.premulAlpha = false;
          texture.hasAlpha = true;

          // Force a clone of the control to ensure it's fresh
          const clonedControl = this.cloneControl(previewControl);
          if (clonedControl) {
            clonedControl.isVisible = true;
            clonedControl.alpha = 1.0;

            texture.addControl(clonedControl);

            // Force update the texture
            texture.markAsDirty();
            texture.update(true);
          } else {
            previewControl.isVisible = true;
            previewControl.alpha = 1.0;
            texture.addControl(previewControl);
          }
        } else {
          // Fallback to original method if we can't find the control
          this.guiHelper.refreshGuiTexture(previewContainerMesh, this.meshGuiMap);
        }

        // Clean up any other ADTs that might be interfering
        this.cleanupUnusedTextures(mesh.getScene());
      };
      // Update the current layer state for this page
      this.currentLayerState.set(mesh.metadata?.pageId, 'preview');
    } else {
      console.warn(`Could not find all required layered meshes for page: ${mesh.metadata?.pageId}`);
    }
  }


  // Helper to ensure text alignment is consistent for all controls in a container
  private ensureConsistentTextAlignment(control: Control): void {
    // For TextBlocks, ensure textHorizontalAlignment matches horizontalAlignment
    if (control instanceof TextBlock) {
      if (control.horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_CENTER) {
        control.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      }
      if (control.verticalAlignment === Control.VERTICAL_ALIGNMENT_CENTER) {
        control.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      }
    }

    // For containers with children, recursively apply alignment
    if ('children' in control && Array.isArray((control as any).children)) {
      const children = (control as any).children;
      children.forEach((child: Control) => {
        this.ensureConsistentTextAlignment(child);
      });
    }
  }

  /**
   * Apply hover style to a mesh by finding the hover style in the stylesheet
   * and applying it to the preview content. For hex meshes, also apply border to the mesh itself.
   */  
  applyHoverStyle(mesh: Mesh): void {
    const guiElements = this.meshGuiMap.get(mesh.name);
    if (!guiElements) {
      console.warn(`No GUI elements found for mesh: ${mesh.name}`);
      return;
    }

    const pageId = mesh.metadata?.pageId;
    if (!pageId) {
      console.warn(`No pageId in metadata for mesh: ${mesh.name}`);
      return;
    }

    const currentLayer = this.currentLayerState.get(pageId) || 'preview';
    const targetControl = currentLayer === 'core' ? guiElements.core : guiElements.preview;

    if (!targetControl) {
      console.warn(`No ${currentLayer} GUI element found for mesh: ${mesh.name}`);
      return;
    }

    // Extract the index from the page ID (assuming format like 'page-1')
    const pageIndex = parseInt(pageId.split('-')[1]);
    if (isNaN(pageIndex)) {
      console.warn(`Invalid page ID format: ${pageId}`);
      return;
    }

    // Look for the hover style in our stylesheet array
    const styleId = `panel-${currentLayer}-hover-${pageIndex}`;
    const hoverStyle = this.findStyleById(pageId, styleId);

    // Detect hex-flower sitemap and preview/core panel
    const isHexFlower = this.siteContent?.site?.sitemapType === 'HEX_FLOWER';
    const isPreviewOrCorePanel = mesh.metadata?.layer === 'preview' || mesh.metadata?.layer === 'core';

    if (hoverStyle) {
      // For hex-flower preview/core panels, only show hex border and suppress rectangle border
      if (isHexFlower && isPreviewOrCorePanel) {
        // Suppress rectangle border
        if (targetControl instanceof Rectangle) {
          targetControl.thickness = 0;
          targetControl.color = 'transparent';
        }
        // Apply hex border
        if (hoverStyle.properties?.borderWidth && hoverStyle.properties?.borderColor) {
          const borderWidthNum = parseInt(hoverStyle.properties.borderWidth);
          if (!isNaN(borderWidthNum) && borderWidthNum > 0) {
            this.styleService.applyHexBorder(mesh, borderWidthNum, hoverStyle.properties.borderColor);
          }
        }
      } else {
        // Normal border logic for other sitemap types or panels
        this.styleService.applyStyles(targetControl, [hoverStyle]);
        if (mesh.name.startsWith('hex_') && hoverStyle.properties?.borderWidth && hoverStyle.properties?.borderColor) {
          const borderWidthNum = parseInt(hoverStyle.properties.borderWidth);
          if (!isNaN(borderWidthNum) && borderWidthNum > 0) {
            this.styleService.applyHexBorder(mesh, borderWidthNum, hoverStyle.properties.borderColor);
          }
        }
      }
    } else {
      console.warn(`Hover style ${styleId} not found in styles`);
    }
  }

  /**
   * Apply normal style to a mesh by finding the normal style in the stylesheet
   * and applying it to the preview content. For hex meshes, also remove the border from the mesh itself.
   */  
  applyNormalStyle(mesh: Mesh): void {
    const guiElements = this.meshGuiMap.get(mesh.name);
    if (!guiElements) {
      console.warn(`No GUI elements found for mesh: ${mesh.name}`);
      return;
    }

    const pageId = mesh.metadata?.pageId;
    if (!pageId) {
      console.warn(`No pageId in metadata for mesh: ${mesh.name}`);
      return;
    }

    const currentLayer = this.currentLayerState.get(pageId) || 'preview';
    const targetControl = currentLayer === 'core' ? guiElements.core : guiElements.preview;

    if (!targetControl) {
      console.warn(`No ${currentLayer} GUI element found for mesh: ${mesh.name}`);
      return;
    }

    const pageIndex = parseInt(pageId.split('-')[1]);
    if (isNaN(pageIndex)) {
      console.warn(`Invalid page ID format: ${pageId}`);
      return;
    }

    // Look for the normal style in our stylesheet array
    const styleId = `panel-${currentLayer}-${pageIndex}`;
    const normalStyle = this.findStyleById(pageId, styleId);

    if (normalStyle) {
      // Always use applyStyles, it will handle material backgrounds internally
      this.styleService.applyStyles( targetControl, [normalStyle]);

      if (mesh.name.startsWith('hex_')) {
        this.styleService.removeHexBorder(mesh);
        mesh.renderOutline = false;
        mesh.outlineWidth = 0;
      }
    } else {
      console.warn(`Normal style ${styleId} not found in styles`);
    }
  }/**
   * Applies a style to a mesh's GUI by style ID
   * @param mesh The mesh to apply the style to
   * @param styleId The ID of the style to apply
   */
  applyStyleById(mesh: Mesh, styleId: string): void {
    const guiElements = this.meshGuiMap.get(mesh.name);
    if (!guiElements || !styleId) return;

    const style = this.findStyleById(mesh.metadata?.pageId || 'default-page', styleId);
    if (!style) {
      console.warn(`Style with ID ${styleId} not found in styles`);
      return;
    }

    const previewContainer = guiElements.preview;
    if (previewContainer instanceof Rectangle) {
      this.styleService.applyStyles(previewContainer, [style]);

      for (const child of previewContainer._children) {
        this.applyStylesToControl(child, style);
      }
    }
  }
}