---
stability: FEATURE_SPEC
last_validated: 2026-04-27
prd_version: 1.0.0
functional_group: ROUTE
---

# Use Cases: Saved Routes CRUD (ROUTE)

| ID | Title | Description |
|----|-------|-------------|
| UC-ROUTE-01 | Save a planned route as favorite | SaveFavoriteSheet captures name and creates `saved_routes` row with immutable snapshot |
| UC-ROUTE-02 | View list of saved routes | SavedRoutesListScreen with search, recently-saved ordering, swipe actions |
| UC-ROUTE-03 | View saved route detail | SavedRouteDetailScreen reuses RouteDetailsScreen template against saved snapshot |
| UC-ROUTE-04 | Rename, delete, and undo-delete a saved route | Rename inline; soft-delete with 30-day undo via toast |

---

## UC-ROUTE-01: Save a planned route as favorite

SaveFavoriteSheet (NEW UI; bottom sheet using V2 LSBottomSheet organism) captures a route name and creates an immutable `saved_routes` row. The snapshot freezes geometry, bounds, and overlay metadata at save time — overlays drift in subsequent enrichments do NOT mutate the saved snapshot. Mirrors RN `components/ui/save-favorite-sheet.tsx`.

- **Maps to**: NEW UI — SaveFavoriteSheet
- **Backend**: mutation `db.savedRoutes.saveRoute({planInput, routeSnapshot, routeIndex, snapshotMeta})` — input validators in `convex/models/saved-routes.ts`
- **Composition**: V2 LSBottomSheet (organism) + LSText + LSTextField + LSInstrumentReadout (metadata display) + LSButton (Cancel + Save row)

### Acceptance Criteria

- ☐ User can open the SaveFavoriteSheet from the "Save" button in the LSRouteSheet on RouteDetailsScreen
- ☐ User can view the route's distance, duration, and saved-at timestamp in the LSInstrumentReadout
- ☐ User can edit the pre-populated route name (default: "{startLabel} → {destinationLabel}") in the LSTextField
- ☐ User can tap "Save" to call `db.savedRoutes.saveRoute` with the captured name + planInput + routeSnapshot + routeIndex (geometry fingerprint) + snapshotMeta (timestamp, overlay status)
- ☐ System closes the sheet and shows an LSToast success toast on successful save
- ☐ System prevents saving the same route fingerprint twice and shows an "Already saved" inline state instead of saving again

---

## UC-ROUTE-02: View list of saved routes

SavedRoutesListScreen (NEW UI) displays the user's saved routes ordered by save date. Search field filters by name. Pull-to-refresh re-fetches. Swipe-to-delete on iOS / long-press menu on Android initiates UC-ROUTE-04 delete. Mirrors RN `app/(app)/(tabs)/saved-routes.tsx`.

- **Maps to**: NEW screen — SavedRoutesListScreen
- **Backend**: paginated subscribe `db.savedRoutes.getSavedRoutesList({searchQuery?, limit, cursor})`
- **Composition**: V2 LSTopBar + LSTextField (search variant) + LSListRow per row + LSEmptyState (zero state) + LSToolbar (sort/filter chips)
- **List row**: route polyline thumbnail (compact LSMap) + route name (LSText) + distance + saved-at date + LSPill scenic-score

### Acceptance Criteria

- ☐ User can view the saved-routes list ordered by most recently saved
- ☐ User can search saved routes by name using the search field, which calls `db.savedRoutes.getSavedRoutesList` with `searchQuery`
- ☐ User can tap any list row to navigate to SavedRouteDetailScreen for that route (UC-ROUTE-03)
- ☐ User can pull-to-refresh to re-fetch the saved-routes query and refresh the list
- ☐ System displays the LSEmptyState molecule with a "Plan your first ride" CTA when the user has zero saved routes

---

## UC-ROUTE-03: View saved route detail

SavedRouteDetailScreen (variant of V2 RouteDetailsScreen) hydrates the LSRouteSheet from a `saved_routes` row's snapshot rather than a live `route_plans` entry. Adds Rename and Delete actions in a toolbar. The "Plan again" button seeds a new session with the saved route's `planInput`.

- **Maps to**: V2 RouteDetailsScreen (variant: source = saved snapshot)
- **Backend**: query `db.savedRoutes.getSavedRouteDetail({savedRouteId})`, mutation `db.planningSessions.createSession({firstMessage, seedPlanInput?})` for re-plan
- **Composition**: V2 RouteDetailsScreen with overrides: source = saved snapshot, action row replaced with Rename / Delete / Plan again

### Acceptance Criteria

- ☐ User can view a saved route's full route sheet (distance, duration, elevation, weather timeline, scenic score) hydrated from the saved snapshot
- ☐ User can tap "Plan again" to call `db.planningSessions.createSession` with the saved `planInput` and route to PlanningScreen for the new session
- ☐ User can tap "Rename" to invoke UC-ROUTE-04 inline rename with the existing name pre-populated
- ☐ User can tap "Delete" to invoke UC-ROUTE-04 soft-delete with confirmation
- ☐ System displays the saved-at timestamp in the LSRouteSheet metadata row
- ☐ System renders the saved route's polyline on the LSMap using the snapshot's frozen geometry

---

## UC-ROUTE-04: Rename, delete, and undo-delete a saved route

Rename inline via LSTextField; soft-delete with 30-day recovery window (server-side scheduled function permanently removes after 30 days); undo via LSToast action button after delete.

- **Maps to**: SavedRoutesListScreen swipe action + SavedRouteDetailScreen toolbar
- **Backend**:
  - Rename: mutation `db.savedRoutes.renameRoute({savedRouteId, newName})`
  - Soft-delete: mutation `db.savedRoutes.softDeleteRoute({savedRouteId})` (sets `deletedAt`)
  - Undo: mutation `db.savedRoutes.undoDeleteRoute({savedRouteId})` (clears `deletedAt`)
- **UI behavior**: optimistic update on rename; immediate hide-from-list on delete; toast "Route deleted" with "Undo" action button visible for ~5 seconds; undo restores

### Acceptance Criteria

- ☐ User can rename a saved route from the SavedRoutesListScreen swipe action menu or the SavedRouteDetailScreen toolbar
- ☐ User can soft-delete a saved route from the SavedRoutesListScreen swipe action or the detail toolbar, which calls `db.savedRoutes.softDeleteRoute`
- ☐ User can tap "Undo" in the post-delete LSToast within ~5 seconds to restore the route via `db.savedRoutes.undoDeleteRoute`
- ☐ System shows the renamed route name immediately via optimistic update and reverts on mutation failure with an error toast
- ☐ System hides soft-deleted routes from the list immediately on delete (filtered server-side via `deletedAt IS NULL` clause)
