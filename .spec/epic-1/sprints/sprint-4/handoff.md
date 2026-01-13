# Sprint 4 Handoff & Coordination

**Sprint**: Sprint 4 — UI Implementation: Planning Flows + Map Rendering + Saved Routes
**Updated**: 2026-01-13

---

## Active Blockers

None yet. Sprint 4 starting.

---

## Integration Points

### 🟡 FROM SPRINT 3: Backend APIs Ready for Consumption

The following backend endpoints are ready and tested (see `.spec/epic-1/sprints/sprint-3/handoff.md`):

#### Planning Action
- **Endpoint**: `api.actions.agent.planRide(planInput)`
- **Input**: `PlanInput` (start, end, departureTime, preferences)
- **Output**: `PlannedRouteOptionsView` with 2-3 `RouteOption` candidates
- **Each option includes**:
  - `routeOptionId`, `label`, `rationale`
  - `stats`: `{ distanceMeters, durationSeconds, legsCount }`
  - `map`: `{ bounds, overviewGeometry, legs[] }` (ready for map rendering)
  - `overlaysPreview`: `{ windSummary: 'low'|'moderate'|'high'|'unavailable' }`
  - `conditionsStatus`: `'ok'|'unavailable'`

#### Saved Routes Queries/Mutations
- **List**: `api.db.savedRoutes.getSavedRoutesList()` → `SavedRoutesListView`
- **Detail**: `api.db.savedRoutes.getSavedRouteDetail({ savedRouteId })` → `SavedRouteDetailView`
- **Save**: `api.db.savedRoutes.saveRoute(routeData)` → `{ savedRouteId }`
- **Rename**: `api.db.savedRoutes.renameRoute({ savedRouteId, name })` → `null`
- **Delete**: `api.db.savedRoutes.deleteRoute({ savedRouteId })` → `null`

#### Plan Init
- **Endpoint**: `api.db.routesPlan.getPlanInit()` → `PlanInitView`
- **Returns**: defaults and constraints for planning UI

#### Error Handling
- **Pattern**: Deterministic error codes thrown from backend
- **Codes**: `INVALID_INPUT`, `LLM_SKETCH_INVALID`, `ROUTING_COMPILE_FAILED`, etc.
- **Mapping**: Use `lib/errors.ts` to map codes to user-friendly messages
- **Soft-fail**: Weather failures return `conditionsStatus: "unavailable"` (no throw)

### 🟡 IN PROGRESS: Frontend Integration Points

| Component | Status | Consuming Endpoint |
|-----------|--------|-------------------|
| HomeMap | 🟡 Pending | - |
| PlanRideSheet | 🟡 Pending | `getPlanInit` |
| PlaceSearchSheet | 🟡 Pending | Google Places API |
| RouteOptionsSheet | 🟡 Pending | `planRide` response |
| RouteOverviewSheet | 🟡 Pending | Selected route option |
| SavedRoutesList | 🟡 Pending | `getSavedRoutesList` |
| SavedRouteDetail | 🟡 Pending | `getSavedRouteDetail` |

---

## Decisions Needed

### D1: Bottom Sheet Library
- **Options**:
  - a) `@gorhom/bottom-sheet` — Most popular, gesture-based
  - b) `react-native-modal` — Simple modal approach
  - c) Custom implementation with `react-native-reanimated`
- **Recommendation**: `@gorhom/bottom-sheet` for native feel
- **Status**: TBD in Task 02

### D2: Polyline Decoding
- **Options**:
  - a) `@mapbox/polyline` — Established library
  - b) Custom decoder — More control
- **Recommendation**: `@mapbox/polyline` for reliability
- **Status**: TBD in Task 01

---

## Cross-Agent Notes

### For Future Sprints
- Map component should be designed for reuse (saved route detail reuses same rendering)
- Polyline utilities should be pure functions in `lib/` for testability
- Sheet components should follow consistent patterns for future screens

### Theme Compliance
- All new components MUST use `useSemanticTheme()` hook
- Reference existing components in `components/ui/` for patterns
- See `.cursor/rules/theme_rules.mdc` for detailed guidelines

---

## Archived Items

(Items moved here when resolved)
