# RUX-002: Plot only the currently-paged route's polyline on the map (one at a time); paging refits the camera

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** M · **Estimate:** 150 min
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** react-native-ui-planner
**Agent rationale:** Narrows the `routePolylines` useMemo (`index.tsx:805-854`) + the use-route-comparison polylines builder (84-112) from "all options" to "the selected/paged route only", and re-fits the camera on page change via the existing `doFit`/`requestFitToRoute` seam. Pure plan-view map state — no Convex change.

> **Remedial — Sprint 1 testing feedback (item 6):** "we should show one route at a time, to see." Pairs with RUX-001 (carousel owns `selectedRouteId`; this makes the MAP follow it).

## Outcome

With multiple routes available, only one polyline (the selected/paged route's coordinates) is on the map; paging to the next route swaps the plotted coordinates and the camera re-fits to frame it (fitToCoordinates for multi-point, setCameraPosition zoom 12 for centroid-only). No muted alternate polylines remain.

## Specification

`use-route-comparison.ts:84-112` builds polylines for ALL options (selected=copper, alternates=muted) and `index.tsx:805-854` flattens them all. Restrict the builder/memo to the SELECTED route only so exactly one route's polyline renders. On `selectedRouteId` change (carousel paging from RUX-001), re-run the fit via the EXISTING `doFit` (`index.tsx:558-597`) / `requestFitToRoute` (`registerFitHandler`, 671-684) seam — `fitToCoordinates` for a multi-point polyline, `setCameraPosition` zoom 12 for a centroid-only route. Reuse `buildRoutePolylines` → `RoutePolyline` (no second render path). Selected stroke stays `semantic.color.primary`; no alternate-gray polylines remain.

## Critical Constraints

- **MUST** render only the polyline for `flowState.selectedRouteId` — exactly ONE route's coordinates at a time. When the carousel pages, the plotted polyline switches to the new selected route and the camera re-fits via the existing `doFit`/`requestFitToRoute` seam.
- **NEVER** render alternate/muted polylines for the non-selected options simultaneously (today the builder maps ALL options). **NEVER** add a second map render path — reuse `buildRoutePolylines` → `RoutePolyline`. **NEVER** hardcode colors/widths — via semantic.
- **STRICTLY** drive the re-fit from `selectedRouteId` change through the EXISTING `doFit` (multi-point `fitToCoordinates` / centroid `setCameraPosition` zoom 12) seam — never a new fit implementation.

## Acceptance Criteria

### AC-1: Only the selected route's polyline is plotted
*(PRIMARY)*
- **GIVEN** the plan view in ROUTE_RESULTS with two distinct routes and `selectedRouteId === the first route`
- **WHEN** the map renders
- **THEN** `home-route-polyline` renders only the first route's coordinates and no polyline for the second (non-selected) route is present
- **Test tier:** `integration` · **Service:** live Convex dev (route_plans) + MapboxMapViewHandle via @testing-library/react-native
- **Verify:** `pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t plotsOnlySelectedRoute`

### AC-2: Paging swaps the plotted route and re-fits the camera
- **GIVEN** two distinct routes, first selected and plotted
- **WHEN** the rider pages to the second route (`selectedRouteId` changes)
- **THEN** the plotted polyline switches to the second route's coordinates and the map handle receives a fit call (fitToCoordinates with the second route's coords, or setCameraPosition for a centroid-only route)
- **Test tier:** `integration` · **Service:** live Convex dev + MapboxMapViewHandle via @testing-library/react-native
- **Verify:** `pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t pagingSwapsPlottedRouteAndRefits`

### AC-3: Centroid-only paged route still plots and frames (edge)
- **GIVEN** the currently-paged route has only a single centroid coordinate (no multi-point geometry)
- **WHEN** it becomes the selected/plotted route
- **THEN** `doFit` takes the centroid branch — `setCameraPosition` zoom 12 centered on the centroid — and does not crash or leave the camera static
- **Test tier:** `integration` · **Service:** live Convex dev + MapboxMapViewHandle via @testing-library/react-native
- **Verify:** `pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t centroidPagedRouteFramesAtZoom12`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Only the selected route's coordinates render; the non-selected route's polyline is absent. | AC-1 | `pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t plotsOnlySelectedRoute` |
| TC-2 | Paging swaps the plotted coordinates to the new route and re-fits the camera for it. | AC-2 | `pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t pagingSwapsPlottedRouteAndRefits` |
| TC-3 | A centroid-only paged route frames at `setCameraPosition` zoom 12 without crashing. | AC-3 | `pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t centroidPagedRouteFramesAtZoom12` |

## Reading List

- `app/(app)/(tabs)/index.tsx` (805-854) — `routePolylines` useMemo flattening ALL options — narrow to the selected route only
- `hooks/use-route-comparison.ts` (84-112) — polylines builder mapping every option (selected=copper, alternates=muted) — restrict to the selected option
- `app/(app)/(tabs)/index.tsx` (558-597) — `doFit` (multi-point fitToCoordinates vs centroid setCameraPosition zoom 12) + pending-fit flush — reuse for the re-fit
- `app/(app)/(tabs)/index.tsx` (671-684) — `registerFitHandler(doFit)` + the agentActiveOption fit effect — hook the selectedRouteId-change re-fit here
- `components/map/route-polyline-component.tsx` (180-226) — RoutePolyline rendering ShapeSource/LineLayer per polyline — single render path to reuse

## Guardrails

**WRITE-ALLOWED:** `app/(app)/(tabs)/index.tsx`, `hooks/use-route-comparison.ts`, `app/(app)/(tabs)/index.one-route.integration.test.tsx` (NEW)
**WRITE-PROHIBITED:** `components/map/route-polyline-component.tsx`, `convex/**`, `components/map/route-summary-carousel.tsx`

## Design

- ref: DESIGN-S01-005 (one-route-at-a-time map state paired with the carousel)
- **Pattern:** `selectedRouteId` → single `buildRoutePolylines` → `RoutePolyline` → `doFit` re-fit.
- **Anti-pattern:** Flattening all options' polylines onto the map at once (the removed `index.tsx:805-854` / `use-route-comparison.ts:84-112` all-options map).
- **Interaction notes:** only the selected route's polyline is on the map; no muted alternates; page change (`selectedRouteId`) re-fits via `doFit` (multi-point vs centroid branch preserved); selected stroke stays copper.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'app/(app)/(tabs)/index.tsx' 'hooks/use-route-comparison.ts'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: the AC-1 test must FAIL on the current all-options plotting (both polylines present) before the change makes it pass` |
| human_gate | `On-device (real iOS+Android, live Convex): plan a ride → map shows ONE route line; paging the carousel swaps the line and re-centers` |

## Coding Standards

- Reuse `buildRoutePolylines` + `RoutePolyline` + `doFit`; do not reimplement plotting or fitting.
- All stroke colors/widths via semantic; selected = `semantic.color.primary`; no alternate-gray polylines remain.
- Re-fit on `selectedRouteId` change via the existing `requestFitToRoute`/`registerFitHandler` seam — no new fit code path.
- Integration test renders the real screen against live Convex; Mapbox handle stubbed only at the native boundary (assert fitToCoordinates/setCameraPosition); Convex data NOT mocked.
- No `any` on the selected PlannedRouteOptionView passed into buildRoutePolylines.

## Dependencies

- Depends on: RUX-001 (carousel owns `selectedRouteId`), DATA-008b (real route data)
- Blocks: RUX-004 (the tag anchors to the single plotted route)

## Notes

Pairs with RUX-001: the carousel owns `selectedRouteId`; this task makes the MAP follow it (one route plotted + re-fit). Kept separate so each is a single review-able commit. `use-route-comparison.ts:84-112` currently builds alternates as muted gray — the simplest correct change is to map only the selected option (filter to `selectedRouteId`) so the alternate branch never produces polylines; verify the e2e `home-route-polyline` testID still resolves.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "plan_view_two_distinct_routes_first_selected": {
      "description": "plan view in ROUTE_RESULTS against live Convex with two distinct routes (multi-point geometry), selectedRouteId === first option",
      "seed_method": "public_api",
      "records": [ "two distinct route_plans options with overviewGeometry", "selectedRouteId = first option" ]
    },
    "plan_view_centroid_route_selected": {
      "description": "plan view in ROUTE_RESULTS where the selected/paged route has only a centroid (single coordinate), no multi-point geometry",
      "seed_method": "public_api",
      "records": [ "a route option whose overviewGeometry decodes to a single coordinate", "selectedRouteId = that centroid option" ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN ROUTE_RESULTS with two distinct routes, first selected WHEN the map renders THEN only the first route's polyline renders and the second route's polyline is absent",
      "verify": "pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t plotsOnlySelectedRoute",
      "scenario": {
        "start_ref": "plan_view_two_distinct_routes_first_selected", "tier": "visible", "test_tier": "integration",
        "verification_service": "live Convex dev + MapboxMapViewHandle via @testing-library/react-native",
        "negative_control": { "would_fail_if": [
          "polylines for BOTH options render (the old all-options flatten at index.tsx:805-854 still in place)",
          "the rendered coordinates belong to the non-selected route (wrong route plotted)",
          "no polyline renders at all (selected route disconnected — empty map)"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_two_distinct_routes_first_selected",
          "action": { "actor": "user", "steps": [
            "render the plan view against live Convex with two distinct routes, first selected",
            "count the rendered route polyline shape sources and read their coordinates"
          ] },
          "end_state": {
            "must_observe": [
              "queryAllByTestId('home-route-polyline').length === 1 (exactly one route polyline group)",
              "queryByTestId('home-route-polyline') !== null",
              "the rendered polyline coordinates === the FIRST route's decoded overviewGeometry (e.g. first coordinate latitude === 37.77)"
            ],
            "must_not_observe": [
              "polyline coordinates from the second (non-selected) route present on the map",
              "two alternate/selected polyline groups rendered simultaneously",
              "queryByTestId('home-route-polyline') === null (empty map)"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN two routes first selected/plotted WHEN paged to the second THEN the plotted polyline switches to the second route and the map handle receives a fit call for it",
      "verify": "pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t pagingSwapsPlottedRouteAndRefits",
      "scenario": {
        "start_ref": "plan_view_two_distinct_routes_first_selected", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "live Convex dev + MapboxMapViewHandle via @testing-library/react-native",
        "negative_control": { "would_fail_if": [
          "the plotted coordinates stay on the first route after paging (polyline not keyed to selectedRouteId)",
          "no fitToCoordinates/setCameraPosition call is made on page change (camera stays on the old route)",
          "the fit handler is a no-op / disconnected from the carousel selection"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_two_distinct_routes_first_selected",
          "action": { "actor": "user", "steps": [
            "render with the first route selected/plotted",
            "fireEvent.press(getByTestId('route-carousel-next-arrow'))",
            "assert the plotted polyline coordinates match the SECOND route and the map handle received a fit call for it"
          ] },
          "end_state": {
            "must_observe": [
              "after paging, the rendered polyline first coordinate === the SECOND route's start coord",
              "mapRef.fitToCoordinates called with coords.length > 1 OR setCameraPosition called for the centroid (fit-call count === 1 after the page change)",
              "the fit-call count increased by 1 on the page change"
            ],
            "must_not_observe": [
              "plotted coordinates still matching the first route after paging",
              "0 fit calls after the page change (static camera)"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN a centroid-only paged route WHEN selected THEN doFit takes the centroid branch (setCameraPosition zoom 12) without crashing",
      "verify": "pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t centroidPagedRouteFramesAtZoom12",
      "scenario": {
        "start_ref": "plan_view_centroid_route_selected", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "live Convex dev + MapboxMapViewHandle via @testing-library/react-native",
        "negative_control": { "would_fail_if": [
          "a centroid-only route takes the fitToCoordinates branch with a single point (wrong branch / no frame)",
          "the centroid route leaves the camera static/unmoved or throws",
          "setCameraPosition is called with zoom !== 12 or with undefined coordinates"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_centroid_route_selected",
          "action": { "actor": "user", "steps": [
            "page to a centroid-only route",
            "assert the map handle received setCameraPosition with the centroid coords and zoom 12"
          ] },
          "end_state": {
            "must_observe": [
              "setCameraPosition called with coordinates === the route centroid and zoom === 12",
              "setCameraPosition.mock.calls.length === 1 (centroid route framed, no crash)"
            ],
            "must_not_observe": [
              "fitToCoordinates called with a single-coordinate array for the centroid route",
              "setCameraPosition call count === 0 after selecting the centroid route"
            ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "Only the selected route's coordinates render; the non-selected route is absent.", "maps_to_ac": "AC-1", "verify": "pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t plotsOnlySelectedRoute" },
    { "id": "TC-2", "type": "test_criterion", "description": "Paging swaps the plotted coordinates and re-fits the camera.", "maps_to_ac": "AC-2", "verify": "pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t pagingSwapsPlottedRouteAndRefits" },
    { "id": "TC-3", "type": "test_criterion", "description": "Centroid-only paged route frames at zoom 12 without crashing.", "maps_to_ac": "AC-3", "verify": "pnpm test app/(app)/(tabs)/index.one-route.integration.test.tsx -t centroidPagedRouteFramesAtZoom12" }
  ]
}
-->
