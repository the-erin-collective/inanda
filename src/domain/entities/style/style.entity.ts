export interface Style {
  _id: string;
  name: string;
  properties: {
    // Padding
    paddingLeft?: string;
    paddingRight?: string;
    paddingTop?: string;
    paddingBottom?: string;
    
    // Margin
    marginLeft?: string;
    marginRight?: string;
    marginTop?: string;
    marginBottom?: string;
    
    // Alignment
    horizontalAlignment?: 'left' | 'center' | 'right';
    verticalAlignment?: 'top' | 'center' | 'bottom';
    textHorizontalAlignment?: 'left' | 'center' | 'right';
    textVerticalAlignment?: 'top' | 'center' | 'bottom';
    
    // Dimensions
    height?: string;
    width?: string;
    
    // Font
    fontSize?: string;
    fontWeight?: string;
    fontFamily?: string;
    
    // Colors
    foregroundColor?: string;
    backgroundColor?: string;
    inheritedForegroundColor?: string;
    
    // Background type and properties
    backgroundType?: 'solid' | 'gradient' | 'image' | 'material';
    gradientStops?: Array<{ color: string; position: number; }>;
    backgroundImageUrl?: string;

    // Border
    borderWidth?: string;
    borderColor?: string;
    borderStyle?: string;
    
    // Border type and properties
    borderType?: 'solid' | 'gradient' | 'material' | 'none';
    // gradientStops is reused for border gradients

    // Material properties (for both background and border, when type is 'material')
    materialType?: string;
    materialName?: string;
    tintIntensity?: number; // For tinting the material with the background color

    // Alpha/Opacity
    alpha?: number;

    // Positioning for 3D controls
    left?: string;
    top?: string;
    zOffset?: number;

    // Special properties
    fillSpace?: boolean; // For panels that should fill their container
  };
}