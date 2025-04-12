import { ElementNode } from './element.entity';
import { BaseNode } from './elements/containers/base.entity';
import { CoreNode } from './elements/containers/core.entity';
import { ScriptNode } from './elements/containers/script.entity';
import { ItemNode } from './elements/item.entity';

export class RootNode extends ElementNode {
  constructor(
    public base: BaseNode,
    public core: CoreNode,
    public script: ScriptNode
  ) {
    super('root');
  }

  override toJSON(): Record<string, unknown> {
    return {
      base: this.base.toJSON(),
      core: this.core.toJSON(),
      script: this.script.toJSON()
    };
  }

  static override fromJSON(json: { base: { children?: ItemNode[] }; core: { children?: ItemNode[] }; script: { children?: ItemNode[] } }): RootNode {
    const base = BaseNode.fromJSON(json.base);
    const core = CoreNode.fromJSON(json.core);
    const script = ScriptNode.fromJSON(json.script);
    return new RootNode(base, core, script);
  }
}