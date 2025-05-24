import { Style } from './style.entity';

export interface Stylesheet {
  _id: string;
  name: string;
  styles: Style[];
  importedStylesheetIds: string[]; // References to other stylesheets
} 