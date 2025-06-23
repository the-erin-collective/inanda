export class DocumentMock {
  public readyState: DocumentReadyState = 'loading';

  createComment(text: string): any {
    return { nodeType: 8, textContent: text, remove: () => { /* no-op */ } };
  }

  querySelector(selector: string): any {
    // Angular looks for the root component selector
    if (selector === 'app-root') {
      return this.createElement('app-root');
    }
    return null;
  }

  createElement(tagName: string): any {
    const el: any = {
      tagName,
      innerHTML: '',
      children: [] as any[],
      childNodes: [] as any[],
      parentNode: null as any,
      firstChild: null as any,
      lastChild: null as any,
      setAttribute: (_: string, __: string) => {},
      appendChild: (child: any) => {
        el.children.push(child);
        el.childNodes.push(child);
        child.parentNode = el;
        el.firstChild = el.childNodes[0] || null;
        el.lastChild = child;
        return child;
      },
      insertBefore: (child: any, ref: any) => {
        const idx = el.childNodes.indexOf(ref);
        if (idx >= 0) el.childNodes.splice(idx, 0, child);
        else el.childNodes.push(child);
        child.parentNode = el;
        return child;
      },
      removeChild: (child: any) => {
        const idx = el.childNodes.indexOf(child);
        if (idx >= 0) {
          el.childNodes.splice(idx, 1);
          const cidx = el.children.indexOf(child);
          if (cidx >= 0) el.children.splice(cidx, 1);
        }
        return child;
      },
      remove: () => {
        if (el.parentNode) el.parentNode.removeChild(el);
      },
      replaceChild: (newChild: any, oldChild: any) => {
        const idx = el.childNodes.indexOf(oldChild);
        if (idx >= 0) {
          el.childNodes[idx] = newChild;
          newChild.parentNode = el;
          oldChild.parentNode = null;
        }
        return oldChild;
      },
      style: {},
      querySelector: (_: string) => el,
      querySelectorAll: (_: string) => [] as any[],
      getAttribute: (_: string) => null,
    };
    return el;
  }

  get head(): any {
    return this.createElement('head');
  }

  get body(): any {
    return this.createElement('body');
  }

  getElementById(id: string): any {
    return null;
  }

  getElementsByTagName(tag: string): any[] {
    // simplistic: return empty, or could search full tree
    return [];
  }

  createDocumentFragment(): any {
    const frag: any = {
      childNodes: [] as any[],
      appendChild: (child: any) => { frag.childNodes.push(child); return child; },
      removeChild: (child: any) => { const idx = frag.childNodes.indexOf(child); if (idx>=0) frag.childNodes.splice(idx,1); return child; },
    };
    return frag;
  }

  createElementNS(_ns: string, tagName: string): any {
    return this.createElement(tagName);
  }

  createTextNode(text: string): any {
    return { textContent: text, remove: () => { /* no-op */ } };
  }

  /**
   * Serialize the document to HTML string, used by Angular SSR
   */
  serialize(): string {
    // Basic serialization of head and body
    const headHtml = this.head.innerHTML || '';
    const bodyHtml = this.body.innerHTML || '';
    return `<!doctype html><html><head>${headHtml}</head><body>${bodyHtml}</body></html>`;
  }
}