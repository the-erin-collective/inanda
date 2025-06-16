import { ErrorHandler, Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  handleError(error: any): void {
    const context = isPlatformBrowser(this.platformId)
      ? 'BROWSER'
      : isPlatformServer(this.platformId)
      ? 'SERVER'
      : 'UNKNOWN';

    // Log error with context
    console.error(`[GlobalErrorHandler][${context}]`, error);

    // Optionally, send error to remote server or show user notification here
    // ...
  }
}
