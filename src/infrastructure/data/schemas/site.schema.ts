import { Schema, model, models, Document } from 'mongoose';

export interface Site extends Document {
  _id: string; // Explicitly define _id as a string in the interface
  name: string;
  description?: string;
  pageOrder: string[]; // Array of page IDs
  sitemapType?: string;
  defaultPage?: string;
  backdrop?: string;
}

const SiteSchema = new Schema<Site>({
  _id: { type: String, required: true }, // Explicitly define _id as a String in the schema
  name: { type: String, required: true },
  description: { type: String },
  pageOrder: { type: [String], default: [] }, // Array of page IDs
  sitemapType: { type: String },
  defaultPage: { type: String },
  backdrop: { type: String }
});

// Check if the model already exists before defining it
export const SiteModel = models['Site'] || model<Site>('Site', SiteSchema);