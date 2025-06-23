import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FileFetchService {
  constructor(private http: HttpClient) {}

  async fetchText(path: string): Promise<string> {
    return this.http.get(path, { responseType: 'text' }).toPromise();
  }

  async fetchJson<T = any>(path: string): Promise<T> {
    return this.http.get<T>(path).toPromise();
  }
}
