import { ElementNode } from '../element.entity';
import { ItemNode } from './item.entity';

export abstract class ContainerNode extends ElementNode {
  constructor(type: string, public children: ItemNode[] = []) {
    super(type);
  }

  static override fromJSON(_json: unknown): ContainerNode {
    console.debug('ContainerNode.fromJSON called with', _json);
    throw new Error('fromJSON must be implemented by subclasses of ContainerNode.');
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      children: this.children.map(c => c.toJSON()),
    };
  }
}