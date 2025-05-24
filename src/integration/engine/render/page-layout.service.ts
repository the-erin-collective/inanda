import { Injectable } from '@angular/core';
import { Scene, MeshBuilder, Mesh, StandardMaterial, Texture, ArcRotateCamera } from '@babylonjs/core';
import * as honeycomb from 'honeycomb-grid';
import { SiteContent } from '../../models/site-content.aggregate.model';
import { Page } from 'src/domain/entities/page/page.entity';
import { GuiService } from './gui.service';
import { SitemapType } from 'src/domain/entities/site/sitemap-type.enum';
import { NavigationService } from '../navigation/navigation.service';
import { RootNode } from 'src/domain/entities/page/root.entity';

@Injectable({ providedIn: 'root' })
export class PageLayoutService {
  material: StandardMaterial;
  constructor(
    private guiService: GuiService,
    private navigationService: NavigationService
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

    this.material = this.createMaterial(scene);
    this.guiService.initializeGui(scene);

    // Initialize navigation service with pages
    this.navigationService.initialize(scene, scene.activeCamera as ArcRotateCamera, pages);

    switch (siteContent.site.sitemapType) {
      case SitemapType.HEX_FLOWER:
        await this.renderHexFlower(scene, pages, siteContent.site.defaultPage);
        break;
      case SitemapType.GRID:
        await this.renderGridLayout(scene, pages, siteContent.site.defaultPage);
        break;
      case SitemapType.LIST:
        await this.renderListLayout(scene, pages, siteContent.site.defaultPage);
        break;
      default:
        console.warn(`Unsupported sitemap type: ${siteContent.site.sitemapType}`);
        await this.renderHexFlower(scene, pages, siteContent.site.defaultPage);
    }
  }

  private async renderHexFlower(scene: Scene, pages: Page[], defaultPageId?: string): Promise<void> {
    console.log('Rendering hex flower with pages:', pages.map(p => ({ id: p._id, title: p.title })));
    
    const grid = this.createGrid();
    let pageIndex = 0;
    
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
      }
      
      const hexMesh = this.createHexMesh(hex, scene, this.material, page._id);
      
      // Store the page ID in the mesh metadata
      hexMesh.metadata = { pageId: page._id };
      console.log(`Stored page ID in mesh metadata:`, hexMesh.metadata);
      
      const guiElement = await this.guiService.createGuiFromJson(page.root);
      if (guiElement) {
        this.guiService.attachGuiToMesh(hexMesh, guiElement);
      }
      pageIndex++;
    }

    // If there's a default page, navigate to it
    if (defaultPageId) {
      console.log('Looking for default page:', defaultPageId);
      const defaultPage = pages.find(p => p._id === defaultPageId);
      if (defaultPage) {
        console.log('Found default page:', defaultPage);
        const defaultMesh = scene.meshes.find(mesh => {
          const meshPageId = mesh.metadata?.pageId;
          console.log('Checking mesh:', mesh.name, 'metadata:', mesh.metadata);
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

  private async renderGridLayout(scene: Scene, pages: Page[], defaultPageId?: string): Promise<void> {
    const gridSize = Math.ceil(Math.sqrt(pages.length));
    const spacing = 70;
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      const mesh = MeshBuilder.CreateBox(`page_${page.id}`, {
        height: 0.1,
        width: 60,
        depth: 60
      }, scene);
      
      mesh.material = this.material;
      mesh.position.x = (col - gridSize/2) * spacing;
      mesh.position.z = (row - gridSize/2) * spacing;
      
      const guiElement = await this.guiService.createGuiFromJson(page.root);
      if (guiElement) {
        this.guiService.attachGuiToMesh(mesh, guiElement);
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

  private async renderListLayout(scene: Scene, pages: Page[], defaultPageId?: string): Promise<void> {
    const spacing = 70;
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const mesh = MeshBuilder.CreateBox(`page_${page.id}`, {
        height: 0.1,
        width: 60,
        depth: 60
      }, scene);
      
      mesh.material = this.material;
      mesh.position.x = 0;
      mesh.position.z = i * spacing;
      
      const guiElement = await this.guiService.createGuiFromJson(page.root);
      if (guiElement) {
        this.guiService.attachGuiToMesh(mesh, guiElement);
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

  private createHexMesh(hex: honeycomb.Hex, scene: Scene, material: StandardMaterial, pageId: string): Mesh {
    if (!pageId) {
      console.error('Attempting to create hex mesh with undefined pageId');
      pageId = 'unknown'; // Fallback to prevent undefined in mesh name
    }

    const meshName = `hex_${hex.q}_${hex.r}_page_${pageId}`;
    console.log('Creating hex mesh:', meshName);
    
    const hexMesh = MeshBuilder.CreateCylinder(meshName, {
      diameter: 60.0, 
      height: 0.1,
      tessellation: 6,
    }, scene);

    hexMesh.material = material;
    hexMesh.position.x = hex.x;
    hexMesh.position.z = hex.y;
    hexMesh.position.y = 0;

    // Store the page ID in the mesh metadata
    hexMesh.metadata = { pageId };
    console.log(`Created hex mesh with metadata:`, hexMesh.metadata);

    return hexMesh;
  }

  createMaterial(scene: Scene): StandardMaterial {
    const material = new StandardMaterial('hex_surface', scene);
    material.specularPower = 100000000;
    material.diffuseTexture = new Texture('presentation/assets/textures/abstract-gray-background.jpg', scene);
    return material;
  }
}