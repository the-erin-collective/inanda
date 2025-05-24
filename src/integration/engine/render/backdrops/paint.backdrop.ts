import { Scene, Color4 } from '@babylonjs/core';

export function createPaintBackdrop(scene: Scene): void {
    // For now, just set a white background
    scene.clearColor = new Color4(1, 1, 1, 1);
 
    // TODO: Add paint backdrop implementation with brush strokes, splatters, etc.
    console.log('Paint backdrop created (temporary implementation)');
} 