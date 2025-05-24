import { Scene, Color4 } from '@babylonjs/core';

export function createSpaceBackdrop(scene: Scene): void {
    // For now, just set a black background
    scene.clearColor = new Color4(0, 0, 0, 1);
 
    // TODO: Add space backdrop implementation with stars, nebulas, etc.
    console.log('Space backdrop created (temporary implementation)');
} 