import { ElementNode } from '../element.entity';

export abstract class ItemNode extends ElementNode {
  constructor(type: string) {
    super(type);
  }
}