# Epic 1 Roadmap: LaneShadow v1.0

## Current Status (as of 2026-01-29)

- **Epic status**: **In Progress** (Expanded from POC to v1.0)
- **Phases**: 3 phases, 9 sprints total
  - **Phase 1: Core POC** (Sprints 1-5)
    - ✅ Sprint 1 complete (infra: theming + auth + data modeling)
    - ✅ Sprint 2 complete (Backend APIs: saved routes + plan init)
    - ✅ Sprint 3 complete (Backend data flows: PlanRide action + providers + overlays)
    - ⏳ Sprint 4 in progress (UI implementation: ~50% complete)
    - 📋 Sprint 5 planned (Hardening + weather overlays: rain/temp)
  - **Phase 2: Personalization** (Sprints 6-7) — 📋 Planned
  - **Phase 3: Post-Ride** (Sprints 8-9) — 📋 Planned

## TRD Documentation

Technical requirements are split by phase:

| Document | Phase | Status |
|----------|-------|--------|
| [trd/phase-1-core.md](./trd/phase-1-core.md) | Phase 1 | ✅ Implemented |
| [trd/phase-2-personalization.md](./trd/phase-2-personalization.md) | Phase 2 | 📋 Planned |
| [trd/phase-3-post-ride.md](./trd/phase-3-post-ride.md) | Phase 3 | 📋 Planned |

See [trd/README.md](./trd/README.md) for overview and API surface summary.

---

## Phase Overview

```
Phase 1 (Sprints 1-5)      Phase 2 (Sprints 6-7)       Phase 3 (Sprints 8-9)
┌─────────────────────┐    ┌─────────────────────┐     ┌─────────────────────┐
│ Route Planning      │    │ Favorite Roads      │     │ Route Rating        │
│ Wind Overlay        │    │ Avoid Areas         │     │ Ride Notes          │
│ Rain/Temp Overlays  │ →  │ Elevation Profile   │  →  │ Ride History        │
│ Save/Reopen Routes  │    │ Enhanced Comparison │     │ Time Optimization   │
│ Core UI             │    │ Preferences UI      │     │ Post-Ride UI        │
└─────────────────────┘    └─────────────────────┘     └─────────────────────┘
```

---

## Scope Summary by Phase

### Phase 1: Core POC (must complete by Sprint 5)

**Backend (Convex)**:
- `saved_routes` table + indexes (TRD phase-1 §3.1)
- Public view-model queries/mutations (TRD phase-1 §4.3.5):
  - `db.routesPlan.getPlanInit`
  - `db.savedRoutes.getSavedRoutesList`
  - `db.savedRoutes.getSavedRouteDetail`
  - `db.savedRoutes.saveRoute` / `renameRoute` / `deleteRoute`
- Planning action: `actions.agent.planRide`
- Weather overlays: wind, rain, temperature (Open-Meteo)

**Frontend (Expo/React Native)**:
- HomeMap (V001) + planning sheets (S001–S004) + loading overlay (V004)
- SavedRoutesList (V002) + SavedRouteDetail (V003)
- Map rendering: overview → legs → overlays → annotations

### Phase 2: Personalization (Sprints 6-7)

**Backend (Convex)**:
- `user_preferences` table (TRD phase-2 §1.1)
- `favorite_roads` table (TRD phase-2 §1.2)
- Preferences CRUD: `db.userPreferences.*`
- Favorites CRUD: `db.favoriteRoads.*`
- Planning integration: apply preferences, match favorites

**Frontend**:
- PreferencesScreen (V011)
- AvoidAreasScreen (V012)
- FavoriteRoadsScreen (V013)
- ElevationProfileSheet (S012)
- Enhanced RouteOptionsSheet with elevation preview

### Phase 3: Post-Ride (Sprints 8-9)

**Backend (Convex)**:
- Extended `saved_routes` with rating fields
- `ride_history` table (TRD phase-3 §1.2)
- Rating mutations: `db.savedRoutes.rateRoute` / `markCompleted`
- History queries: `db.rideHistory.list` / `getDetail`
- Time-of-day optimization in `planRide`

**Frontend**:
- RateRouteSheet (S013)
- RideHistoryScreen (V014)
- DepartureOptimizerSheet (S014)
- Updated SavedRouteDetail with rating display

---

## Convex Endpoint Placement

Per TRD and `.cursor/rules/convex_rules.mdc`:

- **All queries/mutations** → `convex/db/`
- **Actions (external APIs)** → `convex/actions/`
- **Agentic orchestration** → `convex/actions/agent/`

| Phase | New Endpoints |
|-------|---------------|
| Phase 1 | `db/routesPlan.ts`, `db/savedRoutes.ts`, `actions/agent/planRide.ts` |
| Phase 2 | `db/userPreferences.ts`, `db/favoriteRoads.ts` |
| Phase 3 | Extended `db/savedRoutes.ts`, `db/rideHistory.ts` |

---

## Sprint Details

### Sprint 1 — Infra foundations: theming + auth + data modeling

**Status**: ✅ **Complete**

**Goal**: Land cross-cutting infra (theming + auth plumbing) and the core data model.

**Deliverables**:
- Semantic theme via `useSemanticTheme()`
- Auth surfaces (SessionRestoring, SignIn/SignUp)
- `saved_routes` table + indexes
- v-first validators for TRD shared types
- Internal viewer helper with POC authz

**Acceptance criteria**:
- ✅ Schema compiles, Convex codegen succeeds
- ✅ Auth-required behavior in place
- ✅ Convex functions are v-first

---

### Sprint 2 — Backend APIs: saved routes + plan init

**Status**: ✅ **Complete**

**Goal**: Implement full public DB API surface for saved routes + plan init.

**Deliverables**:
- `db.routesPlan.getPlanInit` → PlanInitView
- `db.savedRoutes.*` → List, Detail, Save, Rename, Delete
- Capabilities model on list + detail
- Error semantics (NOT_FOUND for unauthorized)

**Acceptance criteria**:
- ✅ All endpoints return view-model shapes
- ✅ Saved routes are immutable snapshots
- ✅ List is summary-only and bounded

---

### Sprint 3 — Backend data flows: PlanRide action + providers + overlays

**Status**: ✅ **Complete**

**Goal**: Implement `planRide` end-to-end with wind overlay support.

**Deliverables**:
- `actions.agent.planRide` via LangGraph StateGraph
- LLM sketching + validation
- Route compilation + normalization
- Weather provider (Open-Meteo) with soft-fail
- Reliability: timeouts, bounded concurrency, retry-once

**Key Files**:
| Component | File |
|-----------|------|
| Main action | `convex/actions/agent/planRide.ts` |
| LangGraph pipeline | `convex/actions/agent/graphs/planningGraph.ts` |
| Weather provider | `convex/actions/agent/providers/weather-provider.ts` |

**Acceptance criteria**:
- ✅ Returns 2-3 options with overlays
- ✅ Hard failures produce error codes
- ✅ Soft conditions failures still return routes

---

### Sprint 4 — UI implementation: planning flows + map rendering + saved routes

**Status**: ⏳ **In Progress** (~50% complete)

**Goal**: Build user-facing planning and saved routes experience.

**Deliverables**:
- Screens: HomeMap (V001), SavedRoutesList (V002), SavedRouteDetail (V003)
- Sheets: PlanRideSheet (S001), RouteOptionsSheet (S002), RouteOverviewSheet (S003)
- Loading + error handling (V004, S004)
- Map rendering: polylines + wind overlays
- Saved route management: rename, delete

**Completed Tasks (01-07)**:
- ✅ Map infrastructure (Google Maps + polylines)
- ✅ Navigation + sheet infrastructure
- ✅ Hook wiring to Convex endpoints
- ✅ PlanRideSheet with autocomplete
- ✅ RouteOptionsSheet with wind badges
- ⏳ RouteOverviewSheet
- ⏳ SavedRoutesList / SavedRouteDetail
- ⏳ Integration testing

**Acceptance criteria**:
- [ ] Planning flow works end-to-end
- [ ] Save creates route; list shows immediately
- [ ] Saved routes render without recomputation
- [ ] Rename/delete work correctly

---

### Sprint 5 — Hardening + Weather Overlays (Rain/Temp)

**Status**: 📋 **Planned**

**Goal**: Stabilize Phase 1 and add rain/temperature overlays.

**Deliverables**:

**Weather Overlays (NEW)**:
- Extend weather provider for rain + temperature
- Add rain/temp overlay schemas
- Update RouteOptionsSheet with multi-overlay preview
- Side-by-side comparison enhancement

**Testing & QA**:
- Seed scenarios for saved routes
- E2E smoke: auth → plan → compare → save → reopen → rename → delete

**Performance**:
- List queries summary-only and bounded
- Action runtime validation

**Docs**:
- Update `convex/README.md` with API surface

**Acceptance criteria**:
- [ ] Rain + temperature overlays working
- [ ] All Phase 1 screens functional end-to-end
- [ ] Planning returns max 2-3 options consistently
- [ ] Saved routes reopen identically

---

### Sprint 6 — Personalization: Preferences + Favorites

**Status**: 📋 **Planned**

**Goal**: Enable users to save favorite roads and set route preferences.

**TRD Reference**: [trd/phase-2-personalization.md](./trd/phase-2-personalization.md)

**Backend Deliverables**:
- `user_preferences` table + validators
- `favorite_roads` table + validators
- Preferences CRUD mutations
- Favorites CRUD mutations
- Planning integration: apply preferences to route generation

**Frontend Deliverables**:
- PreferencesScreen (V011)
- FavoriteRoadsScreen (V013)
- AddFavoriteRoadSheet (S011) - save road from route
- Update PlanRideSheet with preference display

**Acceptance criteria**:
- [ ] Users can set default preferences
- [ ] Users can add/remove avoid areas
- [ ] Users can save roads as favorites
- [ ] Preferences affect route generation

---

### Sprint 7 — Personalization: Elevation + Enhanced Comparison

**Status**: 📋 **Planned**

**Goal**: Add elevation profiles and improve route comparison UX.

**TRD Reference**: [trd/phase-2-personalization.md](./trd/phase-2-personalization.md)

**Backend Deliverables**:
- Open-Meteo elevation provider
- Elevation overlay schema + processing
- Favorite roads matching in planning pipeline
- Extended PlannedRouteOptionsView with elevation preview

**Frontend Deliverables**:
- ElevationProfileSheet (S012)
- AvoidAreasScreen (V012) with map drawing
- Update RouteOptionsSheet with elevation + favorite badges
- Update RouteOverviewSheet with "Save as Favorite" action

**Acceptance criteria**:
- [ ] Elevation profile displays for routes
- [ ] Route comparison shows elevation summary
- [ ] Avoid areas can be drawn on map
- [ ] Favorite roads highlighted when included in routes

---

### Sprint 8 — Post-Ride: Rating + History Foundation

**Status**: 📋 **Planned**

**Goal**: Enable ride completion tracking, ratings, and history browsing.

**TRD Reference**: [trd/phase-3-post-ride.md](./trd/phase-3-post-ride.md)

**Backend Deliverables**:
- Extend `saved_routes` with rating + status fields
- `ride_history` table + validators
- Rating mutations: `rateRoute`, `markCompleted`
- History queries: `list`, `getDetail`

**Frontend Deliverables**:
- RateRouteSheet (S013)
- RideHistoryScreen (V014)
- RideDetailSheet (S015)
- Update SavedRouteDetail with "Mark Complete" + rating display
- Update SavedRoutesList with status/rating indicators

**Acceptance criteria**:
- [ ] Users can mark rides as completed
- [ ] Users can rate routes 1-5 stars
- [ ] Users can add notes to rated routes
- [ ] Ride history shows completed rides

---

### Sprint 9 — Post-Ride: Time Optimization + Polish

**Status**: 📋 **Planned**

**Goal**: Add departure time optimization and finalize v1.0.

**TRD Reference**: [trd/phase-3-post-ride.md](./trd/phase-3-post-ride.md)

**Backend Deliverables**:
- Hourly forecast fetching in weather provider
- Departure window computation
- Extended PlanInitView with optimization windows

**Frontend Deliverables**:
- DepartureOptimizerSheet (S014)
- Integration into PlanRideSheet ("Best time" suggestion)
- Polish: loading states, error handling, edge cases

**QA & Finalization**:
- E2E: complete ride loop (plan → save → ride → rate → history)
- Performance validation across all phases
- Documentation update

**Acceptance criteria**:
- [ ] Departure optimization shows best windows
- [ ] All Phase 1-3 features functional end-to-end
- [ ] Rating completion flow works smoothly
- [ ] History accurately reflects ride activity

---

## Cross-Phase Principles

1. **Additive Only** - New phases add tables/endpoints without modifying Phase 1 contracts
2. **Backward Compatible** - Existing saved routes remain valid across all phases
3. **Provider Agnostic** - Geometry/overlay formats support multiple providers
4. **Immutable Snapshots** - Route snapshots never change after save
5. **Graceful Degradation** - Missing data (preferences, history) doesn't break core flows

---

## Change Log

| Date | Change | Sprints Affected |
|------|--------|------------------|
| 2025-01-11 | Initial POC sprint plan (5 sprints) | 1-5 |
| 2026-01-29 | Expanded to v1.0: added Phase 2-3 (Sprints 6-9) | 6-9 |
| 2026-01-29 | Renamed SPRINT_PLAN.md → EPIC-ROADMAP.md | — |
| 2026-01-29 | Restructured TRD into trd/ folder | — |
| 2026-01-29 | Added rain/temp overlays to Sprint 5 | 5 |
