import { ContainerNode } from './container.entity';
import { ItemNode } from './item.entity';

export class PanelNode extends ContainerNode {
  constructor(public override children: ItemNode[] = []) {
    super('panel', children);
  }

  static override fromJSON(json: any): PanelNode {
    console.debug('PanelNode.fromJSON called with', json);

    return new PanelNode(
      (json.children || []).map((child: any) => ItemNode.fromJSON(child))
    );
  }
}