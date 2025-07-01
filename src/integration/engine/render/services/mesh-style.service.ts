import { Mesh } from '@babylonjs/core';
import { Style } from '../../../../domain/entities/style/style.entity';
import { WorldSpaceUtils } from '../../utils/world-space.utils';

export class MeshStyleService {
    public applyStyles(mesh: Mesh, styles: Style[]): void {
        // Merge all style properties, with later styles overriding earlier ones
        const computedStyle = this.computeEffectiveStyle(styles);
        
        // Apply position if specified
        if (computedStyle.left !== undefined || computedStyle.top !== undefined || computedStyle.zOffset !== undefined) {
            this.applyPosition(mesh, computedStyle);
        }
        
        // Apply scaling if width/height specified
        if (computedStyle.width !== undefined || computedStyle.height !== undefined) {
            this.applyScaling(mesh, computedStyle);
        }
        
        // Apply material properties if specified
        if (computedStyle.materialType || computedStyle.materialName) {
            this.applyMaterial(mesh, computedStyle);
        }
    }

    private computeEffectiveStyle(styles: Style[]): Style['properties'] {
        return styles.reduce((acc, style) => ({
            ...acc,
            ...style.properties
        }), {} as Style['properties']);
    }

    private applyPosition(mesh: Mesh, style: Style['properties']): void {
        if (style.left !== undefined) {
            mesh.position.x = WorldSpaceUtils.dimensionToWorld(style.left);
        }
        if (style.top !== undefined) {
            mesh.position.y = -WorldSpaceUtils.dimensionToWorld(style.top); // Inverted for Babylon.js
        }
        if (style.zOffset !== undefined) {
            mesh.position.z = WorldSpaceUtils.dimensionToWorld(String(style.zOffset));
        }
    }

    private applyScaling(mesh: Mesh, style: Style['properties']): void {
        if (style.width !== undefined) {
            mesh.scaling.x = WorldSpaceUtils.dimensionToWorld(style.width, 40);
        }
        if (style.height !== undefined) {
            mesh.scaling.y = WorldSpaceUtils.dimensionToWorld(style.height, 40);
        }
    }

    private applyMaterial(mesh: Mesh, style: Style['properties']): void {
        // Material application logic here - this would depend on your material system
    }
}
