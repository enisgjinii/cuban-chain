# Project Structure

## Directory Organization

```
/app                    - Next.js App Router pages
  page.tsx             - Main application page (3D viewer + controls)
  layout.tsx           - Root layout with theme provider
  globals.css          - Global styles

/components            - React components
  model-viewer.tsx     - Core 3D model rendering with Three.js
  customizer-panel.tsx - Desktop customization controls
  compact-sidebar.tsx  - Desktop floating sidebar
  mobile-3d-viewer.tsx - Mobile-optimized 3D viewer
  mobile-bottom-nav.tsx - Mobile navigation bar
  model-loading.tsx    - Loading states
  debug-node-visibility.tsx - Debug utilities
  theme-provider.tsx   - Dark/light theme context
  /ui                  - Reusable UI components (shadcn/ui)

/lib                   - Utility functions and business logic
  chain-config-types.ts - TypeScript types for chain configuration
  chain-geometry.ts    - Constants for link geometry and offsets
  chain-helpers.ts     - Helper functions for chain manipulation
  utils.ts             - General utilities (cn function, etc.)

/public                - Static assets
  /models              - 3D model files (.glb)
  *.png, *.svg         - Icons and images
  *.pdf, *.pptx        - Documentation files

/styles                - Additional stylesheets
  globals.css          - Legacy global styles
```

## Key Architectural Patterns

### State Management
- React hooks (useState, useRef, useEffect) for local state
- Props drilling for component communication
- No external state management library

### 3D Rendering Architecture
- `model-viewer.tsx` handles all Three.js logic
- Uses R3F hooks (useFrame, useThree, useGLTF)
- Mesh cloning for additional chain links beyond base model
- Material management with original material caching

### Responsive Design
- Desktop: Floating sidebar with full 3D canvas
- Mobile: Bottom navigation with mobile-optimized viewer
- Breakpoint: 1024px (lg in Tailwind)
- Conditional rendering based on `isMobile` state

### Configuration System
- JSON-based configuration for chain state
- Exportable/importable configurations
- Per-link and per-surface customization
- Dynamic link offset adjustments

## File Naming Conventions

- Components: kebab-case (e.g., `model-viewer.tsx`)
- Types: kebab-case with `-types` suffix
- Utilities: kebab-case with `-helpers` suffix
- All React components use `.tsx` extension
