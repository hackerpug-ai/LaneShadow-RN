---
stability: FEATURE_SPEC
last_validated: 2026-04-10
prd_version: 1.3.0
appetite_weeks: 6
---

# Scope

## Appetite

**6 weeks** (full feature with polish). Reduced from 10–12 weeks after the v1.3 on-device LLM rollback removed Phase 0 (Shadow Setup) and Phase 7 (Hybrid Enrichment Polish).

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
- Local-first route editing via @trestleinc/replicate (Yjs CRDTs + op-sqlite)

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

### Progressive Server-Side Enrichment
- Deterministic leg label derivation from waypoint names (pure code, synchronous, offline-capable)
- Background weather fetching and merging via Convex scheduled actions (Open-Meteo)
- Background Haiku creative enrichment (label, rationale, highlights) via Convex scheduled actions
- Progressive UI updates (skeleton states, fade-in animations) as each enrichment phase arrives
- Enrichment status tracking and indicators

### Testing & Launch
- Unit tests for coordinate conversion utilities
- Integration tests for offline routing
- E2E tests for critical user flows
- Performance benchmarking
- Documentation

## Out of Scope

### Never in Scope (v1.3 Architectural Guard-Rails)

These are removed from scope by the v1.3 on-device LLM rollback and must not be reintroduced without a separate PRD and validated mobile benchmark:

- **On-device language models of any kind.** No Qwen, no Gemma, no Phi, no Core ML `.mlpackage`, no ONNX, no `llama.cpp`, no `whisper.cpp`, no `mlx-local`, no `transformers`, no embedding model. Zero ML runtime on the device.
- **"Download Your Shadow" onboarding** and any variant of a mandatory model-download gatekeeper screen.
- **`lib/ai/local-enrichment.ts`** and any sibling file that executes model inference in-app.
- **Local model cache / download manager / checksum validator.**
- **Local LLM-generated leg labels.** Leg labels are derived deterministically from waypoint names. If a waypoint lacks a name, online reverse-geocoding or a coordinate placeholder is used — never a model.

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
