# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `pnpm dev` - Start development server with HMR
- `pnpm build` - Type-check with TypeScript then build for production
- `pnpm lint` - Run ESLint on the codebase
- `pnpm preview` - Preview production build locally

## Tech Stack

- React 19 with TypeScript
- Vite 7 for bundling and dev server
- Material UI (MUI) for the interface
- Three.js for 3D rendering
- web-ifc-three / IFC.js for loading BIM/IFC models
- pnpm as package manager

## Architecture

```
src/
├── components/       # React components
│   ├── Viewer.tsx    # Main viewer orchestrating 3D scene and UI
│   ├── Toolbar.tsx   # Top toolbar with file loading buttons
│   ├── PropertiesPanel.tsx  # Side panel showing element properties
│   └── ModelList.tsx # Floating panel listing loaded models
├── hooks/
│   └── useThreeScene.ts  # Hook managing Three.js scene lifecycle
├── utils/
│   ├── ifcLoader.ts  # IFC file loading and property extraction
│   └── gltfLoader.ts # glTF/GLB file loading with DRACO support
├── types/
│   └── bim.ts        # TypeScript interfaces for BIM data
└── theme/
    └── theme.ts      # MUI dark theme configuration
```

## Key Patterns

**Three.js Scene Management**: The `useThreeScene` hook initializes and manages the Three.js scene, camera, renderer, and OrbitControls. It handles cleanup on unmount and provides `fitCameraToObject` for auto-framing loaded models.

**IFC Loading**: Uses web-ifc-three with WASM loaded from unpkg CDN. The `getIFCLoader()` singleton pattern ensures the loader is initialized once. Element selection uses raycasting to find the expressID from face vertices.

**Element Selection**: Click events raycast into IFC models, extract the expressID via `ifcManager.getExpressId()`, then create a highlight subset with a custom material. Properties are fetched via `ifcManager.getItemProperties()`.

**State Flow**: The `Viewer` component maintains state for loaded models, selected element, and loading progress. Models are stored with their type (ifc/gltf) to enable type-specific interactions.

## IFC Specifics

- WASM files loaded from: `https://unpkg.com/web-ifc@0.0.74/`
- Element properties include expressID, globalId, type, name, and nested property sets
- Highlighting creates a transparent orange subset overlay on selected elements
