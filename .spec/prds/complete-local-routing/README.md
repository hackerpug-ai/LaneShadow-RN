# Complete On-Device Routing for LaneShadow - PRD

**Epic ID:** TBD
**Status:** Planning
**Last Updated:** 2026-04-10

> **v1.4 Rollback Notice (2026-04-10):** @trestleinc/replicate, Yjs CRDTs, and op-sqlite have been removed from this architecture. Route persistence is Convex-only. Route editing requires connectivity. Offline route creation is out of scope.

Implement complete offline routing capability for LaneShadow's AI-native motorcycle ride planner by migrating from Google Maps to Mapbox with @rnmapbox/maps, eliminating recurring API costs while preserving copper-accented dark theme and weather overlays. All route enrichments (weather, leg labels, AI descriptions) load progressively and asynchronously on the server, returning routes immediately after local routing completes. Mapbox can calculate route geometry offline from downloaded map tiles, but committing a route to Convex requires connectivity.

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
| 1.4.0 | 2026-04-10 | Remove @trestleinc/replicate, Yjs CRDTs, op-sqlite. Route persistence is Convex-only. Offline route creation is out of scope. | Architectural simplification |
| 1.3.0 | 2026-04-09 | Rollback Phase 0 (Shadow Setup) and local model download requirement | Scoping decision |
| 1.1.0 | 2026-04-09 | Add hybrid enrichment architecture, Phase 0 (Shadow Setup), local model integration | Swarm research validation |
| 1.0.0 | 2026-04-09 | Initial PRD | New initiative |

## Next Steps

- `/kb-project-plan` - Build implementation plan from this PRD
- `/kb-run-epic` - Execute the implementation plan
- Review technical requirements with engineering team
- Set up Mapbox account and obtain access tokens

---

## Executive Summary

**Timeline:** 8-10 weeks
**Team:** 1 React Native developer
**Key Decision:** Mapbox SDK for offline route geometry + Convex for all persistence + Haiku for quality enrichment (server-side)
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

Migrate to Mapbox SDK with @rnmapbox/maps for offline route geometry calculation, persist all routes through Convex directly, and maintain all UI/UX while reducing costs by 98%.

**Architecture:**
- **Local (offline):** Mapbox SDK calculates route geometry from downloaded maps — no internet required for geometry
- **Convex (requires connectivity):** Route saved to Convex on commit — connectivity required to persist
- **Deterministic leg labels:** Derived from waypoint names at route-creation time (pure code, no model required)
- **Cloud (3.9s):** Haiku enriches with creative labels, rationales, and highlights (server-side)
- **Cloud (20s):** Weather data fetched asynchronously and merged progressively
- **Progressive Enhancement:** Show route immediately (<10s), enhance in background

---

## Technical Approach

### Architecture Decision: Mapbox SDK + Convex-Only Persistence

**Selected Approach:** Mapbox + @rnmapbox/maps + Convex (no on-device database)

**Rationale:**
- ✅ Preserves current React Native + Expo architecture
- ✅ Maintains weather overlay system (polyline rendering works identically)
- ✅ Offline geometry calculation without native modules (Mapbox SDK's own storage)
- ✅ Proven technology (BMW, The Weather Channel, etc.)
- ✅ Reasonable implementation effort (2-3 months vs 6+ months)
- ✅ Simplified persistence layer — all data in Convex, no SQLite to manage
- ✅ No CRDT library or op-sqlite bundle weight

**Rejected Alternative:** Custom routing engine with native bridge
- Requires iOS/Android native developers (2)
- C++ knowledge for OSRM/Valhalla integration
- 6+ month timeline
- Only justified for regulatory requirements preventing third-party services

### Technology Stack

```typescript
// Core Dependencies
"@rnmapbox/maps": "^10.1.0"     // Mapbox React Native SDK
"convex": "^1.x"                 // Backend — all persistence (unchanged)
"expo": "~50.x"                  // Platform (unchanged)

// New Utilities
lib/mapbox/offline-manager.ts    // Region download management
lib/mapbox/routing.ts            // Offline route calculation
lib/routing/leg-labels.ts        // Deterministic leg label derivation from waypoint names
components/map/mapbox-map-view.tsx // MapView wrapper
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

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

### Phase 2: Offline Maps & Local Routing (Weeks 2-4)

**Goal:** Download map regions and calculate routes offline; commit routes to Convex

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

3. **Deterministic Leg Label Generation**
   - Implement `lib/routing/leg-labels.ts`
   - Derive "FROM → TO" labels from waypoint names (pure code, no model)
   - Generated at route-creation time and stored on route document

4. **Convex Integration**
   - Store route calculations with provider-agnostic format
   - Implement route plan mutations and queries (direct Convex — no Replicate)
   - If offline when user submits: show "Connect to save your route" prompt
   - Route geometry held in component state until committed; auto-commit on reconnect

#### Success Criteria
- Can download map region for offline use
- Route geometry calculation works without internet (Mapbox SDK's own storage)
- Downloaded regions persist across app restarts (managed by Mapbox SDK)
- Convex stores route geometry provider-agnostically
- Leg labels derived deterministically from waypoint names at creation time
- Route commit requires connectivity; user sees clear prompt if offline

---

### Phase 3: Server-Side Enrichment (Week 5)

**Goal:** Orchestrate server-side enrichment with progressive enhancement

#### Tasks

1. **Enrichment Orchestration**
   - Implement `lib/ai/enrichment.ts`
   - Deterministic leg labels stored at route-creation time (from waypoint names)
   - Remote path: Haiku for full enrichment (background, server-side)
   - State machine: pending → partial → complete

2. **Progressive Enhancement UI**
   - Show route with leg labels immediately after Convex commit
   - Display "enhancing..." indicators for cloud enrichment
   - Incremental UI updates as data arrives
   - Enrichment status badges (partial → complete)

#### Success Criteria
- Route displays immediately after Convex commit with leg labels
- Cloud enrichment completes in background without blocking
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
   - Route geometry calculation benchmarks (online vs offline)
   - Memory usage profiling
   - Battery impact analysis
   - Convex mutation latency benchmarks
   - Progressive loading performance verification

3. **Launch Preparation**
   - Production build configuration
   - Mapbox token provisioning
   - Monitoring and alerting setup
   - Launch readiness checklist

---

### Phase 7: Enrichment Polish (Weeks 9-10)

**Goal:** Optimize server-side enrichment and edge cases

#### Tasks

1. **Integration Testing**
   - Test offline geometry → connectivity restored → auto-commit flow
   - Test progressive enhancement UI
   - Test concurrent enrichment requests

2. **Performance Optimization**
   - Batch enrichment queue optimization
   - Optimize Haiku enrichment latency

3. **Edge Case Handling**
   - User goes offline after route geometry calculated → hold in state, prompt to save
   - Enrichment job failure → retry with exponential backoff
   - Partial enrichment saved → resume on reconnect

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

### Projected Costs (Convex-Only Persistence Architecture)

| Usage | Current | Projected | Monthly Cost |
|-------|---------|-----------|--------------|
| Google Maps API | 1,000 routes/day @ $5/1000 | - | **$0** |
| Mapbox Routing | - | 50k directions/month | **~$15/month** |
| Haiku Enrichment | 100% of routes @ $0.0003/route | 100% of routes (server-side) | **~$30/month** |

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
✅ **Offline route geometry** — Mapbox SDK calculates geometry from downloaded map tiles without internet
✅ **Leg label generation** — Derived deterministically from waypoint names at creation time
✅ **Progressive enrichment** — Route displays immediately after Convex commit; Haiku enriches in background
✅ **Multi-device sync** — Convex provides real-time sync across devices

**Removed in v1.4 (out of scope):**
❌ **Offline route persistence** — Route commit requires connectivity (Convex-only persistence)
❌ **Offline route editing** — No on-device draft store; edits go through Convex directly
❌ **@trestleinc/replicate / Yjs CRDTs / op-sqlite** — Removed entirely

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mapbox API changes | Medium | Use stable SDK version, monitor changelog |
| Offline storage limits | Low | Implement region management UI |
| Coordinate order bugs | High | Comprehensive unit tests for conversion |
| Performance regression | Medium | Benchmark before/after, optimize batch rendering |
| User offline when committing route | Low | Hold geometry in state, auto-commit on reconnect, show clear prompt |
| Weather API rate limits | Low | Free tier, generous limits |
| Haiku enrichment failure | Low | Keep partial enrichment (leg labels + geometry), log error |

---

## Success Metrics

### Technical Metrics
- [ ] Route geometry calculation time < 2 seconds (offline, from downloaded maps)
- [ ] App size increase < 50MB (offline regions, Mapbox SDK only)
- [ ] 99.9% uptime for offline geometry calculation
- [ ] Memory usage increase < 20%
- [ ] Convex route mutation latency < 500ms (p95, when online)
- [ ] Progressive enrichment UI updates < 100ms
- [ ] Time to first route display after commit < 1s

### Business Metrics
- [ ] Cost within budget (Mapbox $15/month)
- [ ] Support tickets for routing < 5/mo
- [ ] Progressive loading time-to-first-response < 10s

---

## Open Questions

1. **Mapbox Token Management:** Should tokens be stored in Convex environment variables or hardcoded?
2. **Offline Region Size:** What's the optimal default region size for most users?
3. **Fallback Behavior:** What happens when a user requests routing outside downloaded regions?
4. **Weather Cache Duration:** How long should weather data be cached before refresh?
5. **Auto-commit UX:** When connectivity returns and a pending route geometry is auto-committed, should there be a confirmation dialog or silent commit?

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
