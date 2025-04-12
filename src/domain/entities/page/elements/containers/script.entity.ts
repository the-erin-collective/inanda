import { ContainerNode } from '../container.entity';
import { ItemNode } from './../item.entity';

export class ScriptNode extends ContainerNode {
  constructor(children: ItemNode[] = []) {
    super('script', children);
  }

  static override fromJSON(json: { children?: ItemNode[] }): ScriptNode {
    const children = (json.children || []).map((childJson) => {
      return ItemNode.fromJSON(childJson);
    });
    return new ScriptNode(children);
  }
}