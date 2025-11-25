# Design Document

## Overview

The Advanced Chain Customization feature enhances the existing Cuban Link Chain Customizer with professional-grade customization capabilities. The system currently supports basic material selection and surface configuration. This design introduces comprehensive stone settings with individual stone control, detailed color management, engraving patterns, enamel finishes, and an improved UI/UX for managing complex configurations.

The architecture maintains the existing Three.js/React Three Fiber rendering pipeline while extending the data model to support richer customization options. The design prioritizes performance through optimized geometry management, material caching, and progressive rendering techniques. Cross-browser compatibility is achieved through WebGL feature detection and graceful degradation.

Key architectural principles:
- **Immutable state management**: All configuration updates create new objects to enable undo/redo
- **Component-based rendering**: Each surface type has dedicated rendering logic
- **Progressive enhancement**: Advanced features degrade gracefully on less capable devices
- **Type safety**: Comprehensive TypeScript types prevent configuration errors

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ CustomizerPanel  │  │  3D Viewer       │                │
│  │ - Link Selection │  │  - Model Display │                │
│  │ - Material Ctrl  │  │  - Interaction   │                │
│  │ - Surface Ctrl   │  │  - Recording     │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ChainConfig (Immutable)                             │  │
│  │  - chainLength: number                               │  │
│  │  - links: LinkConfig[]                               │  │
│  │  - lightingPreset: string                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Config       │  │ Validation   │  │ Serialization│     │
│  │ Helpers      │  │ Logic        │  │ Logic        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Rendering Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Three.js / React Three Fiber                        │  │
│  │  - Material Management                               │  │
│  │  - Geometry Optimization                             │  │
│  │  - Lighting System                                   │  │
│  │  - Performance Monitoring                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → UI components capture user input
2. **State Update** → Immutable configuration updates via helper functions
3. **Validation** → Business logic validates changes
4. **Rendering** → Three.js applies materials and geometry updates
5. **Feedback** → Visual updates reflected in 3D viewer

## Components and Interfaces

### Enhanced Type Definitions

```typescript
// Extended material types
export type Material = "silver" | "grey" | "black" | "white" | "gold" | "rose-gold" | "platinum";

// Stone size options
export type StoneSize = "small" | "medium" | "large";

// Stone count constraints
export type TopSurfaceStoneCount = 1 | 2 | 3;
export type SideSurfaceStoneCount = 1 | 2;

// Enhanced surface configuration
export interface SurfaceConfig {
  type: SurfaceType;
  
  // Gemstone/Moissanite properties
  stoneCount?: TopSurfaceStoneCount | SideSurfaceStoneCount;
  stoneSize?: StoneSize;
  gemstoneColors?: {
    stone1: string;
    stone2?: string;
    stone3?: string;
  };
  
  // Enamel properties
  enamelColor?: string;
  enamelFinish?: "glossy" | "matte" | "satin";
  
  // Engraving properties
  engravingDesign?: "pattern1" | "pattern2" | "pattern3";
  engravingDepth?: number; // 0.0 to 1.0
}

// Chain configuration with metadata
export interface ChainConfig {
  chainLength: number;
  links: LinkConfig[];
  lightingPreset?: "studio" | "outdoor" | "indoor";
  metadata?: {
    createdAt: string;
    modifiedAt: string;
    version: string;
  };
}
```

### Configuration Helper Functions

```typescript
/**
 * Validate stone count based on surface type
 */
export function validateStoneCount(
  surfaceId: SurfaceId,
  count: number
): boolean {
  const isTopSurface = surfaceId === "top1" || surfaceId === "top2";
  if (isTopSurface) {
    return count >= 1 && count <= 3;
  } else {
    return count >= 1 && count <= 2;
  }
}

/**
 * Update stone configuration for a surface
 */
export function updateStoneConfig(
  config: ChainConfig,
  linkIndex: number,
  surfaceId: SurfaceId,
  stoneCount: number,
  stoneSize: StoneSize,
  colors: Record<string, string>
): ChainConfig {
  // Validation and immutable update logic
}

/**
 * Copy link configuration to selected target links
 */
export function copyLinkToTargets(
  config: ChainConfig,
  sourceLinkIndex: number,
  targetIndices: number[]
): ChainConfig {
  // Deep copy logic with independent references
}

/**
 * Serialize configuration with validation
 */
export function serializeConfig(config: ChainConfig): string {
  const serializable = {
    ...config,
    metadata: {
      ...config.metadata,
      modifiedAt: new Date().toISOString(),
      version: "2.0.0"
    }
  };
  return JSON.stringify(serializable, null, 2);
}

/**
 * Deserialize and validate configuration
 */
export function deserializeConfig(json: string): ChainConfig | null {
  try {
    const parsed = JSON.parse(json);
    // Validation logic
    return validateAndMigrateConfig(parsed);
  } catch (error) {
    return null;
  }
}
```

### Rendering Components

#### Stone Renderer

```typescript
interface StoneRendererProps {
  surfaceId: SurfaceId;
  stoneCount: number;
  stoneSize: StoneSize;
  colors: Record<string, string>;
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

/**
 * Renders gemstones or moissanites on a surface
 * Uses instanced rendering for performance
 */
function StoneRenderer(props: StoneRendererProps) {
  // Create geometry based on stone size
  // Position stones based on surface and count
  // Apply individual colors
  // Use InstancedMesh for multiple stones
}
```

#### Enamel Renderer

```typescript
/**
 * Applies enamel material to surface
 * Handles color, finish, and translucency
 */
function applyEnamelMaterial(
  mesh: THREE.Mesh,
  color: string,
  finish: "glossy" | "matte" | "satin"
): void {
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: 0.0,
    roughness: finish === "glossy" ? 0.1 : finish === "matte" ? 0.8 : 0.4,
    transmission: 0.1, // Slight translucency
    thickness: 0.5,
    clearcoat: finish === "glossy" ? 1.0 : 0.0,
    clearcoatRoughness: 0.1
  });
  mesh.material = material;
}
```

#### Engraving Renderer

```typescript
/**
 * Applies engraving pattern using normal maps
 * Patterns stored as texture assets
 */
function applyEngravingPattern(
  mesh: THREE.Mesh,
  pattern: string,
  depth: number
): void {
  // Load pattern texture
  // Apply as normal map with depth scaling
  // Adjust material properties for engraved appearance
}
```

## Data Models

### Configuration State Schema

```typescript
{
  "chainLength": 7,
  "links": [
    {
      "material": "gold",
      "surfaces": {
        "top1": {
          "type": "gemstones",
          "stoneCount": 3,
          "stoneSize": "medium",
          "gemstoneColors": {
            "stone1": "#ffffff",
            "stone2": "#ff0000",
            "stone3": "#0000ff"
          }
        },
        "top2": {
          "type": "enamel",
          "enamelColor": "#000000",
          "enamelFinish": "glossy"
        },
        "side1": {
          "type": "engraving",
          "engravingDesign": "pattern1",
          "engravingDepth": 0.7
        },
        "side2": {
          "type": "empty"
        }
      }
    }
    // ... more links
  ],
  "lightingPreset": "studio",
  "metadata": {
    "createdAt": "2025-11-24T10:00:00Z",
    "modifiedAt": "2025-11-24T10:30:00Z",
    "version": "2.0.0"
  }
}
```

### Validation Rules

1. **Chain Length**: Must be between 7 and 20
2. **Links Array**: Length must match chainLength
3. **Stone Count**: Top surfaces (1-3), Side surfaces (1-2)
4. **Colors**: Must be valid hex colors or predefined gradients
5. **Material**: Must be one of the defined material types
6. **Surface Type**: Must be one of the defined surface types


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Stone count validation

*For any* surface and stone count, when validating the stone count, top surfaces (top1, top2) should accept counts of 1-3 and side surfaces (side1, side2) should accept counts of 1-2, and all other counts should be rejected.

**Validates: Requirements 1.2**

### Property 2: Stone color isolation

*For any* chain configuration with stones on a surface, when changing the color of a specific stone, only that stone's color should change and all other stones on all surfaces should retain their original colors.

**Validates: Requirements 1.4**

### Property 3: Independent stone color controls

*For any* surface configuration with multiple stones, the number of color controls provided should equal the stone count.

**Validates: Requirements 1.5**

### Property 4: Enamel color preservation

*For any* surface with enamel color set, when switching the surface type away from enamel and then back to enamel, the original enamel color should be preserved.

**Validates: Requirements 2.3**

### Property 5: Independent enamel colors

*For any* chain configuration with multiple surfaces having enamel, changing the enamel color on one surface should not affect the enamel color on any other surface.

**Validates: Requirements 2.5**

### Property 6: Surface-specific options visibility

*For any* surface type selection, the UI should display options specific to that surface type and hide options for other surface types.

**Validates: Requirements 8.3**

### Property 7: Link copy completeness

*For any* source link and set of target link indices, when copying the source link configuration to the targets, all target links should have identical material and surface configurations to the source link.

**Validates: Requirements 4.2**

### Property 8: Copy preserves source

*For any* link configuration copy operation, the source link's configuration should remain unchanged after the copy completes.

**Validates: Requirements 4.3**

### Property 9: Copy to all links uniformity

*For any* chain configuration, when copying a link to all links, every link in the chain should have identical configuration to the source link.

**Validates: Requirements 4.4**

### Property 10: Serialization completeness

*For any* valid chain configuration, when serialized to JSON, the output should contain all link materials, surface types, stone settings, colors, engraving patterns, and metadata fields.

**Validates: Requirements 5.1, 5.5**

### Property 11: Configuration round-trip

*For any* valid chain configuration, serializing then deserializing should produce an equivalent configuration object with all properties preserved.

**Validates: Requirements 5.2, 9.1**

### Property 12: Invalid configuration rejection

*For any* invalid configuration data (missing fields, wrong types, invalid values), when attempting to load it, the system should reject it and maintain the current valid state.

**Validates: Requirements 5.3, 5.4**

### Property 13: Link update isolation

*For any* chain configuration and link index, when updating a link's material, only that link should be modified and all other links should remain unchanged.

**Validates: Requirements 9.2**

### Property 14: Invalid stone count rejection

*For any* invalid stone count (negative, zero, or exceeding surface limits), when attempting to set it, the system should reject the input and maintain the current valid state.

**Validates: Requirements 9.3**

### Property 15: Deep copy independence

*For any* link configuration, when copied to another link, modifying the copy should not affect the original link's configuration.

**Validates: Requirements 9.4**

### Property 16: Configuration validation completeness

*For any* configuration object, validation should check all required fields (chainLength, links array, material types, surface types) and reject configurations with missing or invalid fields.

**Validates: Requirements 9.5**

### Property 17: Lighting preset serialization

*For any* chain configuration with a lighting preset selected, when saved, the serialized data should include the lighting preset field.

**Validates: Requirements 10.5**

### Property 18: Custom configuration indicators

*For any* chain with links that have non-default configurations, the UI should provide visual indicators for each customized link.

**Validates: Requirements 8.5**

## Error Handling

### Validation Errors

**Stone Count Validation**
- Invalid counts are rejected before state update
- User receives clear error message indicating valid ranges
- Current configuration remains unchanged

**Color Validation**
- Invalid hex colors are rejected
- Fallback to default color (#ffffff) for malformed input
- User notified of invalid color format

**Configuration Loading**
- JSON parse errors caught and reported
- Schema validation performed on parsed data
- Missing fields filled with defaults where possible
- Incompatible versions trigger migration logic

### Runtime Errors

**WebGL Context Loss**
- Detect context loss events
- Attempt context restoration
- Display user-friendly error message if restoration fails
- Preserve configuration state for recovery

**Performance Degradation**
- Monitor frame rate during rendering
- Automatically reduce quality if FPS drops below threshold
- Notify user of performance mode activation
- Provide option to manually adjust quality settings

**Memory Management**
- Dispose of Three.js objects when no longer needed
- Clear material and geometry caches periodically
- Monitor memory usage and warn on high consumption

### User Input Errors

**File Upload**
- Validate file type before processing
- Check file size limits
- Handle corrupted or incomplete files gracefully
- Provide specific error messages for each failure type

**Browser Compatibility**
- Detect required features on startup
- Display compatibility warnings for missing features
- Provide fallback UI for unsupported browsers
- Guide users to supported browsers if necessary

## Testing Strategy

### Unit Testing

**Configuration Helpers**
- Test each helper function with valid inputs
- Test edge cases (empty arrays, boundary values)
- Test error conditions (invalid indices, null values)
- Verify immutability of state updates

**Validation Logic**
- Test stone count validation for all surface types
- Test color format validation (hex, rgb, gradients)
- Test configuration schema validation
- Test migration logic for older versions

**Serialization**
- Test JSON serialization with various configurations
- Test deserialization with valid and invalid JSON
- Test metadata generation and preservation
- Test backward compatibility with older formats

### Property-Based Testing

The system will use **fast-check** (for TypeScript/JavaScript) as the property-based testing library. Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Configuration**
```typescript
import fc from 'fast-check';

// Configure all property tests to run 100+ iterations
const testConfig = { numRuns: 100 };
```

**Generators**

Custom generators will be created for:
- Valid chain configurations
- Link configurations with various surface types
- Stone configurations with valid counts and colors
- Surface IDs and types
- Material types
- Color values (hex, gradients)

**Property Test Implementation**

Each correctness property from the design document will be implemented as a property-based test with explicit tagging:

```typescript
// Example property test structure
test('Property 1: Stone count validation', () => {
  fc.assert(
    fc.property(
      surfaceIdArbitrary(),
      fc.integer(),
      (surfaceId, count) => {
        // Test implementation
      }
    ),
    testConfig
  );
});
```

All property-based tests will be tagged with comments referencing their corresponding design property:
- Format: `// Feature: advanced-chain-customization, Property N: [property name]`
- This enables traceability from requirements → design → tests

### Integration Testing

**UI Component Integration**
- Test CustomizerPanel with various configurations
- Test 3D viewer updates when configuration changes
- Test copy operations across multiple links
- Test save/load workflow end-to-end

**Rendering Integration**
- Test material application to meshes
- Test stone rendering with different counts and sizes
- Test enamel material properties
- Test engraving pattern application
- Test lighting preset changes

### Performance Testing

**Rendering Performance**
- Measure FPS with maximum complexity (20 links, all surfaces with stones)
- Test update latency when changing configurations
- Profile memory usage over extended sessions
- Test on target devices (desktop and mobile)

**Configuration Operations**
- Measure serialization/deserialization time
- Test copy operations with large chains
- Profile state update performance

### Cross-Browser Testing

**Manual Testing Matrix**
- Chrome (latest, latest-1)
- Firefox (latest, latest-1)
- Safari (latest, latest-1)
- Edge (latest)
- Mobile Safari (iOS latest)
- Mobile Chrome (Android latest)

**Automated Testing**
- Use Playwright for cross-browser automation
- Test core functionality on all supported browsers
- Verify WebGL feature detection
- Test fallback behaviors

## Performance Optimization

### Rendering Optimizations

**Instanced Rendering**
- Use THREE.InstancedMesh for multiple stones
- Reduces draw calls significantly
- Update instance matrices only when needed

**Material Caching**
- Cache materials by configuration hash
- Reuse materials across similar surfaces
- Dispose of unused materials periodically

**Geometry Optimization**
- Use simplified geometry for distant links
- Implement LOD (Level of Detail) system
- Reduce polygon count for mobile devices

**Selective Updates**
- Only update meshes affected by configuration changes
- Batch multiple updates into single render pass
- Use requestAnimationFrame for smooth updates

### State Management Optimizations

**Immutable Updates**
- Use structural sharing for unchanged parts
- Minimize object creation in hot paths
- Memoize expensive computations

**Lazy Evaluation**
- Defer non-critical updates
- Load textures and patterns on demand
- Initialize components progressively

### Memory Management

**Resource Disposal**
- Dispose Three.js objects when removed
- Clear texture caches when memory pressure detected
- Use WeakMap for automatic cleanup

**Garbage Collection**
- Minimize object allocation in render loop
- Reuse objects where possible
- Profile and eliminate memory leaks

## Cross-Browser Compatibility

### WebGL Support

**Feature Detection**
```typescript
function detectWebGLSupport(): {
  webgl2: boolean;
  webgl1: boolean;
  extensions: string[];
} {
  // Detection logic
}
```

**Graceful Degradation**
- WebGL 2.0: Full features
- WebGL 1.0: Reduced shader complexity, fewer effects
- No WebGL: Display error message with browser recommendations

### Browser-Specific Handling

**Safari**
- Handle WebGL context limits
- Adjust texture sizes for memory constraints
- Test on both macOS and iOS

**Firefox**
- Verify shader compilation
- Test performance with large scenes

**Mobile Browsers**
- Reduce default quality settings
- Implement touch-optimized controls
- Handle orientation changes

### Polyfills and Fallbacks

**ES6+ Features**
- Use Babel for transpilation
- Include necessary polyfills
- Test on older browser versions

**CSS Features**
- Provide fallbacks for modern CSS
- Test layout on various screen sizes
- Ensure accessibility compliance

## Deployment Considerations

### Build Optimization

- Code splitting for faster initial load
- Tree shaking to remove unused code
- Asset optimization (textures, models)
- Compression (gzip/brotli)

### CDN Strategy

- Host static assets on CDN
- Use versioned URLs for cache busting
- Implement progressive loading

### Monitoring

- Track performance metrics
- Monitor error rates
- Collect user feedback
- A/B test new features

## Future Enhancements

### Potential Features

- Custom engraving text input
- More material types (titanium, ceramic)
- Animation presets for presentation
- AR preview on mobile devices
- Social sharing with embedded viewer
- Collaborative design sessions
- Design templates and presets
- Export to CAD formats

### Scalability Considerations

- Support for longer chains (20+ links)
- More complex surface geometries
- Real-time collaboration features
- Cloud storage for configurations
- Design marketplace
