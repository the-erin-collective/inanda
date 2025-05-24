import { ContentNode } from './content.entity.interface';

export interface ElementNode {
  type: string;
  styleIds?: string[]; // References to styles that should be applied to this element
  children?: ContentNode[];
  toJSON(): Record<string, unknown>;
}