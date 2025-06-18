import { ContainerNode } from '../container.entity.interface';
import { ContentNode } from '../content.entity.interface';

export class BaseNode implements ContainerNode {
  type: string;
  children: ContentNode[];
  styleIds?: string[];
  
  constructor(children: ContentNode[] = []) {
    this.type = 'base';
    this.children = children;
    this.styleIds = [];
  }

  toJSON(): { type: string; children: any[]; styleIds?: string[] } {
    return {
      type: this.type,
      children: this.children.map(child => {
        if (child && typeof child === 'object') {
          return child.toJSON ? child.toJSON() : child;
        }
        return child;
      }),
      styleIds: this.styleIds
    };
  }
}