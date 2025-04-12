import { ContainerNode } from '../container.entity';
import { ItemNode } from './../item.entity';

export class PanelNode extends ContainerNode {
  constructor(children: ItemNode[] = []) {
    super('panel', children);
  }

  static override fromJSON(json: { children?: ItemNode[] }): PanelNode {
    const children = (json.children || []).map((childJson) => {
      return ItemNode.fromJSON(childJson);
    });
    return new PanelNode(children);
  }
}