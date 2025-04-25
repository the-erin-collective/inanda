import { EmbeddableContainerNode } from '../embeddable-container.entity';
import { ContentNode } from '../../content.entity.interface';

export class PanelNode implements EmbeddableContainerNode {
  type = 'panel';
  children: ContentNode[];

  constructor(children?: ContentNode[]) {
    this.children = children || [];
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      children: this.children,
    };
  }
}