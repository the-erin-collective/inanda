import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WindowMock } from '../mock/window.mock';

@Injectable({ providedIn: 'root' })
export class WindowRefService {
  private readonly windowObject: Window;
  private readonly isBrowser: boolean;

  public constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.windowObject = this.isBrowser ? window : new WindowMock() as unknown as Window;
  }

  public get window(): Window {
    return this.windowObject;
  }

  public get document(): Document {
    return this.isBrowser ? this.window.document : {} as Document;
  }

  public get localStore(): Storage {
    return this.isBrowser ? this.window.localStorage : {} as Storage;
  }

  public get sessionStorage(): Storage {
    return this.isBrowser ? this.window.sessionStorage : {} as Storage;
  }
}