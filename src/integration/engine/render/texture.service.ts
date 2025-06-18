import { Injectable, Inject, Optional, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Scene, Texture, Constants } from '@babylonjs/core';
import { createRequestHandler } from '@angular/ssr';

@Injectable({ providedIn: 'root' })
export class TextureService {
  private textureCache = new Map<string, Texture>();
  private baseUrl: string = '';
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Optional() @Inject(createRequestHandler) private request: any
  ) {
    if (isPlatformServer(this.platformId)) {
      if (this.request) {
        // Extract base URL from request when available
        const protocol = this.request.protocol || 'http';
        const host = this.request.get('host') || 'localhost:4200';
        this.baseUrl = `${protocol}://${host}`;
      } else {
        // Fall back to default URL
        this.baseUrl = 'http://localhost:4200';
      }
      console.log(`[TextureService] Server-side rendering. Base URL set to: ${this.baseUrl}`);
    }
  }
  async getTexture(url: string, scene: Scene): Promise<Texture> {
    // Check if texture is already cached
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }

    // Prepare the full URL with appropriate base for SSR
    const fullUrl = this.getFullUrl(url);
    console.log(`[TextureService] Loading texture: ${fullUrl} (original: ${url})`);

    // If we're in server-side rendering, return a placeholder texture
    if (isPlatformServer(this.platformId)) {
      console.log(`[TextureService] Server-side rendering detected, using placeholder texture for: ${url}`);
      // Create a dummy texture that won't try to load
      const placeholderTexture = new Texture(null, scene);
      this.textureCache.set(url, placeholderTexture);
      return placeholderTexture;
    }

    return new Promise<Texture>((resolve, reject) => {     
      const texture = new Texture(fullUrl, scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        () => {
          console.log(`[TextureService] Successfully loaded texture: ${fullUrl}`);
          this.textureCache.set(url, texture);
          resolve(texture);
        },
        (message, exception) => {
          console.error(`[TextureService] Failed to load texture: ${fullUrl}`, message, exception);
          // Attempt to create a fallback texture
          this.createFallbackTexture(fullUrl, scene).then(fallbackTexture => {
            if (fallbackTexture) {
              this.textureCache.set(url, fallbackTexture);
              resolve(fallbackTexture);
            } else {
              reject(new Error(`Failed to load texture and create fallback: ${fullUrl}`));
            }
          }).catch(err => {
            console.error(`[TextureService] Fallback creation failed for: ${fullUrl}`, err);
            reject(err);
          });
        }
      );
    });
  }  
  
  private getFullUrl(url: string): string {
    // If URL is already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If we're in server-side rendering, prepend the base URL
    if (isPlatformServer(this.platformId) && this.baseUrl) {
      return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    // Otherwise, return the URL as is
    return url;
  }
  
  /**
   * Attempt to create a texture using alternative methods
   * This is used as a fallback when the standard Texture constructor fails
   */
  private async createFallbackTexture(url: string, scene: Scene): Promise<Texture | null> {
    console.log(`[TextureService] Attempting to create fallback texture for: ${url}`);
    
    try {
      // Try loading the image with fetch API first
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[TextureService] Fetch failed for texture: ${url}, status: ${response.status}`);
        return null;
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      console.log(`[TextureService] Created blob URL: ${blobUrl} for texture: ${url}`);
      
      // Create texture from blob URL
      return new Promise<Texture | null>((resolve) => {
        const texture = new Texture(blobUrl, scene, false, false, Texture.LINEAR_LINEAR, 
          () => {
            console.log(`[TextureService] Successfully created fallback texture from blob: ${url}`);
            // We don't release the blob URL here because the texture needs it
            resolve(texture);
          },
          () => {
            console.error(`[TextureService] Failed to create texture from blob: ${url}`);
            URL.revokeObjectURL(blobUrl);
            resolve(null);
          }
        );
      });
    } catch (error) {
      console.error(`[TextureService] Error in fallback texture creation: ${url}`, error);
      return null;
    }
  }
}
