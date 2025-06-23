import { ContentNode } from '../../content.entity.interface';
import { Style } from '../../../style/style.entity';

export class StylesheetNode implements ContentNode {
  _id: string;
  type: string = 'stylesheet';
  styles: Style[];

  constructor(stylesheetId: string, styles: Style[]) {
    this._id = `stylesheet-${stylesheetId}`;
    this.styles = styles;
  }  toJSON(): Record<string, unknown> {
    return {
      _id: this._id ?? undefined,
      type: this.type,
      styles: this.styles ?? []
    };
  }
} 