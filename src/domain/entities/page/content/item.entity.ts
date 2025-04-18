import { ContentNode } from '../content.entity.interface';

export abstract class ItemNode  implements ContentNode {
  type: string;
  
  constructor(type: string) {
    this.type = type
  }

  abstract toJSON(): Record<string, unknown>;
}