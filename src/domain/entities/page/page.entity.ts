import { RootNode } from './root.entity';
import { ContentNode } from './content.entity.interface';

export class Page {
  constructor(
    public id: string,
    public title: string,
    public root: RootNode,
    public siteId: string
  ) {}

  static fromJSON(json: {
    id: string;
    title: string;
    root: {
      base: { children?: ContentNode[] };
      core: { children?: ContentNode[] };
      preview: { children?: ContentNode[] };
      script: { children?: ContentNode[] };
    };
    siteId: string;
  }): Page {
    return new Page(
      json.id,
      json.title,
      RootNode.fromJSON(json.root),
      json.siteId
    );
  }

  toJSON(): {
    _id: string;
    title: string;
    root: {
      base: { children?: ContentNode[] };
      core: { children?: ContentNode[] };
      preview: { children?: ContentNode[] };
      script: { children?: ContentNode[] };
    };
    siteId: string;
  } {
    return {
      _id: this.id, 
      title: this.title,
      root: this.root.toJSON(),
      siteId: this.siteId,
    };
  }
}
