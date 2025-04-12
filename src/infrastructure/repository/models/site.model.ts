import { Schema, model, Document } from 'mongoose';

export interface Site extends Document {
  name: string;
  description?: string;
  pageOrder: string[]; // Array of page IDs
}

const SiteSchema = new Schema<Site>({
  name: { type: String, required: true },
  description: { type: String },
  pageOrder: { type: [String], default: [] }, // Array of page IDs
});

export const SiteModel = model<Site>('Site', SiteSchema);