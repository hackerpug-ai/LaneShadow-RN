# TRD: LaneShadow v1.0

**Version**: 2.0
**Last Updated**: 2026-01-30
**Status**: Phase 1 ✅ Implemented | Phase 2-3 📋 Planned

Technical Requirements Documentation for the LaneShadow motorcycle scenic route planner.

---

## Document Index

| Document | Phase | Status | Description |
|----------|-------|--------|-------------|
| [phase-1-core.md](./phase-1-core.md) | Phase 1 | ✅ Implemented | Core planning, wind overlay, save/reopen |
| [phase-2-personalization.md](./phase-2-personalization.md) | Phase 2 | 📋 Planned | Favorite roads, avoid areas, elevation |
| [phase-3-post-ride.md](./phase-3-post-ride.md) | Phase 3 | 📋 Planned | Ratings, notes, ride history |
| [design-system.md](./design-system.md) | All | 📐 Reference | UI components, design tokens, patterns |
| [implementation-map.md](./implementation-map.md) | All | 🗺️ Reference | Code locations, file paths, module map |

---

## 1. Architecture Overview

### 1.1 Technology Stack

| Layer | Technology | Implementation | Notes |
|-------|------------|----------------|-------|
| Client | React Native + Expo | `/app/`, `/components/` | iOS/Android/Web via Expo Router |
| Backend | Convex | `/convex/` | Serverless, type-safe, real-time |
| Auth | Clerk | `@clerk/clerk-expo` | OAuth + email/password |
| AI/LLM | LangGraph + OpenAI GPT-4O | `/convex/actions/agent/` | Route sketching with structured output |
| Maps | Google Maps | `react-native-maps` | Via Google Routes API v2 |
| Weather | Open-Meteo | `/convex/actions/agent/providers/` | Free, no API key required |

### 1.2 Phased Architecture

LaneShadow uses a **phased architecture** that builds incrementally:

```
Phase 1 (Core)          Phase 2 (Personalization)     Phase 3 (Post-Ride)
┌─────────────────┐     ┌─────────────────────┐       ┌─────────────────┐
│ Route Planning  │     │ User Preferences    │       │ Ride History    │
│ Weather Overlays│ ──► │ Favorite Roads      │ ────► │ Ratings/Notes   │
│ Save/Reopen     │     │ Avoid Areas         │       │ Analytics       │
│ Auth            │     │ Elevation Profile   │       │ Time Optimization│
└─────────────────┘     └─────────────────────┘       └─────────────────┘
```

### 1.3 Architectural Principles

1. **Validator-First Design**: All data structures defined as Convex `v` validators in `/models/`
2. **Separation of Concerns**:
   - `convex/db/*` — Queries and mutations only (no external calls)
   - `convex/actions/*` — External API calls and orchestration
   - `convex/actions/agent/*` — All agentic/LLM logic
3. **Immutable Snapshots**: Saved routes are immutable after creation
4. **Provider-Agnostic Geometry**: Polyline format supports multiple map providers
5. **View-Model Oriented APIs**: Backend returns UI-ready view models, not raw documents

---

## 2. Data Model Summary

### 2.1 Schema Location

All Convex tables defined in `/convex/schema.ts`.
All validators/types defined in `/models/*.ts`.

### 2.2 Phase 1 Tables (✅ Implemented)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Clerk-synced user accounts | clerkUserId, email, name |
| `orgs` | Organization containers | clerkOrgId, name |
| `org_memberships` | User-org relationships | userId, orgId, role |
| `saved_routes` | Immutable route snapshots | ownerType, ownerId, planInput, routeSnapshot, routeIndex |

### 2.3 Phase 2 Tables (📋 Planned)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_preferences` | Route generation preferences | userId, defaultScenicBias, avoidAreas[] |
| `favorite_roads` | Saved road segments | userId, name, geometry, bounds |

### 2.4 Phase 3 Tables (📋 Planned)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `ride_history` | Completed ride records | userId, savedRouteId, completedAt |
| *(extended)* `saved_routes.rating` | User ratings and notes | stars, notes, tags |

---

## 3. API Surface Area

### 3.1 Phase 1 (✅ Implemented)

#### Queries (Read-only)

| Function | Path | Returns |
|----------|------|---------|
| `routesPlan.getPlanInit` | `convex/db/routesPlan.ts` | `PlanInitView` |
| `savedRoutes.getSavedRoutesList` | `convex/db/savedRoutes.ts` | `SavedRoutesListView` |
| `savedRoutes.getSavedRouteDetail` | `convex/db/savedRoutes.ts` | `SavedRouteDetailView` |
| `users.getSession` | `convex/users.ts` | `Session \| null` |

#### Mutations (Write)

| Function | Path | Returns |
|----------|------|---------|
| `savedRoutes.saveRoute` | `convex/db/savedRoutes.ts` | `{ savedRouteId }` |
| `savedRoutes.renameRoute` | `convex/db/savedRoutes.ts` | `null` |
| `savedRoutes.deleteRoute` | `convex/db/savedRoutes.ts` | `null` |

#### Actions (External calls)

| Function | Path | Returns |
|----------|------|---------|
| `agent.planRide` | `convex/actions/agent/planRide.ts` | `PlannedRouteOptionsView` |
| `users.updateCurrentProfile` | `convex/actions/users.ts` | `{ userId }` |

### 3.2 Phase 2 (📋 Planned)

```
db.userPreferences.get
db.userPreferences.update
db.userPreferences.addAvoidArea
db.userPreferences.removeAvoidArea
db.favoriteRoads.list
db.favoriteRoads.getDetail
db.favoriteRoads.add
db.favoriteRoads.update
db.favoriteRoads.remove
```

### 3.3 Phase 3 (📋 Planned)

```
db.savedRoutes.rateRoute
db.savedRoutes.updateNotes
db.savedRoutes.markCompleted
db.savedRoutes.markCancelled
db.rideHistory.list
db.rideHistory.getDetail
```

---

## 4. Core Type Definitions

All types are defined in `/models/` using Zod schemas that generate Convex validators.

### 4.1 Route Types (`/models/saved-routes.ts`)

```typescript
// Enums
OWNER_TYPE = "user" | "group" | "org"
VISIBILITY = "private" | "shared" | "public"
SCENIC_BIAS = "default" | "high"
WIND_SUMMARY = "low" | "moderate" | "high" | "unavailable"
CONDITIONS_STATUS = "ok" | "unavailable"

// Core Types
RouteStop = { lat, lng, label?, placeId? }
PlanPreferences = { scenicBias, avoidHighways?, avoidTolls? }
PlanInput = { start, end, departureTime, preferences }
PolylineGeometry = { format, encoding, precision, value }
RouteLeg = { legIndex, start, end, distanceMeters, durationSeconds, geometry }
RouteAnnotation = { id, annotationKind, label, lat, lng, placeRef?, conditionRef? }
WindOverlay = { generatedAt, modelVersion, legend[], byLeg[] }
RouteSnapshot = { provider, bounds, origin, destination, waypoints, overviewGeometry, legs[], annotations[], overlays }
RouteIndex = { routeFingerprint, sampledPoints[] }
SnapshotMeta = { savedAt, routingProvider, overlays, conditionsStatus, metaVersion }
```

### 4.2 Route Sketch Types (`/models/route-sketch.ts`)

```typescript
RouteSketch = {
  label: string
  rationale: string
  segments: Array<{
    roadName: string
    fromName: string
    toName: string
    viaNames?: string[]
  }>  // Max 20 segments
  anchorPoints: Array<{
    name: string
    kind: "town" | "junction" | "landmark" | "pass"
    lat?: number
    lng?: number
  }>
}
```

### 4.3 View Models (`/types/routes.ts`)

```typescript
// Planning
PlanInitView = { defaults, constraints }
PlannedRouteOptionView = { routeOptionId, label, rationale, stats, map, overlaysPreview }
PlannedRouteOptionsView = { planId, options[] }

// Saved Routes
SavedRouteListItemView = { savedRouteId, name, createdAt, updatedAt, preview, capabilities }
SavedRoutesListView = { routes[] }
SavedRouteDetailView = { savedRouteId, name, planInput, routeSnapshot, routeIndex, snapshotMeta, capabilities }

// Capabilities
SavedRouteCapabilities = { canRead, canRename, canDelete }
```

---

## 5. Agent Pipeline Architecture

### 5.1 Overview

The route planning pipeline uses **LangGraph StateGraph** for orchestrating LLM and deterministic tools.

**Location**: `/convex/actions/agent/`

```
┌─────────────────────────────────────────────────────────────────┐
│                      Planning Graph Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Entry: planRide action]                                        │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                             │
│  │ generateSketches│  ← LLM (GPT-4O) with structured output     │
│  │ (2-3 sketches)  │    Zod schema validation                   │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼ (for each sketch)                                    │
│  ┌─────────────────┐                                             │
│  │ compileSketch   │  ← Google Routes API v2                    │
│  │ (geocode+route) │    25s timeout, 1 retry                    │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ normalizeRoute  │  ← Deterministic transformation            │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │computeRouteIndex│  ← Sample geometry for spatial queries     │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ probeConditions │  ← Open-Meteo wind data                    │
│  │ (max 25 points) │    8s timeout, soft-fail                   │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ mapConditions   │  ← Assign wind levels to legs              │
│  └────────┬────────┘                                             │
│           │                                                      │
│           ▼                                                      │
│  [Output: PlannedRouteOptionsView]                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Tool Implementations

| Tool | Location | Timeout | Retry | Fallback |
|------|----------|---------|-------|----------|
| `generateSketches` | `planningGraph.ts` | 30s | 1 | Fail with error code |
| `compileSketch` | `tools/compileSketch.ts` | 25s | 1 | Discard candidate |
| `normalizeRoute` | `tools/normalizeRoute.ts` | N/A | N/A | N/A (pure) |
| `computeRouteIndex` | `tools/computeRouteIndex.ts` | N/A | N/A | N/A (pure) |
| `probeConditions` | `tools/probeConditions.ts` | 8s | 0 | `conditionsStatus: "unavailable"` |
| `mapConditions` | `tools/mapConditions.ts` | N/A | N/A | N/A (pure) |

### 5.3 External Providers

| Provider | Location | API | Rate Limits |
|----------|----------|-----|-------------|
| Routing | `providers/routingProvider.ts` | Google Routes API v2 | TRAFFIC_UNAWARE for determinism |
| Weather | `providers/weatherProvider.ts` | Open-Meteo Forecast | Max 8 concurrent, max 25 points |

### 5.4 Observability

- **LangSmith Integration**: All graph nodes traced with user context
- **Project**: `LaneShadowDev` (configurable via `LANGSMITH_*` env vars)
- **Tracing Helper**: `/convex/actions/agent/lib/tracing.ts`

---

## 6. Frontend Architecture

### 6.1 App Structure

```
/app/
├── _layout.tsx              # Root layout with auth check + Convex provider
├── index.tsx                # Entry redirect
├── (auth)/
│   ├── sign-in.tsx          # V008 AuthSignIn
│   └── sign-up.tsx          # V009 AuthSignUp
└── (app)/
    └── (tabs)/
        ├── index.tsx        # V001 HomeMap (primary screen)
        ├── saved-routes.tsx # V002 SavedRoutesList (placeholder)
        └── settings.tsx     # V006 Settings (placeholder)
```

### 6.2 Component Organization

```
/components/
├── auth/                    # Auth-specific components
├── layouts/                 # Screen layout wrappers
├── map/                     # Map-related components
│   ├── map-view.tsx         # MapView with imperative handle
│   ├── map-controls.tsx     # Zoom/recenter buttons
│   ├── map-header-overlay.tsx
│   └── route-polyline.tsx   # Polyline helpers
├── planning/                # Route planning components
│   ├── route-option-card.tsx
│   └── wind-badge.tsx
├── sheets/                  # Bottom sheet components
│   ├── plan-ride-sheet.tsx  # S001
│   ├── route-options-sheet.tsx # S002
│   ├── planning-loading.tsx # V004
│   ├── planning-error-sheet.tsx # S004
│   ├── route-timeline.tsx
│   └── bottom-sheet-wrapper.tsx
└── ui/                      # Reusable UI primitives
    ├── button.tsx
    ├── input.tsx
    ├── card.tsx
    ├── badge.tsx
    ├── chip.tsx
    ├── skeleton.tsx
    ├── icon-symbol.tsx
    ├── scenic-bias-segmented.tsx
    └── [60+ components]
```

### 6.3 Custom Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `usePlanInit` | `/hooks/use-plan-ride.ts` | Fetch default preferences |
| `usePlanRide` | `/hooks/use-plan-ride.ts` | Execute planning with abort |
| `useSavedRoutes` | `/hooks/use-saved-routes.ts` | Fetch saved routes list |
| `usePlaceAutocomplete` | `/hooks/use-place-autocomplete.ts` | Google Places search |
| `useSemanticTheme` | `/hooks/use-semantic-theme.ts` | Access design tokens |

### 6.4 State Management

The HomeMap screen uses a **reducer pattern** for complex state:

```typescript
type PlanningState = {
  planningStatus: 'idle' | 'planning' | 'error' | 'options' | 'selected'
  startStop: RouteStop | null
  endStop: RouteStop | null
  departureTime: number
  preferences: PlanPreferences
  routeOptions: PlannedRouteOptionView[]
  selectedRouteOptionId: string | null
  error: string | null
}
```

---

## 7. Screen & Sheet Mapping

### 7.1 Phase 1 Screens

| ID | Name | Status | Component Path |
|----|------|--------|----------------|
| V001 | HomeMap | ✅ Built | `/app/(app)/(tabs)/index.tsx` |
| V002 | SavedRoutesList | 🔶 Placeholder | `/app/(app)/(tabs)/saved-routes.tsx` |
| V003 | SavedRouteDetail | ❌ Not Built | — |
| V004 | RoutePlannerLoading | ✅ Built | `/components/sheets/planning-loading.tsx` |
| V005 | EmptyState | ✅ Built | `/components/ui/empty-state.tsx` |
| V006 | Settings | 🔶 Placeholder | `/app/(app)/(tabs)/settings.tsx` |
| V007 | LegalAbout | ❌ Not Built | — |
| V008 | AuthSignIn | ✅ Built | `/app/(auth)/sign-in.tsx` |
| V009 | AuthSignUp | ✅ Built | `/app/(auth)/sign-up.tsx` |
| V010 | SessionRestoring | ✅ Built | `/components/auth/session-restoring.tsx` |

### 7.2 Phase 1 Sheets

| ID | Name | Status | Component Path |
|----|------|--------|----------------|
| S001 | PlanRideSheet | ✅ Built | `/components/sheets/plan-ride-sheet.tsx` |
| S002 | RouteOptionsSheet | ✅ Built | `/components/sheets/route-options-sheet.tsx` |
| S003 | RouteOverviewSheet | ❌ Not Built | — |
| S004 | PlanningErrorSheet | ✅ Built | `/components/sheets/planning-error-sheet.tsx` |
| S005 | WindLegendSheet | ❌ Not Built | — |
| S005a | RainLegendSheet | ❌ Not Built | — |
| S005b | TemperatureLegendSheet | ❌ Not Built | — |
| S006 | PlaceSearchSheet | ❌ Not Built | — |
| S007 | AnnotationDetailSheet | ❌ Not Built | — |
| S008 | RenameRouteSheet | ❌ Not Built | — |
| S009 | ConfirmDeleteRouteSheet | ❌ Not Built | — |

---

## 8. Error Codes

### 8.1 Defined Error Codes

| Code | Category | Description |
|------|----------|-------------|
| `UNAUTHORIZED` | Auth | User not authenticated |
| `INVALID_INPUT` | Validation | Request args failed validation |
| `NOT_FOUND` | Access | Resource not found or not accessible |
| `LLM_SKETCH_INVALID` | Planning | LLM output failed schema validation |
| `LLM_SKETCH_AMBIGUOUS` | Planning | LLM output requires repair |
| `ROUTING_COMPILE_FAILED` | Planning | Routing provider could not honor sketch |
| `CONDITIONS_LOOKUP_FAILED` | Planning | Weather provider failure (soft-fail) |

### 8.2 Error Handling Patterns

```typescript
// Hard failure: Fail the entire operation
if (sketchValidation.error) {
  throw new ConvexError({ code: 'LLM_SKETCH_INVALID', message: '...' })
}

// Soft failure: Continue with degraded state
if (conditionsError) {
  return { ...route, conditionsStatus: 'unavailable', overlays: { wind: undefined } }
}
```

---

## 9. Performance Budgets

| Operation | Budget | Implementation |
|-----------|--------|----------------|
| Route planning (total) | <30s | LLM timeout + routing timeout |
| LLM sketch generation | <30s | Single request with structured output |
| Route compilation | <25s per sketch | Google Routes API, 1 retry |
| Weather probing | <8s | Max 25 points, 8 concurrent |
| List queries | <100ms | Summaries only, pagination |
| Detail queries | <500ms | Full snapshot, single document |

---

## 10. Sprint Roadmap

| Sprint | Phase | Focus | Status |
|--------|-------|-------|--------|
| 1-3 | Phase 1 | Backend infrastructure, LLM pipeline | ✅ Complete |
| 4-5 | Phase 1 | UI implementation, weather overlays | ⏳ In Progress |
| 6 | Phase 2 | Preferences + favorites foundation | 📋 Planned |
| 7 | Phase 2 | Elevation + comparison | 📋 Planned |
| 8 | Phase 3 | Rating + history | 📋 Planned |
| 9 | Phase 3 | Time optimization + polish | 📋 Planned |

---

## 11. Design References

All screens have corresponding HTML mockups in `../designs/mocks/`.

### Design System
- **Theme**: Dark mode first, industrial-warm aesthetic
- **Primary Color**: Copper (#B87333)
- **Typography**: Space Grotesk (display), Inter (body)
- **Icons**: Material Symbols Outlined
- **Viewport**: 390x844 (iPhone 14 Pro reference)
- **Full design tokens**: [design.stitch.json](../designs/design.stitch.json)

See [design-system.md](./design-system.md) for complete component specifications.

---

## 12. Cross-Phase Principles

1. **Additive Only** — New phases add tables/endpoints without modifying Phase 1 contracts
2. **Backward Compatible** — Existing saved routes remain valid across versions
3. **Provider Agnostic** — Geometry/overlay formats support multiple providers
4. **Immutable Snapshots** — Route snapshots never change after save
5. **Graceful Degradation** — Missing data (preferences, history) doesn't break core flows
6. **Capabilities Model** — UI actions gated by server-computed capabilities

---

## 13. Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01 | Initial TRD |
| 1.1 | 2024-01 | Added LangGraph implementation notes (Sprint 3) |
| 1.2 | 2026-01 | Design-driven enrichments: UI extensions, interaction specs, frozen gaps |
| 2.0 | 2026-01-30 | **Major rebuild**: Implementation map, actual code paths, type inventory, agent pipeline details, component mapping, error codes |

---

## 14. Related Documents

| Document | Purpose |
|----------|---------|
| [PRD.md](../PRD.md) | Product requirements and feature scope |
| [phase-1-core.md](./phase-1-core.md) | Detailed Phase 1 technical spec |
| [phase-2-personalization.md](./phase-2-personalization.md) | Phase 2 technical spec |
| [phase-3-post-ride.md](./phase-3-post-ride.md) | Phase 3 technical spec |
| [design-system.md](./design-system.md) | UI component specifications |
| [implementation-map.md](./implementation-map.md) | Code location reference |
| [../designs/mocks/](../designs/mocks/) | HTML design mockups |
