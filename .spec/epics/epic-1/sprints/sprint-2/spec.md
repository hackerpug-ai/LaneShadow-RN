## Sprint 2 — Backend APIs: saved routes + plan init (view-model queries/mutations)

**Status**: ✅ **Completed**

**Goal**: Implement the full public DB API surface for saved routes + plan init, returning UI-shaped view models per TRD §4.3.5 (using shared types from §4.3.4).

**Backend deliverables**

Implement the TRD §4.3.5 public queries/mutations under `convex/db/*`:

- `db.routesPlan.getPlanInit` (query → PlanInitView)
- `db.savedRoutes.getSavedRoutesList` (query → SavedRoutesListView)
- `db.savedRoutes.getSavedRouteDetail` (query → SavedRouteDetailView)
- `db.savedRoutes.saveRoute` (mutation → `{ savedRouteId }`)
- `db.savedRoutes.renameRoute` (mutation → `null`)
- `db.savedRoutes.deleteRoute` (mutation → `null`)

Also:
- Capabilities model (SavedRouteCapabilities) returned on list + detail (TRD §4.3.3–4.3.4)
- Error semantics (TRD §11), including NOT_FOUND behavior for unauthorized access (TRD §4.3.2)

**Acceptance criteria**

- All endpoints in TRD §4.3.5 (db surface) exist and return the view-model shapes in TRD §4.3.5 (using shared types from §4.3.4).
- Saved routes are immutable snapshots (only metadata like `name` can change).
- Saved routes list is summary-only and bounded (TRD §9).