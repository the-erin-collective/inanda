import { ElementRef, Injectable, NgZone } from '@angular/core';
import {
  Color3,
  Color4,
  DynamicTexture,
  Engine,
  ArcRotateCamera,
  HemisphericLight,
  Light,
  Mesh,  
  MeshBuilder,
  AssetContainer,
  TransformNode,
  Scene,
  StandardMaterial,
  Texture,
  Vector3
} from '@babylonjs/core';
import { WindowRefService } from '../../common/services/window-ref.service';
import * as honeycomb from 'honeycomb-grid';
import * as earcut from 'earcut';
import { SiteContent } from '../models/site-content.aggregate.model';

@Injectable({ providedIn: 'root' })
export class EngineService {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private camera: ArcRotateCamera;
  private scene: Scene;
  private light: Light;
  private sphereMaterial: StandardMaterial;
  private sphere: Mesh;

  public constructor(
    private ngZone: NgZone,
    private windowRef: WindowRefService
  ) {}

  public createScene(canvas: ElementRef<HTMLCanvasElement>, siteContent: SiteContent | null): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    // Then, load the Babylon 3D engine:
    this.engine = new Engine(this.canvas,  true);

    // create a basic BJS Scene object
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.7, 0.7, 0.7, 0);

    // create a FreeCamera, and set its position to (x:5, y:10, z:-20 )
    this.camera = new ArcRotateCamera('camera1', 180, 0, 200, new Vector3(0, 5, -10), this.scene);

    // target the camera to scene origin
    this.camera.setTarget(Vector3.Zero());

    // attach the camera to the canvas
    this.camera.attachControl(this.canvas, false);

    // create a basic light, aiming 0,1,0 - meaning, to the sky
    this.light = new HemisphericLight('light1', new Vector3(0, 0.5, 0), this.scene);

    // create the material with its texture for the sphere and assign it to the sphere
    this.sphereMaterial = new StandardMaterial('hex_surface', this.scene);
    this.sphereMaterial.specularPower = 100000000;
    this.sphereMaterial.diffuseTexture = new Texture('presentation/assets/textures/abstract-gray-background.jpg', this.scene);

   const hexTileMeshContainer = new AssetContainer(this.scene);

        const grid = this.createGrid(); 
    
        const hexTemplate = grid.getHex([0, 0]);
        if(hexTemplate == null){
          throw('no hexes');
        };
    
        const hexTileMesh = this.createHexTileMesh(hexTemplate, this.scene);
        
     //   let hexIndex = 0;
        grid.forEach(hex => {
        //  hexIndex++;

          this.createHexTerrain(hexTileMesh, hexTileMeshContainer, hex);
        });
  }

  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      const rendererLoopCallback = () => {
        this.scene.render();
      };

      if (this.windowRef.document.readyState !== 'loading') {
        this.engine.runRenderLoop(rendererLoopCallback);
      } else {
        this.windowRef.window.addEventListener('DOMContentLoaded', () => {
          this.engine.runRenderLoop(rendererLoopCallback);
        });
      }

      this.windowRef.window.addEventListener('resize', () => {
        this.engine.resize();
      });
    });
  }

  /**
   * creates the world axes
   *
   * Source: https://doc.babylonjs.com/snippets/world_axes
   *
   * @param size number
   */
  public showWorldAxis(size: number): void {

    const makeTextPlane = (text: string, color: string, textSize: number) => {
      const dynamicTexture = new DynamicTexture('DynamicTexture', 50, this.scene, true);
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color , 'transparent', true);
      const plane = Mesh.CreatePlane('TextPlane', textSize, this.scene, true);
      const material = new StandardMaterial('TextPlaneMaterial', this.scene);
      material.backFaceCulling = false;
      material.specularColor = new Color3(0, 0, 0);
      material.diffuseTexture = dynamicTexture;
      plane.material = material;

      return plane;
    };

    const axisX = Mesh.CreateLines(
      'axisX',
      [
        Vector3.Zero(),
        new Vector3(size, 0, 0), new Vector3(size * 0.95, 0.05 * size, 0),
        new Vector3(size, 0, 0), new Vector3(size * 0.95, -0.05 * size, 0)
      ],
      this.scene,
      true
    );

    axisX.color = new Color3(1, 0, 0);
    const xChar = makeTextPlane('X', 'red', size / 10);
    xChar.position = new Vector3(0.9 * size, -0.05 * size, 0);

    const axisY = Mesh.CreateLines(
      'axisY',
      [
        Vector3.Zero(), new Vector3(0, size, 0), new Vector3( -0.05 * size, size * 0.95, 0),
        new Vector3(0, size, 0), new Vector3( 0.05 * size, size * 0.95, 0)
      ],
      this.scene,
      true
    );

    axisY.color = new Color3(0, 1, 0);
    const yChar = makeTextPlane('Y', 'green', size / 10);
    yChar.position = new Vector3(0, 0.9 * size, -0.05 * size);

    const axisZ = Mesh.CreateLines(
      'axisZ',
      [
        Vector3.Zero(), new Vector3(0, 0, size), new Vector3( 0 , -0.05 * size, size * 0.95),
        new Vector3(0, 0, size), new Vector3( 0, 0.05 * size, size * 0.95)
      ],
      this.scene,
      true
    );

    axisZ.color = new Color3(0, 0, 1);
    const zChar = makeTextPlane('Z', 'blue', size / 10);
    zChar.position = new Vector3(0, 0.05 * size, 0.9 * size);
  }
  
   public createGrid(): honeycomb.Grid<honeycomb.Hex> {
    //The math and properties for creating the hex grid.
    const gridSize = 1;
    const gridDimensions = 30;

    const defaultHexSettings: honeycomb.HexSettings = {
      dimensions: { xRadius: gridDimensions, yRadius: gridDimensions }, // these make for tiny hexes
      orientation: honeycomb.Orientation.FLAT, // flat top
      origin: { x: 0, y: 0 }, // the center of the hex
      offset: -1 // how rows or columns of hexes are placed relative to each other
    }

    const tile = honeycomb.defineHex(defaultHexSettings);

    return new honeycomb.Grid(tile, honeycomb.spiral({ start: [0, 0], radius:  gridSize}));
  }

  public createHexTileMesh(hex: honeycomb.Hex, scene: Scene){
    const shape = [ new Vector3(hex.corners[0].x, 0, hex.corners[0].y), new Vector3(hex.corners[1].x, 0, hex.corners[1].y), new Vector3(hex.corners[2].x, 0, hex.corners[2].y), new Vector3(hex.corners[3].x, 0, hex.corners[3].y), new Vector3(hex.corners[4].x, 0, hex.corners[4].y), new Vector3(hex.corners[5].x, 0, hex.corners[5].y) ];   
    
    return MeshBuilder.CreatePolygon("hex", {shape: shape, sideOrientation: Mesh.DOUBLESIDE }, scene, earcut.default);
  }

  public createHexTerrain(hexTileMesh: Mesh, hexTileMeshContainer: AssetContainer, hex: honeycomb.Hex): void {

      hexTileMeshContainer.meshes.splice(0);

      hexTileMesh.material = this.sphereMaterial;
      hexTileMeshContainer.meshes.push(hexTileMesh);
      
      const hexTile = hexTileMeshContainer.instantiateModelsToScene(name => hex.q.toString() + "-" + hex.r.toString() + "_" + name, false );
      
      const hexTileRoot = hexTile.rootNodes[0] as TransformNode;
      hexTileRoot.name = "hexTile" + hex.q + hex.r;
      hexTileRoot.position.x = hex.x;
      hexTileRoot.position.z = hex.y;
  
      const hexChildren = hexTileRoot.getDescendants();
      for (const hexChild of hexChildren) {
        hexChild.name = hexChild.name.slice(9);
      }
  }
}
