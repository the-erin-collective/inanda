import { TextNode } from '../text.entity';

export class H1Node extends TextNode {
  constructor(public override text: string, public _id?: string) {
    super('h1', text);
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      text: this.text,
      _id: this._id
    };
  }
}
