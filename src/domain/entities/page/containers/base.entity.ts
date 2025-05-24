import { ContainerNode } from '../container.entity.interface';
import { ContentNode } from '../content.entity.interface';
import { ElementNode } from '../element.entity.interface';

export class BaseNode implements ContainerNode {
  type: string;
  children: ContentNode[];
  styleIds?: string[];
  
  constructor(children: ContentNode[] = []) {
    this.type = 'base';
    this.children = children;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      children: this.children,
      styleIds: this.styleIds
    };
  }
}