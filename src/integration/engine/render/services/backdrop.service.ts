import { Injectable } from '@angular/core';
import { Scene, Color4 } from '@babylonjs/core';
import { SiteBackdrop } from 'src/domain/entities/site/backdrop.enum';
import { createSpaceBackdrop } from '../backdrops/space.backdrop';
import { createPaintBackdrop } from '../backdrops/paint.backdrop';

@Injectable({
  providedIn: 'root'
})
export class BackdropService {
  private readonly DEFAULT_BACKDROP_COLOR = '#1a1a1a'; // Dark gray as default

  constructor() {}

  applyBackdrop(scene: Scene, backdropValue?: string): void {
    if (!backdropValue) {
      console.log('No backdrop value provided, using default');
      this.setBackgroundColor(scene, this.DEFAULT_BACKDROP_COLOR);
      return;
    }

    // Check if the backdrop value is a valid hex color
    if (this.isValidHexColor(backdropValue)) {
      console.log('Backdrop value is a valid hex color, applying background color');
      this.setBackgroundColor(scene, backdropValue);
      return;
    }

    if (Object.values(SiteBackdrop).includes(backdropValue as SiteBackdrop)) {
      console.log('Applying predefined backdrop:', backdropValue);
      this.applyPredefinedBackdrop(scene, backdropValue as SiteBackdrop);
      return;
    }

    // If no valid backdrop is found, use the default
    console.warn(`Invalid backdrop value: ${backdropValue}. Using default backdrop.`);
    this.setBackgroundColor(scene, this.DEFAULT_BACKDROP_COLOR);
  }

  private isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  private setBackgroundColor(scene: Scene, hexColor: string): void {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;
    
    scene.clearColor = new Color4(r, g, b, 1);
  }  
  
  private applyPredefinedBackdrop(scene: Scene, backdrop: SiteBackdrop): void {
    switch (backdrop) {
      case SiteBackdrop.SPACE:
        console.log('Applying SPACE backdrop');
        createSpaceBackdrop(scene);
        break;
      case SiteBackdrop.PAINT:
        console.log('Applying PAINT backdrop');
        createPaintBackdrop(scene);
        break;
      case SiteBackdrop.ABSTRACT:
        console.warn('Abstract backdrop not yet implemented');
        this.setBackgroundColor(scene, this.DEFAULT_BACKDROP_COLOR);
        break;
      default:
        console.warn(`No implementation found for backdrop: ${backdrop}`);
        this.setBackgroundColor(scene, this.DEFAULT_BACKDROP_COLOR);
    }
  }
}