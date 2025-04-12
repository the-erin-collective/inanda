import { ContainerNode } from '../container.entity';
import { ItemNode } from './../item.entity';

export class CoreNode extends ContainerNode {
  constructor(children: ItemNode[] = []) {
    super('core', children);
  }

  static override fromJSON(json: { children?: ItemNode[] }): CoreNode {
    const children = (json.children || []).map((childJson) => {
      return ItemNode.fromJSON(childJson);
    });
    return new CoreNode(children);
  }
}