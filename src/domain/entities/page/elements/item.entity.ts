import { ElementNode } from '../element.entity';

export class ItemNode extends ElementNode {
  constructor(public text: string) {
    super('item');
  }

  static override fromJSON(json: any): ItemNode {
    console.debug('ItemNode.fromJSON called with', json);

    return new ItemNode(json.text || '');
  }
}