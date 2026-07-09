# RUX-004: On-route map TAG/label (tappable) showing the paged route's archetype + distance; tap opens Route Details

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P1 · **Effort:** M · **Estimate:** 150 min
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** react-native-ui-planner
**Agent rationale:** Adds a new on-map MarkerView tag/callout (modeled on `components/map/search-result-marker.tsx`) anchored to the selected route, showing label+distance, that on tap opens RouteDetailsSheet (the RUX-003 destination). New presentational map component + index.tsx wiring — no Convex change.

> **Remedial — Sprint 1 testing feedback (item 7, /frontend-design):** "can we label the routes with a tag or something rather than having a floating button? when tapped can we show the route details?" Implements [DESIGN-S01-006](./DESIGN-S01-006-on-route-map-tag-label-spec.md).

## Outcome

When a route is plotted, a small pill on the route reads e.g. `Scenic · 78mi`; tapping it opens the Route Details sheet; paging the carousel moves the tag onto the new route with its label/distance. No floating "button that tells nothing" remains.

## Specification

There is no on-map route tag today. Add a `RouteTag` MarkerView component (label + distance pill) anchored to the selected route's geometry midpoint, mounted in index.tsx alongside the polyline, modeled on `search-result-marker.tsx` (MarkerView + Pressable + haptics + `useSemanticTheme()`, gated on `mapboxAvailable`). The tag text reads the archetype label + formatted distance from the paged `PlannedRouteOptionView`. On tap it reuses the SAME open-details path as RUX-003 (no second details path). The tag follows `selectedRouteId` (carousel paging) — exactly one tag, never duplicated.

## Critical Constraints

- **MUST** render a single tappable on-map tag/label anchored to the currently-selected/paged route, showing the route archetype label + distance (e.g. `Scenic · 78mi`), built on the `@rnmapbox/maps` MarkerView pattern from `search-result-marker.tsx`. Tapping the tag opens RouteDetailsSheet (the same destination as the RUX-003 line tap).
- **NEVER** render a floating button that "tells nothing" — the tag MUST carry the route's archetype + distance text from the active PlannedRouteOptionView, never a generic/empty label. **NEVER** render more than one tag (only the selected/paged route gets a tag). **NEVER** hardcode colors/spacing — via semantic.
- **STRICTLY** anchor the tag at a stable point on the selected route (e.g. the route midpoint/centroid from its decoded geometry) and update it when the carousel pages (`selectedRouteId` change). The tap handler reuses the SAME open-details path as RUX-003. Touch target ≥44pt.

## Acceptance Criteria

### AC-1: Tag shows the paged route's archetype + distance
*(PRIMARY)*
- **GIVEN** the plan view with a 'Scenic Coastal' ~78mi route selected and plotted against live Convex
- **WHEN** the map renders the route
- **THEN** an on-route tag (`route-tag`) is present whose text includes the route's archetype label and its distance (e.g. `Scenic · 78mi`)
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/rux-004-route-tag.yaml`
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx` → `tagShowsLabelAndDistance` (vitest @testing-library/react-native mocked wiring)

### AC-2: Tapping the tag opens RouteDetailsSheet
- **GIVEN** the on-route tag is rendered and both sheets are closed
- **WHEN** the rider taps the `route-tag`
- **THEN** RouteDetailsSheet opens for the active route (same destination as the polyline tap) and SaveRouteSheet does NOT open
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/rux-004-route-tag.yaml`
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx` → `tagTapOpensDetails` (vitest @testing-library/react-native mocked wiring)

### AC-3: Tag follows the carousel page (edge)
- **GIVEN** two distinct routes, first selected with its tag rendered
- **WHEN** the rider pages to the second route
- **THEN** exactly one tag remains and it now shows the second route's label/distance (the tag moved to the paged route, not duplicated)
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/rux-004-route-tag.yaml`
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx` → `tagFollowsPaging` (vitest @testing-library/react-native mocked wiring)

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | The `route-tag` renders with the active route's archetype label and distance. | AC-1 | `maestro test .maestro/rux-004-route-tag.yaml` + `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx -t tagShowsLabelAndDistance` |
| TC-2 | Tapping the `route-tag` opens `route-details-sheet` and not `save-route-sheet`. | AC-2 | `maestro test .maestro/rux-004-route-tag.yaml` + `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx -t tagTapOpensDetails` |
| TC-3 | Paging leaves exactly one tag and updates it to the new route's label/distance. | AC-3 | `maestro test .maestro/rux-004-route-tag.yaml` + `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx -t tagFollowsPaging` |

## Reading List

- `components/map/search-result-marker.tsx` (1-60) — MarkerView gating + coordinate conversion + Pressable pattern to model RouteTag on
- `app/(app)/(tabs)/index.tsx` (805-854) — selectedOption/agentActiveOption geometry source for the tag anchor + label/distance
- `app/(app)/(tabs)/index.tsx` (1099-1163) — the open-details handler (post-RUX-003) the tag tap reuses
- `lib/mapbox/coordinate-converter.ts` (1-40) — latLngToMapbox for anchoring the MarkerView; decode helper for the geometry midpoint
- `components/ui/route-attachment-card.tsx` (20-52) — label/distance/scenicScore fields available on the route shape for the tag text

## Guardrails

**WRITE-ALLOWED:** `app/(app)/(tabs)/index.tsx`, `components/map/route-tag.tsx` (NEW), `app/(app)/(tabs)/index.route-tag.integration.test.tsx` (NEW)
**WRITE-PROHIBITED:** `components/map/search-result-marker.tsx`, `components/sheets/route-details-sheet.tsx`, `convex/**`

## Design

- ref: DESIGN-S01-006 (on-route tag/callout visual: archetype + distance pill, copper accent, ≥44pt tap target)
- **Pattern:** Single MarkerView tag anchored to the selected route midpoint; tap → details.
- **Anti-pattern:** A floating button with no route context (the "floating buttons that tell me nothing" the user reported).
- **Interaction notes:** one pill anchored at the selected route's geometry midpoint reading "Archetype · Distance"; tap → Route Details (reuses RUX-003 open-details handler); tag follows the carousel page, never duplicated; MarkerView gated on `mapboxAvailable` like search-result-marker.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `maestro test .maestro/rux-004-route-tag.yaml` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'app/(app)/(tabs)/index.tsx' 'components/map/route-tag.tsx'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: the AC-1 test must FAIL on current main (no route-tag exists) before the tag is added` |
| human_gate | `On-device (real iOS+Android, live Convex): plot a route → a labelled pill on the line reads e.g. 'Scenic · 78mi'; tapping it opens Route Details; paging moves the pill` |

## Coding Standards

- Gate the MarkerView on `mapboxAvailable` (NativeModules.RNMBXModule) like search-result-marker.tsx; render null when unavailable.
- All colors/spacing/radii via `useSemanticTheme()`; tag tap target ≥44pt with `accessibilityRole='button'`.
- Tag text derives label from the route archetype and distance via the existing formatter — never a hardcoded/empty string.
- Tag tap reuses the RUX-003 open-details handler — no second details path.
- Integration test renders the real screen against live Convex; Mapbox handle stubbed only at the native boundary; Convex data NOT mocked.

## Dependencies

- Depends on: RUX-003 (the open-details handler the tag tap reuses), RUX-002 (the single plotted route the tag anchors to), DESIGN-S01-006 (tag visual spec)
- Blocks: (none)

## Notes

Implements UNIFIED UX TARGET item 7 / DESIGN-S01-006. The tag anchor is the decoded-geometry midpoint; for a centroid-only route the anchor is the centroid itself. Distance formatting reuses the existing route formatter (mi). If DESIGN-S01-006 has not landed, implement to the UX target and flag the missing spec.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "plan_view_scenic_route_selected": {
      "description": "plan view against live Convex with a 'Scenic Coastal' ~78mi route selected and plotted (multi-point geometry so a midpoint anchor exists)",
      "seed_method": "public_api",
      "records": [ "a route_plans option labelled Scenic Coastal", "distance ~78mi", "multi-point overviewGeometry", "selectedRouteId = that option" ]
    },
    "plan_view_two_distinct_routes_first_selected": {
      "description": "plan view in ROUTE_RESULTS with two distinct routes, first selected/tagged (shared with RUX-002)",
      "seed_method": "public_api",
      "records": [ "two distinct route_plans options with geometry", "selectedRouteId = first option" ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a Scenic Coastal ~78mi route selected/plotted WHEN the map renders THEN an on-route tag shows the archetype label and distance (e.g. 'Scenic · 78mi')",
      "verify": ".maestro/rux-004-route-tag.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx -t tagShowsLabelAndDistance",
      "scenario": {
        "start_ref": "plan_view_scenic_route_selected", "tier": "visible", "test_tier": "PRIMARY",
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": { "would_fail_if": [
          "the tag renders a generic/empty label ('Route' / '') not wired to the active option",
          "no tag renders when a route is plotted (disconnected)",
          "the distance is missing or shows a placeholder ('--mi')"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_scenic_route_selected",
          "action": { "actor": "user", "steps": [
            "render the plan view with the Scenic Coastal route selected/plotted",
            "query the route-tag and read its text"
          ] },
          "end_state": {
            "must_observe": [
              "queryByTestId('route-tag') !== null",
              "the tag text contains the archetype label (e.g. 'Scenic') AND the distance (e.g. '78mi')"
            ],
            "must_not_observe": [
              "a generic 'Route' / empty tag with no archetype or distance",
              "queryByTestId('route-tag') === null while a route is plotted",
              "a placeholder distance like '--mi' or '0mi'"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN the tag rendered with sheets closed WHEN the rider taps it THEN RouteDetailsSheet opens and SaveRouteSheet does not",
      "verify": ".maestro/rux-004-route-tag.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx -t tagTapOpensDetails",
      "scenario": {
        "start_ref": "plan_view_scenic_route_selected", "tier": "visible", "test_tier": "PRIMARY", "primary": false,
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": { "would_fail_if": [
          "tapping the tag opens the SaveRouteSheet instead of details",
          "the tag tap is a no-op (no sheet opens)",
          "it opens a second/duplicate details path rather than reusing the RUX-003 handler"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_scenic_route_selected",
          "action": { "actor": "user", "steps": [
            "render with the route plotted and tag present",
            "fireEvent.press(getByTestId('route-tag'))",
            "query both sheets"
          ] },
          "end_state": {
            "must_observe": [
              "queryByTestId('route-details-sheet') !== null after the tag tap",
              "queryByTestId('save-route-sheet') === null"
            ],
            "must_not_observe": [
              "save-route-sheet open after the tag tap",
              "no sheet open after the tag tap (no-op)"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN two routes first selected/tagged WHEN paged to the second THEN exactly one tag remains showing the second route's label/distance",
      "verify": ".maestro/rux-004-route-tag.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx -t tagFollowsPaging",
      "scenario": {
        "start_ref": "plan_view_two_distinct_routes_first_selected", "tier": "visible", "test_tier": "PRIMARY", "primary": false,
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": { "would_fail_if": [
          "a tag is left behind on the first route (two tags after paging)",
          "the tag text still shows the first route's label after paging (static)",
          "the tag disappears entirely after paging"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_two_distinct_routes_first_selected",
          "action": { "actor": "user", "steps": [
            "render with the first route selected and tagged",
            "press route-carousel-next-arrow",
            "count tags and read the tag text"
          ] },
          "end_state": {
            "must_observe": [
              "queryAllByTestId('route-tag').length === 1 after paging",
              "the tag text now contains the SECOND route's label (e.g. 'Scenic Coastal')"
            ],
            "must_not_observe": [
              "queryAllByTestId('route-tag').length > 1 (stale tag on the first route)",
              "queryAllByTestId('route-tag').length === 0 (tag vanished / no tag)"
            ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "route-tag renders the active route's archetype label and distance.", "maps_to_ac": "AC-1", "verify": "maestro test .maestro/rux-004-route-tag.yaml + pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx -t tagShowsLabelAndDistance" },
    { "id": "TC-2", "type": "test_criterion", "description": "Tapping route-tag opens route-details-sheet, not save-route-sheet.", "maps_to_ac": "AC-2", "verify": "maestro test .maestro/rux-004-route-tag.yaml + pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx -t tagTapOpensDetails" },
    { "id": "TC-3", "type": "test_criterion", "description": "Paging leaves one tag updated to the new route.", "maps_to_ac": "AC-3", "verify": "maestro test .maestro/rux-004-route-tag.yaml + pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx -t tagFollowsPaging" }
  ]
}
-->
