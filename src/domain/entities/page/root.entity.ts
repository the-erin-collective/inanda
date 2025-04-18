import { ElementNode } from './element.entity.interface';
import { BaseNode } from './containers/base.entity';
import { CoreNode } from './containers/core.entity';
import { ScriptNode } from './containers/script.entity';
import { ContentNode } from './content.entity.interface';

export class RootNode implements ElementNode {
  type: string;
  
  constructor(
    public base: BaseNode,
    public core: CoreNode,
    public script: ScriptNode
  ) {
    this.type = 'root';
  }
  
  static fromJSON(root: { base: { children?: ContentNode[] }, core: { children?: ContentNode[] }, script: { children?: ContentNode[] } }): RootNode {
    const base = new BaseNode(root.base.children);
    const core = new CoreNode(root.core.children);
    const script = new ScriptNode(root.script.children);

    return new RootNode(base, core, script);
  }

  toJSON(): { base: { children?: ContentNode[] }, core: { children?: ContentNode[] }, script: { children?: ContentNode[]  }}{
    return {
      base: this.base.toJSON(),
      core: this.core.toJSON(),
      script: this.script.toJSON()
    };
  }
}