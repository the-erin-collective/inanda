import { Stylesheet } from '../entities/style/stylesheet.entity';

export interface StylesheetRepository {
  getStylesheetById(id: string): Promise<Stylesheet | null>;
  // Add more methods as needed (e.g., save, delete)
}
