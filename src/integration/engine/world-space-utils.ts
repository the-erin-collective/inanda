// FILE: src/integration/engine/world-space-utils.ts
/*
 * WorldSpaceUtils: Utility for 2D <-> 3D coordinate conversion and world space manipulation
 *
 * This utility provides a facade for translating between user/UI (2D) coordinates and Babylon.js world (3D) coordinates.
 * It is designed to be used as a proxy by other engine components (page-layout, gui, backdrop, etc.) to ensure consistent
 * and flexible positioning logic, decoupled from Babylon.js coordinate quirks.
 *
 * Key Features:
 * - getSiteMapPlane(): Returns the axes and orientation of the sitemap plane in world space
 * - screenToWorld(x, y, screenWidth, screenHeight): Converts 2D UI coordinates to 3D world coordinates on the sitemap plane
 * - worldToScreen(x, y, z, camera, engine): Converts 3D world coordinates to 2D screen/UI coordinates
 * - translateLineTo3d(x1, y1, x2, y2, screenWidth, screenHeight): Converts a 2D line to a 3D line on the sitemap plane
 * - applyUserTranslation(mesh, dx, dy): Moves a mesh in world space as if dragging in 2D UI space, respecting mesh rotation
 *
 * The default mapping is:
 *   - User X (left/right) -> World X
 *   - User Y (top/bottom) -> World Z (since Y is up in Babylon.js)
 *   - The sitemap plane is the XZ plane (Y=0)
 *
 * This utility is stateless and can be used as a static class.
 */
import { Vector3, Mesh, Camera, Engine, Viewport, HemisphericLight, Scene, Color3 } from '@babylonjs/core';

export class WorldSpaceUtils {

  /** Returns settings for backdrop planes: width, height, and position */
  static getBackdropPlaneSettings() {
    return {
      width: 2000,
      height: 960,
      position: this.getBackdropPlanePosition()
    };
  }
  // --- CAMERA & LIGHT SETTINGS ---
  static readonly SITEMAP_POSITION = new Vector3(0, 200, 0);
  static readonly SITEMAP_TARGET = new Vector3(0, 0, 0);
  static readonly SITEMAP_ALPHA = 0;
  static readonly SITEMAP_BETA = 0.01;
  static readonly SITEMAP_RADIUS = 200;
  static readonly PAGE_RADIUS = 60;
  static readonly ANIMATION_DURATION = 1.5;

  /** Returns default camera settings for ArcRotateCamera */
  static getDefaultCameraSettings() {
    return {
      alpha: this.SITEMAP_ALPHA,
      beta: this.SITEMAP_BETA,
      radius: 100,
      target: this.SITEMAP_TARGET,
      position: new Vector3(0, 0, 0)
    };
  }
  /** Returns default light settings for HemisphericLight */
  static getDefaultLightSettings() {
    return {
      direction: new Vector3(-1, 1, 0),
      name: 'light1',
      intensity: 0.7,  // Reduced intensity for better texture visibility
      diffuse: new Color3(0.9, 0.9, 0.9), // Slight warm tint to enhance wood textures
      specular: new Color3(0.3, 0.3, 0.3)  // Reduced specular highlight
    };
  }

  static createDefaultLight(scene: Scene) {
    const lightSettings = this.getDefaultLightSettings();
    let light = new HemisphericLight(
      lightSettings.name,
      lightSettings.direction,
      scene
    );
    
    // Apply light properties for better texture visibility
    light.intensity = lightSettings.intensity;
    light.diffuse = lightSettings.diffuse;
    light.specular = lightSettings.specular;
    
    return light;
  }

  /** Returns sitemap camera settings (for overview) */
  static getSitemapCameraSettings() {
    return {
      position: this.SITEMAP_POSITION.clone(),
      target: this.SITEMAP_TARGET.clone(),
      alpha: this.SITEMAP_ALPHA,
      beta: this.SITEMAP_BETA,
      radius: this.SITEMAP_RADIUS
    };
  }

  /** Returns page view camera settings for a mesh */
  static getPageViewCameraSettings(mesh: Mesh) {
    return {
      position: new Vector3(mesh.position.x, mesh.position.y + 50, mesh.position.z),
      target: mesh.position.clone(),
      alpha: this.SITEMAP_ALPHA,
      beta: this.SITEMAP_BETA,
      radius: this.PAGE_RADIUS
    };
  }

  /** Returns animation duration for camera transitions */
  static getCameraAnimationDuration() {
    return this.ANIMATION_DURATION;
  }

  /** Returns the position for the backdrop plane (default: (0, -1000, 0)) */
  static getBackdropPlanePosition() {
    return new Vector3(0, -1000, 0);
  }

  /** Converts mouse pointer (screen) to normalized UV for backdrop (0-1 range) */
  static getMouseWakeUV(scene: any, pointerX: number, pointerY: number) {
    const width = scene.getEngine().getRenderWidth();
    const height = scene.getEngine().getRenderHeight();
    return {
      u: pointerX / width,
      v: pointerY / height
    };
  }
  /** Returns the rotation (in radians) for the grid container. Default is landscape (Y axis, 90deg). */
  static getGridContainerRotation(orientation: 'landscape' | 'portrait' = 'landscape'): Vector3 {
    // Y axis rotation: landscape = PI/2, portrait = 0
    return new Vector3(0, orientation === 'landscape' ? Math.PI / 2 : 0, 0);
  }

  /** Returns the offset vector for a grid layout cell, given its row/col and spacing. */
  static getGridLayoutOffset(row: number, col: number, gridSize: number, spacing: number): Vector3 {
    return new Vector3((col - gridSize / 2) * spacing, 0, (row - gridSize / 2) * spacing);
  }

  /** Returns the offset vector for a list layout cell, given its index and spacing. */
  static getListLayoutOffset(index: number, spacing: number): Vector3 {
    return new Vector3(0, 0, index * spacing);
  }
  /** Returns the axes and orientation of the sitemap plane in world space */
  static getSiteMapPlane() {
    // XZ plane, Y=0
    return { x: 'X', y: 'Z', plane: 'XZ', up: 'Y' };
  }

  /** Converts 2D UI coordinates to 3D world coordinates on the sitemap (XZ) plane */
  static screenToWorld(x: number, y: number, screenWidth: number, screenHeight: number, planeY = 0): Vector3 {
    // Map (0,0) top-left UI to (-w/2, planeY, -h/2) in world space
    // Map (screenWidth, screenHeight) bottom-right UI to (w/2, planeY, h/2)
    const worldX = x - screenWidth / 2;
    const worldZ = y - screenHeight / 2;
    return new Vector3(worldX, planeY, worldZ);
  }

  /** Converts 3D world coordinates to 2D screen/UI coordinates */
  static worldToScreen(x: number, y: number, z: number, camera: Camera, engine: Engine): { x: number, y: number } {
    // Babylon.js Vector3.Project expects: (vector, world, transform, viewport)
    const width = engine.getRenderWidth();
    const height = engine.getRenderHeight();
    // Use Babylon.js Viewport class
    const viewport = new Viewport(0, 0, width, height);
    const projected = Vector3.Project(
      new Vector3(x, y, z),
      camera.getWorldMatrix(),
      camera.getViewMatrix().multiply(camera.getProjectionMatrix()),
      viewport
    );
    return { x: projected.x, y: projected.y };
  }

  /** Converts a 2D UI line to a 3D line on the sitemap plane */
  static translateLineTo3d(
    x1: number, y1: number, x2: number, y2: number,
    screenWidth: number, screenHeight: number, planeY = 0
  ): [Vector3, Vector3] {
    return [
      this.screenToWorld(x1, y1, screenWidth, screenHeight, planeY),
      this.screenToWorld(x2, y2, screenWidth, screenHeight, planeY)
    ];
  }

  /** Applies a 2D UI translation to a mesh in world space, respecting mesh rotation */
  static applyUserTranslation(mesh: Mesh, dx: number, dy: number, screenWidth: number, screenHeight: number) {
    // Convert dx, dy from UI to world space deltas
    const deltaWorld = this.screenToWorld(dx, dy, screenWidth, screenHeight, 0);
    // Only use X and Z for translation (Y is up)
    mesh.position.x += deltaWorld.x;
    mesh.position.z += deltaWorld.z;
  }

  /**
   * Converts logical grid coordinates (e.g., hex or page layouts) to Babylon.js world coordinates.
   * This is a direct mapping but centralized for future flexibility (scaling, offset, etc).
   */
  static gridToWorld(x: number, y: number, yLevel = 0): Vector3 {
    return new Vector3(x, yLevel, y);
  }

  /**
   * Computes the world position for the grid container, allowing for centering, scaling, and offset.
   * By default, returns the world origin (0,0,0) for centered grids.
   * You can extend this to support custom centering, scaling, or offset as needed.
   */
  static gridContainerToWorld(options?: { center?: Vector3; offset?: Vector3; scale?: number }): Vector3 {
    // Default: center at world origin
    let pos = new Vector3(0, 0, 0);
    if (options?.center) {
      pos = pos.add(options.center);
    }
    if (options?.offset) {
      pos = pos.add(options.offset);
    }
    if (options?.scale) {
      pos = pos.scale(options.scale);
    }
    return pos;
  }

  /**
   * Converts a local offset (relative to a mesh) to world coordinates using the mesh's world matrix.
   */
  static localOffsetToWorld(mesh: Mesh, localOffset: Vector3): Vector3 {
    return Vector3.TransformCoordinates(localOffset, mesh.getWorldMatrix());
  }

  /**
   * Converts a UI or logical dimension (e.g., left/top/zOffset) to world units, with optional scaling.
   * This can be used for consistent dimension mapping in GUI/container placement.
   */
  static dimensionToWorld(value: string | number | undefined, parentResolvedDimension?: number, scale = 1): number {
    if (typeof value === 'number') return value * scale;
    if (typeof value === 'string') {
      if (value.endsWith('px')) {
        return (parseFloat(value.replace('px', '')) / 100) * scale;
      }
      if (value.endsWith('%')) {
        const percentage = parseFloat(value) / 100;
        return ((parentResolvedDimension !== undefined ? parentResolvedDimension : 10) * percentage) * scale;
      }
      const parsedFloat = parseFloat(value);
      return !isNaN(parsedFloat) ? parsedFloat * scale : (parentResolvedDimension !== undefined ? parentResolvedDimension : 10) * scale;
    }
    return (parentResolvedDimension !== undefined ? parentResolvedDimension : 10) * scale;
  }
}
