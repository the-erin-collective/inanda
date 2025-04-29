import { Injectable } from '@angular/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control } from '@babylonjs/gui';
import { Scene, Mesh } from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class GuiService {
  private guiTexture: AdvancedDynamicTexture;

  constructor() {}

  initializeGui(scene: Scene): void {
    // Create a full-screen GUI texture
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
  }

  createTextLabel(text: string, width: string, height: string, color: string, background: string): Rectangle {
    // Create a container for the text
    const rect = new Rectangle();
    rect.width = width; // e.g., "150px"
    rect.height = height; // e.g., "50px"
    rect.background = background; // e.g., "black"
    rect.color = color; // e.g., "white"
    rect.thickness = 2;
    rect.cornerRadius = 10;

    // Create a text block
    const textBlock = new TextBlock();
    textBlock.text = text;
    textBlock.color = color;
    textBlock.fontSize = 24;

    // Add the text block to the rectangle
    rect.addControl(textBlock);

    return rect;
  }

  attachGuiToMesh(mesh: Mesh, guiElement: Control): void {
    // Attach the GUI element to a 3D mesh
    const advancedTexture = AdvancedDynamicTexture.CreateForMesh(mesh);
    advancedTexture.addControl(guiElement);
  }

  createGuiFromJson(json: any): Control {
    // Map JSON object types to Babylon.js GUI controls
    switch (json.type) {
      case 'root':
        return this.createContainer(json, 'root');
      case 'core':
        return this.createContainer(json, 'core');
      case 'container':
        return this.createContainer(json, 'container');
      case 'panel':
        return this.createContainer(json, 'panel');
      case 'h1':
        return this.createTextBlock(json, 'h1', 32, 'bold');
      case 'p':
        return this.createTextBlock(json, 'p', 20, 'normal');
      default:
        console.warn(`Unsupported JSON type: ${json.type}`);
        return null;
    }
  }

  private createContainer(json: any, name: string): Rectangle {
    const rect = new Rectangle(name);
    rect.width = json.attributes?.width || '100%';
    rect.height = json.attributes?.height || '100%';
    rect.background = json.attributes?.background || 'transparent';
    rect.thickness = 0; // No border by default
    rect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    // Recursively add children
    if (json.children) {
      json.children.forEach((child: any) => {
        const childControl = this.createGuiFromJson(child);
        if (childControl) {
          rect.addControl(childControl);
        }
      });
    }

    return rect;
  }

  private createTextBlock(json: any, name: string, fontSize: number, fontWeight: string): TextBlock {
    const textBlock = new TextBlock(name);
    textBlock.text = json.content || '';
    textBlock.color = json.attributes?.color || 'black';
    textBlock.fontSize = fontSize;
    textBlock.fontWeight = fontWeight;
    textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    return textBlock;
  }

  addGuiToScene(guiElement: Control): void {
    // Add the GUI element to the full-screen GUI
    this.guiTexture.addControl(guiElement);
  }
}