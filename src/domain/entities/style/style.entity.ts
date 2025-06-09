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
    
    // Background type and properties
    backgroundType?: 'solid' | 'gradient' | 'image' | 'material';
    gradientStops?: Array<{ color: string; position: number; }>;
    backgroundImageUrl?: string;

    // Border
    borderWidth?: string;
    borderColor?: string;
    borderStyle?: string;
    
    // Border type and properties
    borderType?: 'solid' | 'gradient' | 'material';
    // gradientStops is reused for border gradients

    // Material properties (for both background and border, when type is 'material')
    materialType?: string;
    materialTextureUrl?: string;

    // Special properties
    fillSpace?: boolean; // For panels that should fill their container
  };
}