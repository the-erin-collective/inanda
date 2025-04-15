import { ElementNode } from '../element.entity';
import { ItemNode } from './item.entity';

export abstract class ContainerNode extends ElementNode {
  constructor(type: string, public children: ItemNode[] = []) {
    super(type);
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      children: this.children.map(c => c.toJSON()),
    };
  }
}