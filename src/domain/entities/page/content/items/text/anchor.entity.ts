import { TextNode } from '../text.entity';

export class AnchorNode extends TextNode {
  constructor(
    public override text: string,
    public url: string,
    public target?: string,
    public _id?: string
  ) {
    super('anchor', text);
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      text: this.text,
      url: this.url,
      target: this.target,
      _id: this._id
    };
  }
}
