export abstract class ElementNode {
  constructor(public type: string) {}

  toJSON(): Record<string, unknown> {
    return { type: this.type };
  }

  static fromJSON(_json: unknown): ElementNode {
    console.debug('ElementNode.fromJSON called with', _json);
    throw new Error("fromJSON must be implemented by subclasses.");
  }
}