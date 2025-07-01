import { Injectable } from '@angular/core';
import { MeshStyleService } from '../render/services/mesh-style.service';

@Injectable({
  providedIn: 'root',
})
export class RenderProvidersModule {
  static forRoot() {
    return {
      ngModule: RenderProvidersModule,
      providers: [
        MeshStyleService
      ],
    };
  }
}
