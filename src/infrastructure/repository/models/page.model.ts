import { Schema, model, Document } from 'mongoose';
import { ItemNode } from '../../../domain/entities/page/elements/item.entity';

export interface PageDocument extends Document {
  path: string;
  title?: string;
  root: {
    base: { children?: ItemNode[] };
    core: { children?: ItemNode[] };
    script: { children?: ItemNode[] };
  };
  siteId: string;
}

const PageSchema = new Schema<PageDocument>({
  path: { type: String, required: true, unique: true },
  title: { type: String },
  siteId: { type: String, required: true },
  root: {
    base: { children: { type: [Schema.Types.Mixed], default: [] } },
    core: { children: { type: [Schema.Types.Mixed], default: [] } },
    script: { children: { type: [Schema.Types.Mixed], default: [] } },
  },
});

export const PageModel = model<PageDocument>('Page', PageSchema);