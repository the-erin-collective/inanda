# Product Requirements Document - Technical Specifications

*Last Updated: June 8, 2025*

## 🎮 Babylon.js Integration Specifications

### Engine Service Architecture
**Core Engine Service** (`src/integration/engine/engine.service.ts`)
- Manages Babylon.js engine lifecycle
- Handles canvas initialization and cleanup
- Provides abstraction layer for 3D operations
- Manages scene switching and transitions

### JSON Data Schema Specifications

#### Site Data Structure
```typescript
interface SiteData {
  _id: string;
  name: string;
  description: string;
  pageOrder: string[];
  sitemapType: 'HEX_FLOWER' | 'GRID' | 'LINEAR';
  defaultPage: string;
  backdrop: 'PAINT' | 'GRADIENT' | 'TEXTURE' | 'SKYBOX';
}
```

#### Page Data Structure
```typescript
interface PageData {
  _id: string;
  title: string;
  siteId: string;
  root: PageElement;
}

interface PageElement {
  type: 'root' | 'base' | 'core' | 'preview' | 'script';
  children: PageElement[];
  // Additional properties based on type
}
```

#### Layout Component Types
- **base**: Foundation layout elements (containers, grids)
- **core**: Content elements (text, images, interactive components)
- **preview**: Media elements (videos, 3D models, animations)
- **script**: Interactive/dynamic elements (mini-games, custom logic)

### Translation Engine Specifications

#### JSON-to-Babylon.js Pipeline
```
JSON Data → Parser → Layout Calculator → Mesh Generator → Scene Composer
```

**Translation Service** (`src/integration/engine/render/translation.service.ts`)
- Converts JSON page data to Babylon.js GUI and mesh components
- Handles layout calculations (positioning, sizing, spacing)
- Manages material assignment and visual styling
- Implements responsive behavior for different screen sizes

#### Component Mapping Rules
- **Text Elements** → Babylon.js GUI TextBlock with custom materials
- **Images** → Textured planes with proper aspect ratios
- **Containers** → 3D layout groups with transform hierarchies
- **Interactive Elements** → Meshes with action managers and triggers

---

## 🗺️ Navigation System Specifications

### Hexagonal Site Map (Hex-Flower Navigation)

#### Visual Layout
```
     [Page 2]
[Page 6] [Home] [Page 3]
     [Page 5] [Page 4]
         [Page 7]
```

#### 3D Implementation Requirements
- **Hexagon Meshes**: Each page represented as interactive 3D hexagon
- **Smooth Transitions**: Camera movements with easing between pages
- **Visual Feedback**: Hover states, selection indicators, loading states
- **Responsive Layout**: Adapts hex positioning for different screen sizes

#### Navigation Service (`src/integration/engine/navigation/navigation.service.ts`)
- Manages camera positioning and movement
- Handles page transitions and loading states
- Implements zoom-in/zoom-out between sitemap and page views
- Provides navigation history and deep linking

### Page-Level Navigation
- **Route Integration**: Angular routing tied to 3D navigation state
- **Deep Linking**: Direct URLs to specific pages maintain 3D context
- **Transition Effects**: Custom animations between page switches
- **Loading States**: 3D loading indicators while content renders

---

## 🎨 Rendering Engine Specifications

### Performance Requirements
- **Target FPS**: 60fps on modern devices, 30fps minimum on older hardware
- **Loading Times**: Initial scene < 3 seconds, page transitions < 1 second
- **Memory Usage**: Efficient cleanup of unused 3D resources
- **Responsive Design**: Smooth rendering across device sizes

### Visual Specifications

#### Material System
- **Text Rendering**: High-quality text with anti-aliasing
- **Image Display**: Proper texture filtering and mip-mapping
- **Background Effects**: Customizable backdrop systems (paint, gradients, skyboxes)
- **Animation Support**: Smooth property animations for interactive elements

#### Lighting and Camera
- **Default Lighting**: Balanced setup for readable content
- **Camera Controls**: Smooth navigation between overview and detail views
- **Depth Management**: Proper z-ordering for layered content
- **Mobile Optimization**: Touch-friendly camera controls

### Canvas Integration
- **Full-Screen Canvas**: Babylon.js renders entire page content
- **No DOM Content**: All visible elements rendered in 3D space
- **Event Handling**: 3D picking for user interactions
- **Accessibility**: Alternative text content for screen readers (hidden)

---

## 💾 Data Management Specifications

### MongoDB Schema Design

#### Sites Collection
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  pageOrder: string[],
  sitemapType: string,
  defaultPage: string,
  backdrop: string,
  createdAt: Date,
  updatedAt: Date,
  ownerId?: string  // For future multi-user support
}
```

#### Pages Collection
```typescript
{
  _id: ObjectId,
  title: string,
  siteId: ObjectId,
  root: {
    type: string,
    children: PageElement[],
    // Nested structure for page content
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Repository Pattern Implementation
- **Site Repository**: CRUD operations for site data
- **Page Repository**: CRUD operations for page data
- **Cache Layer**: In-memory caching for frequently accessed content
- **Validation**: JSON schema validation before database storage

---

## 🔧 Development Tools & Debugging

### 3D Development Tools
- **Scene Inspector**: Babylon.js debugging tools integration
- **Performance Monitor**: FPS and memory usage tracking
- **Hot Reload**: Live updates during development
- **Error Boundaries**: Graceful handling of 3D rendering errors

### JSON Data Tools
- **Schema Validation**: Real-time validation of site/page data
- **Data Visualization**: Tools to preview JSON as rendered output
- **Migration Scripts**: Database schema updates and data migrations
- **Seed Data Management**: Easy creation and modification of demo content

---

## 🚀 Performance Optimization Specifications

### 3D Rendering Optimizations
- **Level-of-Detail (LOD)**: Reduce mesh complexity based on distance
- **Frustum Culling**: Only render visible elements
- **Texture Optimization**: Compressed textures and efficient formats
- **Batch Rendering**: Group similar elements for efficiency

### Data Loading Optimizations
- **Lazy Loading**: Load page content on-demand
- **Preloading**: Predictive loading of likely next pages
- **Compression**: Gzip compression for JSON data transfer
- **Caching Strategy**: Multi-level caching (browser, CDN, database)

### Memory Management
- **Resource Cleanup**: Proper disposal of 3D resources
- **Garbage Collection**: Minimize GC pressure from frequent allocations
- **Texture Memory**: Efficient texture loading and unloading
- **Scene Optimization**: Remove unused elements from active scenes

---

## 🔒 Security & Content Protection

### Canvas-Based Protection
- **DOM Isolation**: No accessible HTML elements for content
- **Image Protection**: Textures loaded as protected resources
- **Content Obfuscation**: JSON data minification and encoding
- **Right-Click Protection**: Disabled context menus on canvas

### Optional SEO Content
- **Hidden HTML**: Structured data below canvas for crawlers
- **Meta Tags**: Standard SEO metadata in document head
- **Sitemap Generation**: XML sitemaps for search engines
- **Accessibility Content**: Screen reader compatible alternatives

---

## 🧪 Testing Specifications

### 3D Rendering Tests
- **Visual Regression**: Screenshot comparisons for UI consistency
- **Performance Tests**: FPS and loading time benchmarks
- **Cross-Browser**: Ensure compatibility across modern browsers
- **Mobile Testing**: Touch interaction and performance validation

### Data Integration Tests
- **JSON Schema**: Validate all data structures
- **Database Operations**: Test CRUD operations and data integrity
- **Translation Accuracy**: Verify JSON-to-3D conversion correctness
- **Error Handling**: Test graceful degradation scenarios

---

*For architectural patterns and constraints, see [PRD-Architecture.md](./PRD-Architecture.md)*
*For project overview and development workflow, see [PRD-Core.md](./PRD-Core.md)*
