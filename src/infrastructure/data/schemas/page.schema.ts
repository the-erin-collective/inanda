import { Schema, model, models, Document } from 'mongoose';
import { ContentNode } from '../../../domain/entities/page/content.entity.interface';

export interface PageDocument extends Document {
  _id: string; // Explicitly define _id as a string
  title?: string;
  root: {
    base: { children?: ContentNode[] };
    core: { children?: ContentNode[] };
    preview: { children?: ContentNode[] };
    script: { children?: ContentNode[] };
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
    preview: { children: { type: [Schema.Types.Mixed], default: [] } },
    script: { children: { type: [Schema.Types.Mixed], default: [] } },
  },
});

// Check if the model already exists before defining it
export const PageModel = models['Page'] || model<PageDocument>('Page', PageSchema);