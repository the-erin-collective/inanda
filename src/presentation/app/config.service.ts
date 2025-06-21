import { Injectable } from '@angular/core';
import { environment } from '../../infrastructure/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: any;

  constructor() {
    this.config = environment;
  }

  get(key: string): any {
    return this.config[key];
  }
}