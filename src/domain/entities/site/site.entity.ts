export class Site {
    constructor(
      public id: string,
      public name: string,
      public description?: string,
      public pageOrder: string[] = [],
      public sitemapType: string = 'hex-flower',
      public defaultPage?: string
    ) {}
  
    static fromJSON(json: {
      id: string;
      name: string;
      description?: string;
      pageOrder?: string[];
      sitemapType?: string;
      defaultPage?: string;
    }): Site {
      return new Site(
        json.id,
        json.name,
        json.description,
        json.pageOrder ?? [],
        json.sitemapType ?? 'hex-flower',
        json.defaultPage
      );
    }
  
    toJSON(): Record<string, unknown> {
      return {
        _id: this.id,
        name: this.name,
        description: this.description,
        pageOrder: this.pageOrder,
        sitemapType: this.sitemapType,
        defaultPage: this.defaultPage
      };
    }
  }