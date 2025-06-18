import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WindowMock } from '../mock/window.mock';

@Injectable({ providedIn: 'root' })
export class WindowRefService {
  private readonly windowObject: Window | null;
  public readonly isBrowser: boolean;

  public constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.windowObject = this.isBrowser ? window : null;
  }

  public get window(): Window | null {
    return this.windowObject;
  }

  public get document(): Document | null {
    return this.isBrowser ? this.window?.document || null : null;
  }

  public get localStore(): Storage | null {
    return this.isBrowser ? this.window?.localStorage || null : null;
  }

  public get sessionStorage(): Storage | null {
    return this.isBrowser ? this.window?.sessionStorage || null : null;
  }
}