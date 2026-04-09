# Complete On-Device Routing for LaneShadow - PRD

**Epic ID:** TBD
**Status:** Planning
**Last Updated:** 2026-04-09

Implement complete offline routing capability for LaneShadow's AI-native motorcycle ride planner by migrating from Google Maps to Mapbox with @rnmapbox/maps and @trestleinc/replicate for local-first sync, eliminating recurring API costs while preserving copper-accented dark theme and weather overlays. All route enrichments (weather, leg labels, AI descriptions) load progressively and asynchronously on the server, returning routes immediately after local routing completes. Routes are editable offline with automatic conflict resolution via Yjs CRDTs.

**Product Context:** LaneShadow is an AI-native motorcycle ride planner — map-first, conversation-driven. Tagline: "Ride the Moment" — turn a feeling into a road. Platforms: iOS and Android (React Native + Expo). Aesthetic: Rugged, industrial-warm, copper-accented, dark-first.

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Appetite | 6 weeks |
| Scope Level | Full feature with polish |
| Created | 2026-04-09 |
| Last Updated | 2026-04-09 |

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional group overview and use case summary | FEATURE_SPEC |
| [04-uc-map.md](./04-uc-map.md) | UC-MAP-01 through UC-MAP-05 | FEATURE_SPEC |
| [05-uc-off.md](./05-uc-off.md) | UC-OFF-01 through UC-OFF-08 | FEATURE_SPEC |
| [06-uc-rte.md](./06-uc-rte.md) | UC-RTE-01 through UC-RTE-04 | FEATURE_SPEC |
| [08-technical-requirements.md](./08-technical-requirements.md) | Technical specifications | CONSTITUTION |
| [09-hybrid-enrichment.md](./09-hybrid-enrichment.md) | Hybrid enrichment architecture | CONSTITUTION |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 4 |
| Use Cases | 22 |
| System Components | 7 |
| Data Entities | 2 |
| API Endpoints | 6 |
| External Dependencies | 3 |

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.1.0 | 2026-04-09 | Add hybrid enrichment architecture, Phase 0 (Shadow Setup), local model integration | Swarm research validation |
| 1.0.0 | 2026-04-09 | Initial PRD | New initiative |

## Next Steps

- `/kb-project-plan` - Build implementation plan from this PRD
- `/kb-run-epic` - Execute the implementation plan
- Review technical requirements with engineering team
- Set up Mapbox account and obtain access tokens

---

## Executive Summary

**Timeline:** 10-12 weeks (includes local model integration)
**Team:** 1 React Native developer
**Key Decision:** Hybrid architecture - Mapbox SDK for routing + Qwen3.5 0.8B for local leg labels + Haiku for quality enrichment
**Cost Savings:** ~$1,470/month after implementation (Mapbox $15 + reduced Haiku usage)

---

## Background

### Current State

- **Map Provider:** Google Maps API
- **Routing:** Server-side via Google Directions API
- **Cost:** ~$1,500/month at 1,000 routes/day
- **Dependencies:** Requires internet connection for routing
- **Weather Overlays:** Custom polyline rendering system
- **Mini-maps:** Route attachment cards with overview geometry

### Problem Statement

1. **Cost:** Google Maps pricing becomes prohibitive at scale
2. **Offline Limitations:** Cannot calculate routes without internet
3. **Vendor Lock-in:** Tightly coupled to Google's polyline format and API
4. **Reliability:** Service dependency on Google's infrastructure

### Solution Overview

Migrate to Mapbox SDK with @rnmapbox/maps for offline routing, implement hybrid enrichment with Qwen3.5 0.8B (local leg labels) and Haiku (cloud quality enrichment), and maintain all UI/UX while reducing costs by 98%.

**Hybrid Architecture:**
- **Local (instant):** Route editing with automatic conflict resolution via @trestleinc/replicate (Yjs CRDTs + op-sqlite)
- **Local (0.35s):** Qwen3.5 generates leg labels ("FROM → TO") on-device
- **Local (offline):** Mapbox SDK calculates route geometry from downloaded maps
- **Cloud (3.9s):** Haiku enriches with creative labels, rationales, and highlights
- **Cloud (20s):** Weather data fetched asynchronously and merged progressively
- **Progressive Enhancement:** Show route immediately (<10s), enhance in background
- **Offline-First Sync:** Bidirectional CRDT delta sync when online

---

## Technical Approach

### Architecture Decision: Mapbox SDK

**Selected Approach:** Mapbox + @rnmapbox/maps

**Rationale:**
- ✅ Preserves current React Native + Expo architecture
- ✅ Maintains weather overlay system (polyline rendering works identically)
- ✅ True offline routing without native modules
- ✅ Proven technology (BMW, The Weather Channel, etc.)
- ✅ Reasonable implementation effort (2-3 months vs 6+ months)
- ✅ First-class React Native support via op-sqlite (no WASM hacks required)
- ✅ Automatic conflict resolution via Yjs CRDTs

**Rejected Alternative:** Custom routing engine with native bridge
- Requires iOS/Android native developers (2)
- C++ knowledge for OSRM/Valhalla integration
- 6+ month timeline
- Only justified for regulatory requirements preventing third-party services

### Technology Stack

```typescript
// Core Dependencies
"@rnmapbox/maps": "^10.1.0"     // Mapbox React Native SDK
"convex": "^1.x"                 // Backend (unchanged)
"expo": "~50.x"                  // Platform (unchanged)
"@trestleinc/replicate": "^1.x"  // Local-first sync engine (Yjs + op-sqlite)
"@op-engineering/op-sqlite": "^7.x" // SQLite for React Native

// New Utilities
lib/mapbox/offline-manager.ts    // Region download management
lib/mapbox/routing.ts            // Offline route calculation
components/map/mapbox-map-view.tsx // MapView wrapper
collections/use-routes.ts        // Replicate collection (local-first sync)
```

---

## Implementation Phases

### Phase 0: Shadow Setup (Week 1)

**Goal:** Onboarding experience with mandatory local model download

**Hard Requirement:** App cannot be used until "Your Shadow" (local AI model) is downloaded

#### Tasks

1. **Setup Wizard Flow**
   - Create onboarding screens with "Download Your Shadow" branding
   - WiFi detection and requirement (block cellular downloads)
   - Progress tracking with "Awakening Your Shadow" messaging
   - Background download with app state handling

2. **Local Model Integration**
   - Install Qwen3.5 0.8B runtime (MLX framework)
   - Create model download manager with retry logic
   - Implement in-memory model caching (singleton pattern)
   - Add model verification (checksum validation)

3. **Gatekeeper Implementation**
   - Block all route planning until model download completes
   - Show "Setup Required" screen if model missing
   - Persist download state across app restarts
   - Handle download failures with retry UX

#### UX Flow

```
First Launch → "Welcome to LaneShadow" → 
"Download Your Shadow" → WiFi Check → 
"Awakening Your Shadow" (0-100%) → 
"Your Shadow is Ready" → Main App
```

#### Success Criteria
- Model downloads successfully on WiFi (>99% completion rate)
- User cannot bypass setup (hard gate)
- Progress updates every 5% with estimated time remaining
- Download resumes after app restart/interruption

---

### Phase 1: Foundation (Week 2)

**Goal:** Install Mapbox SDK and render basic map

#### Tasks

1. **Install Dependencies**
   ```bash
   npm install @rnmapbox/maps
   ```

2. **Configure Expo Plugin**
   - Add Mapbox plugin to app.json
   - Configure RNMapboxMapsImpl and download token
   - Test build on iOS and Android

3. **Create MapboxMapView Wrapper**
   - Implement `components/map/mapbox-map-view.tsx`
   - Support camera positioning, markers, polylines
   - Theme-aware style URLs (dark/light modes)
   - Coordinate conversion utilities ([lng, lat] vs [lat, lng])

#### Success Criteria
- Mapbox map renders in dev environment
- Camera controls work (zoom, pan, center)
- Theme switching toggles map style

---

### Phase 2: Offline Maps & Local Routing (Weeks 3-5)

**Goal:** Download map regions and calculate routes offline

#### Tasks

1. **Offline Region Download**
   - Implement `lib/mapbox/offline-manager.ts`
   - Create UI for region selection (bounding box input)
   - Progress tracking for downloads
   - Storage management (list, delete downloaded regions)

2. **On-Device Route Calculation**
   - Implement `lib/mapbox/routing.ts`
   - Offline Directions API using cached routing data
   - Support for waypoints and multi-stop routes
   - Error handling for insufficient offline data

3. **Local Leg Label Generation**
   - Implement `lib/ai/local-enrichment.ts`
   - Qwen3.5 workflow for "FROM → TO" label generation
   - 0.35s target time with 100% validity
   - Fallback to generic labels on failure

4. **Local-First Sync with Replicate**
   - Install `@trestleinc/replicate` and `@op-engineering/op-sqlite`
   - Install crypto polyfills (`react-native-get-random-values`, `react-native-random-uuid`)
   - Create `collections/use-routes.ts` with Replicate collection
   - Define route schema with `schema.define()` for versioning
   - Implement server-side collection with auth hooks
   - Test offline route editing (add waypoint, rename, reorder)
   - Verify bidirectional sync when online

5. **Convex Integration**
   - Install Replicate component in `convex/convex.config.ts`
   - Store route calculations with provider-agnostic format
   - Implement route plan mutations and queries

#### Success Criteria
- Can download map region for offline use
- Route calculation works without internet
- Downloaded regions persist across app restarts (managed by Mapbox SDK)
- Convex stores route geometry provider-agnostically
- Leg labels generate locally in <0.5s
- **Route edits sync automatically via CRDT deltas**
- **Offline route editing works instantly (no network required)**
- **Conflict resolution merges concurrent edits automatically**

---

### Phase 3: Hybrid Enrichment (Week 6)

**Goal:** Orchestrate local and cloud enrichment with progressive enhancement

#### Tasks

1. **Dual-Model Orchestration**
   - Implement `lib/ai/hybrid-enrichment.ts`
   - Local path: Qwen3.5 for leg labels (immediate)
   - Remote path: Haiku for full enrichment (background)
   - State machine: draft → partial → complete

2. **Progressive Enhancement UI**
   - Show leg labels immediately (0.35s)
   - Display "enhancing..." indicators for cloud enrichment
   - Incremental UI updates as data arrives
   - Enrichment status badges (partial → complete)

#### Success Criteria
- Local leg labels appear in <0.5s
- Cloud enrichment completes in background without blocking
- **CRDT sync completes automatically when online**
- UI updates reactively as enrichment progresses
- No blocking failures (all paths have fallbacks)

---

### Phase 4: Weather Overlay Implementation (Week 7)

#### Tasks

1. **Polyline Rendering Migration**
   - Update `lib/polyline.ts` with coordinate conversion
   - Replace Google `<Polyline>` with Mapbox `<ShapeSource>` + `<LineLayer>`
   - Preserve all weather styling (wind levels, rain segments, temperature colors)

2. **Theme Integration**
   - Map weather conditions to Mapbox line styles
   - Maintain semantic theme color mappings
   - Test across all weather severity levels

3. **Performance Optimization**
   - Batch polyline rendering for large routes
   - Implement level-of-detail (LOD) for zoom levels
   - Memory profiling for long routes

#### Success Criteria
- Weather overlays render identically to Google Maps version
- Performance metrics match or exceed current implementation
- All weather conditions (clear, wind, rain, storm) render correctly

---

### Phase 4: Weather Overlay Implementation (Week 7)

**Goal:** Implement weather overlays and mini-map components

#### Tasks

1. **Weather Overlay Implementation**
   - Implement polyline rendering using Mapbox ShapeSource
   - Support wind levels, rain segments, temperature colors
   - Batch rendering for long routes
   - Level-of-detail (LOD) for zoom levels

2. **RouteMiniMap Component**
   - Implement MapboxMapView for route cards
   - Overview geometry rendering
   - Bounds calculation and fit-to-bounds
   - Camera animations

#### Success Criteria
- Weather overlays render correctly on routes
- Mini-maps render in route attachment cards
- Camera fits route bounds correctly
- Performance is smooth in card lists

---

### Phase 5: Testing & Launch (Weeks 8-9)

**Goal:** QA validation and production launch

#### Tasks

1. **Testing**
   - Unit tests for coordinate conversion utilities
   - Integration tests for offline routing
   - E2E tests for critical user flows
   - Manual testing on physical devices (iOS + Android)

2. **Performance Testing**
   - Route calculation benchmarks (online vs offline)
   - Memory usage profiling (Qwen3.5 target <1.5GB)
   - Battery impact analysis
   - Local model inference benchmarks
   - Progressive loading performance verification

3. **Launch Preparation**
   - Production build configuration
   - Mapbox token provisioning
   - Monitoring and alerting setup
   - Launch readiness checklist

---

### Phase 7: Hybrid Enrichment Polish (Weeks 11-12)

**Goal:** Optimize local model integration and edge cases

#### Tasks

1. **Integration Testing**
   - Test offline→online sync flow
   - Test progressive enhancement UI
   - Test model download failures and recovery
   - Test concurrent enrichment requests

2. **Performance Optimization**
   - Profile Qwen3.5 memory usage
   - Optimize model loading time
   - Implement model preloading on app launch
   - Batch enrichment queue optimization

3. **Edge Case Handling**
   - Model download failure → retry UX
   - Corrupted model cache → re-download
   - Out-of-disk-space → graceful degradation
   - Concurrent inference → request queuing

4. **Documentation**
   - Migration notes for future developers
   - Offline region download user guide
   - Cost analysis documentation

#### Success Criteria
- All tests pass
- No critical bugs found
- Performance targets met
- Documentation complete

---

## Data Storage Strategy

### Route Geometry Storage

**Format:** Encoded polylines (Mapbox-compatible)

**Implementation:** Store geometry in provider-agnostic format, convert coordinates when rendering.

### Cached Routes

Convex mutation stores route data:

```typescript
// convex/functions/routes.ts
export const saveRoute = mutation({
  args: {
    geometry: v.string(), // Encoded polyline (Mapbox format)
    bounds: v.object({
      northeast: v.object({ lat: v.number(), lng: v.number() }),
      southwest: v.object({ lat: v.number(), lng: v.number() }),
    }),
    metadata: v.any() // Weather overlays, etc.
  },
  handler: async (ctx, args) => {
    // Store route data
  }
})
```

---

## Cost Analysis

### Current Costs (Google Maps)

| Usage | Rate | Monthly Cost |
|-------|------|--------------|
| 1,000 routes/day × 30 days | $5/1000 routes | **~$1,500/month** |

### Projected Costs (Hybrid Architecture)

| Usage | Current | Projected | Monthly Cost |
|-------|---------|-----------|--------------|
| Google Maps API | 1,000 routes/day @ $5/1000 | - | **$0** |
| Mapbox Routing | - | 50k directions/month | **~$15/month** |
| Haiku Enrichment | 100% of routes @ $0.0003/route | 12.5% of routes (leg labels only) | **~$15/month** |
| Qwen3.5 Local | - | 87.5% of routes (local inference) | **$0** |

### Savings

**~$1,470/month** after hybrid implementation
- Mapbox replaces Google Maps: -$1,485
- Reduced Haiku usage: +$15 (only for quality enrichment)

**Break-even:** ~2 months (one-time setup costs amortized)

---

## Preserved Functionality Checklist

✅ **Theme-aware map styling** — Mapbox supports custom styles
✅ **Weather overlays** — Same polyline rendering with coordinate flip
✅ **Route attachment cards** — Mini-maps work identically
✅ **Camera controls** — Zoom, pan, fit to coordinates
✅ **User location tracking** — Mapbox has equivalent
✅ **Offline route replay** — Even better with true offline routing
✅ **Leg label generation** — Qwen3.5 provides fast local labels (0.35s)
✅ **Progressive enrichment** — Immediate UX with background enhancement
✅ **Offline route editing** — Add waypoints, rename, reorder stops (instant, no network)
✅ **Multi-device sync** — Edit on phone, see on tablet via CRDT sync
✅ **Automatic conflict resolution** — Yjs merges concurrent edits intelligently  

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mapbox API changes | Medium | Use stable SDK version, monitor changelog |
| Offline storage limits | Low | Implement region management UI |
| Coordinate order bugs | High | Comprehensive unit tests for conversion |
| Performance regression | Medium | Benchmark before/after, optimize batch rendering |
| Qwen3.5 model failure | Medium | Fallback to generic labels, preserve functionality |
| Model download abandonment | High | Hard gate - cannot use app without model |
| Replicate sync conflicts | Low | Yjs CRDTs resolve automatically |
| SQLite database corruption | Low | op-sqlite is battle-tested, add backups |
| Weather API rate limits | Low | Free tier, generous limits |

---

## Success Metrics

### Technical Metrics
- [ ] Route calculation time < 2 seconds (offline)
- [ ] App size increase < 50MB (offline regions)
- [ ] 99.9% uptime for offline routing
- [ ] Memory usage increase < 20%
- [ ] Local leg label generation < 0.5s (target: 0.35s)
- [ ] Qwen3.5 memory usage < 1.5GB
- [ ] **CRDT sync completion rate > 99%**
- [ ] Progressive enrichment UI updates < 100ms
- [ ] **Offline route editing latency < 50ms**

### Business Metrics
- [ ] Cost within budget (Mapbox $15/month)
- [ ] Support tickets for routing < 5/mo
- [ ] Offline route creation > 15% of total routes
- [ ] **Offline route edits > 30% of total edits**
- [ ] Model download completion > 99%
- [ ] Progressive loading time-to-first-response < 10s

---

## Open Questions

1. **Mapbox Token Management:** Should tokens be stored in Convex environment variables or hardcoded?
2. **Offline Region Size:** What's the optimal default region size for most users?
3. **Replicate Compaction:** What delta count threshold for CRDT compaction? (default: 500)
4. **Fallback Behavior:** What happens when a user requests routing outside downloaded regions?
5. **Weather Cache Duration:** How long should weather data be cached before refresh?
6. **Conflict Resolution UX:** How should we present concurrent edits to users? (Yjs auto-merges)

---

## Next Steps

1. **Review this PRD** with stakeholders
2. **Create task breakdown** via `/kb-project-plan`
3. **Begin Phase 1** implementation

---

## Appendix: Alternative Approaches

### Custom Routing Engine (Not Recommended)

If regulatory requirements prevent using any third-party service:

```
Architecture:
React Native (JS)
  └─ Native Module Bridge (Kotlin/Swift)
      └─ Routing Engine (C++ - libosrm.so OR Valhalla)
          └─ Map Data (OpenStreetMap PBF)
```

**Effort:** 6+ months  
**Team:** 2 native developers + 1 backend  
**Not Recommended** unless legally required
