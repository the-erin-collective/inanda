import { Injectable } from '@angular/core';
import { Scene, MeshBuilder, Mesh, StandardMaterial, Texture } from '@babylonjs/core';
import * as honeycomb from 'honeycomb-grid';
import { SiteContent } from '../../models/site-content.aggregate.model';
import { Page } from 'src/domain/entities/page/page.entity';
import { GuiService } from './gui.service';

@Injectable({ providedIn: 'root' })
export class PageLayoutService {
  material: StandardMaterial;
  constructor(private guiService: GuiService) {}

  renderGrid(scene: Scene, siteContent: SiteContent | null): void {
    const grid = this.createGrid();
    const pages = siteContent?.pages || [];
    if (pages.length === 0) {
      console.warn('No pages available to render.');
      return;
    }

    this.material = this.createMaterial(scene);

    // Initialize the GUI
    this.guiService.initializeGui(scene);

    let pageIndex = 0;
    grid.forEach((hex) => {
      const page = pages[pageIndex % pages.length];
      this.renderPageContent(hex, page, scene);
      pageIndex++;
    });
  }

  private renderPageContent(hex: honeycomb.Hex, page: Page, scene: Scene): void {
    // Create a hex mesh
    const hexMesh = this.createHexMesh(hex, scene, this.material);

    // Create GUI elements from the page JSON
    const guiElement = this.guiService.createGuiFromJson(page.root);
    if (guiElement) {
      this.guiService.attachGuiToMesh(hexMesh, guiElement);
    }
  }

  private createHexMesh(hex: honeycomb.Hex, scene: Scene, material: StandardMaterial,): Mesh {
    const hexMesh = MeshBuilder.CreateCylinder(`hex_${hex.q}_${hex.r}`, {
      diameter: 60.0, 
      height: 0.1,
      tessellation: 6,
    }, scene);

    hexMesh.material = material;
    hexMesh.position.x = hex.x;
    hexMesh.position.z = hex.y;

    return hexMesh;
  }

  private createGrid(): honeycomb.Grid<honeycomb.Hex> {
    const gridSize = 1;
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

  createMaterial(scene: Scene): StandardMaterial {
    const material = new StandardMaterial('hex_surface', scene);
    material.specularPower = 100000000;
    material.diffuseTexture = new Texture('presentation/assets/textures/abstract-gray-background.jpg', scene);
    return material;
  }
}