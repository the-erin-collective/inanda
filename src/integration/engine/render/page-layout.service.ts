import { Injectable } from '@angular/core';
import { Scene, Mesh, MeshBuilder, AssetContainer, StandardMaterial, Texture, Vector3, TransformNode } from '@babylonjs/core';
import * as honeycomb from 'honeycomb-grid';
import * as earcut from 'earcut';
import { SiteContent } from '../../models/site-content.aggregate.model';

@Injectable({ providedIn: 'root' })
export class PageLayoutService {
  private material: StandardMaterial;

  createGrid(): honeycomb.Grid<honeycomb.Hex> {
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
    this.material = material;
    return material;
  }

  createPageMesh(hex: honeycomb.Hex, scene: Scene): Mesh {
    const shape = hex.corners.map((corner) => new Vector3(corner.x, 0, corner.y));
    return MeshBuilder.CreatePolygon(
      'page',
      { shape, sideOrientation: Mesh.DOUBLESIDE },
      scene,
      earcut.default
    );
  }

  renderGrid(scene: Scene, siteContent: SiteContent | null): void {
    const grid = this.createGrid();
    const hexTemplate = grid.getHex([0, 0]);
    if (!hexTemplate) {
      throw new Error('No hexes found in the grid.');
    }

    const hexTileMesh = this.createPageMesh(hexTemplate, scene);
    const hexTileMeshContainer = new AssetContainer(scene);

    // Create and apply the material
    const material = this.createMaterial(scene);

    grid.forEach((hex) => {
      this.renderPageContent(hexTileMesh, hexTileMeshContainer, hex, material);
    });

    // Optionally, use siteContent to add additional content to the grid
    if (siteContent) {
      console.log('Rendering site content:', siteContent);
      // Add logic to render site content on top of the hexes
    }
  }

  renderPageContent(
    pageMesh: Mesh,
    pageMeshContainer: AssetContainer,
    hex: honeycomb.Hex,
    material: StandardMaterial
  ): void {
    pageMeshContainer.meshes.splice(0);

    pageMesh.material = material;
    pageMeshContainer.meshes.push(pageMesh);

    const pageInstance = pageMeshContainer.instantiateModelsToScene(
      (name) => `${hex.q}-${hex.r}_${name}`,
      false
    );

    const pageRoot = pageInstance.rootNodes[0] as TransformNode;
    pageRoot.name = `page${hex.q}${hex.r}`;
    pageRoot.position.x = hex.x;
    pageRoot.position.z = hex.y;

    const pageChildren = pageRoot.getDescendants();
    for (const pageChild of pageChildren) {
      pageChild.name = pageChild.name.slice(9);
    }
  }
}