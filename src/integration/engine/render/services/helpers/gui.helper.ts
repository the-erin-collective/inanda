import { Injectable } from '@angular/core';
import { AbstractMesh, Camera, Matrix, Mesh, Scene, Vector3 } from '@babylonjs/core';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
import { Control } from '@babylonjs/gui';

@Injectable({
  providedIn: 'root'
})
export class GuiHelper {
 // Helper method to refresh the GUI texture on a mesh
  public refreshGuiTexture(mesh: Mesh, meshMap: Map<string, { preview: Control; core: Control }>): void {
    if (!mesh) {
      console.warn('Cannot refresh GUI texture: no mesh provided');
      return;
    }

    console.log(`Refreshing GUI texture for mesh ${mesh.name}`);

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
      console.warn(`No layer found in metadata for mesh ${mesh.name}`);
      return;
    }

    // Get the control from our stored map
    const guiElements = meshMap.get(mesh.name);
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

  public getMeshScreenBounds(mesh: AbstractMesh, scene: Scene, camera: Camera): { width: number, height: number } {
    const engine = scene.getEngine();
    if (!engine) {
        console.error("Engine not available for screen bounds calculation.");
        return { width: 0, height: 0 };
    }

    const vertices = mesh.getBoundingInfo().boundingBox.vectorsWorld;
    const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const tempVector = new Vector3();

    for (const vertex of vertices) {
        // Project the 3D vertex to 2D screen coordinates
        Vector3.ProjectToRef(
            vertex,
            Matrix.IdentityReadOnly, // .vectorsWorld are already in world space
            scene.getTransformMatrix(),
            viewport,
            tempVector
        );

        minX = Math.min(minX, tempVector.x);
        maxX = Math.max(maxX, tempVector.x);
        minY = Math.min(minY, tempVector.y);
        maxY = Math.max(maxY, tempVector.y);
    }

    return { width: maxX - minX, height: maxY - minY };
  }

}
