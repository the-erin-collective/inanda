import { Injectable } from '@angular/core';
import { Style } from '../../../../domain/entities/style/style.entity';
import { Control, TextBlock, Rectangle, AdvancedDynamicTexture } from '@babylonjs/gui';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { DynamicTexture, Mesh, Scene } from '@babylonjs/core';
import { MeshBuilder, Vector3 } from '@babylonjs/core';
import { MaterialService } from './material.service';
import { SiteContent } from '../../../models/site-content.aggregate.model';
import { TextureService } from './texture.service';
import { GuiHelper } from './helpers/gui.helper';
import { text } from 'node:stream/consumers';

@Injectable({
  providedIn: 'root'
})
export class StyleService {
  /**
   * Map of pageId to array of styles for that page
   */
  public stylesheetMap: Map<string, Style[]> = new Map();
  private scene: Scene | null = null;
  private siteContent: SiteContent | null = null;

  /**
   * Global line height scale for text blocks (used in text height calculation)
   * Increase to 1.5 to prevent text clipping.
   */
  private textLineHeightScale: number = 1.2;
  private textHeightBuffer = 5;

  constructor(
    private materialService: MaterialService,
    private textureService: TextureService,
    private guiHelper: GuiHelper
  ) { }

  /**
   * Creates a hexagonal border mesh for a given mesh if not already present.
   * Only applies if sitemapType is HEX_FLOWER and style requests a border.
   * This method is now internal; use applyPreviewHoverBorder for context-aware application.
   */
  public applyHexBorderMesh(mesh: any, scene: Scene, borderColor: string = '#FFFFFF', borderWidth: number = 2): void {
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
      const x = positions[i], y = positions[i + 1], z = positions[i + 2];
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
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], v) <= 0) lower.pop();
      lower.push(v);
    }
    let upper: any[] = [];
    for (let i = topVerts.length - 1; i >= 0; i--) {
      let v = topVerts[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], v) <= 0) upper.pop();
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
   * Applies or removes the preview hover border for a mesh, depending on sitemapType and preview/core state.
   * @param mesh The mesh to apply/remove the border on
   * @param scene The BabylonJS scene
   * @param sitemapType The current sitemap type (e.g., 'HEX_FLOWER', 'GRID', etc.)
   * @param isPreview True if this is a preview panel, false for core/content
   * @param borderColor Optional border color
   * @param borderWidth Optional border width
   */
  public applyPreviewHoverBorder(mesh: any, scene: Scene, sitemapType: string, isPreview: boolean, borderColor: string = '#FFFFFF', borderWidth: number = 2): void {
    if (sitemapType === 'HEX_FLOWER' && isPreview) {
      this.applyHexBorderMesh(mesh, scene, borderColor, borderWidth);
    } else {
      this.removeHexBorder(mesh);
    }
  }
  /**
   * Helper to wrap a TextBlock in a Rectangle for background/border support.
   * Applies container styles to the Rectangle and text styles to the TextBlock.
   * Returns the Rectangle with the TextBlock as its child.
   */
  public wrapTextInRectangle(
    textBlock: TextBlock,
    containerStyles: Style[],
    textStyles: Style[],
    mesh?: any
  ): Rectangle {
    const rect = new Rectangle();
    // Set a meaningful name for debugging
    rect.name = (textBlock && textBlock.name) ? `rect-${textBlock.name}` : 'rect-unnamed';
    if (mesh) {
      (rect as any)._parentMesh = mesh;
    }

    // --- Ensure width is set from the most specific container style, not inherited ---
    // Find the most specific container style (last in array)
    const mostSpecificContainer = containerStyles.length > 0 ? containerStyles[containerStyles.length - 1] : undefined;
    let forcedWidth: string | undefined = undefined;
    if (mostSpecificContainer && mostSpecificContainer.properties && mostSpecificContainer.properties.width) {
      forcedWidth = mostSpecificContainer.properties.width;
    }
    // If width is set, apply it directly to the TextBlock and Rectangle before applying styles
    if (forcedWidth && typeof forcedWidth === 'string' && forcedWidth.endsWith('px')) {
      textBlock.width = forcedWidth;
      rect.width = forcedWidth;
    }

    this.applyStyles(rect, containerStyles);
    this.applyStyles(textBlock, textStyles);

    rect.addControl(textBlock);
    rect.isPointerBlocker = true;
    // Ensure the rectangle height and width are always pixel values and match the TextBlock
    let tbHeight = textBlock.height;
    let tbWidth = textBlock.width;
    // Always set Rectangle width/height to match TextBlock's width/height
    if (typeof tbWidth === 'string' && tbWidth.endsWith('px')) {
      rect.width = tbWidth;
    } else {
      console.error('[ERROR] TextBlock width is not a px string:', tbWidth);
      throw new Error('[ERROR] TextBlock width is not a px string: ' + tbWidth);
    }
    if (typeof tbHeight === 'string' && tbHeight.endsWith('px')) {
      rect.height = tbHeight;
    } else {
      console.error('[ERROR] TextBlock height is not a px string:', tbHeight);
      throw new Error('[ERROR] TextBlock height is not a px string: ' + tbHeight);
    }

    return rect;
  }

  /**
   * Utility to scale padding, margin, and fontSize from % to px based on texture size.
   * Modifies the input props object in-place.
   */
  public scaleSpacingProperties(props: any, textureWidth: number, textureHeight: number): void {
    const horizontalKeys = ['paddingLeft', 'paddingRight', 'marginLeft', 'marginRight', 'fontSize'];
    const verticalKeys = ['paddingTop', 'paddingBottom', 'marginTop', 'marginBottom'];
    for (const key of horizontalKeys) {
      if (typeof props[key] === 'string' && props[key].endsWith('%')) {
        props[key] = (parseFloat(props[key]) / 100 * textureWidth) + 'px';
      }
    }
    for (const key of verticalKeys) {
      if (typeof props[key] === 'string' && props[key].endsWith('%')) {
        props[key] = (parseFloat(props[key]) / 100 * textureHeight) + 'px';
      }
    }
    // fontSize can be % of textureHeight (for vertical scaling)
    if (typeof props['fontSize'] === 'string' && props['fontSize'].endsWith('%')) {
      props['fontSize'] = (parseFloat(props['fontSize']) / 100 * textureHeight) + 'px';
    }
  }

  /**
   * Set styles for a specific page by pageId
   */
  setStylesForPage(pageId: string, styles: Style[]): void {
    this.stylesheetMap.set(pageId, styles);
  }

  /**
   * Get styles for a specific pageId
   */
  getStylesForPage(pageId: string): Style[] {
    return this.stylesheetMap.get(pageId) || [];
  }

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
   * Merges a style chain into a single properties object.
   * @param styles The style chain, from root to leaf.
   * @returns A single object with all resolved style properties.
   */
  public getMergedProperties(styles: Style[]): any {
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
    this.resolveInheritedProperties(new Control(), mergedProps, styles);

    return mergedProps;
  }
  /**
   * Load styles from a page's embedded styles node
   */
  async loadStyles(styles: Style[]): Promise<Style[]> {
    // This method is now a passthrough, but could be extended for async style loading
    return styles;
  }

  /**
   * Applies styles to a Babylon.js GUI control, resolving 'inherit' by walking up the style chain.
   * The 'styles' array should be ordered from parent to child (lowest to highest specificity).
   */
  applyStyles(control: Control, styles: Style[]): void {
    // Merge all style properties, handling non-inherit values first
    const mergedProps: any = {};

    // First pass: collect non-inherit values (except for foregroundColor and padding)
    for (const style of styles) {
      if (!style.properties) continue;
      for (const key of Object.keys(style.properties)) {
        if (key === 'foregroundColor' || key.startsWith('padding')) continue; // Handle separately below
        const value = style.properties[key];
        if (value !== 'inherit') {
          mergedProps[key] = value;
        }
      }
    }

    // Special handling for foregroundColor using resolveInheritedProperties
    this.resolveInheritedProperties(control, mergedProps, styles);

    // Only apply padding from the most specific style (last in array)
    const mostSpecific = styles.length > 0 ? styles[styles.length - 1].properties || {} : {};
    for (const padKey of ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom']) {
      if (mostSpecific[padKey] !== undefined) {
        mergedProps[padKey] = mostSpecific[padKey];
      } else {
        delete mergedProps[padKey];
      }
    }

    // Apply background styles (will handle material backgrounds internally)
    this.applyBackgroundStyles(control, mergedProps);

    // Apply other styles
    this.applyBasicStyles(control, mergedProps);

    // Apply text styles if it's a TextBlock
    if (control instanceof TextBlock) {
      this.applyTextStyles(control, mergedProps);
    }

    // Apply border styles
    this.applyBorderStyles(control, mergedProps);

    // Apply container styles if it's a Rectangle
    if (control instanceof Rectangle) {
      this.applyContainerStyles(control, mergedProps);
    }

    // Apply other properties
    if (mergedProps.alpha !== undefined) {
      control.alpha = mergedProps.alpha;
    }

    control.markAsDirty();
  }

  private applyBasicStyles(control: Control, props: Style['properties']): void {
    // Scale spacing properties if needed (for controls created outside container.factory)
    // Assume texture size 1024x1024 for now; can be parameterized if needed
    this.scaleSpacingProperties(props, 1024, 1024);
    // Padding
    if (props.paddingLeft) control.paddingLeft = props.paddingLeft;
    if (props.paddingRight) control.paddingRight = props.paddingRight;
    if (props.paddingTop) control.paddingTop = props.paddingTop;
    if (props.paddingBottom) control.paddingBottom = props.paddingBottom;

    // Margin/Position - using left/top as these are the valid properties in BabylonJS
    if (props.marginLeft) control.left = props.marginLeft;
    if (props.marginTop) control.top = props.marginTop;

    // Dimensions (enforce string ending with 'px')
    if (props.width) {
      if (typeof props.width !== 'string' || !props.width.endsWith('px')) {
        throw new Error(`[ERROR] width style property must be a string ending with 'px'. Got: ${props.width}`);
      }
      control.width = props.width;
    }
    if (props.height) {
      if (typeof props.height !== 'string' || !props.height.endsWith('px')) {
        throw new Error(`[ERROR] height style property must be a string ending with 'px'. Got: ${props.height}`);
      }
      control.height = props.height;
    }

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
    }
  }

  private applyTextStyles(textBlock: TextBlock, props: Style['properties']): void {    // Text-specific properties
    // Apply foreground color - this should already be resolved by resolveInheritedProperties
    // but we add extra safeguards to ensure it's never 'inherit' at this point
    if (props.foregroundColor && props.foregroundColor !== 'inherit') {
      textBlock.color = props.foregroundColor;
    } else {
      // Use white as default
      textBlock.color = 'white';
    }

    if (props.fontSize) textBlock.fontSize = this.getNumberValue(props.fontSize);
    if (props.fontWeight) textBlock.fontWeight = props.fontWeight;
    if (props.fontFamily) textBlock.fontFamily = props.fontFamily;
    if (props.paddingBottom) textBlock.paddingBottom = props.paddingBottom;
    if (props.paddingTop) textBlock.paddingTop = props.paddingTop;
    if (props.paddingRight) textBlock.paddingRight = props.paddingRight;
    if (props.paddingLeft) textBlock.paddingLeft = props.paddingLeft;

    // Calculate height based on fontSize, line count, and padding
    const fontSize = this.getNumberValue(props.fontSize);
    // Use the width from the control itself if not specified in styles.
    // The control's width is set by the factory based on the parent container.
    const widthString = typeof textBlock.width === 'number' ? `${textBlock.width}px` : String(textBlock.width);
    const width = this.getNumberValue(props.width ||widthString);
    const paddingTop = this.getNumberValue(props.paddingTop);
    const paddingBottom = this.getNumberValue(props.paddingBottom);
    const lineHeight = fontSize;
    const textLength = textBlock.text.length;
    // Estimate chars per line: width / (fontSize * 0.6) (0.6 is a rough average char width in em)
    const avgCharsPerLine = Math.max(1, Math.floor(width / (fontSize * 0.6)));
    const estimatedLines = Math.max(1, Math.ceil(textLength / avgCharsPerLine));
    const totalHeight = (estimatedLines * lineHeight) + paddingTop + paddingBottom + this.textHeightBuffer;
    textBlock.height = Math.ceil(totalHeight * this.textLineHeightScale) + 'px';

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

  private getNumberValue(propertyValue:string): number{
    if (!propertyValue) return 0;
      // Remove 'px' and trim whitespace
      const cleaned = propertyValue.replace(/px\s*$/, '').trim();
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? 0 : num;
  }

  /**
   * Applies background styles to a Babylon.js GUI control based on backgroundType.
   * @param control The GUI control to apply styles to.
   * @param props The style properties.
   */
  private applyBackgroundStyles(control: Control, props: Style['properties']): void {
    const backgroundType = props.backgroundType || 'solid'; // Default to 'solid'

    // Check if site uses materials and force transparency for GUI controls
    if (this.siteContent?.site?.backgroundType === 'material' && control instanceof Rectangle) {
      if (control instanceof Rectangle) {
        control.background = "transparent";
        return; // Skip all other background application for Rectangle
      }

      return;
    }

    switch (backgroundType) {
      case 'solid':
        const solidColor = props.backgroundColor || '#222'; // Default to #222
        if (control instanceof Rectangle) {
          control.background = solidColor;
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

    if (control instanceof Rectangle) {
      switch (borderType) {
        case 'solid':
          const borderWidthNum = parseInt(props.borderWidth || '0');
          const borderColor = props.borderColor || 'transparent';
          if (borderWidthNum > 0) {
            control.thickness = borderWidthNum;
            control.color = borderColor;
          } else {
            control.thickness = 0;
            control.color = 'transparent';
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
      const x = positions[i], y = positions[i + 1], z = positions[i + 2];
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
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], v) <= 0) lower.pop();
      lower.push(v);
    }
    let upper: any[] = [];
    for (let i = topVerts.length - 1; i >= 0; i--) {
      let v = topVerts[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], v) <= 0) upper.pop();
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
   */
  removeHexBorder(mesh: any): void {
    if (!mesh) return;
    if (mesh._borderLine) {
      mesh._borderLine.dispose();
      mesh._borderLine = null;
    }
  }
  /**
 * Only applies to BabylonJS GUI Rectangle controls, not 3D meshes. For hex meshes, use applyHexBorder.
 */
  private applyContainerStyles(container: Rectangle, props: Style['properties']): void {
    // Container-specific properties like `fillSpace` are now handled in the ContainerFactory,
    // which has access to the camera for correct on-screen pixel calculations.
    // This method will apply other container-related styles if any are added in the future.

    // Store foregroundColor in metadata FOR DEBUGGING ONLY
    // Child controls should NEVER read this value - instead they should use their own
    // style chain to resolve inheritance
    container.metadata = container.metadata || {};
    container.metadata.styleMeta = container.metadata.styleMeta || {};

    if (props.foregroundColor) {
      // Store in nested metadata to make it super clear this is just for debugging
      container.metadata.styleMeta.foregroundColor = props.foregroundColor;
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
  /**
   * Returns the style chain for a node, from root to leaf, for a given pageId.
   * The chain includes DEFAULT styles first, then all PARENT styles in order, and finally the NODE's own styles.
   * @param pageId The page ID to look up styles for
   * @param node The node to resolve styles for
   */
  getStyleChain(pageId: string, node: any): Style[] {
    // Start with the default styles (always applied as base styles)
    const chain: Style[] = [...this.getDefaultStyles()];
    if (!node) return chain;
    const pageStyles = this.getStylesForPage(pageId);
    // Helper function to get styles for a single node
    const getStylesForNode = (n: any): Style[] => {
      const nodeStyles: Style[] = [];
      // First check styleIds array, which takes priority
      if (n.styleIds && Array.isArray(n.styleIds)) {
        for (const styleId of n.styleIds) {
          const style = pageStyles.find(s => s._id === styleId);
          if (style) nodeStyles.push(style);
        }
      }
      // Fallback to _id if styleIds is not present
      else if (n._id) {
        const style = pageStyles.find(s => s._id === n._id);
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

    return chain;
  }

  getHoverStyleChain(pageId: string, node: any, baseChain?: Style[]): Style[] {
    // Start with the normal style chain
    const chain = baseChain ?? this.getStyleChain(pageId, node);
    if (!node) return chain;
    const pageStyles = this.getStylesForPage(pageId);

    // Collect hover styles
    const hoverStyles: Style[] = [];

    // 1. If node has styleIds, look for any with a corresponding -hover style
    if (node.styleIds && Array.isArray(node.styleIds)) {
      for (const styleId of node.styleIds) {
        const hoverStyle = pageStyles.find(s => s._id === `${styleId}-hover`);
        if (hoverStyle) hoverStyles.push(hoverStyle);
      }
    }

    // 2. Fallback: look for a hover style with _id === `${node._id}-hover`
    if (node._id) {
      const hoverStyle = pageStyles.find(s => s._id === `${node._id}-hover`);
      if (hoverStyle) hoverStyles.push(hoverStyle);
    }

    // 3. Optionally: look for a generic type-based hover style (e.g., 'anchor-hover')
    if (node.type) {
      const typeHoverStyle = pageStyles.find(s => s._id === `${node.type}-hover`);
      if (typeHoverStyle) hoverStyles.push(typeHoverStyle);
    }

    // Append hover styles to the end of the chain (most specific)
    return [...chain, ...hoverStyles];
  }

  /**
   * Resolves 'inherit' values for specific properties by looking at parent element styles in the style chain.
   * This is called by applyStyles to ensure inherited values are properly resolved.
   * IMPORTANT: This method ONLY uses the style chain (JSON data), NEVER traverses the BabylonJS control hierarchy.
   */
  resolveInheritedProperties(control: Control, props: any, styleChain: Style[]): void {
    // Check if we need to handle foregroundColor inheritance specifically
    const needsColorResolution = !props.foregroundColor || props.foregroundColor === 'inherit';

    if (needsColorResolution) {
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
          break;
        }
      }

      // If we found a color, use it; otherwise, use default white
      if (resolvedColor) {
        props.foregroundColor = resolvedColor;
      } else {
        props.foregroundColor = 'white'; // Fallback default
      }
    }
  }
}