import { EmbeddableContainerNode } from '../embeddable-container.entity';
import { ContentNode } from '../../content.entity.interface';
import { isContentNode } from '../../utils';

export class PanelNode implements EmbeddableContainerNode {
  type = 'panel';
  children: ContentNode[];

  constructor(children?: ContentNode[]) {
    this.children = (children || []).map((child) => {
      if (!isContentNode(child)) {
        throw new Error(`Invalid child passed to PanelNode: ${JSON.stringify(child)}`);
      }
      return child;
    });
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      children: this.children.map((child) => child.toJSON()),
    };
  }
}