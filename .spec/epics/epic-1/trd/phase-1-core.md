# TRD: Phase 1 - Core Planning & Saving

**Version**: 2.0
**Last Updated**: 2026-01-30
**Status**: ✅ Backend Complete | ⏳ UI In Progress (Sprint 4-5)

---

## Implementation Status

### Backend (✅ Complete - Sprints 1-3)

| Component | Status | Location |
|-----------|--------|----------|
| Schema (saved_routes, users, orgs) | ✅ | `convex/schema.ts` |
| Validators (PlanInput, RouteSnapshot) | ✅ | `models/saved-routes.ts` |
| Planning action (planRide) | ✅ | `convex/actions/agent/planRide.ts` |
| LangGraph pipeline | ✅ | `convex/actions/agent/planningGraph.ts` |
| Route compilation (Google Routes) | ✅ | `convex/actions/agent/tools/compileSketch.ts` |
| Wind overlay (Open-Meteo) | ✅ | `convex/actions/agent/providers/weatherProvider.ts` |
| Saved routes CRUD | ✅ | `convex/db/savedRoutes.ts` |
| Clerk auth integration | ✅ | `convex/db/clerkSync.ts` |

### Frontend (⏳ Sprint 4-5)

| Component | Status | Location |
|-----------|--------|----------|
| HomeMap (V001) | ✅ | `app/(app)/(tabs)/index.tsx` |
| PlanRideSheet (S001) | ✅ | `components/sheets/plan-ride-sheet.tsx` |
| RouteOptionsSheet (S002) | ✅ | `components/sheets/route-options-sheet.tsx` |
| PlanningLoading (V004) | ✅ | `components/sheets/planning-loading.tsx` |
| PlanningErrorSheet (S004) | ✅ | `components/sheets/planning-error-sheet.tsx` |
| SavedRoutesList (V002) | 🔶 Placeholder | `app/(app)/(tabs)/saved-routes.tsx` |
| SavedRouteDetail (V003) | ❌ Not Built | — |
| RouteOverviewSheet (S003) | ❌ Not Built | — |
| PlaceSearchSheet (S006) | ❌ Not Built | — |
| WindLegendSheet (S005) | ❌ Not Built | — |
| RenameRouteSheet (S008) | ❌ Not Built | — |
| ConfirmDeleteRouteSheet (S009) | ❌ Not Built | — |

---

## Overview

This document defines the technical implementation for the **Scenic Route Planning & Saving** feature. The system allows motorcycle riders to plan scenic routes, compare alternatives, view motorcycle-specific overlays (initially wind exposure), save routes, and reopen them later with identical map presentation.

The experience is designed to feel **Google Maps–like**, with:

- Smooth, road-adherent geometry
- Overview routes with leg-level breakdowns
- Clear highlighting of locations, conditions, and segments

The system intentionally leverages **LLM-led route planning** to capture rider-native route knowledge (named roads, passes, junctions), while preserving deterministic, provider-backed geometry for rendering and storage.

---

## Goals

1. Generate scenic, motorcycle-friendly route options  
2. Leverage LLM “route memory” (roads + transitions)  
3. Render routes with smooth road adherence  
4. Display motorcycle-specific overlays (wind)  
5. Allow routes to be saved and reopened identically  
6. Support future sharing (groups/orgs) without refactors  
7. Remain provider-agnostic and extensible  

---

## Non-Goals (POC)

- Turn-by-turn navigation  
- Live ride tracking  
- Offline routing  
- Route dragging or waypoint editing  
- Push notifications  
- Social feeds or messaging  
- Group management UI  

---

## 1. Architecture Overview

### 1.1 Technology Stack

- **Client:** React Native  
- **Backend:** Convex  
- **Authentication:** Clerk  
- **LLM Interface:** LangGraph + LangChain (OpenAI GPT-4O)  
- **Mapping SDK:** Google Maps / Mapbox / equivalent  
- **Routing Provider:** External Directions API (mock provider for POC)  
- **Conditions Provider:** Open-Meteo (wind data, no API key required)  

### 1.2 Architectural Principles

- `convex/db/*` contains only queries and mutations  
- `convex/actions/*` contains all external calls and orchestration  
- All agentic logic lives under `convex/actions/agent/*`  
- Clean API naming (no duplicated namespaces)  
- Route planning is ephemeral  
- Only provider-backed snapshots are persisted  
- Ownership and visibility are explicit  
- Geometry is provider-agnostic  
- Saved routes must be fully renderable without recomputation  

---

## 2. Core Concepts

- **User** – An authenticated individual  
- **Group (future)** – A collection of users (e.g., riding group)  
- **Organization (future)** – A higher-level container (club, tour operator)  
- **Route Option** – A compiled candidate route returned during planning  
- **Route Snapshot** – A persisted, presentation-ready route  
- **Route Index** – Analytics anchors derived from geometry  
- **Annotations** – Map markers or callouts (places or conditions)  
- **Overlays** – Segment-based line annotations (e.g., wind exposure)  
- **RouteSketch** – LLM-generated route intent (roads + transitions)  

---

## 3. Data Model (Convex)

### 3.1 Saved Routes

**saved_routes**

- ownerType: `"user" | "group" | "org"`  
- ownerId  
- createdByUserId  
- visibility: `"private" | "shared" | "public"`  
- name  
- planInput  
- routeSnapshot  
- routeIndex  
- snapshotMeta  
- createdAt  
- updatedAt  

**Indexes**

- by_owner (ownerType, ownerId)  
- by_createdByUserId  

---

### 3.2 Plan Input

```ts
{
  start: { lat, lng, label, placeId? }
  end: { lat, lng, label, placeId? }
  departureTime
  preferences: {
    scenicBias: "default" | "high"
    avoidHighways?: boolean
    avoidTolls?: boolean
  }
}
```

---

### 3.3 Route Snapshot

```ts
{
  provider
  bounds: { north, south, east, west }

  /**
   * Top-level trip stops. These improve UX and debugging and are persisted so the
   * UI can show “from/to/via” without recomputation.
   */
  origin: { lat, lng, label?, placeId? }
  destination: { lat, lng, label?, placeId? }
  waypoints: [{ lat, lng, label?, placeId? }]

  /**
   * POC geometry policy:
   * - Store overview polyline for fast preview + fit-to-bounds.
   * - Store leg-level polylines for high-fidelity “on-road” rendering.
   * - Do NOT store step-level instructions/polylines (turn-by-turn is out of scope).
   */
  overviewGeometry: {
    format: "polyline"
    encoding
    precision
    value
  }
  legs: [{
    legIndex
    start: { lat, lng, label? }
    end: { lat, lng, label? }
    distanceMeters
    durationSeconds
    geometry
  }]
  annotations: [{
    id
    annotationKind: "place" | "condition"
    label
    lat
    lng
    placeRef?
    conditionRef?
  }]
  overlays: {
    wind: {
      generatedAt
      modelVersion
      legend[]
      byLeg: [{
        legIndex
        segments: [{
          startMeters
          endMeters
          level
          reason?
        }]
      }]
    }
  }
}
```

---

### 3.4 Route Index

```ts
{
  routeFingerprint
  sampledPoints: [{
    lat
    lng
    distanceFromStartMeters
  }]
}
```

---

## 4. Service Map

### 4.1 Convex DB

- `convex/db/routesPlan.ts`
  - getPlanInit (query)

- `convex/db/savedRoutes.ts`
  - getSavedRoutesList (query)
  - getSavedRouteDetail (query)
  - saveRoute (mutation)
  - updateVisibility (future)
  - updateRouteOwnership (future)

---

### 4.2 Convex Actions

All agentic work lives under:

```
convex/actions/agent/
```

**Public Action**
- `convex/actions/agent/planRide.ts`
  - planRide (action)

**Supporting Modules**
- graphs/planningGraph.ts (LangGraph StateGraph with structured LLM output)
- tools/compileSketch.ts
- tools/normalizeRoute.ts
- tools/computeRouteIndex.ts
- tools/probeConditions.ts
- tools/mapConditions.ts
- providers/routingProvider.ts (mock provider for POC)
- providers/weatherProvider.ts (Open-Meteo integration)

**Optional actions (POC)**
- `convex/actions/places.ts`
  - autocomplete (action)
  - getPlaceDetail (action)

#### 4.2.1 Reliability + determinism requirements (agentic pipeline)

This project's "agent standards" apply to Epic 1 planning actions:

- **Deterministic tools**: Non-LLM "tools" should be pure/deterministic given inputs (e.g., normalization, route indexing, overlay mapping).
- **Structured outputs only**: Any LLM output consumed by code must be structured JSON and validated before use (Convex `v` is canonical; Zod may be used at the agent boundary).
- **External call budgets**: Bound fan-out and request volume (TRD §9); cap probe points and route options.
- **Timeouts + bounded retries**:
  - External provider calls (LLM, routing, weather) should have timeouts.
  - Apply **at most 1 retry per failure type**, then **fallback**:
    - **Routing/LLM hard failures**: discard candidate or fail with a deterministic error code (TRD §11).
    - **Conditions soft failures**: proceed with `conditionsStatus: "unavailable"` and omit `overlays.wind` (TRD §6.2.10).
- **Explicit error behavior**: Prefer deterministic error codes (TRD §11) over free-form error messages.

#### 4.2.2 Implementation notes (Sprint 3)

The agentic pipeline was implemented using **LangGraph `StateGraph`** rather than raw LangChain `createAgent`:

- **Why LangGraph**: Clearer separation of probabilistic (LLM) vs deterministic (tools) logic, built-in conditional edges, and native LangSmith observability support.
- **Structured output**: Uses `model.withStructuredOutput(zod_schema)` directly on GPT-4O; no agent/tools overhead since no dynamic tool calling is needed for sketch generation.
- **Graph nodes**:
  - `generateSketches` — LLM generates 2-3 route sketches (structured JSON output)
  - `processRoutes` — Deterministic tools chain (compile → normalize → index → conditions)
- **Observability**: LangSmith integration enabled with project default `LaneShadowDev` (configurable via `LANGSMITH_*` env vars).
- **Weather provider**: Open-Meteo chosen for POC (no API key required, bounded probing at route sample points).
- **Wind summary**: Centralized enum literals in `models/saved-routes.ts` (`WIND_SUMMARY = { LOW, MODERATE, HIGH, UNAVAILABLE }`).

---

## 4.3 Backend API Contract (v-first, view-model oriented)

This section specifies the **server-shaped view models** and the **Convex function surface area** needed by the UI flows in §6.

### 4.3.1 Validation standard (Convex `v` is source of truth)

- All Convex functions use standard `query` / `mutation` / `action` with **`v` validators** for args + returns.
- No Zod-first patterns (`zQuery`, `zMutation`) are used for defining Convex APIs.
- Prefer reusable validator constants for complex shapes to avoid deep inference and improve readability.

### 4.3.2 Auth + authorization baseline (POC)

**POC constraints**

- Auth is required for **all** planning and saved-route operations.
- Saved routes are **user-private only**:
  - `ownerType = "user"`
  - `visibility = "private"`
  - `ownerId = current user`

**Authorization behavior**

- Detail reads and mutations should behave as **NOT_FOUND** when the route is not accessible (to avoid leaking existence).
- Only metadata fields (e.g., `name`) are mutable. Route snapshots are immutable by design.

### 4.3.3 Capabilities model (centralized, pure)

Define a centralized “capabilities” contract to keep UI dumb and allow future sharing without refactors.

**SavedRouteCapabilities**

- canRead
- canRename
- canDelete

**POC rule**

- All capabilities are true **only if** the current viewer is the owner.

### 4.3.4 Shared Types (used across endpoints)

If an object shape is referenced by multiple endpoints, it is defined here. Endpoint-only shapes remain inline in §4.3.5.

#### Shared primitives

```ts
type ConditionsStatus = "ok" | "unavailable"

type Bounds = {
  north: number
  south: number
  east: number
  west: number
}

type SavedRouteCapabilities = {
  canRead: boolean
  canRename: boolean
  canDelete: boolean
}
```

#### Plan input + stops (shared; used by planning + saved routes)

```ts
type RouteStop = {
  lat: number
  lng: number
  label?: string
  placeId?: string
}

type PlanPreferences = {
  scenicBias: "default" | "high"
  avoidHighways?: boolean
  avoidTolls?: boolean
}

type PlanInput = {
  start: RouteStop
  end: RouteStop
  departureTime: number
  preferences: PlanPreferences
}
```

#### `SnapshotMeta` (shared; stored + returned)

`snapshotMeta` is intended to capture **non-geometry, non-overlay** metadata needed for diagnostics and “reopen identically” guarantees without recomputation.

```ts
type SnapshotMeta = {
  /**
   * When this snapshot was persisted (client-observable timeline anchor).
   */
  savedAt: number

  /**
   * Provider identifiers to support future provider migrations and debugging.
   * The routeSnapshot itself includes provider-specific normalized geometry, but
   * snapshotMeta captures the “how” and “when” at a high level.
   */
  routingProvider: string

  /**
   * Overlay generation metadata for advisory overlays (wind, etc.).
   * Overlay payloads live in routeSnapshot.overlays.*; this is the summary.
   */
  overlays: {
    wind?: {
      generatedAt: number
      modelVersion: string
    }
  }

  /**
   * Whether condition overlays are present and trustworthy. This powers the UI
   * “conditions unavailable” notice without requiring any recomputation.
   */
  conditionsStatus: ConditionsStatus

  /**
   * Reserved for future: app version, schema version, fingerprinting, etc.
   * Keep add-only for backwards compatibility.
   */
  metaVersion: number
}
```

#### Route preview (shared; list cards + map framing)

```ts
type RoutePreview = {
  bounds: Bounds
  distanceMeters: number
  durationSeconds: number
}
```

#### Route snapshot + geometry (shared; used by multiple endpoints)

These types define the full “render without recomputation” contract for saved routes and planned route previews.

```ts
type LatLng = {
  lat: number
  lng: number
}

type PolylineGeometry = {
  /**
   * Provider-agnostic geometry encoding format.
   * POC uses polyline exclusively.
   */
  format: "polyline"

  /**
   * Encoding identifier (provider-specific string).
   * Examples: "google_polyline", "mapbox_polyline6"
   */
  encoding: string

  /**
   * Precision used when encoding the polyline (commonly 5 or 6).
   */
  precision: number

  /**
   * Encoded polyline string
   */
  value: string
}

type RouteLeg = {
  legIndex: number
  start: RouteStop
  end: RouteStop
  distanceMeters: number
  durationSeconds: number
  geometry: PolylineGeometry
}

type RouteAnnotation = {
  id: string
  annotationKind: "place" | "condition"
  label: string
  lat: number
  lng: number
  placeRef?: string
  conditionRef?: string
}

type WindLegendItem = {
  /**
   * A stable key for UI mapping (e.g. "low", "medium", "high").
   */
  level: string

  /**
   * Human readable label (e.g. "Low", "Moderate", "High").
   */
  label: string

  /**
   * Optional numeric range for display (e.g. mph/kph).
   * Keep flexible since providers may vary.
   */
  range?: { min?: number; max?: number; unit?: string }
}

type WindOverlaySegment = {
  /**
   * Segment bounds along the leg polyline, measured from leg start.
   */
  startMeters: number
  endMeters: number

  /**
   * Level key mapped to WindLegendItem.level.
   */
  level: string

  /**
   * Optional explanation used in detail UI or debugging.
   */
  reason?: string
}

type WindOverlayByLeg = {
  legIndex: number
  segments: Array<WindOverlaySegment>
}

type WindOverlay = {
  generatedAt: number
  modelVersion: string
  legend: Array<WindLegendItem>
  byLeg: Array<WindOverlayByLeg>
}

type RouteOverlays = {
  wind?: WindOverlay
}

type RouteSnapshot = {
  provider: string
  bounds: Bounds

  /**
   * Top-level trip stops (POC: always present)
   */
  origin: RouteStop
  destination: RouteStop
  waypoints: Array<RouteStop>

  overviewGeometry: PolylineGeometry
  legs: Array<RouteLeg>
  annotations: Array<RouteAnnotation>
  overlays: RouteOverlays
}
```

#### Route index (shared; used for overlays + future analytics)

```ts
type RouteIndexPoint = {
  lat: number
  lng: number
  distanceFromStartMeters: number
}

type RouteIndex = {
  routeFingerprint: string
  sampledPoints: Array<RouteIndexPoint>
}
```

### 4.3.5 View models (UI-shaped responses)

These are not raw documents; they are shaped payloads designed to render screens/sheets directly.

**PlanInitView (V001/S001)**

- defaults (preference defaults)
- constraints (caps: max options=3, etc.)

**PlannedRouteOptionsView (S002)**

- planId
- options[]:
  - routeOptionId
  - label
  - rationale
  - stats: { distanceMeters, durationSeconds, legsCount }
  - map: { bounds: Bounds, overviewGeometry: PolylineGeometry, legs: Array<RouteLeg> }
  - overlaysPreview: { windSummary, conditionsStatus: ConditionsStatus }

**RouteOverviewView (S003)**

- selected option full snapshot + overlays + annotations
- conditionsStatus: ConditionsStatus

**SavedRoutesListView (V002)**

- routes[]: SavedRouteListItemView

**SavedRouteListItemView**

- savedRouteId
- name
- createdAt
- updatedAt
- preview: RoutePreview
- capabilities: SavedRouteCapabilities

**SavedRouteDetailView (V003)**

- savedRouteId
- name
- planInput: PlanInput
- routeSnapshot: RouteSnapshot
- routeIndex: RouteIndex
- snapshotMeta: SnapshotMeta
- capabilities: SavedRouteCapabilities

### 4.3.6 UI Display Extensions (Additive, Non-Breaking)

These optional extensions support design mockup features. They are computed client-side or added as optional fields without modifying existing contracts.

#### RouteOptionUIExtensions (computed from RouteOption)

```typescript
/**
 * UI-only extensions for route option display.
 * These are derived from existing RouteOption data, not stored.
 */
type RouteOptionUIExtensions = {
  /**
   * Display badges derived from route characteristics.
   * Computed from: label, stats, overlaysPreview
   */
  badges?: Array<{
    type: 'primary' | 'neutral'
    icon?: string  // Material Symbol name
    label: string
  }>

  /**
   * Weather summary pill for route cards.
   * Computed from: overlaysPreview.windSummary + route legs
   */
  weatherPill?: {
    icon: string
    text: string  // e.g., "Light crosswinds on Hwy 1"
    severity: 'low' | 'moderate' | 'high'
  }
}

// Example badge derivation logic:
function deriveRouteBadges(option: RouteOption): Badge[] {
  const badges: Badge[] = []

  // Label-based badge (e.g., "Most Scenic")
  if (option.label.toLowerCase().includes('scenic')) {
    badges.push({ type: 'primary', icon: 'landscape', label: 'Most Scenic' })
  }

  // Distance badge
  const miles = Math.round(option.stats.distanceMeters / 1609.34)
  badges.push({ type: 'neutral', label: `${miles} mi` })

  return badges
}
```

#### AnnotationDetailUIView (for S007)

```typescript
/**
 * Extended annotation view for detail modal display.
 * Supplements the base RouteAnnotation with display-specific fields.
 */
type AnnotationDetailUIView = {
  // Base fields from RouteAnnotation
  id: string
  annotationKind: 'place' | 'condition'
  label: string
  lat: number
  lng: number

  // UI display extensions
  headerIcon: string  // Material Symbol name

  severityBadge?: {
    text: string      // e.g., "15-25 mph"
    color: string     // Hex color
  }

  details: Array<{
    label: string     // e.g., "Time Range", "Direction", "Segment"
    value: string     // e.g., "2:00 PM - 4:00 PM"
  }>

  description?: string  // Extended explanation text

  actions?: Array<{
    icon: string
    label: string
    action: string    // Action identifier
  }>
}

// Derivation example for wind condition annotation:
function deriveWindAnnotationDetail(
  annotation: RouteAnnotation,
  windOverlay: WindOverlay
): AnnotationDetailUIView {
  return {
    ...annotation,
    headerIcon: 'air',
    severityBadge: {
      text: '15-25 mph',
      color: '#fbbf24',
    },
    details: [
      { label: 'Time Range', value: '2:00 PM - 4:00 PM' },
      { label: 'Direction', value: 'NW Crosswind' },
      { label: 'Segment', value: 'Highway 1, Mile 42-58' },
    ],
    description: 'Expect noticeable crosswinds on exposed coastal sections.',
    actions: [
      { icon: 'info', label: 'View Legend', action: 'OPEN_LEGEND' },
    ],
  }
}
```

#### PlaceSearchHistoryItem (client-side, S006)

```typescript
/**
 * Recent search history for PlaceSearchSheet.
 * Stored client-side (AsyncStorage), not in backend.
 */
type PlaceSearchHistoryItem = {
  id: string
  query: string
  placeId?: string
  label: string
  address?: string
  timestamp: number
}

// Storage key: '@laneshadow/place_search_history'
// Max items: 10 (FIFO)
```

#### CurrentLocationResult (S006)

```typescript
/**
 * Current location option in PlaceSearchSheet.
 * Requires geolocation permission.
 */
type CurrentLocationResult = {
  lat: number
  lng: number
  label: 'Current Location'
  isCurrentLocation: true
  accuracy?: number  // meters
}
```

### 4.3.6 Convex function surface area (public vs internal)

Public functions are the app API and return view models. Internal functions are schema-aligned helpers called only by other Convex functions/actions.

#### Public queries/mutations (client-callable)

**Routes planning**

- `convex/db/routesPlan.ts`
  - getPlanInit (query) → PlanInitView

**Saved routes**

- `convex/db/savedRoutes.ts`
  - getSavedRoutesList (query) → SavedRoutesListView
  - getSavedRouteDetail (query) → SavedRouteDetailView
  - saveRoute (mutation) → { savedRouteId }
  - renameRoute (mutation) → null
  - deleteRoute (mutation) → null

#### Public actions (external calls / orchestration)

- `convex/actions/agent/planRide.ts`
  - planRide (action) → PlannedRouteOptionsView

- `convex/actions/places.ts` (optional, if using Places provider)
  - autocomplete (action) → PlaceSearchResultsView
  - getPlaceDetail (action) → { placeId, label, lat, lng }

#### Internal functions (not client-callable)

All internal queries/mutations live under `convex/db/*` (same directory as public db APIs), but are registered with `internalQuery` / `internalMutation`.

- `convex/db/viewer.ts`
  - requireViewer (internalQuery) → { viewerUserId, ... }

- `convex/db/savedRoutes.ts`
  - getById (internalQuery)
  - listByOwner (internalQuery)
  - insert (internalMutation)
  - patchName (internalMutation)
  - deleteById (internalMutation)

**Future (optional)**

- `convex/db/routePlans.ts`
  - persistPlan (internalMutation) for save-from-plan immutability guarantees

---

## 5. LLM-Led Route Sketching

### 5.1 Purpose

The LLM is the source of truth for:

- Which roads to ride  
- Which transitions matter  
- Why the route is recommended  

The routing provider is the source of truth for:

- Legal, drivable paths  
- Exact geometry  
- Distances and durations  

The system compiles the route story into directions.

---

### 5.2 Route Sketch Contract

```ts
{
  label
  rationale
  segments: [{
    roadName
    fromName
    toName
    viaNames?
  }]
  anchorPoints: [{
    name
    kind: "town" | "junction" | "landmark" | "pass"
    lat?
    lng?
  }]
}
```

**Constraints**

- Max 2–3 sketches  
- Must pass schema validation  
- One repair attempt allowed if ambiguous  

---

### 5.3 Compilation Pipeline

1. Geocode anchor points  
2. Compile sketch into provider route using via points  
3. Normalize provider output into routeSnapshot  
4. Sample geometry → routeIndex  
5. Probe conditions at representative points  
6. Map conditions to overlays  
7. Generate annotations  

Failure handling:
- Attempt one repair pass  
- Otherwise discard candidate  

---

## 6. UI Requirements

This section is the single source of truth for **screens/sheets** and the core **end-to-end user flows** for the POC.

### 6.1 Screens (including sheets/overlays) — single source of truth

#### A. Core Screens

| ID | Name | Purpose | Design Mockup |
|----|------|---------|---------------|
| V001 | HomeMap | Map-first shell that hosts planning + route rendering | [home_map.mobile.html](../designs/mocks/home_map.mobile.html) |
| V002 | SavedRoutesList | List of saved routes (summary) | [saved_routes_list.mobile.html](../designs/mocks/saved_routes_list.mobile.html) |
| V003 | SavedRouteDetail | Saved route replay (immutable snapshot) | [saved_route_detail.mobile.html](../designs/mocks/saved_route_detail.mobile.html) |
| V004 | RoutePlannerLoading | Progress overlay while planning | [route_planner_loading.mobile.html](../designs/mocks/route_planner_loading.mobile.html) |
| V005 | EmptyState | Reusable empty screen | [empty_state.mobile.html](../designs/mocks/empty_state.mobile.html) |
| V006 | Settings | Minimal POC settings | [settings.mobile.html](../designs/mocks/settings.mobile.html) |
| V007 | LegalAbout | About + legal | [legal_about.mobile.html](../designs/mocks/legal_about.mobile.html) |
| V008 | AuthSignIn | Sign in (Clerk wrapper/hosted) | [auth_sign_in.mobile.html](../designs/mocks/auth_sign_in.mobile.html) |
| V009 | AuthSignUp | Sign up (Clerk wrapper/hosted) | [auth_sign_up.mobile.html](../designs/mocks/auth_sign_up.mobile.html) |
| V010 | SessionRestoring | Startup/session loading | [session_restoring.mobile.html](../designs/mocks/session_restoring.mobile.html) |

#### B. Sheets / Modals / Overlays (UI states that behave like screens)

| ID | Name | Purpose | Design Mockup |
|----|------|---------|---------------|
| S001 | PlanRideSheet | Start/end + preferences | [plan_ride_sheet.mobile.html](../designs/mocks/plan_ride_sheet.mobile.html) |
| S002 | RouteOptionsSheet | Compare 2–3 routes | [route_options_sheet.mobile.html](../designs/mocks/route_options_sheet.mobile.html) |
| S003 | RouteOverviewSheet | Details, overlays, save | [route_overview_sheet.mobile.html](../designs/mocks/route_overview_sheet.mobile.html) |
| S004 | PlanningErrorSheet | Plan failures | [planning_error_sheet.mobile.html](../designs/mocks/planning_error_sheet.mobile.html) |
| S005 | WindLegendSheet | Wind overlay legend | [wind_legend_sheet.mobile.html](../designs/mocks/wind_legend_sheet.mobile.html) |
| S005a | RainLegendSheet | Rain probability legend | [rain_legend_sheet.mobile.html](../designs/mocks/rain_legend_sheet.mobile.html) |
| S005b | TemperatureLegendSheet | Temperature guide | [temperature_legend_sheet.mobile.html](../designs/mocks/temperature_legend_sheet.mobile.html) |
| S006 | PlaceSearchSheet | Choose start/end place | [place_search_sheet.mobile.html](../designs/mocks/place_search_sheet.mobile.html) |
| S007 | AnnotationDetailSheet | Place/condition detail | [annotation_detail_sheet.mobile.html](../designs/mocks/annotation_detail_sheet.mobile.html) |
| S008 | RenameRouteSheet | Rename saved route | [rename_route_sheet.mobile.html](../designs/mocks/rename_route_sheet.mobile.html) |
| S009 | ConfirmDeleteRouteSheet | Confirm delete | [confirm_delete_route_sheet.mobile.html](../designs/mocks/confirm_delete_route_sheet.mobile.html) |

### 6.2 User Flows (end-to-end)

#### 1) Onboarding / Authentication

**Goal:** user can access planning + saving

- SessionRestoring → (if not authed) AuthSignIn / AuthSignUp → HomeMap

**Screens involved:** V010 → V008/V009 → V001

#### 2) Plan a Ride (primary happy path)

**Goal:** generate 2–3 route options from intent

1. HomeMap → open PlanRideSheet
2. (Optional) open PlaceSearchSheet for Start/End
3. Tap “Plan Ride”
4. Show RoutePlannerLoading overlay during planning
5. Land in RouteOptionsSheet

**Screens involved:** V001 → S001 → (S006 optional) → V004 → S002

#### 3) Compare Route Options

**Goal:** quickly understand differences, pick one

1. RouteOptionsSheet shows 2–3 cards
2. Tap a card → map highlights selected route + overlay preview
3. Tap “View details” → RouteOverviewSheet

**Screens involved:** S002 → S003 (+ map state on V001)

#### 4) Inspect Route (pre-ride confidence)

**Goal:** leg-level understanding + overlays + annotations

1. RouteOverviewSheet shows overview + wind advisory + highlights
2. Tap “Legend” → WindLegendSheet
3. Tap annotation on map → AnnotationDetailSheet

**Screens involved:** S003 → (S005 optional) → (S007 optional)

#### 5) Save Route

**Goal:** persist immutable snapshot for identical replay

1. From RouteOverviewSheet tap “Save route”
2. Success toast + dismiss sheets back to map (or stay, your choice)

**Screens involved:** S003 → (toast) → V001

#### 6) View Saved Routes List

**Goal:** browse saved rides quickly

1. Navigate to SavedRoutesList
2. If empty, show embedded empty state (or EmptyStateStandalone)

**Screens involved:** V002 (→ V005 optional)

#### 7) Reopen Saved Route (immutable replay)

**Goal:** render saved snapshot without recomputation

1. Tap a route in SavedRoutesList
2. SavedRouteDetail renders snapshot + overlays + annotations

**Screens involved:** V002 → V003

#### 8) Rename a Saved Route (metadata-only)

**Goal:** rename without altering snapshot

1. From SavedRouteDetail tap edit
2. RenameRouteSheet → save

**Screens involved:** V003 → S008 → V003

#### 9) Delete a Saved Route

**Goal:** destructive action with confirmation

1. From SavedRouteDetail tap delete
2. ConfirmDeleteRouteSheet → delete → return to list

**Screens involved:** V003 → S009 → V002

#### 10) Planning Failure / Degraded Mode

**Goal:** be honest, keep user moving

- If planning fails: show PlanningErrorSheet with retry guidance
- If conditions fail but route compiles: continue, but show “conditions unavailable” notice in RouteOverview

**Screens involved:**

- Hard fail: V004 → S004 → S001
- Soft fail: V004 → S002/S003 (with advisory notice)

#### 11) Settings / About

**Goal:** minimal app hygiene

- HomeMap → Settings
- Settings → About/Legal (optional)

**Screens involved:** V001 → V006 → (V007 optional)

### 6.3 "Most Essential" subset (if you want to cut scope hard)

If you want the true POC core with no extras:

- **V001 HomeMap**
- **S001 PlanRideSheet**
- **S002 RouteOptionsSheet**
- **S003 RouteOverviewSheet**
- **V004 Loading overlay**
- **S004 Error sheet**
- **V002 SavedRoutesList**
- **V003 SavedRouteDetail**
- **V010 SessionRestoring**
- **V008 SignIn** (and/or hosted auth)

### 6.4 UI Interaction Specifications

#### 6.4.1 PlanRideSheet (S001) Interactions

**Location Swap**
- **Trigger**: Tap swap button between start/end inputs
- **Action**: Swap `planInput.start` ↔ `planInput.end`
- **State**: Both fields must have values for swap to be enabled
- **Animation**: Cross-fade transition (200ms)

**Current Location Quick-Fill**
- **Trigger**: Tap "near_me" icon on starting point field
- **Action**: Request geolocation permission → populate start with current coords
- **Fallback**: If permission denied, show toast "Location access required"
- **Loading**: Show spinner in icon while fetching location

**Route Style Segmented Control**
- **Options**: "Direct" | "Balanced" | "Scenic"
- **Default**: "Balanced"
- **Mapping to `scenicBias`**:
  - "Direct" → `scenicBias: "default"`, `avoidHighways: false`
  - "Balanced" → `scenicBias: "default"`
  - "Scenic" → `scenicBias: "high"`
- **Note**: This is a UI interpretation. Backend `scenicBias` enum is frozen at `"default" | "high"`.

**Preference Toggles**
- **Avoid Highways**: Maps to `preferences.avoidHighways`
- **Avoid Tolls**: Maps to `preferences.avoidTolls`
- **Default**: Both OFF

#### 6.4.2 PlaceSearchSheet (S006) Interactions

**Recent Searches**
- **Storage**: Client-side AsyncStorage
- **Key**: `@laneshadow/place_search_history`
- **Max Items**: 10 (FIFO eviction)
- **Display**: Horizontal chip row with history icon
- **Tap Action**: Populate search field and auto-select

**Current Location Option**
- **Position**: First item after recent searches, highlighted with primary color
- **Icon**: `my_location` in primary-tinted container
- **Label**: "Current Location"
- **Tap Action**:
  1. Request geolocation if not granted
  2. Return `{ lat, lng, label: "Current Location", isCurrentLocation: true }`
  3. Dismiss sheet

**Search Results**
- **Source**: Google Places Autocomplete (or configured provider)
- **Debounce**: 300ms after typing stops
- **Max Results**: 5
- **Display**: Icon + name + address

**Clear Button**
- **Visibility**: Show when search field has text
- **Action**: Clear field, show recent searches

#### 6.4.3 RouteOptionsSheet (S002) Interactions

**Route Card Selection**
- **Tap Card**: Select route, highlight with primary border, show checkmark
- **Selected State**: Full card with stats + weather pill
- **Unselected State**: Compact card (name + stats only)
- **Map Sync**: Update map to show selected route geometry + overlay

**Overlay Toggle Pills**
- **Wind** (Phase 1): Toggle wind overlay visualization
- **Rain** (Phase 2): Toggle rain probability overlay (disabled in Phase 1)
- **Temp** (Phase 2): Toggle temperature overlay (disabled in Phase 1)
- **Active State**: Primary background + border
- **Inactive State**: Muted background

**View Details**
- **Trigger**: Tap primary button on selected route
- **Action**: Push RouteOverviewSheet (S003)

#### 6.4.4 RouteOverviewSheet (S003) Interactions

**Wind Bar Interaction**
- **Tap Segment**: Highlight corresponding leg on map
- **Tap "View Legend"**: Open WindLegendSheet (S005)

**Leg List**
- **Tap Leg**: Pan map to leg, highlight
- **Wind Indicator**: Colored bar per leg showing wind level

**Annotation Taps**
- **Map Marker Tap**: Open AnnotationDetailSheet (S007)
- **Advisory Card Tap**: Scroll to relevant leg or open detail

**Save Route**
- **Trigger**: Tap "Save Route" primary button
- **Action**: Call `saveRoute` mutation
- **Success**: Toast "Route saved", optionally dismiss to map
- **Error**: Toast with retry option

**Start Navigation**
- **Trigger**: Tap "Start Navigation" secondary button
- **Action**: Deep link to external maps app (Google Maps / Apple Maps)
- **Parameters**: Pass destination coords + via waypoints
- **Fallback**: If no maps app, show "Maps app required" toast

#### 6.4.5 SavedRouteDetail (V003) Interactions

**Edit Name**
- **Trigger**: Tap edit icon
- **Action**: Open RenameRouteSheet (S008)
- **Guarded**: Only if `capabilities.canRename`

**Delete Route**
- **Trigger**: Tap delete icon
- **Action**: Open ConfirmDeleteRouteSheet (S009)
- **Guarded**: Only if `capabilities.canDelete`

**Legend Access**
- **Trigger**: Tap overlay legend link
- **Action**: Open appropriate legend sheet (S005/S005a/S005b)

### 6.5 Sheet Behavior Specifications

#### 6.5.1 Sheet Height Reference

| Sheet | Height | Expandable | Keyboard Behavior |
|-------|--------|------------|-------------------|
| S001 PlanRideSheet | 65% | No | Push up on focus |
| S002 RouteOptionsSheet | 65% | No | N/A |
| S003 RouteOverviewSheet | 75% | Yes (40%-75%) | N/A |
| S004 PlanningErrorSheet | 50% | No | N/A |
| S005 WindLegendSheet | 45% | No | N/A |
| S006 PlaceSearchSheet | 85% | Yes (50%-85%) | Stay at 85% |
| S007 AnnotationDetailSheet | Modal | Modal | N/A |
| S008 RenameRouteSheet | 40% | No | Push up on focus |
| S009 ConfirmDeleteRouteSheet | 35% | No | N/A |

#### 6.5.2 Sheet Dismissal

- **Drag Down**: All sheets can be dismissed by dragging below minimum snap point
- **Scrim Tap**: Dismiss sheet (except modals with explicit close)
- **Back Gesture/Button**: Dismiss current sheet
- **Programmatic**: After successful actions (save, delete, etc.)

#### 6.5.3 Sheet Stacking

- Maximum 2 sheets stacked (e.g., PlanRideSheet → PlaceSearchSheet)
- Deep links should dismiss all sheets before navigating

---

## 7. Map Rendering Contract

**Render Order**

1. Overview polyline  
2. Leg polylines  
3. Overlay segments  
4. Annotation markers  

**Rules**

- No backend calls required to render saved routes  
- Overlays anchored by legIndex + meters  
- Annotations are point-based  

---

## 8. Authorization Model

**POC**

- ownerType = "user"  
- ownerId = current user  

**Future**

- Group/org ownership  
- Public visibility  

Authorization enforced server-side.

---

## 9. Performance & Fan-Out

- List queries return summaries only  
- Detail queries return full snapshots  
- Planning returns max 2–3 options  
- Probe points and overlays are capped  
- Group/org access resolved once per request  

---

## 10. Validation Rules

- RouteSketch must validate  
- Provider must return renderable geometry  
- Overlays must reference valid legs  
- Saved routes must reopen identically  
- Access control enforced server-side  

---

## 11. Error Handling

- UNAUTHORIZED  
- INVALID_INPUT  
- LLM_SKETCH_INVALID  
- LLM_SKETCH_AMBIGUOUS  
- ROUTING_COMPILE_FAILED  
- CONDITIONS_LOOKUP_FAILED  
- NOT_FOUND  

---

## 12. Extensibility

Supports future:

- Shared/group routes  
- User-created annotations  
- Additional overlays (rain, ice, visibility)  
- Route popularity analytics  
- Multiple routing providers  

---

## 13. RAID Analysis

### Risks

- **R1:** LLM hallucinated roads  
  - Mitigation: schema validation, provider compilation, repair loop  

- **R2:** Recommendation inconsistency  
  - Mitigation: deterministic compilation, logging selections  

- **R3:** Provider cannot honor sketch  
  - Mitigation: anchors, intent verification, discard invalid candidates  

- **R4:** Performance/cost  
  - Mitigation: caps, caching, synchronous planning  

- **R5:** Conditions inaccuracies  
  - Mitigation: time-bounded overlays, advisory labeling  

### Assumptions

- A1. LLM has strong rider-route knowledge  
- A2. Providers support via points  
- A3. Riders prefer scenic over fastest  
- A4. Saved routes should be immutable  

### Issues

- I1. Scenic quality measurement (open)  
- I2. Ambiguous place names (open)  
- I3. Cross-provider geometry variance (open)  

### Dependencies

- D1. OpenAI availability (GPT-4O for route sketch generation)
- D2. Routing provider stability (mock provider for POC; real provider TBD)
- D3. Weather provider reliability (Open-Meteo, free tier, soft-fail on unavailability)

---

## 14. Future Considerations (Frozen Contract Gaps)

This section documents design-to-TRD gaps that cannot be resolved without breaking frozen Sprint 1-3 contracts. These are documented here for future epic planning.

### 14.1 Scenic Bias Enum Mismatch

**Issue**: Design mockups show a 3-option Route Style selector ("Direct" | "Balanced" | "Scenic"), but the backend `scenicBias` enum is frozen at `"default" | "high"`.

**Current Status**: Frozen (Sprint 1-3 contract)

**Workaround (Sprint 4-5)**: UI maps the 3 visual options to existing enum:
```typescript
// UI to Backend mapping
const routeStyleMapping = {
  'Direct': { scenicBias: 'default', avoidHighways: false },
  'Balanced': { scenicBias: 'default' },
  'Scenic': { scenicBias: 'high' },
}
```

**Future Epic Consideration**: If 3-level granularity is needed at the backend level (for LLM prompting), add `scenicBias: "low" | "default" | "high"` in a schema migration.

### 14.2 External Navigation Deep Link

**Issue**: Design shows "Start Navigation" button but TRD marks turn-by-turn navigation as non-goal. The button's purpose is undefined.

**Current Status**: Frozen (POC scope decision)

**Workaround (Sprint 4-5)**: Implement as deep link to external maps app:
```typescript
// Platform-specific deep links
const navigationDeepLinks = {
  ios: 'maps://?daddr={lat},{lng}&dirflg=d',
  android: 'google.navigation:q={lat},{lng}&mode=d',
}
```

**Future Epic Consideration**: If in-app navigation is desired, add to Phase 4 or v2 epic.

### 14.3 Overlay Toggle Expansion

**Issue**: Design shows Rain and Temperature overlay toggles alongside Wind, but only Wind overlay is implemented in Phase 1.

**Current Status**: Phase 2 planned (not frozen)

**Workaround (Sprint 4-5)**: Render Rain/Temp toggles as disabled with "Coming soon" state.

**Phase 2 Resolution**: Implement additional overlays per TRD phase-2-personalization.md.

### 14.4 Recent Search History Storage

**Issue**: Design shows "Recent" searches in PlaceSearchSheet, but no backend storage is specified.

**Current Status**: Not in frozen contract (client-side only)

**Sprint 4-5 Implementation**: Store client-side via AsyncStorage:
```typescript
const PLACE_HISTORY_KEY = '@laneshadow/place_search_history'
const MAX_HISTORY_ITEMS = 10
```

**Future Epic Consideration**: If cross-device sync is needed, add `user_search_history` table in future epic.

### 14.5 Bottom Navigation Tab Mapping

**Issue**: Design shows 4-tab navigation (Explore, Saved, Rides, Profile) but "Rides" (RideHistoryScreen) is Phase 3.

**Current Status**: Phase 3 planned (not frozen)

**Workaround (Sprint 4-5)**: Render "Rides" tab as disabled or hidden until Phase 3.

**Phase 3 Resolution**: Enable tab when V014 RideHistoryScreen is implemented.

### 14.6 Wind Overlay Segment Colors

**Issue**: Design specifies exact colors for wind levels (`--wind-low: #94a3b8`, `--wind-moderate: #64748b`, `--wind-high: #b45309`) but backend returns level strings, not colors.

**Current Status**: Frozen (backend returns strings, UI maps to colors)

**Sprint 4-5 Implementation**: Map in UI layer via design-system.md WindDisplayLevels.

**Note**: This is working as intended. Color mapping belongs in UI layer, not backend.

---

## 15. Sprint 4-5 Remaining Tasks

### 15.1 Critical Path (Must Complete)

| Task | Effort | Dependency | Screen/Sheet |
|------|--------|------------|--------------|
| Implement SavedRoutesList (V002) | M | savedRoutes.getSavedRoutesList | V002 |
| Implement SavedRouteDetail (V003) | L | savedRoutes.getSavedRouteDetail | V003 |
| Implement RouteOverviewSheet (S003) | M | V003 | S003 |
| Implement PlaceSearchSheet (S006) | M | usePlaceAutocomplete | S006 |
| Implement RenameRouteSheet (S008) | S | savedRoutes.renameRoute | S008 |
| Implement ConfirmDeleteRouteSheet (S009) | S | savedRoutes.deleteRoute | S009 |
| Wire route saving from RouteOverviewSheet | S | S003 | S003 |

### 15.2 Polish (Should Complete)

| Task | Effort | Screen/Sheet |
|------|--------|--------------|
| Implement WindLegendSheet (S005) | S | S005 |
| Implement AnnotationDetailSheet (S007) | M | S007 |
| Add route polyline color-coding by wind | M | V001 |
| Add current location quick-fill | S | S001 |
| Add route card loading states | S | S002 |
| Add empty state for saved routes | S | V002 |

### 15.3 Deferred (Nice to Have)

| Task | Reason |
|------|--------|
| Rain/Temp legend sheets (S005a, S005b) | Phase 2 overlays |
| External navigation deep link | Low priority |
| Settings screen implementation | Minimal POC |

---

## 16. Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01 | Initial TRD |
| 1.1 | 2024-01 | Added LangGraph implementation notes (Sprint 3) |
| 1.2 | 2026-01 | Design-driven enrichments: UI extensions (§4.3.6), interaction specs (§6.4-6.5), frozen gaps (§14), design system addendum |
| 2.0 | 2026-01-30 | **Major update**: Added implementation status, code locations, Sprint 4-5 task breakdown |

---

## 17. Related Documents

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | TRD index and architecture overview |
| [implementation-map.md](./implementation-map.md) | Code location reference |
| [design-system.md](./design-system.md) | UI component specifications derived from mockups |
| [phase-2-personalization.md](./phase-2-personalization.md) | Phase 2 TRD (Sprints 6-7) |
| [phase-3-post-ride.md](./phase-3-post-ride.md) | Phase 3 TRD (Sprints 8-9) |
| [../designs/mocks/](../designs/mocks/) | HTML design mockups (31 files) |  
