import { Schema, model, models, Document } from 'mongoose';
import { ItemNode } from '../../../domain/entities/page/elements/item.entity';

export interface PageDocument extends Document {
  _id: string; // Explicitly define _id as a string
  title?: string;
  root: {
    base: { children?: ItemNode[] };
    core: { children?: ItemNode[] };
    script: { children?: ItemNode[] };
  };
  siteId: string;
}

const PageSchema = new Schema<PageDocument>({
  _id: { type: String, required: true }, // Explicitly define _id as a String
  title: { type: String },
  siteId: { type: String, required: true },
  root: {
    base: { children: { type: [Schema.Types.Mixed], default: [] } },
    core: { children: { type: [Schema.Types.Mixed], default: [] } },
    script: { children: { type: [Schema.Types.Mixed], default: [] } },
  },
});

console.log('Mongoose models:', models);

// Check if the model already exists before defining it
export const PageModel = models['Page'] || model<PageDocument>('Page', PageSchema);