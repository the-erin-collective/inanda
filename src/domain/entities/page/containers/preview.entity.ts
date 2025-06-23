import { ContainerNode } from '../container.entity.interface';
import { ContentNode } from '../content.entity.interface';

export class PreviewNode implements ContainerNode {
  type: string;
  children: ContentNode[];
  
  constructor(children: ContentNode[] = []) {
    this.type = 'preview';
    this.children = children;
  }
  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      children: this.children?.map(child => child?.toJSON?.() ?? child) ?? [],
    };
  }
}