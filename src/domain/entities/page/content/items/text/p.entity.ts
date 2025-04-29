import { TextNode } from '../text.entity';

export class PNode extends TextNode {
  constructor(public override text: string) {
    super('p', text);
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      text: this.text,
    };
  }
}
