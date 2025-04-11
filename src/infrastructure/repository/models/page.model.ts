import { Schema, model, Document } from 'mongoose';

export interface Page extends Document {
  path: string;
  title?: string;
  content: string; // Replace with a more precise structure if you have one
}

const PageSchema = new Schema<Page>({
  path: { type: String, required: true, unique: true },
  title: { type: String },
  content: { type: String, required: true }, // Ideally a structured type later
});

export const PageModel = model<Page>('Page', PageSchema);