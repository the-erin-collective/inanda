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

    return new Promise<Texture>((resolve, reject) => {      try {
        console.log(`[TextureService] Starting texture load process for: ${fullUrl}`);
        console.log(`[TextureService] Will check if texture exists at: ${fullUrl}`);
        
        // First try to preload the image to check if it's accessible
        const img = new Image();
        img.crossOrigin = "anonymous";  // Important for CORS handling
        
        img.onload = () => {
          console.log(`[TextureService] ✅ Image preload successful for: ${fullUrl}`);
          console.log(`[TextureService] Image dimensions: ${img.width}x${img.height}`);
          
          // Now create the actual BabylonJS texture
          const texture = new Texture(fullUrl, scene,
            false, // not noMipmap 
            false, // not invertY
            Texture.LINEAR_LINEAR, // sampling mode
            () => {
              console.log(`[TextureService] ✅ Successfully loaded texture: ${fullUrl}`);
              console.log(`[TextureService] Texture details: size=${texture.getSize()}, hasAlpha=${texture.hasAlpha}, isReady=${texture.isReady}`);
              this.textureCache.set(url, texture);
              resolve(texture);
            },
            (message, exception) => {
              console.error(`[TextureService] ❌ Failed to load texture: ${fullUrl}`, message, exception);
              console.log(`[TextureService] Trying fallback texture creation method...`);
              // Try creating a texture with engine.createTexture as a fallback
              this.createFallbackTexture(fullUrl, scene).then(fallbackTexture => {
                if (fallbackTexture) {
                  console.log(`[TextureService] ✅ Fallback texture creation successful`);
                  this.textureCache.set(url, fallbackTexture);
                  resolve(fallbackTexture);
                } else {
                  console.error(`[TextureService] ❌ All texture creation methods failed for: ${fullUrl}`);
                  reject(exception);
                }
              });
            }
          );
        };
          img.onerror = (e) => {
          console.error(`[TextureService] ❌ Image preload failed for: ${fullUrl}`, e);
          
          // Log network attempt
          console.log(`[TextureService] Attempting to fetch texture with network request to verify accessibility`);
          
          // Create a test fetch request to see the network error
          fetch(fullUrl)
            .then(response => {
              if (response.ok) {
                console.log(`[TextureService] ✅ Fetch successful for ${fullUrl}, status: ${response.status}, but Image loading still failed`);
              } else {
                console.error(`[TextureService] ❌ Fetch failed for ${fullUrl}, status: ${response.status}`);
              }
            })
            .catch(error => {
              console.error(`[TextureService] ❌ Fetch error for ${fullUrl}:`, error);
            });
          
          // Try fallback mechanism
          console.log(`[TextureService] Attempting fallback texture creation...`);
          this.createFallbackTexture(fullUrl, scene).then(texture => {
            if (texture) {
              console.log(`[TextureService] ✅ Fallback texture creation successful`);
              this.textureCache.set(url, texture);
              resolve(texture);
            } else {
              console.error(`[TextureService] ❌ All texture creation methods failed for: ${fullUrl}`);
              reject(new Error(`Failed to load texture: ${fullUrl}`));
            }
          });
        };
        
        // Start loading
        img.src = fullUrl;
      } catch (error) {
        console.error(`[TextureService] Error setting up texture loading: ${fullUrl}`, error);
        reject(error);
      }
    });
  }  private getFullUrl(url: string): string {
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
