import { Injectable } from '@angular/core';
import { Style } from '../entities/style/style.entity';
import { Stylesheet } from '../entities/style/stylesheet.entity';

@Injectable({
  providedIn: 'root'
})
export class StyleService {
  private stylesheetCache: Map<string, Stylesheet> = new Map();

  constructor() {}

  /**
   * Loads a stylesheet and all its imported stylesheets recursively
   */
  async loadStylesheet(stylesheetId: string): Promise<Style[]> {
    // Check cache first
    if (this.stylesheetCache.has(stylesheetId)) {
      return this.getStylesFromStylesheet(this.stylesheetCache.get(stylesheetId)!);
    }

    // TODO: Replace with actual API call to fetch stylesheet
    const stylesheet = await this.fetchStylesheet(stylesheetId);
    this.stylesheetCache.set(stylesheetId, stylesheet);

    // Load all imported stylesheets recursively
    const importedStyles: Style[] = [];
    for (const importedId of stylesheet.importedStylesheetIds) {
      const importedStylesheetStyles = await this.loadStylesheet(importedId);
      importedStyles.push(...importedStylesheetStyles);
    }

    // Combine imported styles with local styles
    return [...importedStyles, ...stylesheet.styles];
  }

  /**
   * Applies styles to a Babylon.js GUI control
   */
  applyStyles(control: any, styles: Style[]): void {
    for (const style of styles) {
      const props = style.properties;
      
      // Apply padding
      if (props.paddingLeft) control.paddingLeft = props.paddingLeft;
      if (props.paddingRight) control.paddingRight = props.paddingRight;
      if (props.paddingTop) control.paddingTop = props.paddingTop;
      if (props.paddingBottom) control.paddingBottom = props.paddingBottom;
      
      // Apply margin
      if (props.marginLeft) control.left = props.marginLeft;
      if (props.marginRight) control.right = props.marginRight;
      if (props.marginTop) control.top = props.marginTop;
      if (props.marginBottom) control.bottom = props.marginBottom;
      
      // Apply anchor/position
      if (props.anchorLeft) control.horizontalAlignment = props.anchorLeft;
      if (props.anchorRight) control.horizontalAlignment = props.anchorRight;
      if (props.anchorTop) control.verticalAlignment = props.anchorTop;
      if (props.anchorBottom) control.verticalAlignment = props.anchorBottom;
      
      // Apply dimensions
      if (props.height) control.height = props.height;
      if (props.width) control.width = props.width;
      
      // Apply font properties
      if (props.fontSize) control.fontSize = props.fontSize;
      if (props.fontWeight) control.fontWeight = props.fontWeight;
      if (props.fontFamily) control.fontFamily = props.fontFamily;
      
      // Apply colors
      if (props.foregroundColor) control.color = props.foregroundColor;
      if (props.backgroundColor) control.background = props.backgroundColor;
    }
  }

  private async fetchStylesheet(stylesheetId: string): Promise<Stylesheet> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  private getStylesFromStylesheet(stylesheet: Stylesheet): Style[] {
    return stylesheet.styles;
  }
} 