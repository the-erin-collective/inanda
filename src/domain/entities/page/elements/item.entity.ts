import { ElementNode } from '../element.entity';

export class ItemNode extends ElementNode {
  constructor(public text: string) {
    super('item');
  }

  static override fromJSON(_json: unknown): ItemNode {
    console.debug('ItemNode.fromJSON called with', _json);

    return new ItemNode(_json['text'] || '');
  }
}