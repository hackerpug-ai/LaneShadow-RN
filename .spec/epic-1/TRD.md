# TRD: Lane Shadow PRD V1

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

1. **HomeMap (V001)** — map-first shell that hosts planning + route rendering
2. **SavedRoutesList (V002)** — list of saved routes (summary)
3. **SavedRouteDetail (V003)** — saved route replay (immutable snapshot)
4. **Settings (V006)** — minimal POC settings
5. **LegalAbout (V007)** — about + legal (low design priority)
6. **AuthSignIn (V008)** — sign in (Clerk wrapper/hosted)
7. **AuthSignUp (V009)** — sign up (Clerk wrapper/hosted)
8. **SessionRestoring (V010)** — startup/session loading

#### B. Sheets / Modals / Overlays (UI states that behave like screens)

9. **PlanRideSheet (S001)** — start/end + preferences
10. **RouteOptionsSheet (S002)** — compare 2–3 routes
11. **RouteOverviewSheet (S003)** — details, overlays, save
12. **PlanningErrorSheet (S004)** — plan failures
13. **WindLegendSheet (S005)** — overlay legend
14. **PlaceSearchSheet (S006)** — choose start/end place
15. **AnnotationDetailSheet (S007)** — place/condition detail
16. **RenameRouteSheet (S008)** — rename saved route
17. **ConfirmDeleteRouteSheet (S009)** — confirm delete
18. **RoutePlannerLoading (V004 overlay)** — progress while planning
19. **EmptyStateStandalone (V005)** — reusable empty screen (optional, if you don’t embed empties)

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

### 6.3 “Most Essential” subset (if you want to cut scope hard)

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
