# Sprint 4 — UI Implementation: Planning Flows + Map Rendering + Saved Routes

**Status**: Planning
**Epic**: `.spec/epic-1/TRD.md`
**Duration**: ~2 weeks
**Assignee**: UI Developer

---

## Overview

Sprint 4 implements the complete user-facing Epic 1 experience: plan → compare → inspect → save → reopen → manage. This is a **frontend-focused sprint** building all essential screens and sheets using the backend APIs delivered in Sprints 2-3.

## Goals

1. Implement Google Maps integration with polyline rendering
2. Build the complete planning flow (PlanRideSheet → RouteOptions → RouteOverview)
3. Build the saved routes management flow (list → detail → rename → delete)
4. Wire all UI to real Convex endpoints (no placeholders)
5. Ensure all UI uses semantic theme system (no hardcoded colors)

## Key Decisions

- **Mapping SDK**: Google Maps (`react-native-maps` with Google provider)
- **Scope**: Full essential subset per TRD §6.3
- **Places**: Include PlaceSearchSheet (S006) with Google Places API
- **Theme**: All components use `useSemanticTheme()` hook — no hardcoded hex colors

## Design References

All screens have design mockups. **Important**: These designs are conceptual references — colors and typography must be adapted to the app's semantic theme system.

| Screen | Design File | Notes |
|--------|-------------|-------|
| HomeMap (V001) | `home.mapview.designs.html` | Main map shell |
| PlanRideSheet (S001) | `home.planridesheet.design.html` | Plan input form |
| RouteOptionsSheet (S002) | `home.routeoptions.designs.html` | Compare routes |
| RouteOverviewSheet (S003) | `routeoverview.designs.html` | Route details, wind per leg, save action |
| PlaceSearchSheet (S006) | `placesearch.designs.html` | Location autocomplete |
| WindLegendSheet (S005) | `whind-legend.designs.html` | Wind overlay legend |
| SavedRoutesList (V002) | `saved.routes.designs.html` | List view |
| SavedRouteDetail (V003) | `saved.routes.designs.html` | Detail view |
| RenameRouteSheet (S008) | `renameroute.designs.html` | Rename dialog |
| ConfirmDeleteRouteSheet (S009) | `deleteroute.designs.html` | Adapt to bottom sheet |

### Design Adaptation Notes

When implementing these designs:
1. **Colors**: Replace hardcoded hex colors with semantic theme tokens (`semantic.color.*`)
2. **Typography**: Use React Native Paper `Text` component with proper variants
3. **Spacing**: Use semantic spacing tokens (`semantic.space.*`)
4. **Delete Sheet**: Design shows centered modal — adapt to bottom sheet pattern
5. **Loading/Error**: No explicit designs — derive from existing sheet patterns

## Environment Variables Required

Sprint 4 requires these environment variables:
- `GOOGLE_MAPS_API_KEY` — for map rendering
- `GOOGLE_PLACES_API_KEY` — for place autocomplete (may be same key)

## Dependencies

- Sprint 3 complete (planRide action, providers, overlays)
- Sprint 2 complete (savedRoutes queries/mutations)
- Google Maps API key configured

## Acceptance Criteria

- [ ] **AC1**: Planning flow works end-to-end: PlanRide → Options → Overview (with loading + error handling)
- [ ] **AC2**: Save from RouteOverview creates a saved route; list shows it immediately
- [ ] **AC3**: Opening a saved route renders the same snapshot geometry and overlays without recomputation
- [ ] **AC4**: Rename updates only name/metadata; snapshot remains unchanged
- [ ] **AC5**: Delete removes the route and returns to list with correct empty state handling
- [ ] **AC6**: All UI uses semantic theme (no hardcoded colors)
- [ ] **AC7**: Map renders polylines correctly (overview + legs + wind overlay segments)
- [ ] **AC8**: Place search returns autocomplete results and populates start/end fields

## Tasks

See `tasks.md` for detailed task breakdown (11 tasks across 4 phases).

## Risks

- **R1**: Google Maps API key issues — Mitigation: document setup clearly, test early
- **R2**: Polyline decoding complexity — Mitigation: use established library (e.g., `@mapbox/polyline`)
- **R3**: Bottom sheet library compatibility — Mitigation: evaluate options in Task 02

## Out of Scope

- Turn-by-turn navigation
- Offline map support
- Route editing/dragging
- Push notifications
