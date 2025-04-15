export class Site {
    constructor(
      public id: string,
      public name: string,
      public description?: string,
      public pageOrder: string[] = []
    ) {}
  
    static fromJSON(json: {
      id: string;
      name: string;
      description?: string;
      pageOrder?: string[];
    }): Site {
      return new Site(
        json.id,
        json.name,
        json.description,
        json.pageOrder ?? []
      );
    }
  
    toJSON(): Record<string, unknown> {
      return {
        _id: this.id,
        name: this.name,
        description: this.description,
        pageOrder: this.pageOrder,
      };
    }
  }