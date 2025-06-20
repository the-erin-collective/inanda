import { Injectable } from '@angular/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control, StackPanel } from '@babylonjs/gui';
import { Scene, Mesh, Animation } from '@babylonjs/core';
import { ElementNode } from 'src/domain/entities/page/element.entity.interface';
import { RootNode } from 'src/domain/entities/page/root.entity';
import { ContentNode } from 'src/domain/entities/page/content.entity.interface';
import { CoreNode } from 'src/domain/entities/page/containers/core.entity';
import { PreviewNode } from 'src/domain/entities/page/containers/preview.entity';
import { EmbeddableContainerNode } from 'src/domain/entities/page/content/embeddable-container.entity';
import { H1Node } from 'src/domain/entities/page/content/items/text/h1.entity';
import { PNode } from 'src/domain/entities/page/content/items/text/p.entity';
import { StyleService } from 'src/integration/engine/render/style.service';
import { StylesheetNode } from 'src/domain/entities/page/content/items/stylesheet.entity';
import { SiteContent } from '../../models/site-content.aggregate.model';
import { Style } from 'src/domain/entities/style/style.entity';

@Injectable({ providedIn: 'root' })
export class GuiService {
  private guiTexture: AdvancedDynamicTexture;
  private meshGuiMap: Map<string, { preview: Control; core: Control }> = new Map();
  private stylesheetMap: Style[] = [];
  private currentLayerState: Map<string, 'preview' | 'core'> = new Map();
  private siteContent: SiteContent | null = null;

  constructor(private styleService: StyleService) {}

  // Helper method to find a style by ID in the stylesheet array
  private findStyleById(styleId: string): Style | undefined {
    return this.stylesheetMap.find(style => style._id === styleId);
  }

  // Helper method to check if using material background
  private usesMaterialBackground(): boolean {
    return this.siteContent?.site?.backgroundType === 'material';
  }

  // Helper method to check if node is an ElementNode
  private isElementNode(node: any): node is ElementNode {
    return node && typeof node === 'object' && 'type' in node;
  }

  // Helper method to apply styles to child controls
  private applyStyleToChildren(container: Control, style: any): void {
    if (!container || !style) return;

    // If this is a panel (Rectangle), apply the style directly
    if (container instanceof Rectangle) {
      this.styleService.applyStyles(container, [style]);
    }

    // Recursively search for Rectangle controls to apply style
    if (container instanceof Rectangle || container instanceof StackPanel) {
      const children = container["_children"] || [];
      for (const child of children) {
        this.applyStyleToChildren(child, style);
      }
    }
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

  // Helper method to refresh the GUI texture on a mesh
  private refreshGuiTexture(mesh: Mesh): void {
    if (!mesh) {
      console.warn('Cannot refresh GUI texture: no mesh provided');
      return;
    }
    
    console.log(`[DEBUG-REFRESH] Attempting to refresh GUI texture for mesh: ${mesh.name}`);
    
    const scene = mesh.getScene();
    const advancedTextures = AdvancedDynamicTexture['AdvancedDynamicTextureCollection'] || 
                            (scene as any)._advancedTextures || 
                            [];
    
    // Find and dispose any existing texture on this mesh
    for (let i = advancedTextures.length - 1; i >= 0; i--) {
      const texture = advancedTextures[i];
      if (texture._mesh === mesh) {
        texture.dispose();
      }
    }
    
    // Get the layer type from the mesh metadata
    const layer = mesh.metadata?.layer as 'preview' | 'core';
    if (!layer) {
      console.log(`[DEBUG-REFRESH] No layer found in metadata for mesh ${mesh.name}`);
      return;
    }
    
    // Get the control from our stored map
    const guiElements = this.meshGuiMap.get(mesh.name);
    if (!guiElements) {
      console.warn(`No GUI elements found for mesh ${mesh.name}`);
      return;
    }
    
    const control = layer === 'preview' ? guiElements.preview : guiElements.core;
    if (!control) {
      console.warn(`No ${layer} control found for mesh ${mesh.name}`);
      return;
    }
    
    // Create a new texture and attach the control
    const newTexture = AdvancedDynamicTexture.CreateForMesh(mesh, 1024, 1024, true);
    newTexture.addControl(control);
    newTexture.update();
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
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
    // Set the scene in StyleService for texture operations
    this.styleService.setScene(scene);
  }attachGuiToMesh(mesh: Mesh, guiElement: Control): void {
    console.log(`Attaching GUI to mesh: ${mesh.name}`, guiElement);
    
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
      
    // Preserve the existing mesh metadata
    if (mesh.metadata) {
      console.log(`Preserving mesh metadata for ${mesh.name}:`, mesh.metadata);
    }

    // Set initial state
    guiElement.alpha = 1;
    guiElement.isVisible = true;
      // Add control to the texture
    advancedTexture.addControl(guiElement);
    console.log(`Added GUI control to texture for mesh: ${mesh.name}, control type: ${guiElement.typeName || guiElement.constructor.name}`);
    console.log(`GUI control properties: alpha=${guiElement.alpha}, isVisible=${guiElement.isVisible}`);    // Store the control in our map based on layer type
    const layer = mesh.metadata?.layer;
    
    // Get existing elements or create new ones
    const existingElements = this.meshGuiMap.get(mesh.name) || { preview: null, core: null };
    const guiElements = { ...existingElements };
    
    if (layer === 'preview') {
      guiElements.preview = guiElement;
      console.log(`Stored preview GUI control for mesh: ${mesh.name}`);
    } else if (layer === 'core') {
      guiElements.core = guiElement;
      console.log(`Stored core GUI control for mesh: ${mesh.name}`);
    }
    
    this.meshGuiMap.set(mesh.name, guiElements);
    
    // Debug the hierarchy
    this.logControlHierarchy(guiElement);
  }  
  
  async createGuiFromJson(node: ElementNode, siteContent?: SiteContent | null): Promise<{ preview: Control; core: Control } | null> {
    if (!node || !node.type || node.type !== 'root') {
      console.warn(`Invalid node provided to createGuiFromJson`);
      return null;
    }

    // Store site content for material detection
    this.setSiteContent(siteContent);
    
    const rootNode = node as RootNode;
    console.log('Creating GUI from root node');    
    
    // Find and store the stylesheet    
    const stylesheet = rootNode.base.children.find(child => child.type === 'stylesheet') as StylesheetNode;
    if (stylesheet) {
      // IMPORTANT: Don't clear previous styles to maintain hover styles for all pages
      // Add new styles to the array, avoid duplicates by checking _id
      stylesheet.styles.forEach(style => {
        if (!this.stylesheetMap.some(existing => existing._id === style._id)) {
          this.stylesheetMap.push(style);
          console.log(`Added style to array: ${style._id}`);
        }
      });      
      // Log all style IDs for debugging
      console.log('Current styles:', this.stylesheetMap.map(style => style._id));
    }

    // Create preview and core containers with site context
    console.log('Creating preview container from node:', rootNode.preview);
    const previewContainer = await this.createContainer(rootNode.preview, siteContent);
    console.log('Preview container created successfully:', !!previewContainer);
    
    console.log('Creating core container from node:', rootNode.core);
    const coreContainer = await this.createContainer(rootNode.core, siteContent);
    console.log('Core container created successfully:', !!coreContainer);
    
    if (!previewContainer || !coreContainer) {
      console.error('Failed to create containers');
      return null;
    }

    // Make a final pass to ensure text alignment consistency in both containers
    this.ensureConsistentTextAlignment(previewContainer);
    this.ensureConsistentTextAlignment(coreContainer);
    
    // Log the final hierarchy of both containers
    console.log('Preview container final hierarchy:');
    this.logControlHierarchy(previewContainer);
    console.log('Core container final hierarchy:');
    this.logControlHierarchy(coreContainer);

    // Initially hide the core content
    coreContainer.isVisible = true;    
    
    return {
      preview: previewContainer,
      core: coreContainer
    };
  } 
  
  showCoreContent(mesh: Mesh): void {
    console.log(`showCoreContent called for mesh: ${mesh.name}, metadata:`, mesh.metadata);

    // For layered approach, we need to find and switch the background meshes
    if (mesh.metadata?.previewBackgroundMesh) {
      // This is a container mesh, use its background mesh to find the layer pair
      const backgroundMesh = mesh.metadata.previewBackgroundMesh;
       const containerMesh = mesh.metadata.previewContainerMesh;

      // Find the preview and core background meshes by pattern matching
      const pageId = mesh.metadata.pageId;
      console.log(`Looking for meshes with pageId: ${pageId}`);
      
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
        console.log(`[DEBUG-TRANSITION] Before animation setup:`)
        console.log(`[DEBUG-TRANSITION] backgroundMesh isVisible: ${backgroundMesh.isVisible}, visibility: ${backgroundMesh.visibility}`);
        console.log(`[DEBUG-TRANSITION] containerMesh isVisible: ${containerMesh.isVisible}, visibility: ${containerMesh.visibility}`);        // Set initial visibility for animation (both properties)
        backgroundMesh.visibility = 1.0;
        containerMesh.visibility = 1.0;
        
        // Important: Make sure core meshes are visible before starting the animation
        // This ensures they're ready to appear when we animate
        mesh.metadata.coreBackgroundMesh.isVisible = true;
        mesh.metadata.coreContainerMesh.isVisible = true;
        
        // Force immediate texture refresh on the core mesh
        this.refreshGuiTexture(mesh.metadata.coreContainerMesh);
        
        // Attach animations to meshes
        backgroundMesh.animations = [previewFadeOut];
        containerMesh.animations = [previewFadeOut];

        const scene = mesh.getScene();
        
        // Debug: Log scene background info before transition
        console.log(`[DEBUG] Scene clearColor before transition:`, scene.clearColor);
        console.log(`[DEBUG] Scene background before transition:`, scene.clearColor?.toHexString());
        
        let animBg = scene.beginAnimation(backgroundMesh, 0, 30, false, 1.0);
        scene.beginAnimation(containerMesh, 0, 30, false, 1.0);        animBg.onAnimationEnd = () => {
          console.log(`[DEBUG-TRANSITION] Core content visibility fade animation ended for page: ${pageId}`);
          
          console.log(`[DEBUG-TRANSITION] Setting core meshes visibility to TRUE`);
          console.log(`[DEBUG-TRANSITION] coreBackgroundMesh before: ${mesh.metadata.coreBackgroundMesh.name}, visible=${mesh.metadata.coreBackgroundMesh.isVisible}`);
          console.log(`[DEBUG-TRANSITION] coreContainerMesh before: ${mesh.metadata.coreContainerMesh.name}, visible=${mesh.metadata.coreContainerMesh.isVisible}`);          // IMPORTANT: Set visibility properties FIRST
          mesh.metadata.previewContainerMesh.isVisible = false;
          mesh.metadata.previewBackgroundMesh.isVisible = false;
          
          // Force disable any lingering preview textures
          const previewMesh = mesh.metadata.previewContainerMesh;
          if (previewMesh.material) {
            console.log(`[DEBUG-TRANSITION] Disabling preview mesh material`);
            previewMesh.material.alpha = 0;
            
            // Force any ADT on the preview mesh to be disabled
            const scene = mesh.getScene();
            const advancedTextures = AdvancedDynamicTexture['AdvancedDynamicTextureCollection'] || 
                                     (scene as any)._advancedTextures || [];
            for (const adt of advancedTextures) {
              if (adt._mesh === previewMesh) {
                console.log(`[DEBUG-TRANSITION] Found and disabling preview ADT`);
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
          console.log(`[DEBUG-TRANSITION] Moving core container above preview position`);
          console.log(`[DEBUG-TRANSITION] Core container Y before: ${mesh.metadata.coreContainerMesh.position.y}`);
          mesh.metadata.coreContainerMesh.position.y = 0.5; // Even higher than preview (0.3)
          console.log(`[DEBUG-TRANSITION] Core container Y after: ${mesh.metadata.coreContainerMesh.position.y}`);
              // Fully recreate the core container's ADT with its stored control
          const coreMesh = mesh.metadata.coreContainerMesh;
          const coreControl = this.getGuiControlForMesh(coreMesh, 'core');
            if (coreControl) {
            console.log(`[DEBUG-TRANSITION] Found original core control, recreating texture`);
            
            // Create a fresh new texture and attach the original control
            const texture = AdvancedDynamicTexture.CreateForMesh(coreMesh, 1024, 1024, true);
            
            // Make sure the texture is using the correct settings
            texture.premulAlpha = false;
            texture.hasAlpha = true;
            
            // Force a clone of the control to ensure it's fresh
            const clonedControl = this.cloneControl(coreControl);
            if (clonedControl) {
              console.log(`[DEBUG-TRANSITION] Created fresh clone of core control`);
              clonedControl.isVisible = true;
              clonedControl.alpha = 1.0;
              
              // Set the z-index of the control to ensure it's on top
              if ('zIndex' in clonedControl) {
                clonedControl.zIndex = 10;
                console.log(`[DEBUG-TRANSITION] Set core control zIndex to 10`);
              }
              
              texture.addControl(clonedControl);
              console.log(`[DEBUG-TRANSITION] Added cloned control to texture`);
              
              // Force update the texture
              texture.markAsDirty();
              texture.update(true);
              
              // Log the visibility hierarchy
              this.logControlHierarchy(clonedControl);
            } else {
              console.log(`[DEBUG-TRANSITION] Control cloning failed, using original`);
              coreControl.isVisible = true;
              coreControl.alpha = 1.0;
              texture.addControl(coreControl);
            }
          } else {
            // Fallback to original method if we can't find the control
            console.log(`[DEBUG-TRANSITION] No core control found in meshGuiMap, using fallback`);
            this.refreshGuiTexture(mesh.metadata.coreContainerMesh);
          }
          
          // Clear any other ADTs that might be interfering
          this.cleanupUnusedTextures(mesh.getScene());
          
          console.log(`[DEBUG-TRANSITION] After visibility change:`);
          console.log(`[DEBUG-TRANSITION] coreBackgroundMesh after: ${mesh.metadata.coreBackgroundMesh.name}, visible=${mesh.metadata.coreBackgroundMesh.isVisible}`);
          console.log(`[DEBUG-TRANSITION] coreContainerMesh after: ${mesh.metadata.coreContainerMesh.name}, visible=${mesh.metadata.coreContainerMesh.isVisible}`);
        };
        // Update the current layer state for this page
        this.currentLayerState.set(pageId, 'core');
        
        console.log(`Started core content visibility fade animation for page: ${pageId}`);
      } else {
        console.log(`$$$ Could not find all required layered meshes for page: ${mesh.metadata}`);
      }
  }

  showPreviewContent(mesh: Mesh): void {
    console.log(`showPreviewContent called for mesh: ${mesh.name}, metadata:`, mesh.metadata);
    
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
        console.log(`[DEBUG-TRANSITION] Before animation setup:`)
        console.log(`[DEBUG-TRANSITION] backgroundMesh isVisible: ${backgroundMesh.isVisible}, visibility: ${backgroundMesh.visibility}`);
        console.log(`[DEBUG-TRANSITION] containerMesh isVisible: ${containerMesh.isVisible}, visibility: ${containerMesh.visibility}`);

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
        scene.beginAnimation(containerMesh, 0, 30, false, 1.0);        animBg.onAnimationEnd = () => {
          console.log(`[DEBUG-TRANSITION] Preview content visibility fade animation ended for page: ${mesh.metadata?.pageId}`);
          
          console.log(`[DEBUG-TRANSITION] Setting preview meshes visibility to TRUE, core to FALSE`);
          console.log(`[DEBUG-TRANSITION] coreBackgroundMesh before: ${mesh.metadata.coreBackgroundMesh.name}, visible=${mesh.metadata.coreBackgroundMesh.isVisible}`);
          console.log(`[DEBUG-TRANSITION] coreContainerMesh before: ${mesh.metadata.coreContainerMesh.name}, visible=${mesh.metadata.coreContainerMesh.isVisible}`);
            // First, set the visibility states
          mesh.metadata.coreBackgroundMesh.isVisible = false;
          mesh.metadata.coreContainerMesh.isVisible = false;
          mesh.metadata.previewContainerMesh.isVisible = true;
          mesh.metadata.previewBackgroundMesh.isVisible = true;
          
          // Get the preview container mesh and make sure it's positioned correctly
          const previewContainerMesh = mesh.metadata.previewContainerMesh;
          
          // Make sure preview mesh is restored to its original position
          console.log(`[DEBUG-TRANSITION] Restoring preview container position`);
          console.log(`[DEBUG-TRANSITION] Preview container Y before: ${previewContainerMesh.position.y}`);
          previewContainerMesh.position.y = 0.3; // Standard preview position
          console.log(`[DEBUG-TRANSITION] Preview container Y after: ${previewContainerMesh.position.y}`);
          
          // Similar to what we did with the core mesh, recreate the GUI for the preview mesh
          const previewControl = this.getGuiControlForMesh(previewContainerMesh, 'preview');
          
          console.log(`[DEBUG-TRANSITION] Looking for stored preview control for mesh ${previewContainerMesh.name}`);
          
          if (previewControl) {
            console.log(`[DEBUG-TRANSITION] Found original preview control, recreating texture`);
            
            // Create a fresh new texture and attach the original control
            const texture = AdvancedDynamicTexture.CreateForMesh(previewContainerMesh, 1024, 1024, true);
            
            // Make sure the texture is using the correct settings
            texture.premulAlpha = false;
            texture.hasAlpha = true;
            
            // Force a clone of the control to ensure it's fresh
            const clonedControl = this.cloneControl(previewControl);
            if (clonedControl) {
              console.log(`[DEBUG-TRANSITION] Created fresh clone of preview control`);
              clonedControl.isVisible = true;
              clonedControl.alpha = 1.0;
              
              texture.addControl(clonedControl);
              console.log(`[DEBUG-TRANSITION] Added cloned preview control to texture`);
              
              // Force update the texture
              texture.markAsDirty();
              texture.update(true);
              
              // Log the visibility hierarchy
              this.logControlHierarchy(clonedControl);
            } else {
              console.log(`[DEBUG-TRANSITION] Control cloning failed, using original`);
              previewControl.isVisible = true;
              previewControl.alpha = 1.0;
              texture.addControl(previewControl);
            }
          } else {
            // Fallback to original method if we can't find the control
            console.log(`[DEBUG-TRANSITION] No preview control found in meshGuiMap, using fallback`);
            this.refreshGuiTexture(previewContainerMesh);
          }
          
          // Clean up any other ADTs that might be interfering
          this.cleanupUnusedTextures(mesh.getScene());
          
          console.log(`[DEBUG-TRANSITION] After visibility change:`);
          console.log(`[DEBUG-TRANSITION] coreBackgroundMesh after: ${mesh.metadata.coreBackgroundMesh.name}, visible=${mesh.metadata.coreBackgroundMesh.isVisible}`);
          console.log(`[DEBUG-TRANSITION] coreContainerMesh after: ${mesh.metadata.coreContainerMesh.name}, visible=${mesh.metadata.coreContainerMesh.isVisible}`);
        };
        // Update the current layer state for this page
        this.currentLayerState.set(mesh.metadata?.pageId, 'preview');
        
        console.log(`Started preview content visibility fade animation for page: ${ mesh.metadata?.pageId}`);
      } else {
        console.log(`$$$ Could not find all required layered meshes for page: ${ mesh.metadata?.pageId}`);
      }
  }
  // Helper to compute effective style by walking up the site data tree (root-to-leaf order)
private computeEffectiveStyle(node: ElementNode, styles: any[]): any {
  // Build the ancestor chain from root to this node
  const chain: ElementNode[] = [];
  let current: any = node;
  while (current) {
    chain.unshift(current);
    current = current.parent;
  }
  
  // For each property, use the closest non-'inherit' value from root to leaf
  let effectiveStyle = {};
  const seenKeys = new Set<string>();
  
  for (const n of chain) {
    if (n._id) {      const style = this.findStyleById(n._id);
      if (style) {
        for (const key of Object.keys(style)) {
          const value = style[key];
          // Only set if not already set (closest to leaf wins), and not 'inherit'
          if (!seenKeys.has(key) && value !== 'inherit') {
            effectiveStyle[key] = value;
            seenKeys.add(key);
          }
        }
      }
    }
  }
  return effectiveStyle;
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
      });    }
  }

  private createTextBlock(node: ElementNode, fontSize: number, fontWeight: string, parentPanelSize?: { width: number; height: number }): TextBlock {
    console.log(`Creating text block for type: ${node.type}`);
    const textBlock = new TextBlock(node.type);
    
    // Ensure text is never clipped by its container
    textBlock.clipContent = false;
    
    // Set content first so we can calculate sizes based on content
    if ('text' in node && typeof node.text === 'string') {
      textBlock.text = node.text;
      console.log(`Text content for ${node.type}: "${textBlock.text}"`);
    } else {
      textBlock.text = node.type === 'h1' ? 'Header' : 'Text content';
    }    // Set parent chain for style inheritance
    // Get the complete style chain by traversing from root to this node in the site data
    // This chain will include default styles + all applicable styles ordered from least to most specific
    const styleChain = this.styleService.getStyleChain(node, this.stylesheetMap);
    
    // Log the style chain for debugging
    console.log(`[DEBUG] Style chain for ${node.type}:`, styleChain.map(s => s._id || s.name));
    
    // StyleService.applyStyles will handle all style inheritance automatically
    // by walking through the style chain (from default to most specific styles)
    
    this.styleService.applyStyles(textBlock, styleChain);
    
    // Different configuration based on text type
    if (node.type === 'h1') {
      // For headings: Allow horizontal growth if needed
      textBlock.resizeToFit = true;
      textBlock.textWrapping = false;
      if (parentPanelSize) {
        textBlock.width = parentPanelSize.width + 'px';
        // Fixed height for headings - more predictable
        textBlock.height = (fontSize * 3) + 'px';
      }
      
      // Extra padding for headings
      textBlock.paddingTop = "10px";
      textBlock.paddingBottom = "10px";
      
    } else {
      // For paragraphs: Enable wrapping and calculate height based on content
      textBlock.resizeToFit = false;
      textBlock.textWrapping = true;
      
      if (parentPanelSize) {
        textBlock.width = parentPanelSize.width + 'px';
          // Count the number of lines (rough estimate based on width and text length)
        const textLength = textBlock.text.length;
        // Use a much more conservative avgCharsPerLine calculation with very generous overhead
        // We'd rather have too much space than too little
        const avgCharsPerLine = Math.floor(parentPanelSize.width / (fontSize * 0.5)); // More conservative estimate (reduced from 0.6)        // Calculate estimated lines based on text length with a reasonable factor
        // Use a moderate divisor to avoid underestimating lines
        const estimatedLinesBase = Math.ceil(textLength / Math.max(1, avgCharsPerLine * 0.65));
          // Use a smart scaling factor that handles specific cases differently
        // For longer text that likely has 3+ lines, be more generous to ensure no cutoff
        // For shorter text, use minimal scaling to avoid wasting space
        const scalingFactor = 
          textLength > 800 ? 1.5 :  // Very long text gets 1.5x multiplier
          textLength > 500 ? 1.3 :  // Long text gets 1.3x multiplier
          textLength > 300 ? 1.2 :  // Medium-long text gets 1.2x multiplier
          textLength > 150 ? 1.1 :  // Medium text gets 1.1x multiplier
          1.0;                      // Short text gets no multiplier
          
        // For text that might be on the border of 2-3 lines, add a special check
        // This specifically targets the original problem case of 3+ lines being cut off
        const estimatedLineCount = Math.ceil(textLength / avgCharsPerLine);
        const needsExtraSpace = estimatedLineCount >= 3;
          const estimatedLines = Math.max(
          3, // Reasonable minimum for short text
          Math.ceil(estimatedLinesBase * scalingFactor) // Apply our scaling factor
        );
        
        // Use a reasonable line height multiplier for proper spacing
        const lineHeight = fontSize * 1.4; // Moderate multiplier for proper line spacing
          // Use reasonable padding that scales modestly with text length
        // For longer text, add some extra padding to prevent cutoffs
        const basePadding = 20; // Start with a reasonable base padding
        
        // Give extra padding specifically to text that likely has 3+ lines (our problem case)
        // This ensures we fix the original issue without making single lines too tall
        const lineSpecificPadding = needsExtraSpace ? 25 : 0;
        
        const extraPadding = Math.min(40, estimatedLines * 2); // Scale padding with line count, but with a reasonable cap
        const totalPadding = basePadding + extraPadding + lineSpecificPadding;
        
        const calculatedHeight = (estimatedLines * lineHeight) + totalPadding;        // Set a fixed height based on our calculations, with a reasonable minimum size
        // Balance between having enough space without excessive height
        const minimumHeight = Math.max(
          fontSize * 3, // Reasonable minimum height for single-line content
          calculatedHeight * 1.05 // Add a small 5% safety margin to calculated height
        );
        
        textBlock.height = Math.ceil(minimumHeight) + 'px';
        
        console.log(`Enhanced paragraph height calculation: fontSize=${fontSize}, chars=${textLength}, ` +
                    `avgCharsPerLine=${avgCharsPerLine}, estimatedLines=${estimatedLines}, ` +
                    `calculatedHeight=${calculatedHeight}, finalHeight=${textBlock.height}`);
      }
      
      // Extra padding for paragraphs
      textBlock.paddingTop = "15px"; // Increased padding
      textBlock.paddingBottom = "15px"; // Increased padding
      textBlock.paddingLeft = "10px";
      textBlock.paddingRight = "10px";
    }
    
    // Force alignment consistency between the control position and text position
    if (textBlock.horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_CENTER) {
      textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    }
    if (textBlock.verticalAlignment === Control.VERTICAL_ALIGNMENT_CENTER) {
      textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    }
    
    // Log configuration for debugging
    console.log(`TextBlock ${node.type} configuration:`, {
      text: textBlock.text.substring(0, 20) + (textBlock.text.length > 20 ? '...' : ''),
      width: textBlock.width,
      height: textBlock.height,
      textWrapping: textBlock.textWrapping,
      resizeToFit: textBlock.resizeToFit,
      fontSize: textBlock.fontSize,
      paddingTop: textBlock.paddingTop,
      paddingBottom: textBlock.paddingBottom
    });
    
    return textBlock;
  }
  private async createContainer(node: ElementNode, siteContent?: SiteContent | null): Promise<Rectangle> {
    console.log(`Creating container for type: ${node.type}`);
    const rect = new Rectangle(node.type);
    rect.clipChildren = false; // Ensure children are never clipped    // Set parent chain for style inheritance
    const styleChain = this.styleService.getStyleChain(node, this.stylesheetMap);
      // Use site-context aware styling if site content is provided
    if (siteContent) {
      await this.styleService.applyStylesWithSiteContext(rect, styleChain, siteContent);
    } else {
      this.styleService.applyStyles(rect, styleChain);
    }    // If the site uses material backgrounds, always make GUI rectangles transparent
    // When using material backgrounds, GUI should always be transparent to show the mesh material
    if (siteContent?.site?.backgroundType === 'material') {
      // Always make GUI transparent when site uses materials - the mesh provides the background
      rect.background = "transparent";
      console.log(`Container ${node.type} set to transparent background because site uses material backgrounds.`);
    } else {
      // Only check individual node styles if site doesn't use materials
      const nodeStyle = styleChain.find(s => s._id === node._id); // Get the specific style for this node
      if (nodeStyle?.properties?.backgroundType === 'material' || 
          nodeStyle?.properties?.borderType === 'material') {
        rect.background = "transparent";
        console.log(`Container ${node.type} set to transparent background due to node material settings.`);
      }
    }

    // Determine pixel width for this container
    let rectWidth = 800; // Default fallback
    if (typeof rect.width === 'string' && rect.width.endsWith('px')) {
      rectWidth = parseInt(rect.width);
    }
    
    // Handle children
    const children = this.getChildNodes(node);
    if (children && children.length > 0) {
      // Group text nodes in a StackPanel, add non-text children directly
      const textNodes: ElementNode[] = [];
      const otherNodes: ElementNode[] = [];      for (const childNode of children) {
        if (!this.isElementNode(childNode)) continue;
        (childNode as any).parent = node;
        if (childNode.type === 'h1' || childNode.type === 'p') {
          textNodes.push(childNode);
        } else {
          otherNodes.push(childNode);
        }
      }
      
      if (textNodes.length > 0) {
        console.log(`Creating StackPanel for ${textNodes.length} text nodes in ${node.type}`);
        const stackPanel = new StackPanel("text-stack");
        stackPanel.isVertical = true;
        stackPanel.clipChildren = false; // Ensure children are never clipped
        
        // Set width for the StackPanel based on container dimensions
        const spWidth = Math.round(rectWidth * 0.95); // 95% of container width
        stackPanel.width = spWidth + 'px';
        
        // Add padding to the StackPanel
        stackPanel.paddingTop = "10px";
        stackPanel.paddingBottom = "10px";
        
        // Center the StackPanel in its parent container
        stackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;        // Moderate spacing between text elements for better readability without excessive gaps
        stackPanel.spacing = 10;
        
        // Add all text nodes to the StackPanel and calculate total height
        let totalHeight = stackPanel.paddingTop ? parseInt(stackPanel.paddingTop) : 0;
        totalHeight += stackPanel.paddingBottom ? parseInt(stackPanel.paddingBottom) : 0;
        
        // Process each text node
        for (const textNode of textNodes) {
          console.log(`Adding ${textNode.type} to StackPanel`);
          
          // Use appropriate font sizes based on element type
          const fontSize = textNode.type === 'h1' ? 32 : 20;          // Create text block with calculated width from parent StackPanel
          const textBlock = this.createTextBlock(
            textNode,
            fontSize,
            textNode.type === 'h1' ? 'bold' : 'normal',
            { width: spWidth - 20, height: 0 }
          );
          
          // Center text within the StackPanel
          textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          
          // Add to total height (block height + spacing)
          if (textBlock.height && typeof textBlock.height === 'string' && textBlock.height.endsWith('px')) {
            totalHeight += parseInt(textBlock.height) + stackPanel.spacing;
          }
          
          stackPanel.addControl(textBlock);
        }        // Set explicit height for the stack panel based on total content height
        // Add moderate extra padding to ensure text is not cut off
        // For multiple text blocks, be slightly more generous with the padding
        const extraPadding = textNodes.length > 1 ? 30 : 20;
        const finalHeight = totalHeight + extraPadding;
        stackPanel.height = finalHeight + 'px';
        
        console.log(`Setting StackPanel height to ${stackPanel.height} based on content (${textNodes.length} text nodes, ${extraPadding}px extra padding)`);
        
        rect.addControl(stackPanel);
      }      for (const childNode of otherNodes) {
        let childControl: Control | null = null;
        if (childNode.type === 'container' || childNode.type === 'panel') {
          childControl = await this.createContainer(childNode, siteContent);
        }
        if (childControl) {
          rect.addControl(childControl);
        }
      }
    }
    return rect;
  }

  addGuiToScene(guiElement: Control): void {
    console.log('Adding GUI element to scene:', guiElement);
    this.guiTexture.addControl(guiElement);
  }
  
  // Helper function to log the control hierarchy
  private logControlHierarchy(control: Control, level: number = 0): void {
    const indent = '  '.repeat(level);
    console.log(`${indent}Control: ${control.name}, Type: ${control.constructor.name}`);
    
    // If this is a container, log its children
    if ('children' in control && Array.isArray((control as any).children)) {
      const children = (control as any).children;
      children.forEach((child: Control) => {
        this.logControlHierarchy(child, level + 1);
      });
    }
  }

  private getChildNodes(node: ElementNode): ContentNode[] | undefined {
    if (node instanceof CoreNode || node instanceof PreviewNode || node instanceof EmbeddableContainerNode) {
      return node.children;
    } else if ('children' in node && Array.isArray((node as any).children)) {
      return (node as any).children;
    }
    return undefined;
  }

  /**
   * Apply hover style to a mesh by finding the hover style in the stylesheet
   * and applying it to the preview content. For hex meshes, also apply border to the mesh itself.
   */  applyHoverStyle(mesh: Mesh): void {
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
    const hoverStyle = this.findStyleById(styleId);
    console.log(`Looking for hover style with ID: ${styleId} for layer: ${currentLayer}`);
    
    if (hoverStyle) {
      console.log(`Applying hover style ${styleId} to ${currentLayer} layer of mesh ${mesh.name}`);
      if (targetControl instanceof Rectangle) {
        if (this.usesMaterialBackground()) {
          console.log(`Using material-aware hover styling for ${mesh.name}`);
          this.styleService.applyHoverStyles(targetControl, [hoverStyle]);
        } else {
          this.styleService.applyStyles(targetControl, [hoverStyle]);
        }
      } else {
        this.applyStyleToChildren(targetControl, hoverStyle);
      }
      
      if (mesh.name.startsWith('hex_') && hoverStyle.properties?.borderWidth && hoverStyle.properties?.borderColor) {
        const borderWidthNum = parseInt(hoverStyle.properties.borderWidth);
        if (!isNaN(borderWidthNum) && borderWidthNum > 0) {
          this.styleService.applyHexBorder(mesh, borderWidthNum, hoverStyle.properties.borderColor);
        }
      }
    } else {
      console.warn(`Hover style ${styleId} not found in styles`);
    }
  }

  /**
   * Apply normal style to a mesh by finding the normal style in the stylesheet
   * and applying it to the preview content. For hex meshes, also remove the border from the mesh itself.
   */  applyNormalStyle(mesh: Mesh): void {
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
    const normalStyle = this.findStyleById(styleId);
    console.log(`Looking for normal style with ID: ${styleId} for layer: ${currentLayer}`);
    
    if (normalStyle) {
      console.log(`Applying normal style ${styleId} to ${currentLayer} layer of mesh ${mesh.name}`);
      if (targetControl instanceof Rectangle) {
        if (this.usesMaterialBackground()) {
          console.log(`Using material-aware normal styling for ${mesh.name}`);
          this.styleService.applyHoverStyles(targetControl, [normalStyle]);
        } else {
          this.styleService.applyStyles(targetControl, [normalStyle]);
        }
      } else {
        this.applyStyleToChildren(targetControl, normalStyle);
      }
      
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
    
    const style = this.findStyleById(styleId);
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

  // Rest of the class remains unchanged
  // ...existing code...
}
