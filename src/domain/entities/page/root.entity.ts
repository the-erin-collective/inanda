import { ElementNode } from './element.entity.interface';
import { BaseNode } from './containers/base.entity';
import { CoreNode } from './containers/core.entity';
import { ScriptNode } from './containers/script.entity';
import { ContentNode } from './content.entity.interface';
import { PreviewNode } from './containers/preview.entity';

export class RootNode implements ElementNode {
  type: string;
  
  constructor(
    public base: BaseNode,
    public core: CoreNode,
    public preview: PreviewNode,
    public script: ScriptNode
  ) {
    this.type = 'root';
  }
  
  static fromJSON(root: { base: { children?: ContentNode[] }, core: { children?: ContentNode[] }, preview: { children?: ContentNode[] }, script: { children?: ContentNode[] } }): RootNode {
    const base = new BaseNode(root.base.children);
    const core = new CoreNode(root.core.children);
    const script = new ScriptNode(root.script.children);
    const preview = new PreviewNode(root.preview.children);

    return new RootNode(base, core, preview, script);
  }

  toJSON(): { base: { children?: ContentNode[] }, core: { children?: ContentNode[] }, preview: { children?: ContentNode[] }, script: { children?: ContentNode[]  }}{
    return {
      base: this.base.toJSON(),
      core: this.core.toJSON(),
      preview: this.preview.toJSON(),
      script: this.script.toJSON()
    };
  }
}