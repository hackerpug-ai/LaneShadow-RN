# RUX-001: Replace the bottom compact-route-card stack with a single route-summary card + ‹ ROUTE DETAILS › carousel above the chat input

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** M · **Estimate:** 180 min
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** react-native-ui-planner
**Agent rationale:** Pure plan-view UI: removes the vertically-stacked RouteAttachmentCard list at `index.tsx:1376-1412` and replaces it with a single paged route-summary card flanked by carousel arrows, slotted directly above ChatInput (`index.tsx:1448`). Touches `index.tsx` render + a new presentational carousel component and a pure paging/dedupe reducer — no Convex change.

> **Remedial — Sprint 1 testing feedback (item 1):** "route buttons tell me nothing … list the route title card above the input with carousel arrows to page to the next route." Implements [DESIGN-S01-005](./DESIGN-S01-005-route-carousel-single-card-above-input-spec.md).

## Outcome

The "floating buttons that tell me nothing" bottom stack is gone. A single route-summary card (archetype label + distance + duration + scenic score from the currently-paged route) sits above the chat input flanked by ‹ › arrows; paging advances through the deduped distinct-route list and updates `flowState.selectedRouteId`. With ≥2 distinct routes both arrows show; at an end the matching arrow is disabled; with one distinct route no arrows show.

## Specification

`index.tsx:1376-1412` renders a ScrollView stack of compact `RouteAttachmentCard`s from `flowState.routeOptions.options[]`. Replace it with ONE route-summary card (reusing the compact RouteAttachmentCard body) with a left arrow, the card, and a right arrow in a row (`‹ [route summary] ›`) positioned directly above the chat input (`index.tsx:1448`). A PURE `deduplicateRouteOptions` reducer (label+distance+geometry key) collapses efficiency-variant duplicates to distinct routes BEFORE paging. Paging prev/next advances through the distinct list and updates `flowState.selectedRouteId` via the existing `selectRoute()` (`use-route-comparison.ts:115-123`) so it stays the single source of truth (RUX-002's plotted polyline and RUX-004's tag follow it). Arrows are disabled/hidden at the ends and the whole arrow affordance is hidden when only one distinct route exists; the carousel is hidden when `!hasActiveRoute`. Tapping the card opens RouteDetailsSheet (RUX-003), no chat message.

## Critical Constraints

- **MUST** replace the ScrollView stack at `index.tsx:1376-1412` with ONE route-summary card at a time, flanked by prev/next carousel arrows, slotted directly ABOVE ChatInput (`index.tsx:1448`); the paged index drives `flowState.selectedRouteId` via the existing `selectRoute()`.
- **NEVER** add a new per-variant screen or a second route state store — the carousel page is STATE of `index.tsx` + the existing ride-flow machine. **NEVER** hardcode hex/spacing — all via `useSemanticTheme()`. **NEVER** render more than one route-summary card simultaneously.
- **STRICTLY** collapse duplicate/efficiency-variant options into distinct display routes via a PURE deduplicate reducer (label+distance+geometry key) BEFORE paging, so the carousel pages between genuinely-distinct routes only; arrows disabled/hidden at the ends, the whole arrow affordance hidden when only one distinct route exists; touch targets ≥44pt.

## Acceptance Criteria

### AC-1: Single carousel card pages between distinct routes
*(PRIMARY)*
- **GIVEN** the plan view in ROUTE_RESULTS with `flowState.routeOptions.options` containing ≥2 genuinely-distinct routes (e.g. 'Efficient' 64mi and 'Scenic Coastal' 78mi) against live Convex
- **WHEN** the rider presses `route-carousel-next-arrow`
- **THEN** exactly one route-summary card is shown, its label/distance update to the next distinct route, and `flowState.selectedRouteId === that route's routeOptionId`
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/rux-001-route-carousel-paging.yaml`
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx` → `pagesBetweenDistinctRoutes` (vitest @testing-library/react-native mocked wiring)
- **Scenario** (start `plan_view_two_distinct_routes`): must observe one card showing the second route's label/distance + `selectedRouteId` updated; must NOT observe `>1` card, a static first-route card, or a vanished card; negative control: old stack, static card, disconnected selection, empty placeholder.

### AC-2: Single distinct route hides the carousel arrows
- **GIVEN** options that collapse (after dedupe) to exactly ONE distinct route
- **WHEN** the route-summary slot renders
- **THEN** the card shows WITHOUT prev/next arrows (`route-carousel-prev-arrow` and `route-carousel-next-arrow` both absent)
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/rux-001-route-carousel-paging.yaml`
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx` → `singleRouteHidesArrows` (vitest @testing-library/react-native mocked wiring)

### AC-3: Prev arrow disabled at first route, next disabled at last
- **GIVEN** ≥3 distinct routes, paged to the FIRST route
- **WHEN** the carousel renders at the first index, then is paged to the last
- **THEN** at the first index the prev arrow is `accessibilityState.disabled === true`, at the last index the next arrow is disabled, and a disabled press is a no-op on `selectedRouteId`
- **Test tier:** `PRIMARY` · **Service:** real-device Maestro + live Convex dev
- **Verify:** `.maestro/rux-001-route-carousel-paging.yaml`
- **Supplementary verify:** `pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx` → `arrowsDisabledAtEnds` (vitest @testing-library/react-native mocked wiring)

### AC-4: Dedupe reducer collapses identical efficiency variants (unit)
- **GIVEN** an options array where two entries share label+distance+overviewGeometry (a backend efficiency-variant duplicate) and a third differs, plus one with undefined geometry
- **WHEN** the pure `deduplicateRouteOptions` reducer runs
- **THEN** it returns a list with the duplicate collapsed to a single distinct route (`[A,A_dup,B] → [A,B]`), preserving order, never throwing on empty/undefined geometry
- **Test tier:** `unit` · **Service:** pure function (no I/O)
- **UNIT_TEST_JUSTIFIED:** `deduplicate-route-options` is a pure array→array reducer with zero I/O — unit-justified to pin the dedupe key + empty/undefined-geometry guards; the screen behavior is covered by AC-1..AC-3 integration tests.
- **Verify:** `pnpm test lib/routes/dedupe-route-options.test.ts -t collapsesIdenticalVariants`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Exactly one `route-summary-card` renders; pressing next advances the label/distance and updates `selectedRouteId`. | AC-1 | `maestro test .maestro/rux-001-route-carousel-paging.yaml` + `pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx -t pagesBetweenDistinctRoutes` |
| TC-2 | A single distinct route renders the card with no prev/next arrows. | AC-2 | `maestro test .maestro/rux-001-route-carousel-paging.yaml` + `pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx -t singleRouteHidesArrows` |
| TC-3 | Prev disabled at first index, next disabled at last; disabled press is a no-op on `selectedRouteId`. | AC-3 | `maestro test .maestro/rux-001-route-carousel-paging.yaml` + `pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx -t arrowsDisabledAtEnds` |
| TC-4 | `deduplicateRouteOptions` collapses identical efficiency variants, preserves order, and guards undefined geometry. | AC-4 | `pnpm test lib/routes/dedupe-route-options.test.ts -t collapsesIdenticalVariants` |

## Reading List

- `app/(app)/(tabs)/index.tsx` (1374-1412) — the bottom compact RouteAttachmentCard ScrollView stack to REMOVE and replace with the single carousel slot above ChatInput
- `app/(app)/(tabs)/index.tsx` (1447-1470) — ChatInput render site — the carousel slot mounts directly above this
- `hooks/use-route-comparison.ts` (84-140) — polylines builder + `selectRoute()`/`selectedRouteId` — the single source of truth the carousel drives via SELECT_ROUTE
- `components/ui/route-attachment-card.tsx` (20-52) — RouteAttachmentCardProps — reuse the compact body for the summary; do NOT fork its visual
- `hooks/use-ride-flow.ts` (36-110) — ROUTE_RESULTS/ROUTE_DETAILS flow shapes carrying routeOptions/selectedRouteId

## Guardrails

**WRITE-ALLOWED:** `app/(app)/(tabs)/index.tsx`, `components/map/route-summary-carousel.tsx` (NEW), `lib/routes/dedupe-route-options.ts` (NEW), `app/(app)/(tabs)/index.carousel.integration.test.tsx` (NEW), `lib/routes/dedupe-route-options.test.ts` (NEW)
**WRITE-PROHIBITED:** `hooks/use-ride-flow.ts`, `convex/**`, `components/ui/route-attachment-card.tsx`

## Design

- ref: DESIGN-S01-005 (single route-summary card + carousel-arrow visual spec above the chat input)
- **Pattern:** Single state-driven carousel slot above the input; paged index ↔ `selectedRouteId`.
- **Anti-pattern:** A vertical stack of all route cards (the removed `index.tsx:1376-1412`), or a separate route-list screen/modal.
- **Interaction notes:** row `‹ arrow (44pt) | route-summary-card (flex) | arrow (44pt) ›` above ChatInput; arrows hidden when one distinct route; disabled (dimmed, `accessibilityState.disabled`) at the ends; paging updates `selectedRouteId` via `selectRoute()`; card reuses RouteAttachmentCard content.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `maestro test .maestro/rux-001-route-carousel-paging.yaml` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'app/(app)/(tabs)/index.tsx' 'components/map/route-summary-carousel.tsx' 'lib/routes/dedupe-route-options.ts'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: the AC-1 test must FAIL on the current code (multiple stacked cards / no carousel) before the replacement makes it pass` |
| human_gate | `On-device (real iOS+Android, live Convex): plan a ride → see ONE route-summary card with arrows above the input; arrows page through routes; single route shows no arrows` |

## Coding Standards

- All colors/spacing/radii via `useSemanticTheme()`; no hardcoded hex.
- Carousel arrows ≥44pt touch target with `accessibilityRole='button'` and `accessibilityState.disabled` at the ends.
- `deduplicateRouteOptions` is pure (array→array), no I/O, exported from `lib/routes` for reuse by RUX-002.
- No `any` on the PlannedRouteOptionView page passed to `selectRoute`.
- Integration test renders the real screen against live Convex; Mapbox native handle stubbed only at the native boundary; Convex data NOT mocked.
- Remove the dead route-cards ScrollView block and the `styles.routeCards` style if it becomes unused.

## Dependencies

- Depends on: DATA-008b (real non-zero route data), DESIGN-S01-005 (carousel visual spec); informed by DATA-009 (backend dedup — the carousel pages whatever distinct set arrives, with the client reducer as a safety net)
- Blocks: RUX-002, RUX-004

## Notes

DESIGN-S01-005 is the matching visual spec; if it has not landed, implement to the UNIFIED UX TARGET and flag the missing spec. The backend dedup (DATA-009) reduces duplicates at the source; this task's client-side `deduplicateRouteOptions` ensures the carousel pages between distinct routes regardless. `selectedRouteId` remains the single source of truth so RUX-002 (one-route plotting) and RUX-004 (tag) follow the page automatically.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "plan_view_two_distinct_routes": {
      "description": "plan view rendered against live Convex dev, signed-in, ride-flow in ROUTE_RESULTS with routeOptions.options containing two genuinely-distinct routes ('Efficient' ~64mi and 'Scenic Coastal' ~78mi), each with overviewGeometry; selectedRouteId === first option",
      "seed_method": "public_api",
      "records": [ "a planRide result with two distinct route_plans options", "distinct labels Efficient/Scenic Coastal", "distinct distances and geometries", "selectedRouteId = first option's routeOptionId" ]
    },
    "plan_view_one_distinct_route": {
      "description": "plan view in ROUTE_RESULTS whose routeOptions.options collapse (after dedupe) to exactly one distinct route — either a single option or two identical efficiency variants",
      "seed_method": "public_api",
      "records": [ "routeOptions with options that dedupe to one distinct route", "either one option or two byte-identical variants" ]
    },
    "plan_view_three_distinct_routes": {
      "description": "plan view in ROUTE_RESULTS with three genuinely-distinct routes for end-clamp testing",
      "seed_method": "public_api",
      "records": [ "three distinct route_plans options", "distinct labels/distances/geometries" ]
    },
    "options_with_duplicate_variant": {
      "description": "an in-memory PlannedRouteOptionsView.options array of three entries where index 0 and 1 share label+distance+overviewGeometry (efficiency-variant duplicate) and index 2 differs; one entry has undefined overviewGeometry to exercise the guard",
      "seed_method": "recorded_external",
      "records": [ "A: label Efficient, 64mi, geometry G1", "A_dup: label Efficient, 64mi, geometry G1", "B: label Scenic, 78mi, geometry undefined" ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the plan view in ROUTE_RESULTS with >=2 distinct routes WHEN the rider presses route-carousel-next-arrow THEN exactly one route-summary card shows the next distinct route and selectedRouteId updates to that routeOptionId",
      "verify": ".maestro/rux-001-route-carousel-paging.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx -t pagesBetweenDistinctRoutes",
      "scenario": {
        "start_ref": "plan_view_two_distinct_routes", "tier": "visible", "test_tier": "PRIMARY",
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": { "would_fail_if": [
          "the old vertical ScrollView stack still renders >1 RouteAttachmentCard simultaneously (queryAllByTestId('route-summary-card').length > 1)",
          "pressing next does not change the displayed label/distance (static card / disconnected from paging state)",
          "selectedRouteId is unchanged after paging (carousel disconnected from selectRoute)",
          "the card is empty/placeholder ('Route' with no distance) — not wired to the paged PlannedRouteOptionView"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_two_distinct_routes",
          "action": { "actor": "user", "steps": [
            "render the plan view against live Convex with two distinct route options",
            "assert exactly one route-summary-card is present and shows the first route's label+distance",
            "fireEvent.press(getByTestId('route-carousel-next-arrow'))",
            "read the displayed label/distance and the flow state's selectedRouteId"
          ] },
          "end_state": {
            "must_observe": [
              "queryAllByTestId('route-summary-card').length === 1",
              "the card text contains the SECOND distinct route's label (e.g. 'Scenic Coastal') and its distance (e.g. '78mi')",
              "flowState.selectedRouteId === the second route's routeOptionId"
            ],
            "must_not_observe": [
              "queryAllByTestId('route-summary-card').length > 1 (old stack still rendering)",
              "the card still showing the FIRST route after pressing next (static / no paging)",
              "queryByTestId('route-summary-card') === null after paging (card vanished)"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN options that dedupe to one distinct route WHEN the slot renders THEN the card shows without any prev/next arrows",
      "verify": ".maestro/rux-001-route-carousel-paging.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx -t singleRouteHidesArrows",
      "scenario": {
        "start_ref": "plan_view_one_distinct_route", "tier": "visible", "test_tier": "PRIMARY", "primary": false,
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": { "would_fail_if": [
          "arrows render even with one distinct route (static always-on arrows)",
          "duplicate efficiency variants are NOT collapsed, so the dedupe reports >1 and arrows show for what is really one route",
          "the card itself does not render for the single route (empty slot)"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_one_distinct_route",
          "action": { "actor": "user", "steps": [
            "render the plan view against live Convex with options that dedupe to one distinct route",
            "query for the carousel arrows and the route-summary card"
          ] },
          "end_state": {
            "must_observe": [
              "queryByTestId('route-summary-card') !== null",
              "queryByTestId('route-carousel-prev-arrow') === null",
              "queryByTestId('route-carousel-next-arrow') === null"
            ],
            "must_not_observe": [
              "any carousel arrow rendered for a single distinct route",
              "queryByTestId('route-summary-card') === null (no card for the one route)"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN >=3 distinct routes WHEN paged to first then last THEN prev disabled at first index and next disabled at last index; disabled press is a no-op",
      "verify": ".maestro/rux-001-route-carousel-paging.yaml",
      "supplementary_verify": "pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx -t arrowsDisabledAtEnds",
      "scenario": {
        "start_ref": "plan_view_three_distinct_routes", "tier": "visible", "test_tier": "PRIMARY", "primary": false,
        "verification_service": "real-device Maestro + live Convex dev",
        "negative_control": { "would_fail_if": [
          "pressing prev at index 0 wraps to the last route or advances state (no clamp)",
          "the prev arrow is enabled at the first index / next arrow enabled at the last index",
          "the disabled state is purely visual (a no-op style) but pressing still changes selectedRouteId"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_three_distinct_routes",
          "action": { "actor": "user", "steps": [
            "render at the first route index",
            "assert prev arrow disabled",
            "press next twice to reach the last index",
            "assert next arrow disabled and pressing it does not change selectedRouteId"
          ] },
          "end_state": {
            "must_observe": [
              "at index 0: getByTestId('route-carousel-prev-arrow').props.accessibilityState.disabled === true",
              "at the last index: getByTestId('route-carousel-next-arrow').props.accessibilityState.disabled === true",
              "pressing the disabled next arrow leaves selectedRouteId unchanged (=== its prior value)"
            ],
            "must_not_observe": [
              "selectedRouteId wrapping from last back to first on next press",
              "prev arrow enabled at index 0"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN options with a duplicate efficiency variant WHEN deduplicateRouteOptions runs THEN duplicates collapse to one distinct route, order preserved, no throw on undefined geometry",
      "verify": "pnpm test lib/routes/dedupe-route-options.test.ts -t collapsesIdenticalVariants",
      "unit_test_justified": "pure array->array reducer with zero I/O; screen behavior covered by AC-1..AC-3 integration tests",
      "scenario": {
        "start_ref": "options_with_duplicate_variant", "tier": "logic", "test_tier": "unit", "primary": false,
        "unit_test_justified": "pure array->array reducer with zero I/O; screen behavior covered by AC-1..AC-3 integration tests",
        "verification_service": "pure function (no I/O)",
        "negative_control": { "would_fail_if": [
          "the reducer returns the input unchanged (no dedupe applied)",
          "it throws on an option with undefined overviewGeometry (no guard)",
          "it collapses two GENUINELY-distinct routes (over-aggressive key, e.g. label-only)"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "options_with_duplicate_variant",
          "action": { "actor": "system", "steps": [
            "call deduplicateRouteOptions([A, A_dup, B]) where A and A_dup share label+distance+geometry and B differs",
            "inspect the returned distinct list"
          ] },
          "end_state": {
            "must_observe": [
              "result.length === 2",
              "result[0].routeOptionId === A.routeOptionId and result[1].routeOptionId === B.routeOptionId (order preserved, first wins)"
            ],
            "must_not_observe": [
              "result.length === 3 (no dedupe)",
              "a thrown error when an option's overviewGeometry is undefined",
              "result.length === 1 (B incorrectly collapsed into A)"
            ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "Exactly one route-summary-card renders; pressing next advances the label/distance and updates selectedRouteId.", "maps_to_ac": "AC-1", "verify": "maestro test .maestro/rux-001-route-carousel-paging.yaml + pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx -t pagesBetweenDistinctRoutes" },
    { "id": "TC-2", "type": "test_criterion", "description": "A single distinct route renders the card with no prev/next arrows.", "maps_to_ac": "AC-2", "verify": "maestro test .maestro/rux-001-route-carousel-paging.yaml + pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx -t singleRouteHidesArrows" },
    { "id": "TC-3", "type": "test_criterion", "description": "Prev disabled at first index, next disabled at last index; disabled press is a no-op on selectedRouteId.", "maps_to_ac": "AC-3", "verify": "maestro test .maestro/rux-001-route-carousel-paging.yaml + pnpm test app/(app)/(tabs)/index.carousel.integration.test.tsx -t arrowsDisabledAtEnds" },
    { "id": "TC-4", "type": "test_criterion", "description": "deduplicateRouteOptions collapses identical efficiency variants, preserves order, guards undefined geometry.", "maps_to_ac": "AC-4", "verify": "pnpm test lib/routes/dedupe-route-options.test.ts -t collapsesIdenticalVariants" }
  ]
}
-->
