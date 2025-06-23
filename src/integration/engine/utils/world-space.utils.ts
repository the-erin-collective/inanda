export class WorldSpaceUtils {
    /**
     * Converts a dimension string (e.g., '10px', '50%') to a world space value
     * @param dimension The dimension to convert (e.g., '10px', '50%')
     * @param parentDimension The parent dimension for percentage calculations
     * @returns The converted world space value
     */    static dimensionToWorld(dimension: string | number | undefined, parentDimension: number = 0): number {
        if (dimension === undefined) return 0;

        // If it's already a number, just apply the scaling factor
        if (typeof dimension === 'number') {
            return dimension * 0.01; // Scale factor for world space
        }

        // Handle string values
        const cleanDimension = dimension.trim();

        // Handle percentages
        if (cleanDimension.endsWith('%')) {
            const percentage = parseFloat(cleanDimension) / 100;
            return percentage * parentDimension;
        }

        // Handle pixel values
        if (cleanDimension.endsWith('px')) {
            return parseFloat(cleanDimension) * 0.01;
        }

        // Handle numbers without units (assume pixels)
        if (!isNaN(parseFloat(cleanDimension))) {
            return parseFloat(cleanDimension) * 0.01;
        }

        return 0;
    }
}
