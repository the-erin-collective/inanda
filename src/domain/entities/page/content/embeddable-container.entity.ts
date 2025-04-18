import { ContainerNode } from '../container.entity.interface';
import { ContentNode } from '../content.entity.interface';

export abstract class EmbeddableContainerNode implements ContainerNode, ContentNode {
  type: string;
  children: ContentNode[];

  constructor(children: ContentNode[] = []) {
    this.type = 'embeddable-container';
    this.children = children;
  }

  abstract toJSON(): Record<string, unknown>;
}