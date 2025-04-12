import { Injectable } from '@angular/core';
import { Page } from './../../domain/entities/page/page.entity';

@Injectable({
  providedIn: 'root'
})
export class PageService {
  loadFromJson(json: unknown): Page {
    if (!this.isValidPageJson(json)) {
      throw new Error('Invalid Page JSON structure.');
    }

    return Page.fromJSON(json);
  }

  private isValidPageJson(json: unknown): json is Parameters<typeof Page.fromJSON>[0] {
    return typeof json === 'object' && json !== null &&
      'id' in json && 'title' in json && 'root' in json && 'siteId' in json;
  }
}