import { ElementNode } from './../../element.entity';
import { ItemNode } from './../item.entity';

export abstract class ContainerNode extends ElementNode {
  constructor(public type: string, public children: ItemNode[] = []) {
    super(type);
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      children: this.children,
    };
  }
}