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
    
    // Anchor/Position
    anchorLeft?: string;
    anchorRight?: string;
    anchorTop?: string;
    anchorBottom?: string;
    
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
  };
} 