import { Injectable } from '@angular/core';
import { Style } from '../../../domain/entities/style/style.entity';

import { Control, TextBlock, Rectangle } from '@babylonjs/gui';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { DynamicTexture, Scene } from '@babylonjs/core';
import { MeshBuilder, Vector3 } from '@babylonjs/core';
import { MaterialService } from './material.service';
import { SiteContent } from '../../models/site-content.aggregate.model';
import { TextureService } from './texture.service';

@Injectable({
  providedIn: 'root'
})
export class StyleService {  private scene: Scene | null = null;
  private siteContent: SiteContent | null = null;

  constructor(
    private materialService: MaterialService,
    private textureService: TextureService
  ) {}

  /**
   * Set the current scene for texture operations
   */
  setScene(scene: Scene): void {
    this.scene = scene;
  }

  /**
   * Set the current site content for material-aware styling
   */
  setSiteContent(siteContent: SiteContent | null): void {
    this.siteContent = siteContent;
  }
  /**
   * Load styles from a page's embedded styles node
   */
  async loadStyles(styles: Style[]): Promise<Style[]> {
    return styles;
  }

  /**
   * Applies styles to a Babylon.js GUI control, resolving 'inherit' by walking up the style chain.
   * The 'styles' array should be ordered from parent to child (lowest to highest specificity).
   */  applyStyles(control: Control, styles: Style[]): void {
    // Log out the incoming styles to help with debugging
    console.log(`[DEBUG] ApplyStyles called for ${control instanceof TextBlock ? 'TextBlock' : 'Control'} with ${styles.length} styles`);
    styles.forEach((style, index) => {
      if (style.properties && style.properties.foregroundColor) {
        console.log(`[DEBUG] Style ${index}: ${style.name || style._id} has foregroundColor: ${style.properties.foregroundColor}`);
      }
    });
    
    // Merge all style properties, handling non-inherit values first
    const mergedProps: any = {};
    
    // First pass: collect non-inherit values (except for foregroundColor)
    // Process from least to most specific
    for (const style of styles) {
      if (!style.properties) continue;
      
      for (const key of Object.keys(style.properties)) {
        if (key === 'foregroundColor') continue; // Handle separately below
        
        const value = style.properties[key];
        if (value !== 'inherit') {
          mergedProps[key] = value;
        }
      }
    }
    
    // Special handling for foregroundColor using resolveInheritedProperties
    // This ensures we use the style chain for inheritance, not the BabylonJS controls
    this.resolveInheritedProperties(control, mergedProps, styles);// Apply styles based on control type and properties
    this.applyBasicStyles(control, mergedProps);
    
    // Apply background and border styles based on their types
    this.applyBackgroundStyles(control, mergedProps);
    this.applyBorderStyles(control, mergedProps);
      if (control instanceof TextBlock) {
      // For TextBlocks, we've already resolved inherited properties
      // Just apply the text styles with what we have
      this.applyTextStyles(control, mergedProps);
    }
    
    if (control instanceof Rectangle) {
      // Container styles are applied after background/border to ensure proper rendering order
      // For example, if background sets a texture, ensure container styles don't override it.
      // Also, border needs to be applied after background for correct visual stacking.
      // We already call applyContainerStyles, so let's ensure it works with the new types.
      this.applyContainerStyles(control, mergedProps);
    }
  }

  /**
   * Applies styles to a control with site context for material background handling
   */  async applyStylesWithSiteContext(control: Control, styles: Style[], siteContent?: SiteContent | null): Promise<void> {
    console.log(`Applying ${styles.length} styles to control: ${control.name}`);
    for (const style of styles) {
      await this.applyStyleWithSiteContext(control, style, siteContent);
    }
  }

  /**
   * Apply a single style to a control with site context
   */  private async applyStyleWithSiteContext(control: Control, style: Style, siteContent?: SiteContent | null): Promise<void> {
    if (!style.properties) return;

    const props = style.properties;
    console.log(`[DEBUG] applyStyleWithSiteContext - control: ${control.name}, style: ${style.name || 'Unnamed'}`);
    console.log(`[DEBUG] siteContent?.site?.backgroundType: ${siteContent?.site?.backgroundType}`);
    console.log(`[DEBUG] props.backgroundColor: ${props.backgroundColor}`);    // Handle material backgrounds when site has material background type
    if (siteContent?.site?.backgroundType === 'material') {
      console.log(`[DEBUG] *** SKIPPING BACKGROUND APPLICATION - Site uses materials for: ${control.name} ***`);
      // Don't apply any solid backgrounds when site uses materials
      // The mesh material provides the background
    } else {
      console.log(`[DEBUG] Site doesn't use materials, applying regular background styles for: ${control.name}`);
      // Apply regular background styles only when site doesn't use materials
      this.applyBackgroundStyles(control, props);
    }

    // Apply other styles (positioning, text, borders, etc.)
    this.applyOtherStyles(control, props);
  }

  /**
   * Apply material background with color tinting to a control
   */  private async applyMaterialBackgroundWithTint(control: Control, props: Style['properties'], siteContent: SiteContent): Promise<void> {
    if (!(control instanceof Rectangle)) {
      console.warn(`Material background with tint only supported for Rectangle controls, skipping for ${control.constructor.name}`);
      return;
    }

    console.log(`Applying material background with tint color: ${props.backgroundColor}`);
    
    // For GUI controls, we make them transparent so the material'd mesh shows through
    control.background = "transparent";
    
    // The actual material tinting should be applied to the mesh, not the GUI
    // This will be handled by the mesh creation process in PageLayoutService
    console.log(`Set GUI control to transparent, material mesh should show the tinted material underneath`);
  }  /**
   * Apply non-background styles to a control
   */
  private applyOtherStyles(control: Control, props: Style['properties']): void {
    // Apply text styles if it's a TextBlock
    if (control instanceof TextBlock) {
      this.applyTextStyles(control, props);
    }
    
    // Apply basic styles (positioning, etc.)
    this.applyBasicStyles(control, props);
    
    // Apply border styles
    this.applyBorderStyles(control, props);
    
    // Apply container styles if it's a Rectangle
    if (control instanceof Rectangle) {
      this.applyContainerStyles(control, props);
    }
    
    // Apply other properties
    if (props.alpha !== undefined) {
      control.alpha = props.alpha;
    }
  }

  private applyBasicStyles(control: Control, props: Style['properties']): void {
    // Padding
    if (props.paddingLeft) control.paddingLeft = props.paddingLeft;
    if (props.paddingRight) control.paddingRight = props.paddingRight;
    if (props.paddingTop) control.paddingTop = props.paddingTop;
    if (props.paddingBottom) control.paddingBottom = props.paddingBottom;
    
    // Margin/Position - using left/top as these are the valid properties in BabylonJS
    if (props.marginLeft) control.left = props.marginLeft;
    if (props.marginTop) control.top = props.marginTop;
    
    // Dimensions
    if (props.width) control.width = props.width;
    if (props.height) control.height = props.height;
    
    // Alignment
    if (props.horizontalAlignment) {
      switch (props.horizontalAlignment) {
        case 'left':
          control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          break;
        case 'center':
          control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          break;
        case 'right':
          control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          break;
      }
    }
    
    if (props.verticalAlignment) {
      switch (props.verticalAlignment) {
        case 'top':
          control.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          break;
        case 'center':
          control.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          break;
        case 'bottom':
          control.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          break;
      }
    }  }  private applyTextStyles(textBlock: TextBlock, props: Style['properties']): void {    // Text-specific properties
    // Apply foreground color - this should already be resolved by resolveInheritedProperties
    // but we add extra safeguards to ensure it's never 'inherit' at this point
    if (props.foregroundColor && props.foregroundColor !== 'inherit') {
      textBlock.color = props.foregroundColor;
      console.log(`[DEBUG] Setting text color to ${props.foregroundColor} for TextBlock ${textBlock.name || ''}`);
    } else {
      // Use white as default
      textBlock.color = 'white';
      console.log(`[DEBUG] Missing or inherit foregroundColor for TextBlock ${textBlock.name || ''}, using default white`);
    }
    
    if (props.fontSize) textBlock.fontSize = parseInt(props.fontSize);
    if (props.fontWeight) textBlock.fontWeight = props.fontWeight;
    if (props.fontFamily) textBlock.fontFamily = props.fontFamily;
    
    // First set horizontalAlignment to ensure the container aligns properly
    if (props.horizontalAlignment) {
      switch (props.horizontalAlignment) {
        case 'left':
          textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          break;
        case 'center':
          textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          break;
        case 'right':
          textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          break;
      }
    }
    
    // Now set textHorizontalAlignment with explicit property or inherit from horizontalAlignment
    if (props.textHorizontalAlignment) {
      switch (props.textHorizontalAlignment) {
        case 'left':
          textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          break;
        case 'center':
          textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          break;
        case 'right':
          textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          break;
      }
    } 
    // Important: Always ensure textHorizontalAlignment matches horizontalAlignment if not set
    else if (props.horizontalAlignment) {
      switch (props.horizontalAlignment) {
        case 'left':
          textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
          break;
        case 'center':
          textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
          break;
        case 'right':
          textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
          break;
      }
    }
    
    // First set verticalAlignment to ensure the container aligns properly
    if (props.verticalAlignment) {
      switch (props.verticalAlignment) {
        case 'top':
          textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          break;
        case 'center':
          textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          break;
        case 'bottom':
          textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          break;
      }
    }
    
    // Now handle textVerticalAlignment
    if (props.textVerticalAlignment) {
      switch (props.textVerticalAlignment) {
        case 'top':
          textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          break;
        case 'center':
          textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          break;
        case 'bottom':
          textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          break;
      }
    }
    // Important: Always ensure textVerticalAlignment matches verticalAlignment if not set
    else if (props.verticalAlignment) {
      switch (props.verticalAlignment) {
        case 'top':
          textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
          break;
        case 'center':
          textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
          break;
        case 'bottom':
          textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
          break;
      }
    }
  }

  /**
   * Applies background styles to a Babylon.js GUI control based on backgroundType.
   * @param control The GUI control to apply styles to.
   * @param props The style properties.
   */  private applyBackgroundStyles(control: Control, props: Style['properties']): void {
    const backgroundType = props.backgroundType || 'solid'; // Default to 'solid'
    console.log(`[DEBUG] applyBackgroundStyles called - control: ${control.name}, backgroundType: ${backgroundType}`);
    console.log(`[DEBUG] props.backgroundColor: ${props.backgroundColor}`);

    // Check if site uses materials and force transparency for GUI controls
    if (this.siteContent?.site?.backgroundType === 'material') {
      console.log(`[DEBUG] *** FORCING TRANSPARENT BACKGROUND - Site uses materials for: ${control.name} ***`);
      if (control instanceof Rectangle) {
        control.background = "transparent";
        console.log(`[DEBUG] Set Rectangle background to transparent due to material mode`);
        return; // Skip all other background application
      }
      if (control instanceof TextBlock) {
        // TextBlocks don't have a background property, but we can skip applying any background-related styles
        console.log(`[DEBUG] Skipping background application for TextBlock due to material mode`);
        return;
      }
    }

    switch (backgroundType) {
      case 'solid':
        const solidColor = props.backgroundColor || '#222'; // Default to #222
        if (control instanceof Rectangle) {
          control.background = solidColor;
          console.log(`[DEBUG] *** APPLIED SOLID BACKGROUND: ${solidColor} to ${control.name} ***`);
        }
        break;
      case 'gradient':
        // Default gradient: linear from #0f7fd8 (0) to #00896e (1)
        const gradientStops = props.gradientStops || [
          { color: '#0f7fd8', position: 0 },
          { color: '#00896e', position: 1 }
        ];
        // BabylonJS GUI does not directly support CSS-like linear gradients out of the box.
        // This would require custom shader or advanced dynamic texture manipulation.
        // For now, we will log a warning and fallback to solid background.
        console.warn(`  Gradient background is not directly supported by BabylonJS GUI Rectangle control. Falling back to solid color.`);
        if (control instanceof Rectangle) {
          control.background = gradientStops[0].color; // Use the first color as fallback
        }
        break;
      case 'image':
        const imageUrl = props.backgroundImageUrl || 'src/presentation/assets/images/image-background.txt';
        // Apply image background to Rectangle. This might require creating an Image control
        // and setting it as a background, or using AdvancedDynamicTexture.CreateForMesh
        // if this is a mesh-attached GUI.
        if (control instanceof Rectangle) {
          // In Babylon.js GUI, setting an image background for a Rectangle directly isn't straightforward.
          // A common approach is to create an Image control and add it as a child behind other elements.
          // and setting it as a background, or using AdvancedDynamicTexture.CreateForMesh
          // if this is a mesh-attached GUI.        if (control instanceof Rectangle) {
          // In Babylon.js GUI, setting an image background for a Rectangle directly isn't straightforward.
          // A common approach is to create an Image control and add it as a child behind other elements.
          // For simplicity, we'll log for now.
          console.warn(`  Image background is not directly supported by BabylonJS GUI Rectangle control. Falling back to solid color.`);
          control.background = 'transparent'; // Fallback to transparent
        } else {
          console.warn(`  Image background is only applicable to Rectangle controls. Skipping for ${control.name || 'unnamed control'}.`);
        }
        break;
      case 'material':
        // Material backgrounds are typically applied to 3D meshes, not 2D GUI controls.
        // This constraint needs to be enforced at a higher level (e.g., PageLayoutService).
        console.warn(`  Material background type is intended for 3D meshes and site-level application, not direct GUI controls. Skipping for ${control.constructor.name}.`);
        break;
      default:
        console.warn(`  Unknown background type: ${backgroundType}. Falling back to solid.`);
        if (control instanceof Rectangle) {
          control.background = props.backgroundColor || '#222';
        }
        break;
    }
  }

  /**
   * Applies border styles to a Babylon.js GUI control based on borderType.
   * @param control The GUI control to apply styles to.
   * @param props The style properties.
   */
  private applyBorderStyles(control: Control, props: Style['properties']): void {
    const borderType = props.borderType || 'solid'; // Default to 'solid'
    console.log(`Applying border style: ${borderType} to control: ${control.name}`);

    if (control instanceof Rectangle) {
      switch (borderType) {
        case 'solid':
          const borderWidthNum = parseInt(props.borderWidth || '0');
          const borderColor = props.borderColor || 'transparent';
          if (borderWidthNum > 0) {
            control.thickness = borderWidthNum;
            control.color = borderColor;
            console.log(`  Solid border: width=${borderWidthNum}, color=${borderColor}`);
          } else {
            control.thickness = 0;
            control.color = 'transparent';
            console.log(`  Solid border: thickness 0 or invalid, setting transparent.`);
          }
          break;
        case 'gradient':
          const gradientStops = props.gradientStops || [
            { color: '#0f7fd8', position: 0 },
            { color: '#00896e', position: 1 }
          ];
          console.warn(`  Gradient border is not directly supported by BabylonJS GUI Rectangle control. Falling back to solid border.`);
          control.thickness = parseInt(props.borderWidth || '0');
          control.color = gradientStops[0].color; // Use the first color as fallback
          break;
        case 'material':
          // Material borders are typically applied to 3D meshes, not 2D GUI controls.
          console.warn(`  Material border type is intended for 3D meshes and site-level application, not direct GUI controls. Skipping for ${control.constructor.name}.`);
          control.thickness = 0;
          control.color = 'transparent';
          break;
        default:
          console.warn(`  Unknown border type: ${borderType}. Falling back to solid.`);
          control.thickness = parseInt(props.borderWidth || '0');
          control.color = props.borderColor || 'transparent';
          break;
      }
    } else {
      console.warn(`Border styles are only applicable to Rectangle controls. Skipping for ${control.constructor.name}.`);
    }
  }

  /**
   * Applies a border to a BabylonJS mesh (e.g., a hexagon in the hex-flower theme) using a line mesh above the hex.
   * The border is constructed from the hex's edge vertices and rendered above the mesh.
   * Uses a 2D convex hull (X/Z plane) for robust perimeter extraction.
   * @param mesh The BabylonJS mesh to apply the border to
   * @param borderWidth The width of the border (used for line thickness)
   * @param borderColor The color of the border (outline) as a hex string (e.g., '#FFFFFF')
   */
  applyHexBorder(mesh: any, borderWidth: number, borderColor: string): void {
    if (!mesh) return;
    // Only create the border if it doesn't already exist with the same color/width
    if (mesh._borderLine && mesh._borderLine.metadata && mesh._borderLine.metadata.lastColor === borderColor && mesh._borderLine.metadata.lastWidth === borderWidth) {
      return;
    }
    // Remove any previous border line
    if (mesh._borderLine) {
      mesh._borderLine.dispose();
      mesh._borderLine = null;
    }
    // Extract all top face vertices (max Y for BabylonJS cylinders)
    const positions = mesh.getVerticesData && mesh.getVerticesData("position");
    if (!positions) return;
    let maxY = -Infinity;
    for (let i = 1; i < positions.length; i += 3) {
      if (positions[i] > maxY) maxY = positions[i];
    }
    const epsilon = 0.001;
    // Collect all vertices on the top face (Y ~= maxY)
    let topVerts: { x: number, y: number, z: number }[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i], y = positions[i+1], z = positions[i+2];
      if (Math.abs(y - maxY) < epsilon) {
        topVerts.push({ x, y, z });
      }
    }
    if (topVerts.length < 3) return; // Not enough points for a border
    // 2D Convex Hull (Andrew's monotone chain) on X/Z
    topVerts.sort((a, b) => a.x === b.x ? a.z - b.z : a.x - b.x);
    function cross(o: any, a: any, b: any) {
      return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    }
    let lower: any[] = [];
    for (let v of topVerts) {
      while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], v) <= 0) lower.pop();
      lower.push(v);
    }
    let upper: any[] = [];
    for (let i = topVerts.length - 1; i >= 0; i--) {
      let v = topVerts[i];
      while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], v) <= 0) upper.pop();
      upper.push(v);
    }
    // Remove last point of each (it's duplicated)
    upper.pop();
    lower.pop();
    const hull = lower.concat(upper);
    if (hull.length < 3) return;
    // Offset border above mesh to avoid z-fighting
    const yOffset = 0.01;
    const borderPoints = hull.map(p => new Vector3(p.x, p.y + yOffset, p.z));
    borderPoints.push(borderPoints[0]); // Close the loop
    // Create the border line mesh in local space, parent to mesh
    const borderLine = MeshBuilder.CreateLines(mesh.name + "_borderLine", { points: borderPoints, updatable: false }, mesh.getScene());
    borderLine.color = Color3.FromHexString(borderColor);
    borderLine.isPickable = false;
    borderLine.visibility = 1;
    borderLine.alwaysSelectAsActiveMesh = true;
    borderLine.metadata = borderLine.metadata || {};
    borderLine.metadata.lastColor = borderColor;
    borderLine.metadata.lastWidth = borderWidth;
    if (borderLine.enableEdgesRendering) {
      borderLine.enableEdgesRendering();
      borderLine.edgesWidth = borderWidth * 6;
      borderLine.edgesColor = Color3.FromHexString(borderColor).toColor4(1);
    }
    borderLine.parent = mesh;
    mesh._borderLine = borderLine;
  }

  /**
   * Removes the border line for a BabylonJS hex mesh.
   */  removeHexBorder(mesh: any): void {
    if (!mesh) return;
    if (mesh._borderLine) {
      mesh._borderLine.dispose();
      mesh._borderLine = null;
    }
  }
    /**
   * Only applies to BabylonJS GUI Rectangle controls, not 3D meshes. For hex meshes, use applyHexBorder.
   */  private applyContainerStyles(container: Rectangle, props: Style['properties']): void {
    // Container-specific properties
    if (props.fillSpace) {
      container.width = "120%";  // Special case for hex panels
      container.height = "120%";
    }
    
    // Store foregroundColor in metadata FOR DEBUGGING ONLY
    // Child controls should NEVER read this value - instead they should use their own
    // style chain to resolve inheritance
    container.metadata = container.metadata || {};
    container.metadata.styleMeta = container.metadata.styleMeta || {};
    
    if (props.foregroundColor) {
      // Store in nested metadata to make it super clear this is just for debugging
      container.metadata.styleMeta.foregroundColor = props.foregroundColor;
      console.log(`[DEBUG] Stored foregroundColor in container metadata: ${props.foregroundColor} (${container.name || ''}) - FOR REFERENCE ONLY`);
    }
    
    // Background color is now handled by applyBackgroundStyles
    // Border styles are now handled by applyBorderStyles

    if (props.borderStyle) {
      // Log if borderStyle is provided, though BabylonJS Rectangle doesn't directly use it like CSS.
      console.log(`Border style specified: ${props.borderStyle} for container ${container.name || 'undefined'} (Note: BabylonJS Rectangle does not directly support CSS-like border-style).`);
    }
  }
    private getDefaultStyles(): Style[] {
    return [
      {
        _id: 'default-style',
        name: 'Default Style',
        properties: {
          fontWeight: 'normal',
          fontFamily: 'Arial',
          foregroundColor: 'white',
          backgroundColor: 'transparent',
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingTop: '5px',
          paddingBottom: '5px'
        }
      }
    ];
  }
    /**
   * Returns the style chain for a node, from root to leaf, based on site data hierarchy.
   * This is the KEY method for resolving inheritance correctly.
   * The chain includes DEFAULT styles first, then all PARENT styles in order, 
   * and finally the NODE's own styles.
   */
  getStyleChain(node: any, styles: any[]): Style[] {
    // Start with the default styles (always applied as base styles)
    const chain: Style[] = [...this.getDefaultStyles()];
    
    if (!node) return chain;
    
    // Helper function to get styles for a single node
    const getStylesForNode = (n: any): Style[] => {
      const nodeStyles: Style[] = [];
      
      // First check styleIds array, which takes priority
      if (n.styleIds && Array.isArray(n.styleIds)) {
        for (const styleId of n.styleIds) {
          // Handle both Map and Array of styles
          const style = styles instanceof Map 
            ? styles.get(styleId)
            : styles.find(s => s._id === styleId);
            
          if (style) nodeStyles.push(style);
        }
      }
      // Fallback to _id if styleIds is not present
      else if (n._id) {
        const style = styles instanceof Map 
          ? styles.get(n._id) 
          : styles.find(s => s._id === n._id);
          
        if (style) nodeStyles.push(style);
      }
      
      return nodeStyles;
    };
    
    // Build the parent chain from root to this node
    const parentChain = [];
    let current: any = node.parent; // Start with the parent
    
    // Walk up the data tree to collect ancestor nodes
    while (current) {
      parentChain.unshift(current); // Add parents first-to-last
      current = current.parent;
    }
    
    // Add all parent styles in order from root to direct parent
    for (const parentNode of parentChain) {
      chain.push(...getStylesForNode(parentNode));
    }
    
    // Finally, add this node's own styles
    chain.push(...getStylesForNode(node));
    
    // Log the chain for debugging
    console.log(`[DEBUG] Style chain for ${node.type || 'node'} contains ${chain.length} styles`);
    
    return chain;
  }  /**
   * Apply hover styles without overriding material backgrounds
   * This method applies only border, text, and layout styles while preserving material backgrounds
   */
  applyHoverStyles(control: Control, styles: Style[]): void {
    // Merge all style properties, handling non-inherit values first
    const mergedProps: any = {};
    
    // Process from least to most specific for most properties
    for (const style of styles) {
      if (!style.properties) continue;
      
      for (const key of Object.keys(style.properties)) {
        if (key === 'foregroundColor') continue; // Handle separately below
        
        const value = style.properties[key];
        if (value !== 'inherit') {
          mergedProps[key] = value;
        }
      }
    }
    
    // Special handling for foregroundColor using resolveInheritedProperties
    // This ensures we use the style chain for inheritance, not the BabylonJS controls
    this.resolveInheritedProperties(control, mergedProps, styles);
    
    // Apply styles but skip background colors to preserve material
    this.applyBasicStyles(control, mergedProps);
    
    // Apply only border styles, skip background styles for material preservation    
    this.applyBorderStyles(control, mergedProps);
      if (control instanceof TextBlock) {
      // Apply text styles with the resolved properties
      this.applyTextStyles(control, mergedProps);
    }
      
    if (control instanceof Rectangle) {
      this.applyContainerStyles(control, mergedProps);
    }
      if (control instanceof Rectangle) {
      this.applyContainerStyles(control, mergedProps);
    }
  }  /**
   * Resolves 'inherit' values for specific properties by looking at parent element styles in the style chain.
   * This is called by applyStyles to ensure inherited values are properly resolved.
   * IMPORTANT: This method ONLY uses the style chain (JSON data), NEVER traverses the BabylonJS control hierarchy.
   */
  resolveInheritedProperties(control: Control, props: any, styleChain: Style[]): void {
    // Check if we need to handle foregroundColor inheritance specifically
    const needsColorResolution = !props.foregroundColor || props.foregroundColor === 'inherit';
    
    if (needsColorResolution) {
      // Log current style chain for debugging
      console.log(`[DEBUG] Resolving foregroundColor from style chain with ${styleChain.length} styles for ${control.name || 'unnamed'}`);
      
      // Clone the chain so we don't modify the original
      const workingChain = [...styleChain];
      
      // Add a default style at the beginning if needed
      if (!workingChain.some(s => s._id === 'default-style')) {
        workingChain.unshift(this.getDefaultStyles()[0]);
      }
      
      // Start from the most specific (highest index) and work backward for foregroundColor
      let resolvedColor = null;
      for (let i = workingChain.length - 1; i >= 0; i--) {
        const style = workingChain[i];
        if (style && style.properties && style.properties.foregroundColor && 
            style.properties.foregroundColor !== 'inherit') {
          resolvedColor = style.properties.foregroundColor;
          console.log(`[DEBUG] Found foregroundColor: ${resolvedColor} from style: ${style.name || style._id}`);
          break;
        }
      }
      
      // If we found a color, use it; otherwise, use default white
      if (resolvedColor) {
        props.foregroundColor = resolvedColor;
        console.log(`[DEBUG] Set foregroundColor to: ${resolvedColor} for ${control.name || ''}`);      } else {
        props.foregroundColor = 'white'; // Fallback default
        console.log(`[DEBUG] No foregroundColor found in chain, using default white for ${control.name || ''}`);
      }
    }
  }
}