import { ElementNode } from './element.entity.interface';

export interface ContentNode extends ElementNode {
  type: string;
  toJSON?(): Record<string, unknown>;
}