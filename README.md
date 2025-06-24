# inanda

## Rendering json as a website in a 3d game engine 

**inanda** is an experimental project that renders web content in three-dimensional space using the Babylon.js 3D engine instead of traditional browser rendering.

This project implements a custom rendering approach where page content and styling are stored as JSON objects and rendered through a 3D engine. This approach enables web experiences with depth, lighting, and spatial positioning that aren't possible with standard HTML and CSS.

![inanda Screenshot](https://the-erin-collective.github.io/inanda/presentation/assets/images/Screenshot.jpg)

## Features

- **3D Materials & Lighting**: Content rendered with physically-based materials that respond to lighting
- **Shader Effects**: Apply custom shader effects to web content
- **Spatial Positioning**: Position elements anywhere in 3D space
- **WebXR Ready**: Foundation for VR/AR experiences
- **Visual Effects**: Advanced page transitions and 3D effects
- **Custom Expression**: Highly customizable visual presentation

## Design Considerations

This project takes a deliberate approach to web rendering with these considerations:

- Custom layout system designed specifically for 3D space
- JSON-based content structure for 3D positioning
- Performance optimizations for 3D rendering
- Different approach to content creation compared to HTML/CSS

The project aims to bring modern 3D capabilities to web experiences while providing a platform for creative expression similar to the customization options of early web platforms, but with modern rendering capabilities.

## Configuration

Web Home can be configured for different deployment scenarios using environment variables.

### Storage Options

Two main storage mechanisms are supported:

File storage mode writes data to JSON files, making it suitable for static site deployments without database dependencies.

#### 1. File Storage (Default)

```
PERSISTENT_STORAGE=FILE
DATA_PATH=presentation/assets/data/repository/sites
```

File storage mode writes data to JSON files, making it suitable for static site deployments without database dependencies.

#### 2. Database Storage 

```
PERSISTENT_STORAGE=DB
MONGO_URI=mongodb://localhost:27017/webhomedb
```

This configuration uses MongoDB for persistent storage and LevelDB for caching, ideal for multi-site deployments.

### Caching Configuration

LevelDB can be enabled or disabled for caching:

```
USE_LEVEL_DB=true  # Enable LevelDB caching (recommended for production)
USE_LEVEL_DB=false # Disable LevelDB caching (simpler deployment)
```

When disabled, the application uses in-memory caching, which is simpler but less performant for production use.

### Static Build Configuration

For a completely static build with no database dependencies:

```
PERSISTENT_STORAGE=FILE
USE_LEVEL_DB=false
```

This configuration is ideal for deploying a single site to static hosting platforms.

## Dependencies and Patches

The project includes several patches for dependencies to ensure compatibility:

- **classic-level**: Patched to work with Angular Universal SSR
- **mongoose**: Using version 5.13.x with security patches applied
  - Note: This older version is required for SSR compatibility
  - Security patches address known vulnerabilities in the base version

These patches are automatically applied during the `npm install` process via patch-package.

## Try It Out

### Quick Start

```bash
# Clone the repository
git clone https://github.com/the-erin-collective/inanda.git

# Install dependencies
npm install

# Start the development server
npm start
```

Then visit `http://localhost:4200` to explore the 3D web experience.

### Creating Content

Documentation for content creation is coming soon. For now, check out the example site data in `src/presentation/assets/data/repository/sites` to see how content is structured.

## Tech Stack

- **Frontend**: Angular 20
- **3D Engine**: Babylon.js 8.4
- **Data Storage**: MongoDB with LevelDB (optional)
- **Architecture**: Clean Architecture with domain-driven design

## Development Commands

```bash
# Start development server
npm start

# Build for development
npm run build

# Build for production
npm run build:prod

```

## Roadmap

Web Home is under active development with the following planned enhancements:

### Near-term Goals

- **Storage Modernization**: Replace MongoDB and caching packages with more modern alternatives when SSR-capable options become available
- **Content Types**: Add support for H2 headings, images, and anchor links (currently only H1 and paragraph elements are implemented)
- **Loading Experience**: Add a "splash screen" view while Babylon.js and site data initialize
- **More Site Layouts**: Add the grid and list sitemap types (currently only HEX_FLOWER is implemented)

### Medium-term Goals

- **Materials**: Expand material types beyond the current wood implementation
- **Backdrops**: Add more backdrop types beyond the current paint implementation
- **Content Positioning**: Improve the layout and positioning logic for more complex content arrangements
- **Performance**: Optimize rendering for improved performance on mobile devices
- **Documentation**: Document the content layout / styling to help with site content creation

### Long-term Vision

- **Editor**: Visual editor for creating and customizing 3D web experiences
- **Component Library**: Reusable 3D web components
- **Animation System**: Advanced animation capabilities for content and navigation
- **Full XR Support**: Comprehensive Virtual and Augmented Reality experiences
- **AI site design**: Add an interface for providing prompts to an llm and have it generate the site content

## License

This project is licensed under the AGPL-3.0 License - see the LICENSE file for details.

---

*Web Home: Web experiences with depth.*