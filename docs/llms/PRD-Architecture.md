# Product Requirements Document - Architecture

*Last Updated: June 8, 2025*

## 🏗️ Clean Architecture Constraints

### Domain-Driven Design Principles
**CRITICAL**: All implementation must follow clean architecture patterns with strict layer separation.

#### Layer Responsibilities
- **Common** (`src/common/`): Shared utilities, interfaces, and cross-cutting concerns
- **Domain** (`src/domain/`): Core business entities, value objects, domain services
- **Enactment** (`src/enactment/`): Use cases, application services, business logic orchestration
- **Infrastructure** (`src/infrastructure/`): External concerns (database, file system, external APIs)
- **Integration** (`src/integration/`): Framework configuration, dependency injection, bootstrapping
- **Presentation** (`src/presentation/`): UI components, user interface logic

#### Dependency Rules
- **NEVER**: Allow domain to depend on infrastructure
- **NEVER**: Allow domain to depend on presentation
- **NEVER**: Allow enactment to depend on infrastructure directly
- **ALWAYS**: Use dependency inversion for external dependencies
- **ALWAYS**: Keep domain layer pure TypeScript with no framework dependencies

### Babylon.js Integration Architecture

#### 3D Engine Abstraction Pattern
```
Presentation Layer → Engine Service → Babylon.js
```

**Rules:**
- Babylon.js engine must be abstracted behind service interfaces
- Domain entities should not directly reference Babylon.js types
- Rendering logic isolated in dedicated engine services
- Scene management separated from business logic

#### JSON-to-3D Translation Architecture
```
Domain JSON Data → Translation Service → Babylon.js Components
```

**Pattern Requirements:**
- Translation services in `src/integration/engine/`
- Domain data structures in `src/domain/entities/`
- Rendering implementations in `src/integration/engine/render/`
- Navigation logic in `src/integration/engine/navigation/`

---

## 📁 File Organization Standards

### Strict Naming Conventions
- **Entities**: `[name].entity.ts`
- **Services**: `[name].service.ts`
- **Repositories**: `[name].repository.interface.ts` (interfaces), `[name].repository.ts` (implementations)
- **Components**: `[name].component.ts`
- **Models**: `[name].model.ts`
- **Aggregates**: `[name].aggregate.ts`

### Required Folder Structure
```
src/
├── common/
│   ├── services/     # Cross-cutting services
│   └── mock/         # Test mocks
├── domain/
│   ├── entities/     # Core business entities
│   ├── aggregates/   # Domain aggregates
│   ├── constants/    # Domain constants
│   ├── data/         # Domain interfaces
│   └── repository/   # Repository interfaces
├── enactment/
│   ├── services/     # Application services
│   └── resolvers/    # Route resolvers
├── infrastructure/
│   ├── bootstrap/    # Infrastructure setup
│   ├── data/         # Database implementations
│   ├── providers/    # Dependency providers
│   └── repository/   # Repository implementations
├── integration/
│   ├── bootstrap/    # App configuration
│   ├── engine/       # Babylon.js engine services
│   ├── models/       # Integration models
│   └── providers/    # Integration providers
└── presentation/
    ├── app/          # Angular components
    └── assets/       # Static file resources
```

---

## 🔄 State Management Patterns

### Current Implementation: Traditional Angular Patterns
**CURRENT STATE**: The project uses traditional Angular dependency injection and services

#### Established Pattern Rules
- Services use `@Injectable({ providedIn: 'root' })` for singleton pattern
- Component state managed through `ChangeDetectionStrategy.OnPush`
- Data flow through dependency injection and service methods
- Observable patterns via RxJS where needed

#### Service-Based Architecture
```typescript
// CURRENT: Traditional service injection
@Injectable({ providedIn: 'root' })
export class NavigationService {
  constructor(private guiService: GuiService) {}
  
  async navigateToPage(page: Page, mesh: any): Promise<void> {
    // Direct method calls for state updates
  }
}
```

### Data Flow Patterns (Current Implementation)
- MongoDB operations → Service method calls
- User interactions → Direct service calls
- 3D scene changes → Service-driven updates  
- Navigation events → Method-based routing

**Note**: While Angular signals represent the cutting-edge approach and may be considered for future refactoring, the current codebase successfully uses traditional Angular patterns. Any migration to signals should be planned as a deliberate architectural evolution rather than immediate requirement.

---

## 🚫 Anti-Patterns to Avoid

### Architecture Violations
- **NEVER**: Import infrastructure directly into domain
- **NEVER**: Put business logic in presentation components
- **NEVER**: Couple Babylon.js directly to Angular components
- **NEVER**: Mix rendering logic with business logic

### Current Implementation Patterns (Established)
- Traditional Angular dependency injection pattern (stable)
- Service-based state management (proven approach)
- Method-driven component interactions (current standard)
- Observable streams for async operations where needed

### Performance Anti-Patterns
- **AVOID**: Creating new Babylon.js scenes on every navigation
- **AVOID**: Blocking main thread with heavy 3D operations
- **AVOID**: Synchronous database operations
- **AVOID**: Unnecessary DOM manipulation when using canvas rendering

### Code Organization Anti-Patterns
- **AVOID**: Barrel exports that create circular dependencies
- **AVOID**: Mixing different abstraction levels in same file
- **AVOID**: Framework-specific code in domain layer
- **AVOID**: Hard-coded configuration values

---

## ✅ Architecture Validation Checklist

### Before Implementation
- [ ] Verify layer separation maintained
- [ ] Check dependency flow follows clean architecture
- [ ] Confirm abstractions are in place for external dependencies
- [ ] Validate state management patterns are consistent

### During Development
- [ ] Domain layer has no framework dependencies
- [ ] Services are properly abstracted behind interfaces
- [ ] Babylon.js integration follows abstraction patterns
- [ ] Traditional Angular patterns implemented correctly (DI, services, change detection)

### Before Completion
- [ ] Architecture documentation updated
- [ ] No circular dependencies introduced
- [ ] Performance requirements met
- [ ] Clean separation of concerns maintained

---

## 🎯 Technology Philosophy Implementation

### Cutting-Edge Over Stability
**Priority**: Latest versions and experimental features when possible

#### Implementation Guidelines
- Use latest Angular features (signals, control flow, standalone components)
- Leverage newest Babylon.js capabilities (WebXR, compute shaders, latest materials)
- Implement experimental browser APIs when beneficial
- Prefer modern JavaScript/TypeScript patterns over legacy approaches

#### Acceptable Risk Areas
- Beta Angular features that enhance DX
- Experimental Babylon.js features for visual effects
- Cutting-edge WebXR capabilities
- Latest TypeScript features

#### Stability Requirements
- Core data persistence (MongoDB operations)
- Basic navigation functionality
- Essential 3D rendering pipeline
- User data integrity

---

*For core features and development workflow, see [PRD-Core.md](./PRD-Core.md)*
*For technical implementation details, see [PRD-Technical-Specs.md](./PRD-Technical-Specs.md)*
