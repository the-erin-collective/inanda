import { Injectable } from '@angular/core';
import { Scene, MeshBuilder, Mesh, StandardMaterial, Texture, ArcRotateCamera, HemisphericLight, Vector3, Material, GlowLayer, Color3, HighlightLayer } from '@babylonjs/core';
import * as honeycomb from 'honeycomb-grid';
import { SiteContent } from '../../models/site-content.aggregate.model';
import { Page } from 'src/domain/entities/page/page.entity';
import { GuiService } from './gui.service';
import { SitemapType } from 'src/domain/entities/site/sitemap-type.enum';
import { NavigationService } from '../navigation/navigation.service';
import { RootNode } from 'src/domain/entities/page/root.entity';
import { BackdropService } from './backdrop.service';
import { MaterialService } from './material.service';
import { StyleService } from './style.service';

@Injectable({ providedIn: 'root' })
export class PageLayoutService {
  material: StandardMaterial;
 
  constructor(
    private guiService: GuiService,
    private navigationService: NavigationService,
    private backdropService: BackdropService,
    private materialService: MaterialService,
    private styleService: StyleService
  ) {}

  async renderGrid(scene: Scene, siteContent: SiteContent | null): Promise<void> {
    if (!siteContent?.site) {
      console.warn('No site content available to render.');
      return;
    }

    const pages = siteContent.pages || [];
    if (pages.length === 0) {
      console.warn('No pages available to render.');
      return;
    }

    // Add a hemispheric light to the scene
    new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    console.log('Added HemisphericLight to the scene.');

    // Apply the site backdrop
    this.backdropService.applyBackdrop(scene, siteContent.site.backdrop);

  // Conditionally create material based on site's backgroundType or borderType
  if (siteContent.site.backgroundType === 'material' || siteContent.site.borderType === 'material') {
    //console.log(`RenderGrid: Creating scene material with type=${siteContent.site.materialType}, texture=${siteContent.site.materialTextureUrl} because backgroundType or borderType is 'material'.`);
    this.material = await this.materialService.getMaterial({
      materialType: siteContent.site.materialType
    }, scene);
  } else {
    console.log(`RenderGrid: Creating transparent scene material because backgroundType and borderType are not 'material'.`);
    this.material = this.materialService.getEmptyMaterial(scene);
  }
    
    this.guiService.initializeGui(scene);

    // Initialize navigation service with pages
    this.navigationService.initialize(scene, scene.activeCamera as ArcRotateCamera, pages);

    switch (siteContent.site.sitemapType) {
      case SitemapType.HEX_FLOWER:
        await this.renderHexFlower(scene, pages, siteContent.site.defaultPage, siteContent);
        break;
      case SitemapType.GRID:
        await this.renderGridLayout(scene, pages, siteContent.site.defaultPage, siteContent);
        break;
      case SitemapType.LIST:
        await this.renderListLayout(scene, pages, siteContent.site.defaultPage, siteContent);
        break;
      default:
        console.warn(`Unsupported sitemap type: ${siteContent.site.sitemapType}`);
        await this.renderHexFlower(scene, pages, siteContent.site.defaultPage, siteContent);
    }
  }

  private async renderHexFlower(scene: Scene, pages: Page[], defaultPageId?: string, siteContent?: SiteContent | null): Promise<void> {
    console.log('Rendering hex flower with pages:', pages.map(p => ({ id: p._id, title: p.title })));
    
    const grid = this.createGrid();
    let pageIndex = 0;    // Create multiple highlight layers for the shadow effect, each with different blur values
    const shadowColor = new Color3(0, 0, 0);
    
    // // First pass - wide blur, very transparent
    // const highlightLayer1 = new HighlightLayer("shadowLayer1", scene, {
    //     mainTextureFixedSize: 1024,
    //     blurTextureSizeRatio: 0.5,
    //     camera: scene.activeCamera
    // });
    // highlightLayer1.innerGlow = false;
    // highlightLayer1.outerGlow = true;
    
    // Second pass - medium blur
    const highlightLayer = new HighlightLayer("shadowLayer2", scene, {
        mainTextureFixedSize: 1024,
        blurTextureSizeRatio: 0.3,
        blurHorizontalSize: 0.5,
        camera: scene.activeCamera
    });
    highlightLayer.innerGlow = false;
    highlightLayer.outerGlow = true;

    for (const hex of grid) {
      if (pageIndex >= pages.length) {
        console.warn(`No more pages available for hex at position (${hex.q}, ${hex.r})`);
        break;
      }

      const page = pages[pageIndex];
      console.log(`Creating hex for page ${pageIndex}:`, { 
        pageId: page._id, 
        pageTitle: page.title,
        hex: { q: hex.q, r: hex.r } 
      });
      
      if (!page._id) {
        console.error('Page ID is undefined for page:', page);
        continue;
      }      // Create the shadow mesh first so it appears behind everything
      const shadowMesh = this.createShadowMesh(hex, scene, page._id);
      
      // Apply both highlight layers with different intensities
     // highlightLayer1.addMesh(shadowMesh, new Color3(0, 0, 0), true);
      highlightLayer.addMesh(shadowMesh, new Color3(0, 0, 0), false);
      
      // Create background meshes with materials (these will show the wood texture)
      const backgroundMeshes = {
        preview: this.createHexMesh(hex, scene, this.material.clone("preview_material_" + page._id), page._id, 'preview_bg'),
        core: this.createHexMesh(hex, scene, this.material.clone("core_material_" + page._id), page._id, 'core_bg')
      };

      // Apply color overlays if site uses materials
      if (siteContent?.site?.backgroundType === 'material') {
        console.log(`[PageLayoutService] Site uses material backgrounds, extracting colors for page: ${page._id}`);
        const pageColors = await this.extractPageBackgroundColors(page, siteContent);
        console.log(`[PageLayoutService] Extracted colors for page ${page._id}:`, pageColors);          // Apply preview color overlay if available
        if (pageColors.preview) {
          const previewMesh = backgroundMeshes.preview;
          const previewColor = this.materialService.hexToColor3(pageColors.preview);
          
          // Set overlay properties without forcing full material update
          previewMesh.renderOverlay = true;
          previewMesh.overlayColor = previewColor;
          previewMesh.overlayAlpha = 0.6;
          
          // Basic material settings without forcing recalculation
          previewMesh.material.alpha = 1.0;
          previewMesh.material.transparencyMode = 0; // OPAQUE
          
          console.log(`[PageLayoutService] Applied preview overlay:`, {
            meshName: previewMesh.name,
            color: pageColors.preview,
            overlayEnabled: previewMesh.renderOverlay,
            overlayAlpha: previewMesh.overlayAlpha
          });
        }        // Apply core color overlay if available
        if (pageColors.core) {
          const coreMesh = backgroundMeshes.core;
          const coreColor = this.materialService.hexToColor3(pageColors.core);
          
          // Set overlay properties without forcing full material update
          coreMesh.renderOverlay = true;
          coreMesh.overlayColor = coreColor;
          coreMesh.overlayAlpha = 0.6;
          
          // Basic material settings without forcing recalculation
          coreMesh.material.alpha = 1.0;
          coreMesh.material.transparencyMode = 0; // OPAQUE
          
          console.log(`[PageLayoutService] Applied core overlay:`, {
            meshName: coreMesh.name,
            color: pageColors.core,
            overlayEnabled: coreMesh.renderOverlay,
            overlayAlpha: coreMesh.overlayAlpha
          });
        }
        
        // Force scene update
        scene.render();
      }
      
      // Create transparent container meshes for GUI elements
      const previewContainerMesh = this.createTransparentContainerMesh(hex, scene, page._id, 'preview_container', 0.3);
      const coreContainerMesh = this.createTransparentContainerMesh(hex, scene, page._id, 'core_container', 0.1);

      // Initially show preview layer, hide core layer
      backgroundMeshes.preview.isVisible = true;
      previewContainerMesh.isVisible = true;
      backgroundMeshes.core.isVisible = false;
      coreContainerMesh.isVisible = false;

      // Setup metadata with correct references between preview and core layers
      const meshMetadata = { 
        pageId: page._id, 
        layer: 'preview',
        coreBackgroundMesh: backgroundMeshes.core,
        coreContainerMesh: coreContainerMesh,
        previewContainerMesh: previewContainerMesh,
        previewBackgroundMesh: backgroundMeshes.preview
      };

      // Apply metadata to all meshes
      backgroundMeshes.preview.metadata = { ...meshMetadata, layer: 'preview' };
      backgroundMeshes.core.metadata = { ...meshMetadata, layer: 'core' };
      previewContainerMesh.metadata = { ...meshMetadata, layer: 'preview' };
      coreContainerMesh.metadata = { ...meshMetadata, layer: 'core' };

      console.log(`Created layered meshes for page: ${page._id}`);

      // Create GUI elements and attach them
      const guiElements = await this.guiService.createGuiFromJson(page.root, siteContent);
      if (guiElements) {
        if (guiElements.preview) {
          this.guiService.attachGuiToMesh(previewContainerMesh, guiElements.preview);
        }
        if (guiElements.core) {
          this.guiService.attachGuiToMesh(coreContainerMesh, guiElements.core);
        }
        console.log(`Attached GUI elements to container meshes for page: ${page._id}`);
      }

      pageIndex++;
    }

    // Handle navigation to default page if specified
    if (defaultPageId) {
      console.log('Looking for default page:', defaultPageId);
      const defaultPage = pages.find(p => p._id === defaultPageId);
      if (defaultPage) {
        console.log('Found default page:', defaultPage);
        const defaultMesh = scene.meshes.find(mesh => {
          const meshPageId = mesh.metadata?.pageId;
          return meshPageId === defaultPageId;
        });
        if (defaultMesh) {
          console.log('Found default mesh:', defaultMesh.name);
          await this.navigationService.navigateToPage(defaultPage, defaultMesh);
        } else {
          console.warn('Default mesh not found for page:', defaultPageId);
        }
      } else {
        console.warn('Default page not found:', defaultPageId);
      }
    }
  }

  private async renderGridLayout(scene: Scene, pages: Page[], defaultPageId?: string, siteContent?: SiteContent | null): Promise<void> {
    const gridSize = Math.ceil(Math.sqrt(pages.length));
    const spacing = 70;
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      const mesh = MeshBuilder.CreateBox(`page_${page.id}`, {
        height: 0.5, // Increased height for better visibility
        width: 60,
        depth: 60
      }, scene);
      
      mesh.material = this.material;
      console.log(`  Applying material to grid mesh: ${mesh.name}, Material Name: ${this.material.name}, Has Diffuse Texture: ${!!this.material.diffuseTexture}`);
      mesh.position.x = (col - gridSize/2) * spacing;
      mesh.position.z = (row - gridSize/2) * spacing;      // If site has a material border, create a separate border mesh
      if (siteContent?.site?.borderType === 'material') {
        const borderMaterial = await this.materialService.getMaterial({
          materialType: siteContent.site.materialType,
        }, scene);
        // Create a slightly larger box for the border
        const borderMesh = MeshBuilder.CreateBox(`box_border_${page.id}`, {
          height: 0.15, // Slightly thicker
          width: 62,   // Slightly larger
          depth: 62
        }, scene);

        borderMesh.material = borderMaterial;
        borderMesh.position.x = mesh.position.x;
        borderMesh.position.z = mesh.position.z;
        borderMesh.position.y = -0.05; // Slightly below the main box
        borderMesh.isPickable = false;        console.log(`  Created material border for grid mesh: ${borderMesh.name}, Material Name: ${borderMaterial.name}`);
      }      const guiElements = await this.guiService.createGuiFromJson(page.root, siteContent);
      if (guiElements) {
        // For grid layout, attach both to the same mesh (TODO: consider layered approach)
        if (guiElements.preview) {
          this.guiService.attachGuiToMesh(mesh, guiElements.preview);
        }
        console.log(`Attached GUI elements to grid mesh for page: ${page.id}`);
      }
    }

    // If there's a default page, navigate to it
    if (defaultPageId) {
      const defaultPage = pages.find(p => p.id === defaultPageId);
      if (defaultPage) {
        const defaultMesh = scene.getMeshByName(`page_${defaultPage.id}`);
        if (defaultMesh) {
          await this.navigationService.navigateToPage(defaultPage, defaultMesh);
        }
      }
    }
  }

  private async renderListLayout(scene: Scene, pages: Page[], defaultPageId?: string, siteContent?: SiteContent | null): Promise<void> {
    const spacing = 70;
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const mesh = MeshBuilder.CreateBox(`page_${page.id}`, {
        height: 0.5, // Increased height for better visibility
        width: 60,
        depth: 60
      }, scene);
      
      mesh.material = this.material;
      console.log(`  Applying material to list mesh: ${mesh.name}, Material Name: ${this.material.name}, Has Diffuse Texture: ${!!this.material.diffuseTexture}`);
      mesh.position.x = 0;
      mesh.position.z = i * spacing;      // If site has a material border, create a separate border mesh
      if (siteContent?.site?.borderType === 'material') {
        const borderMaterial = await this.materialService.getMaterial({
          materialType: siteContent.site.materialType,
        }, scene);
        // Create a slightly larger box for the border
        const borderMesh = MeshBuilder.CreateBox(`box_border_${page.id}`, {
          height: 0.15, // Slightly thicker
          width: 62,   // Slightly larger
          depth: 62
        }, scene);

        borderMesh.material = borderMaterial;
        borderMesh.position.x = mesh.position.x;
        borderMesh.position.z = mesh.position.z;
        borderMesh.position.y = -0.05; // Slightly below the main box        borderMesh.isPickable = false;        console.log(`  Created material border for list mesh: ${borderMesh.name}, Material Name: ${borderMaterial.name}`);
      }      const guiElements = await this.guiService.createGuiFromJson(page.root, siteContent);
      if (guiElements) {
        // For list layout, attach both to the same mesh (TODO: consider layered approach)
        if (guiElements.preview) {
          this.guiService.attachGuiToMesh(mesh, guiElements.preview);
        }
        console.log(`Attached GUI elements to list mesh for page: ${page.id}`);
      }
    }

    // If there's a default page, navigate to it
    if (defaultPageId) {
      const defaultPage = pages.find(p => p.id === defaultPageId);
      if (defaultPage) {
        const defaultMesh = scene.getMeshByName(`page_${defaultPage.id}`);
        if (defaultMesh) {
          await this.navigationService.navigateToPage(defaultPage, defaultMesh);
        }
      }
    }
  }

  private createGrid(): honeycomb.Grid<honeycomb.Hex> {
    const gridSize = 2;
    const gridDimensions = 30;

    const defaultHexSettings: honeycomb.HexSettings = {
      dimensions: { xRadius: gridDimensions, yRadius: gridDimensions },
      orientation: honeycomb.Orientation.FLAT,
      origin: { x: 0, y: 0 },
      offset: -1,
    };

    const tile = honeycomb.defineHex(defaultHexSettings);

    return new honeycomb.Grid(
      tile,
      honeycomb.spiral({ start: [0, 0], radius: gridSize })
    );
  }
  private createHexMesh(hex: honeycomb.Hex, scene: Scene, material: StandardMaterial, pageId: string, layer?: string): Mesh {
    if (!pageId) {
      console.error('Attempting to create hex mesh with undefined pageId');
      pageId = 'unknown'; // Fallback to prevent undefined in mesh name
    }

    const layerSuffix = layer ? `_${layer}` : '';
    const meshName = `hex_${hex.q}_${hex.r}_page_${pageId}${layerSuffix}`;
    console.log('Creating hex mesh:', meshName);
      const hexMesh = MeshBuilder.CreateCylinder(meshName, {
      diameter: 60.0, 
      height: 0.5,
      tessellation: 6,
    }, scene);    // Set up texture tiling and coordinates
    console.log('DEBUG - TEXTURE - material', material);
    // if (material.diffuseTexture) {
    //   material.diffuseTexture.coordinatesIndex = 0;
    //   (material.diffuseTexture as any).uScale = 3.0; // Repeat texture 3 times horizontally
    //   (material.diffuseTexture as any).vScale = 3.0; // Repeat texture 3 times vertically
    //   material.diffuseTexture.wrapU = 1; // Enable horizontal wrapping (1 = WRAP)
    //   material.diffuseTexture.wrapV = 1; // Enable vertical wrapping (1 = WRAP)
    // }

    // Set up material for glow effect
    material.emissiveColor = new Color3(0.1, 0.1, 0.1); // This helps with the glow effect
    hexMesh.material = material;
    console.log(`  Applying material to ${layer || 'default'} hex mesh: ${hexMesh.name}, Material Name: ${material.name}, Has Diffuse Texture: ${!!material.diffuseTexture}`);
    console.log(`  hexMesh position`, hexMesh.position);
    hexMesh.position.x = hex.x;
    hexMesh.position.z = hex.y;

    // Position layers at different heights
    if (layer === 'preview') {
      hexMesh.position.y = 0.0; // Preview layer above core
    } else if (layer === 'core') {
      hexMesh.position.y = 0; // Core layer at base level
    } else {
      hexMesh.position.y = 0; // Default position
    }

    // Store the page ID in the mesh metadata
    hexMesh.metadata = { pageId };
    console.log(`Created hex mesh with metadata:`, hexMesh.metadata);

    return hexMesh;
  }
  private createTransparentContainerMesh(hex: honeycomb.Hex, scene: Scene, pageId: string, layer: string, heightOffset: number): Mesh {
    const meshName = `hex_${hex.q}_${hex.r}_page_${pageId}_${layer}`;
    console.log('Creating transparent container mesh:', meshName);
    
    const containerMesh = MeshBuilder.CreateCylinder(meshName, {
      diameter: 60.0, 
      height: 0.1, // Thin container for GUI
      tessellation: 6,
    }, scene);    // Create a transparent material
    const transparentMaterial = new StandardMaterial(`transparent_${meshName}`, scene);
    transparentMaterial.alpha = 0.1; // Slightly more visible for debugging
    transparentMaterial.alphaMode = 1; // Enable alpha blending
    
    containerMesh.material = transparentMaterial;    containerMesh.position.x = hex.x;
    containerMesh.position.z = hex.y;
    containerMesh.position.y = heightOffset; // Slightly above the background mesh
    
    console.log(`  Created transparent container mesh: ${containerMesh.name} at position (${containerMesh.position.x}, ${containerMesh.position.y}, ${containerMesh.position.z})`);
    console.log(`  Container material alpha: ${transparentMaterial.alpha}`);
    return containerMesh;
  }
  private createShadowMesh(hex: honeycomb.Hex, scene: Scene, pageId: string): Mesh {
    const meshName = `hex_shadow_${hex.q}_${hex.r}_page_${pageId}`;    // Create a larger hex for the shadow
    const shadowMesh = MeshBuilder.CreateCylinder(meshName, {
      diameter: 60.5, // Just slightly larger than the hex
      height: 0.01, // Very thin
      tessellation: 6,
    }, scene);

    // Create a simple black material
    const shadowMaterial = new StandardMaterial(`shadow_material_${meshName}`, scene);
    shadowMaterial.diffuseColor = new Color3(0, 0, 0);
    shadowMaterial.specularColor = new Color3(0, 0, 0);
    shadowMaterial.emissiveColor = new Color3(0, 0, 0);
    shadowMaterial.alpha = 0.15; // Very transparent

    shadowMesh.material = shadowMaterial;
    shadowMesh.position.x = hex.x;
    shadowMesh.position.z = hex.y;
    shadowMesh.position.y = -0.1; // Position it slightly below the hex
    shadowMesh.visibility = 0.5; // Semi-transparent shadow

    return shadowMesh;
  }
  /**
   * Extract background colors from a page's styles for material tinting
   */
  private async extractPageBackgroundColors(page: Page, siteContent: SiteContent): Promise<{ preview?: string; core?: string }> {
    const colors: { preview?: string; core?: string } = {};
    
    console.log(`[PageLayoutService] Extracting background colors for page: ${page._id}`);
    
    if (!page.root) {
      console.warn(`[PageLayoutService] No root element found for page: ${page._id}`);
      return colors;
    }

    // Find the stylesheet in the page's root structure
    const stylesheetNode = page.root.base?.children?.find(child => child.type === 'stylesheet') as any;
    if (!stylesheetNode || !stylesheetNode.styles) {
      console.warn(`[PageLayoutService] No stylesheet found for page: ${page._id}`);
      return colors;
    }

    // Create a style map for quick lookup
    const styleMap = new Map();
    stylesheetNode.styles.forEach((style: any) => {
      styleMap.set(style._id, style);
      console.log(`[PageLayoutService] Found style: ${style._id} with properties:`, style.properties);
    });

    // Look for preview and core containers and their associated styles
    const findBackgroundColors = (node: any, containerType?: string): void => {
      if (!node) return;
      
      console.log(`[PageLayoutService] Checking node: ${node.type}, id: ${node._id}, containerType: ${containerType}`);
      
      // Determine if we're in a preview or core context
      let currentContainerType = containerType;
      if (node.type === 'preview') currentContainerType = 'preview';
      if (node.type === 'core') currentContainerType = 'core';
      
      // Check if this node has a style with background color
      if (node._id && currentContainerType) {
        const style = styleMap.get(node._id);
        if (style?.properties?.backgroundColor) {
          if (currentContainerType === 'preview' && !colors.preview) {
            colors.preview = style.properties.backgroundColor;
            console.log(`[PageLayoutService] Found preview background color: ${colors.preview} for node: ${node._id}`);
          } else if (currentContainerType === 'core' && !colors.core) {
            colors.core = style.properties.backgroundColor;
            console.log(`[PageLayoutService] Found core background color: ${colors.core} for node: ${node._id}`);
          }
        }
      }
      
      // Recursively check children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => findBackgroundColors(child, currentContainerType));
      }
    };
    
    // Start searching from preview and core nodes
    if (page.root.preview) {
      findBackgroundColors(page.root.preview, 'preview');
    }
    if (page.root.core) {
      findBackgroundColors(page.root.core, 'core');
    }
    
    console.log(`[PageLayoutService] Final extracted colors for page ${page._id}:`, colors);
    return colors;
  }
}