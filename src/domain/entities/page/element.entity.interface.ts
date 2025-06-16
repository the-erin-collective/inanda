import { ContentNode } from './content.entity.interface';

export interface ElementNode {
  _id?: string;
  type: string;
  name?: string;
  styleIds?: string[]; // References to styles that should be applied to this element
  children?: ContentNode[];
  toJSON(): Record<string, unknown>;
}