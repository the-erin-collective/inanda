import { Injectable } from '@angular/core';
import { Scene, StandardMaterial, Texture, BaseTexture, Color3 } from '@babylonjs/core';
import { TextureService } from './texture.service';

export interface MaterialOptions {
  materialType?: string;                // Type of material (e.g., 'wood', 'metal', 'stone')
  materialTextureUrl?: string;          // Optional direct URL to texture (if not using materialType)
  normalMapUrl?: string;                // Optional direct URL to normal map
  ambientOcclusionMapUrl?: string;      // Optional direct URL to AO map
  specularMapUrl?: string;              // Optional direct URL to specular map
  bumpStrength?: number;                // Controls intensity of normal map effect (0.0-1.0, default: 0.8)
  aoStrength?: number;                  // Controls intensity of ambient occlusion shadows (0.0-1.0, default: 0.5)
  specularIntensity?: number;           // Controls overall shininess from specular map (0.0-1.0, default: 0.3)
  diffuseIntensity?: number;            // Controls intensity of the color map (0.0-2.0, default: 1.2)
  tintColor?: string;                   // Optional color to tint the material (#RRGGBB format)
  tintIntensity?: number;               // Controls how strongly the tint affects the material (0.0-1.0, default: 0.5)
}

@Injectable({ providedIn: 'root' })
export class MaterialService {
  // Map of material types to folder names
  private materialFolderMap: Record<string, string> = {
    'wood': 'light-wood-boards',
    'dark-wood': 'dark-wood',
    'metal': 'brushed-metal',
    'stone': 'granite',
    'concrete': 'concrete',
    'marble': 'marble',
    'default': 'light-wood-boards'  // Default if no material type is specified
  };
  
  constructor(private textureService: TextureService) {}
  
  /**
   * Converts a hexadecimal color string to a BabylonJS Color3 object
   * @param hex Hexadecimal color string (e.g., "#FF0000" or "FF0000" for red)
   * @returns BabylonJS Color3 object
   */  private hexToColor3(hex: string): Color3 {
    // Remove the # if present
    hex = hex.replace('#', '');
    
    // Parse the hex string to get the RGB components
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    return new Color3(r, g, b);
  }
  
  /**
   * Gets the folder name for a material type
   * @param materialType The material type string (e.g., 'wood', 'metal')
   * @returns The folder name for the material type
   */
  public getMaterialFolder(materialType?: string): string {
    if (!materialType) return this.materialFolderMap['default'];
    return this.materialFolderMap[materialType] || this.materialFolderMap['default'];
  }
  
  /**
   * Generates a full texture URL based on material type and map type
   * @param materialType The material type ('wood', 'metal', etc.)
   * @param mapType The map type ('ColorMap', 'NormalMap', etc.)
   * @param extension The file extension ('jpg', 'png')
   * @returns Full texture URL
   */
  private getTextureUrl(materialType: string | undefined, mapType: string, extension: string = 'jpg'): string {
    const folder = this.getMaterialFolder(materialType);
    return `/presentation/assets/textures/${folder}/${mapType}.${extension}`;
  }  async getMaterial(options: MaterialOptions, scene: Scene): Promise<StandardMaterial> {
    const { 
      materialType, 
      materialTextureUrl, // This can be provided directly or generated using materialType
      normalMapUrl,       // This can be provided directly or generated using materialType
      ambientOcclusionMapUrl,
      specularMapUrl,
      bumpStrength = 0.8,           // Normal map intensity
      aoStrength = 0.5,             // Ambient occlusion intensity
      specularIntensity = 0.3,      // Specular intensity
      diffuseIntensity = 1.2,       // Color map intensity
      tintColor,                    // Optional color tint
      tintIntensity = 0.5           // Tint strength
    } = options;
    
    // Generate texture URLs from materialType if not provided directly
    const diffuseUrl = materialTextureUrl || this.getTextureUrl(materialType, 'ColorMap', 'jpg');
    const normalUrl = normalMapUrl || this.getTextureUrl(materialType, 'NormalMap', 'png');
    const aoUrl = ambientOcclusionMapUrl || this.getTextureUrl(materialType, 'AmbientOcclusionMap', 'png');
    const specularUrl = specularMapUrl || this.getTextureUrl(materialType, 'SpecularMap', 'png');    // Create StandardMaterial
    const material = new StandardMaterial(materialType || 'defaultMaterial', scene);
    console.log(`[MaterialService] Creating StandardMaterial: ${material.name}`);
    
    // Configure material properties for better appearance
    material.specularPower = 32;
    material.specularColor = new Color3(specularIntensity, specularIntensity, specularIntensity); // Configurable specular
    material.alpha = 1;
    
    // Set diffuse color - white by default but can be tinted if tintColor is specified
    if (tintColor) {
      // Convert the hex color string to Color3
      const color = this.hexToColor3(tintColor);
      
      // Apply tint by blending white with the tint color based on tintIntensity
      // This ensures we're only tinting (darkening) rather than brightening
      const r = 1 - tintIntensity + (color.r * tintIntensity);
      const g = 1 - tintIntensity + (color.g * tintIntensity);
      const b = 1 - tintIntensity + (color.b * tintIntensity);
      
      material.diffuseColor = new Color3(r, g, b);
      console.log(`[MaterialService] Applied tint color: ${tintColor} with intensity ${tintIntensity}`);
    } else {
      material.diffuseColor = new Color3(1, 1, 1); // White (no tint)
    }
    
    material.emissiveColor = new Color3(0, 0, 0);
    material.backFaceCulling = false;
    material.useAlphaFromDiffuseTexture = false;
    
    // Slight roughness for natural materials
    material.roughness = 0.6;    // Load diffuse texture (ColorMap) if available
    if (diffuseUrl) {
      try {
        console.log(`[MaterialService] Loading diffuse texture (ColorMap): ${diffuseUrl}`);
        const texture = await this.textureService.getTexture(diffuseUrl, scene);
        
        // Apply the diffuse texture
        material.diffuseTexture = texture;
          if (material.diffuseTexture) {
          const diffuseTexture = material.diffuseTexture as Texture;
          diffuseTexture.hasAlpha = false;
          
          // Enhance texture visibility with customizable intensity
          diffuseTexture.level = diffuseIntensity; // Configurable contrast boost
          diffuseTexture.coordinatesIndex = 0;
          (diffuseTexture as Texture).uScale = 1;
          (diffuseTexture as Texture).vScale = 1;          // Load normal map if available - adds 3D-like detail to the surface
          if (normalUrl) {
            try {
              console.log(`[MaterialService] Loading normal map: ${normalUrl}`);
              const normalTexture = await this.textureService.getTexture(normalUrl, scene);
              
              // StandardMaterial uses bumpTexture for normal maps
              material.bumpTexture = normalTexture;
                if (material.bumpTexture) {
                // Configure normal map properties
                const bumpTexture = material.bumpTexture as Texture;
                bumpTexture.level = bumpStrength;
                (bumpTexture as Texture).uScale = (diffuseTexture as Texture).uScale;
                (bumpTexture as Texture).vScale = (diffuseTexture as Texture).vScale;
                material.invertNormalMapX = false;
                material.invertNormalMapY = false;
                console.log(`[MaterialService] Normal map applied to StandardMaterial with strength: ${bumpStrength}`);
              }
            } catch (e) {
              console.warn(`[MaterialService] Failed to load normal map: ${normalMapUrl}`, e);
            }
          }          // Load ambient occlusion map if available - adds shadowing in crevices
          if (aoUrl) {
            try {
              console.log(`[MaterialService] Loading ambient occlusion map: ${aoUrl}`);
              const aoTexture = await this.textureService.getTexture(aoUrl, scene);
              
              // Standard material uses ambientTexture
              material.ambientTexture = aoTexture;
                if (material.ambientTexture) {
                const ambientTexture = material.ambientTexture as Texture;
                (ambientTexture as Texture).uScale = (diffuseTexture as Texture).uScale;
                (ambientTexture as Texture).vScale = (diffuseTexture as Texture).vScale;
                // Set AO strength - higher values make shadows darker
                ambientTexture.level = aoStrength;
                console.log(`[MaterialService] Ambient occlusion map applied to StandardMaterial with strength: ${aoStrength}`);
              }
            } catch (e) {
              console.warn(`[MaterialService] Failed to load ambient occlusion map: ${ambientOcclusionMapUrl}`, e);
            }
          }          // Load specular map if available - controls shininess variation
          if (specularUrl) {
            try {
              console.log(`[MaterialService] Loading specular map: ${specularUrl}`);
              const specularTexture = await this.textureService.getTexture(specularUrl, scene);
              
              // Standard material uses specularTexture
              material.specularTexture = specularTexture;
                if (material.specularTexture) {
                const specTexture = material.specularTexture as Texture;
                (specTexture as Texture).uScale = (diffuseTexture as Texture).uScale;
                (specTexture as Texture).vScale = (diffuseTexture as Texture).vScale;
                console.log(`[MaterialService] Specular map applied for StandardMaterial`);
              }
            } catch (e) {
              console.warn(`[MaterialService] Failed to load specular map: ${specularMapUrl}`, e);
            }
          }          // Note: Displacement maps are no longer supported
          // We only use normal maps for surface detail
        }
      } catch (e) {
        console.warn(`[MaterialService] Using fallback material for: ${diffuseUrl}`);
      }
    }
    
    return material;
  }

    public getEmptyMaterial(scene: Scene): StandardMaterial {
      const material = new StandardMaterial('transparent_surface', scene);
      material.alpha = 0; // Make it fully transparent
      material.diffuseTexture = null; // Ensure no texture is applied
      return material;
    }
  
}
