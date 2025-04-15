import { RootNode } from './root.entity';
import { ItemNode } from './elements/item.entity';

export class Page {
  constructor(
    public id: string,
    public title: string,
    public root: RootNode,
    public siteId: string
  ) {}

  static fromJSON(json: { id: string, title: string, root: { base: { children?: ItemNode[] }, core: { children?: ItemNode[] }, script: { children?: ItemNode[] } }, siteId: string }): Page {
    return new Page(
      json.id,
      json.title,
      RootNode.fromJSON(json.root),
      json.siteId
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      _id: this.id,
      title: this.title,
      root: this.root.toJSON(),
      siteId: this.siteId
    };
  }
}
