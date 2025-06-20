import { ItemNode } from '../item.entity';

export abstract class TextNode extends ItemNode {
  constructor(type: string, public text: string) {
    super(type);
  }

  override  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      text: this.text ?? '',
    };
  }
}