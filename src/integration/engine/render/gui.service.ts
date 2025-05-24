import { Injectable } from '@angular/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control } from '@babylonjs/gui';
import { Scene, Mesh } from '@babylonjs/core';
import { ElementNode } from 'src/domain/entities/page/element.entity.interface';
import { RootNode } from 'src/domain/entities/page/root.entity';
import { ContentNode } from 'src/domain/entities/page/content.entity.interface';
import { CoreNode } from 'src/domain/entities/page/containers/core.entity';
import { EmbeddableContainerNode } from 'src/domain/entities/page/content/embeddable-container.entity';
import { TextNode } from 'src/domain/entities/page/content/items/text.entity';
import { StyleService } from 'src/domain/services/style.service';

@Injectable({ providedIn: 'root' })
export class GuiService {
  private guiTexture: AdvancedDynamicTexture;

  constructor(private styleService: StyleService) {}

  initializeGui(scene: Scene): void {
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
  }

  attachGuiToMesh(mesh: Mesh, guiElement: Control): void {
    console.log(`Attaching GUI to mesh: ${mesh.name}`, guiElement);
    const advancedTexture = AdvancedDynamicTexture.CreateForMesh(
      mesh,
      1024, // width
      1024, // height
      true // generateMipMaps
    );
    
    // Set appropriate scaling - found a better value after testing
    advancedTexture.rootContainer.scaleX = 0.8;
    advancedTexture.rootContainer.scaleY = 0.8;
    
    // Preserve the existing mesh metadata
    if (mesh.metadata) {
      console.log(`Preserving mesh metadata for ${mesh.name}:`, mesh.metadata);
    }
    
    advancedTexture.addControl(guiElement);
    
    // Debug the full hierarchy
    this.logControlHierarchy(guiElement);
  }

  async createGuiFromJson(node: ElementNode): Promise<Control | null> {
    if (!node || !node.type) {
      console.warn('Invalid element node:', node);
      return null;
    }

    console.log(`Creating GUI from node type: ${node.type}`);

    // Special handling for RootNode which has a specific structure
    if (node.type === 'root') {
      const rootContainer = await this.createRootContainer(node as RootNode);
      // Store the page ID in the root container's metadata
      if ('id' in node) {
        rootContainer.metadata = {
          pageId: (node as any).id
        };
        console.log(`Stored page ID ${(node as any).id} in root container metadata`);
      }
      return rootContainer;
    }

    // Handle other node types
    switch (node.type) {
      case 'container':
      case 'panel':
      case 'core':
        return this.createContainer(node);
      case 'h1':
      case 'p':
        return this.createTextBlock(node, node.type === 'h1' ? 32 : 20, node.type === 'h1' ? 'bold' : 'normal');
      default:
        console.warn(`Unsupported node type: ${node.type}`);
        return null;
    }
  }

  private async createRootContainer(rootNode: RootNode): Promise<Rectangle> {
    console.log('Creating root container');
    const rootContainer = new Rectangle('root');
    rootContainer.width = '100%';
    rootContainer.height = '100%';
    rootContainer.background = 'transparent';
    rootContainer.thickness = 0;
    
    rootContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    rootContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    // We ignore base and script nodes as per requirements
    // Only process core content (similar to HTML body)
    if (rootNode.core) {
      console.log('Processing core content');
      const coreContainer = await this.createContainer(rootNode.core);
      if (coreContainer) {
        rootContainer.addControl(coreContainer);
        console.log('Added core container to root');
      }
    }

    return rootContainer;
  }

  private async createContainer(node: ElementNode): Promise<Rectangle> {
    console.log(`Creating container for type: ${node.type}`);
    const rect = new Rectangle(node.type);
    
    // Apply styles if they exist
    if (node.styleIds && node.styleIds.length > 0) {
      const styles = await Promise.all(
        node.styleIds.map(styleId => this.styleService.loadStylesheet(styleId))
      );
      const flattenedStyles = styles.flat();
      this.styleService.applyStyles(rect, flattenedStyles);
    }
    
    // Handle children based on the node type
    let children: ContentNode[] | undefined;
    
    // Check the node type and cast accordingly
    if (node.type === 'core' && node instanceof CoreNode) {
      children = node.children;
      console.log('Core node children count:', children?.length || 0);
    } else if (node.type === 'container' && node instanceof EmbeddableContainerNode) {
      children = node.children;
      console.log('Container node children count:', children?.length || 0);
    } else if ('children' in node && Array.isArray((node as any).children)) {
      // Handle any node that has children property
      children = (node as any).children;
      console.log(`${node.type} node children count:`, children?.length || 0);
    }
    
    // Process children if they exist
    if (children && Array.isArray(children)) {
      // Create better layout system with more spacing
      let childTop = 10;
      for (const childNode of children) {
        // Check if childNode is an ElementNode before processing
        if (isElementNode(childNode)) {
          console.log(`Processing child of type: ${childNode.type}`);
          const childControl = await this.createGuiFromJson(childNode);
          if (childControl) {
            rect.addControl(childControl);
            console.log(`Added child control for ${childNode.type} to ${node.type}`);
            
            // Improve vertical spacing based on element type
            childControl.top = `${childTop}px`;
            
            // Different spacing for different element types
            if (childNode.type === 'h1') {
              childTop += 60; // More space after headers
            } else if (childNode.type === 'p') {
              childTop += 30; // Standard space after paragraphs
            } else {
              childTop += 40; // Default spacing
            }
          }
        } else {
          console.warn('Child is not an ElementNode:', childNode);
        }
      }
    } else {
      console.log(`No children found for ${node.type} node`);
    }

    return rect;
  }

  private async createTextBlock(node: ElementNode, fontSize: number, fontWeight: string): Promise<TextBlock> {
    console.log(`Creating text block for type: ${node.type}`);
    const textBlock = new TextBlock(node.type);
    
    // Apply styles if they exist
    if (node.styleIds && node.styleIds.length > 0) {
      const styles = await Promise.all(
        node.styleIds.map(styleId => this.styleService.loadStylesheet(styleId))
      );
      const flattenedStyles = styles.flat();
      this.styleService.applyStyles(textBlock, flattenedStyles);
    }
    
    // Set default text properties
    let content = '';
    
    // Check if this is a TextNode and get its content
    if (node instanceof TextNode && (node as TextNode).text) {
      content = (node as TextNode).text;
      console.log(`Text content: "${content}"`);
    } else {
      console.warn('No content found for text node:', node);
      content = node.type === 'h1' ? 'Header' : 'Text content';
    }
    
    textBlock.text = content;
    textBlock.color = 'white'; // Default to white text for visibility
    textBlock.fontSize = fontSize;
    textBlock.fontWeight = fontWeight;
    
    // Make text more visible
    textBlock.outlineWidth = 1;
    textBlock.outlineColor = "black";
    
    // Improved text layout
    textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    textBlock.resizeToFit = false; // Allow text to wrap
    textBlock.textWrapping = true;
    textBlock.width = "100%";
    
    return textBlock;
  }

  addGuiToScene(guiElement: Control): void {
    console.log('Adding GUI element to scene:', guiElement);
    this.guiTexture.addControl(guiElement);
  }
  
  // Helper function to log the control hierarchy
  private logControlHierarchy(control: Control, level: number = 0): void {
    const indent = '  '.repeat(level);
    console.log(`${indent}Control: ${control.name}, Type: ${control.constructor.name}`);
    
    // If this is a container, log its children
    if ('children' in control && Array.isArray((control as any).children)) {
      const children = (control as any).children;
      children.forEach((child: Control) => {
        this.logControlHierarchy(child, level + 1);
      });
    }
  }
}

// Helper function to check if a node is an ElementNode
function isElementNode(node: any): node is ElementNode {
  return node && typeof node === 'object' && 'type' in node;
}