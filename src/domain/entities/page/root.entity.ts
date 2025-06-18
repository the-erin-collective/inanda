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
  
  static fromJSON(root: { 
    base: { children?: ContentNode[]; type?: string }, 
    core: { children?: ContentNode[]; type?: string }, 
    preview: { children?: ContentNode[]; type?: string }, 
    script: { children?: ContentNode[]; type?: string }, 
    type: string 
  }): RootNode {
    const base = new BaseNode(root.base.children);
    const core = new CoreNode(root.core.children);
    const script = new ScriptNode(root.script.children);
    const preview = new PreviewNode(root.preview.children);

    return new RootNode(base, core, preview, script);
  }

  toJSON(): Record<string, unknown> {
    const safeToJSON = (obj: any) => {
      if (obj && typeof obj === 'object') {
        return obj.toJSON ? obj.toJSON() : {
          type: obj.type,
          children: Array.isArray(obj.children) ? obj.children.map(safeToJSON) : obj.children,
          styleIds: obj.styleIds
        };
      }
      return obj;
    };

    return {
      base: safeToJSON(this.base),
      core: safeToJSON(this.core),
      preview: safeToJSON(this.preview),
      script: safeToJSON(this.script),
      type: this.type,
    };
  }
}