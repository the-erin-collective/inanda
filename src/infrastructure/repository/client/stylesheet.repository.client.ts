import { Injectable } from '@angular/core';
import { StylesheetRepository } from '../../../domain/repository/stylesheet.repository.interface';
import { Stylesheet } from '../../../domain/entities/style/stylesheet.entity';

@Injectable({ providedIn: 'root' })
export class ClientStylesheetRepository implements StylesheetRepository {
  // In-memory cache for client-side stylesheets
  private stylesheets = new Map<string, Stylesheet>();

  constructor() {
    // Pre-populate with some default stylesheets for client-side development
    this.addDefaultStylesheets();
  }

  async getStylesheetById(id: string): Promise<Stylesheet | null> {
    return this.stylesheets.get(id) || null;
  }

  private addDefaultStylesheets(): void {
    // Add a few default stylesheets for development
    const defaultStylesheet: Stylesheet = {
      _id: 'default-stylesheet',
      name: 'Default Stylesheet',
      styles: [
        {
          _id: "hex-base-style",
          name: "Hex Base Style",
          properties: {
            materialType: "material",
            materialName: "wood",
            alpha: 1.0,
          }
        },
        {
          _id: "panel-preview-1",
          name: "Preview Panel Style",
          properties: {
            width: "100%",
            height: "100%",
            backgroundColor: "#000000",
            alpha: 0.5,
          }
        },
        {
          _id: "h1-1",
          name: "H1 Style",
          properties: {
            foregroundColor: "white",
            fontSize: "60px",
            horizontalAlignment: "center",
            verticalAlignment: "center",
          }
        },
        {
          _id: "p-1",
          name: "P Style",
          properties: {
            foregroundColor: "white",
            fontSize: "30px",
            horizontalAlignment: "center",
            verticalAlignment: "center",
          }
        }
      ],
      importedStylesheetIds: [],
    };

    this.stylesheets.set('default-stylesheet', defaultStylesheet);
  }
}
