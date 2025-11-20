# Technology Stack

## Framework & Core Libraries

- **Next.js 16.0.0** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.1.0** - Type safety
- **Tailwind CSS 4.1.9** - Styling with PostCSS

## 3D Rendering

- **Three.js** (latest) - 3D graphics library
- **@react-three/fiber** (latest) - React renderer for Three.js
- **@react-three/drei** (latest) - Useful helpers for R3F (OrbitControls, Environment, Stage)

## UI Components

- **Radix UI** - Headless component primitives (dialogs, selects, sliders, tabs, etc.)
- **Lucide React** - Icon library
- **shadcn/ui** - Component system built on Radix UI
- **class-variance-authority** - Component variant management
- **tailwind-merge** & **clsx** - Conditional class merging

## Build & Development

### Common Commands

```bash
# Development server (runs on port 3004)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Configuration Notes

- TypeScript strict mode enabled
- Build errors ignored in Next.js config (`ignoreBuildErrors: true`)
- Images unoptimized for deployment flexibility
- Path alias: `@/*` maps to project root
- Custom port: Development runs on port 3004
