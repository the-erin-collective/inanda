import { ItemNode } from '../item.entity';

export class PNode extends ItemNode {
  constructor(public text: string) {
    super('h1');
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      text: this.text,
    };
  }

  static override fromJSON(json: { text: string }): PNode {
    return new PNode(json.text);
  }
}
