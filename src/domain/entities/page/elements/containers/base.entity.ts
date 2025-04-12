import { ContainerNode } from '../container.entity';
import { ItemNode } from './../item.entity';

export class BaseNode extends ContainerNode {
  constructor(children: ItemNode[] = []) {
    super('base', children);
  }

  static override fromJSON(json: { children?: ItemNode[] }): BaseNode {
    const children = (json.children || []).map((childJson) => {
      return ItemNode.fromJSON(childJson);
    });
    return new BaseNode(children);
  }
}