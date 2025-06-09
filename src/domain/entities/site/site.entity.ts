import { SiteBackdrop } from './backdrop.enum';
import { SitemapType } from './sitemap-type.enum';

export class Site {    constructor(
      public id: string,
      public name: string,
      public description?: string,
      public pageOrder: string[] = [],
      public sitemapType: SitemapType = SitemapType.HEX_FLOWER,
      public defaultPage?: string,
      public backdrop?: string,
      public backgroundType?: 'solid' | 'gradient' | 'image' | 'material',
      public materialType?: string,
      public materialTextureUrl?: string,
      public borderType?: 'solid' | 'gradient' | 'material'
    ) {}
    static fromJSON(json: {
      id: string;
      name: string;
      description?: string;
      pageOrder?: string[];      sitemapType?: SitemapType;
      defaultPage?: string;
      backdrop?: string;
      backgroundType?: 'solid' | 'gradient' | 'image' | 'material';
      materialType?: string;
      materialTextureUrl?: string;
      borderType?: 'solid' | 'gradient' | 'material';
    }): Site {
      return new Site(
        json.id,
        json.name,
        json.description,
        json.pageOrder ?? [],
        json.sitemapType ?? SitemapType.HEX_FLOWER,
        json.defaultPage,
        json.backdrop,
        json.backgroundType,
        json.materialType,
        json.materialTextureUrl,
        json.borderType
      );
    }
  
    toJSON(): Record<string, unknown> {
      return {
        _id: this.id,
        name: this.name,
        description: this.description,
        pageOrder: this.pageOrder,
        sitemapType: this.sitemapType,
        defaultPage: this.defaultPage,
        backdrop: this.backdrop,
        backgroundType: this.backgroundType,
        materialType: this.materialType,
        materialTextureUrl: this.materialTextureUrl,
        borderType: this.borderType
      };
    }
  }