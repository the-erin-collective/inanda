export interface ElementNode {
  type: string;
  toJSON(): Record<string, unknown>;
}