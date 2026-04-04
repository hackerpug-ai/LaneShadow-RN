---
stability: FEATURE_SPEC
last_validated: 2026-03-04
prd_version: 1.0.0
functional_group: SR
---

# Use Cases: Saved Routes (SR)

Build the route library management interface.

| ID | Title | Description |
|----|-------|-------------|
| UC-SR-01 | Saved Routes List | Browse all saved routes with chronological display |
| UC-SR-02 | Route Search & Filter | Find routes by name, location, or date range |
| UC-SR-03 | Route Detail View | View full route details with map and overlays |
| UC-SR-04 | Route Management | Rename, delete, and organize saved routes |

---

## UC-SR-01: Saved Routes List

**Description**: Replace the stub saved routes screen with a functional list view showing all saved routes with key metadata.

**Existing Infrastructure**:
- `app/(app)/(tabs)/saved-routes.tsx` - stub screen exists
- `convex/db/savedRoutes.ts` - `listByOwner` query exists
- `hooks/use-saved-routes.ts` - hook exists
- `components/saved-route-card.tsx` - card component exists

**Acceptance Criteria**:
- [ ] Rider can view a scrollable list of all saved routes on the Saved Routes tab
- [ ] Rider can see route name, date saved, start/end locations, and distance on each card
- [ ] Rider can see a route thumbnail preview (mini map) on each card
- [ ] System displays routes in reverse chronological order (newest first)
- [ ] Rider can see empty state with call-to-action when no routes saved

---

## UC-SR-02: Route Search & Filter

**Description**: Enable riders to find specific routes quickly within their library.

**Acceptance Criteria**:
- [ ] Rider can search routes by name using a search input
- [ ] Rider can filter routes by date range (last week, last month, custom)
- [ ] Rider can filter routes by start or end location
- [ ] System displays filtered results in real-time as filters change
- [ ] Rider can clear all filters with a single action

---

## UC-SR-03: Route Detail View

**Description**: When a rider selects a saved route, display full details with the same rendering quality as the planning experience.

**Existing Infrastructure**:
- `components/sheets/route-details-sheet.tsx` - partial implementation
- `components/route-timeline.tsx` - leg details component
- Route rendering works on home screen

**Acceptance Criteria**:
- [ ] Rider can tap a saved route card to open full detail view
- [ ] Rider can see the route rendered on a full map with all overlays available
- [ ] Rider can view route timeline with leg-by-leg breakdown
- [ ] Rider can see the original scenic rationale and weather conditions
- [ ] Rider can toggle between wind/rain/temp overlays on the detail map
- [ ] Rider can navigate back to list without losing scroll position

---

## UC-SR-04: Route Management

**Description**: Enable riders to organize their route library with rename and delete capabilities.

**Existing Infrastructure**:
- `convex/db/savedRoutes.ts` - needs `delete` and `update` mutations

**Acceptance Criteria**:
- [ ] Rider can rename a saved route from the detail view
- [ ] Rider can delete a saved route with confirmation dialog
- [ ] System removes deleted routes immediately from the list
- [ ] Rider can undo delete within 5 seconds (soft delete)
- [ ] Rider can swipe-to-delete from the list view (optional shortcut)
