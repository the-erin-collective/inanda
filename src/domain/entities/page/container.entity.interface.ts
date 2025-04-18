import { ContentNode } from './content.entity.interface';
import { ElementNode } from './element.entity.interface';

export interface ContainerNode extends ElementNode  {
  type: string;
  children: ContentNode[];
  toJSON(): Record<string, unknown>;
}