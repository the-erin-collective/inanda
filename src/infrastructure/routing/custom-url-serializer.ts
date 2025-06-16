import { DefaultUrlSerializer, UrlTree } from '@angular/router';

export class CustomUrlSerializer extends DefaultUrlSerializer {
  override parse(url: string): UrlTree {
    // Redirect static asset paths to the root, preventing them from causing routing errors
    if (url.startsWith('/assets') || url.startsWith('/css') || url.startsWith('/js') || url.startsWith('/favicon.ico')) {
      return super.parse('/'); // Redirect to root
    }
    return super.parse(url);
  }

  override serialize(tree: UrlTree): string {
    return super.serialize(tree);
  }
} 