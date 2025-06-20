import { ContentNode } from '../../content.entity.interface';

export class PanelNode implements ContentNode {
  type: string = 'panel';
  children: ContentNode[];

  constructor(children: ContentNode[] = [], public _id?: string) {
    this.children = children;
  }
  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      children: this.children?.map(child => child?.toJSON?.() ?? child) ?? [],
      _id: this._id ?? undefined
    };
  }
}