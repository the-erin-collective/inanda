import { Schema, model, models, Document } from 'mongoose';
import { Style } from '../../../domain/entities/style/style.entity';

export interface StylesheetDocument extends Document {
  _id: string;
  name: string;
  styles: Style[];
  importedStylesheetIds: string[];
}

const StylesheetSchema = new Schema<StylesheetDocument>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  styles: { type: [Schema.Types.Mixed], default: [] },
  importedStylesheetIds: { type: [String], default: [] },
});

// Debug logging
console.log('Mongoose models available:', typeof models, models ? Object.keys(models) : 'undefined');
console.log('Registering StylesheetModel');

// Check if models is defined before trying to access it
export const StylesheetModel = (typeof models !== 'undefined' && models['Stylesheet']) 
  ? models['Stylesheet'] 
  : model<StylesheetDocument>('Stylesheet', StylesheetSchema);
