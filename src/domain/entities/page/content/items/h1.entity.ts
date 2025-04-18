import { ItemNode } from '../item.entity';

export class H1Node extends ItemNode {
  constructor(public text: string) {
    super('h1');
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      text: this.text,
    };
  }
}
