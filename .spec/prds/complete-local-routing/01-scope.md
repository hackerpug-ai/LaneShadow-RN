---
stability: FEATURE_SPEC
last_validated: 2026-04-09
prd_version: 1.0.0
appetite_weeks: 6
---

# Scope

## Appetite

**6 weeks** (full feature with polish)

## In Scope

### Core Functionality
- Mapbox SDK integration (@rnmapbox/maps v10+)
- MapView component replacement with theme-aware styling
- Camera controls (zoom, pan, fit to coordinates)
- Theme switching (dark/light map styles)

### Offline Capabilities
- Offline map region download (bounding box selection)
- Download progress tracking and UI
- Downloaded region management (list, delete)
- Offline route calculation using cached data
- Route calculation with waypoints support

### Data & Storage
- Provider-agnostic route geometry storage in Convex
- Offline region metadata persistence
- Route caching for replay without internet

### UI Components
- Offline region download interface
- Region management screen
- User education for offline features
- Progressive loading states and animations

### Weather & Overlays
- Weather overlay implementation using Mapbox rendering
- RouteMiniMap component for route cards
- Polyline rendering with coordinate conversion
- Performance optimization for batch rendering

### Progressive Enrichment
- Background weather fetching and merging
- Progressive UI updates (skeleton states, fade-in animations)
- Enrichment status tracking and indicators
- Deterministic leg label generation from waypoint names (pure code)

### Testing & Launch
- Unit tests for coordinate conversion utilities
- Integration tests for offline routing
- E2E tests for critical user flows
- Performance benchmarking
- Documentation

## Out of Scope

### Deferred for Appetite
- Cross-device sync of downloaded regions
- Automatic region download based on route history
- Route optimization algorithms (beyond Mapbox defaults)
- Custom map styles beyond dark/light themes

### Separate Initiatives
- Real-time traffic integration
- Public transit routing
- Multi-modal routing (walking + transit + driving)
- Route sharing between users
- Advanced route customization (avoid tolls, highways, etc.)

### Technical Exclusions
- Custom routing engine implementation (OSRM/Valhalla)
- Native module development
- Map data hosting (using Mapbox's infrastructure)
- Custom tile server implementation

### Non-Goals
- Changing existing route visualization UI/UX
- Modifying weather overlay business logic
- Altering Convex backend architecture
- Changing user notification system

## Never in Scope (v1.4 Guard-Rails)

The following were explicitly removed from scope to simplify architecture. All route persistence is server-side (Convex). Do not re-introduce these:

- **No @trestleinc/replicate** — Local-first sync engine is removed
- **No Yjs / CRDTs** — No conflict resolution library of any kind
- **No op-sqlite / SQLite** — No on-device database; all persistence is Convex
- **No offline route persistence** — Routes cannot be committed to storage without connectivity
- **No offline route editing** — Route mutations go directly to Convex; connectivity required
- **No on-device ML model** — No Qwen, no mlx-local, no local inference; leg labels are deterministic code
