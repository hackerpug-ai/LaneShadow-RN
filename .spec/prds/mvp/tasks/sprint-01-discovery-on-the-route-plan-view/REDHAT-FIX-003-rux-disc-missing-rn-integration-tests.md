# REDHAT-FIX-003: RUX-004/RUX-007/DISC-016/DISC-020: create the four missing RN integration test files

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P1 · **Effort:** L · **Estimate:** 180 min
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** react-native-ui-planner
**TDD Mode:** red_first · **RED/GREEN Required:** yes
**Agent rationale:** Four RN integration test files specified in the acceptance criteria of RUX-004, RUX-007, DISC-016, and DISC-020 were never created — the red-hat review flagged each as a HIGH finding. react-native-ui-implementer owns the plan-view screen and card components under test and can write the integration tests against the project's vitest harness (jsdom/@testing-library/react-native with Convex+RN mocked per `vitest.config.ts`).

> **Source:** [red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md](../../../reviews/red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md) — HIGH findings #5, #6, #7, #8.

## Outcome

The four missing integration test files exist under the exact paths required by the parent task ACs, each file runs with `pnpm test <path>`, and all named tests pass. No production source or Convex code is modified.

## Specification

This is a test-only remediation task that closes four HIGH red-hat findings. The parent tasks RUX-004, RUX-007, DISC-016, and DISC-020 defined observable acceptance criteria that require named integration tests, but the test files were never created. This task creates only those four files:

1. `app/(app)/(tabs)/index.route-tag.integration.test.tsx` — validates the on-route tag label/distance, the tag-to-details-sheet interaction, and correct single-tag behavior across route paging (per RUX-004 AC).
2. `app/(app)/(tabs)/index.card-loading.integration.test.tsx` — validates that tapping a curated card shows then hides the map-planning-indicator and does NOT append a chat transcript message (per RUX-007 AC-2/AC-3).
3. `app/(app)/(tabs)/index.discovery.integration.test.tsx` — validates that discovery pill taps plot the route without sending a message, that the camera fits both centroid and multi-point routes, and that typed NL messages still send normally (per DISC-016 AC).
4. `components/chat/cards/curated-route-card.integration.test.tsx` — validates curated-card score rendering as a percentage (not raw decimal), re-rendering an earlier curated card returns to the map, and a centroid-only curated route plots via the fallback camera path (per DISC-020 AC).

All tests render the real screen/component through `@testing-library/react-native` using the project's harness mocks (`__mocks__/convex/*`, stubbed `@rnmapbox/maps` without imperative handle) and add additive spies for `setCameraPosition`/`fitToCoordinates`. Assertions are non-degenerate: they check exact testID presence/absence, visible text content, and concrete state transitions rather than "renders" or empty counts.

**Harness reality:** vitest aliases Convex `_generated/*` to `__mocks__/convex/*` and stubs `@rnmapbox/maps` without an imperative handle (`vitest.config.ts:150-162,195`). The vitest integration tier asserts wiring via an additive camera/fit spy on the rnmapbox mock; the genuine real-service tier is Maestro e2e against the dev client + live Convex dev.

## Critical Constraints

- **MUST** create exactly the four test files listed in WRITE-ALLOWED and no other files.
- **NEVER** modify any production source file in `app/`, `components/`, `hooks/`, `stores/`, `shared/`, `tokens/`, `convex/`, or anywhere else outside the four new test files.
- **STRICTLY** target the project's existing vitest integration tier: jsdom/`@testing-library/react-native` with Convex and React Native mocked per `vitest.config.ts` (rnmapbox has no imperative handle; add spies around the mock).
- **MUST** use non-degenerate assertions that observe real testIDs, exact text (e.g. `'Scenic · 78mi'`), method call arguments (e.g. `setCameraPosition` with centroid coords + zoom 12), and absence/presence delta.
- **NEVER** allow a test to pass on "renders without crashing" or on 0/empty-only assertions.
- **MUST** include stable testIDs matching the parent ACs: `route-tag`, `route-details-sheet`, `save-route-sheet`, `map-planning-indicator`, `home-route-polyline`, `discovery-suggestion-pill-{routeId}`.

## Acceptance Criteria

### AC-1: route-tag integration test file passes (tag label/distance, tap→details, paging)
*(PRIMARY)*
- **GIVEN** the plan view with a route selected and plotted
- **WHEN** the map renders, the rider taps the tag, and pages to a second route
- **THEN** `route-tag` is present with archetype label + distance; tapping opens `route-details-sheet` (not `save-route-sheet`); paging leaves exactly one tag with the second route's label
- **Test tier:** `integration` · **Service:** @testing-library/react-native (Convex+RN mocked per harness reality)
- **Verify:** `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx`
- **Scenario** (start `plan_view_route_selected`):
  - must observe: `queryByTestId('route-tag') !== null` with text matching `/Scenic.*78mi/`; `queryByTestId('route-details-sheet') !== null` after press; `queryByTestId('save-route-sheet') === null` after press; `queryAllByTestId('route-tag').length === 1` after paging
  - must NOT observe: `route-tag === null` (empty/no tag); `save-route-sheet !== null` (wrong sheet); `queryAllByTestId('route-tag').length === 0 or > 1` after paging
  - negative control (would fail if): tag renders a generic/empty label; no tag renders when a route is selected; distance substring missing

### AC-2: card-loading integration test file passes (indicator toggle + no chat message)
- **GIVEN** the plan view in map mode with `createCuratedPlan` pending
- **WHEN** `handleSelectCuratedRoute` runs and the mutation resolves
- **THEN** `map-planning-indicator` is present while pending and absent after resolve, and the transcript message count delta `=== 0`
- **Test tier:** `integration` · **Service:** @testing-library/react-native (jsdom, Convex+RN mocked)
- **Verify:** `pnpm test app/(app)/(tabs)/index.card-loading.integration.test.tsx`
- **Scenario** (start `map_mode_card_tap_pending`):
  - must observe: `queryByTestId('map-planning-indicator') !== null` while pending (1 shown); `queryByTestId('map-planning-indicator') === null` after resolve; transcript count `=== N` (delta `=== 0`)
  - must NOT observe: indicator `=== null` throughout (0 shown / empty); indicator `!== null` after resolve (stuck); transcript count `=== N+1` (delta `!== 0`)
  - negative control (would fail if): `setMapPlanningVisible` omitted; `finally` clear removed (stuck); `session_messages` write re-introduced

### AC-3: discovery integration test file passes (tap plots, camera fits, typed send works)
- **GIVEN** the plan view with curated discovery cards and transcript count N
- **WHEN** tapping a `discovery-suggestion-pill`, fitting centroid + multi-point routes, and typing+sending a message
- **THEN** tap renders `home-route-polyline` with count unchanged; centroid→`setCameraPosition` zoom 12; multi-point→`fitToCoordinates` `>1` coord; typed send→count `N+1`
- **Test tier:** `integration` · **Service:** @testing-library/react-native (Convex+RN mocked, additive camera/fit spies)
- **Verify:** `pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx`
- **Scenario** (start `plan_view_discovery_cards`):
  - must observe: `queryByTestId('home-route-polyline') !== null` after tap; transcript count `=== N` after tap (delta `=== 0`); `setCameraPosition.mock.calls.length === 1` (zoom 12) for centroid; `fitToCoordinates` `coords.length > 1` for multi-point; transcript count `=== N+1` after send
  - must NOT observe: transcript count `=== N+1` after tap (wrong — tap should not send); `home-route-polyline === null` (empty map); `setCameraPosition.mock.calls.length === 0` (no camera call); transcript count `=== N` after send (no-op / 0 increment)
  - negative control (would fail if): tap still calls `handleSendMessage`; `doFit` never invoked; send path removed

### AC-4: curated-route-card integration test file passes (score %, re-render→map, centroid fallback)
- **GIVEN** a completed curated routing_card with `compositeScore ~0.82`
- **WHEN** `CompletedCard` renders the curated branch, an earlier card is pressed, and a centroid-only option is selected
- **THEN** score shown as `82%` (not `0.82`, not `0%`); pressing calls `setSelectedRouteId`+`setDisplayedRoutePlanId` and flips `chatMode false`; centroid→`setCameraPosition` zoom 12
- **Test tier:** `integration` · **Service:** @testing-library/react-native (Convex+RN mocked)
- **Verify:** `pnpm test components/chat/cards/curated-route-card.integration.test.tsx`
- **Scenario** (start `curated_routing_card_real_scores`):
  - must observe: `getByText('82%') !== null` (`Math.round(0.82*100) === 82`); `setDisplayedRoutePlanId` called 1 time with `routePlanId`; `chatMode === false` after press; `setCameraPosition.mock.calls.length === 1` with `zoom === 12`
  - must NOT observe: `getByText('0%') !== null` (zero for non-zero route); `queryByText('0.82') !== null` (raw decimal shown); `chatMode === true` (stuck in chat); `setCameraPosition.mock.calls.length === 0` (no camera call / empty)
  - negative control (would fail if): DATA-008b score normalization not applied (shows 0%); raw decimal rendered; curated branch disconnected (`onSelect`/`onViewOnMap` missing); centroid `doFit` crashes

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | `tagShowsLabelAndDistance` + `tagTapOpensDetails` + `tagFollowsPaging` pass — route-tag renders archetype+distance, tap opens details (not save), paging leaves one tag. | AC-1 | `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx` |
| TC-2 | `cardTapShowsThenHidesMapPlanningIndicator` + `cardTapDoesNotAppendChatMessage` pass — indicator visible while pending, gone after resolve, transcript delta 0. | AC-2 | `pnpm test app/(app)/(tabs)/index.card-loading.integration.test.tsx` |
| TC-3 | `tapPlotsRouteWithoutChatMessage` + `cameraFitsTappedRouteIncludingCentroid` + `typedMessageStillSends` pass — tap plots route without chat, camera fits centroid+multi-point, typed send increments count. | AC-3 | `pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx` |
| TC-4 | `curatedCardShowsScoreAsPercentOnZeroToOneScale` + `earlierCuratedCardReRendersAndReturnsToMap` + `centroidOnlyCuratedPlotsViaFallback` pass — score as %, card press→map, centroid camera zoom 12. | AC-4 | `pnpm test components/chat/cards/curated-route-card.integration.test.tsx` |

## Reading List

- `app/(app)/(tabs)/index.tsx` (423-455, 503-542, 620-681, 805-854, 1099-1163) — `handleSelectCuratedRoute`, `doFit` centroid fallback, auto-fit effect, `selectedOption` geometry, open-details handler
- `components/chat/routing-card.tsx` (229-289) — `CompletedCard` curated branch + `onSelect`/`onViewOnMap`
- `components/chat/cards/curated-route-card.tsx` (1-110) — the curated card rendering score as `%`
- `components/map/route-tag.tsx` — the route tag component
- `components/map/map-planning-indicator.tsx` (27-64) — the loading indicator
- `.spec/reviews/red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md` (59-85) — the 4 HIGH findings this closes
- `vitest.config.ts` (150-162, 195) — Convex alias and rnmapbox mock configuration

## Guardrails

**WRITE-ALLOWED:**
- `app/(app)/(tabs)/index.route-tag.integration.test.tsx (NEW)`
- `app/(app)/(tabs)/index.card-loading.integration.test.tsx (NEW)`
- `app/(app)/(tabs)/index.discovery.integration.test.tsx (NEW)`
- `components/chat/cards/curated-route-card.integration.test.tsx (NEW)`

**WRITE-PROHIBITED:** Any production source file (`app/(app)/(tabs)/index.tsx`, `components/chat/routing-card.tsx`, `components/chat/cards/curated-route-card.tsx`, `components/map/route-tag.tsx`, `components/map/map-planning-indicator.tsx`, etc.)
**WRITE-PROHIBITED:** `convex/**`

## Design

- ref: RUX-004 task ACs — route-tag on-map integration criteria
- ref: RUX-007 task ACs — card tap loading + no-chat-message criteria
- ref: DISC-016 task ACs — discovery pill plot + camera fit + typed send criteria
- ref: DISC-020 task ACs — curated card percentage score + re-render + centroid fallback criteria
- pattern: Render the real screen/component via `@testing-library/react-native` with Convex+RN mocked per harness reality. Add additive spies to the stubbed `@rnmapbox/maps` mock for `setCameraPosition`/`fitToCoordinates`. Assert on concrete observable testIDs, visible text, camera call args, and exact message-count deltas.
- anti-pattern: Writing "renders without crashing" assertions; mocking Convex data to static stubs that hide wiring gaps; asserting only empty/null values; modifying production source to make tests pass.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx app/(app)/(tabs)/index.card-loading.integration.test.tsx app/(app)/(tabs)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check app/(app)/(tabs)/index.route-tag.integration.test.tsx app/(app)/(tabs)/index.card-loading.integration.test.tsx app/(app)/(tabs)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx` |
| scope | `git diff --name-only ⊆ write_allowed` |

## Coding Standards

- Prefer `screen.getByTestId`/`queryByTestId`/`findByTestId` and `screen.getByText` for observable assertions.
- Use `waitFor` only when the test genuinely awaits async state transitions (e.g. mutation resolution).
- Keep mock route/option/chat data inline and non-degenerate (real coordinates, real labels, non-zero distances, `compositeScore 0.82`).
- Stub camera methods additively on the existing `@rnmapbox/maps` mock; do not replace the mock module.
- Use descriptive camelCase test names that match the parent ACs exactly.
- No production file changes; tests must adapt to existing component contracts.

## Dependencies

- Depends on: RUX-004, RUX-007, DISC-016, DISC-020 (the parent tasks whose AC test names this creates)
- Blocks: (none)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-003",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "plan_view_route_selected": {
      "description": "plan view rendered with a mocked selected route and route options (Scenic ~78mi + second route for paging)",
      "seed_method": "ui_flow",
      "records": ["selected route with archetype label and distance", "route-tag testID present", "two distinct routes for paging"]
    },
    "map_mode_card_tap_pending": {
      "description": "RN screen rendered in map mode where createCuratedPlan returns a controllable pending promise",
      "seed_method": "ui_flow",
      "records": ["chatMode === false", "createCuratedPlan returns a controllable pending promise", "transcript with N messages"]
    },
    "plan_view_discovery_cards": {
      "description": "plan view rendered with curated discovery suggestions and transcript of N messages",
      "seed_method": "ui_flow",
      "records": ["curated suggestion cards from useCuratedDiscovery", "centroid-only route and multi-point route", "transcript count N"]
    },
    "curated_routing_card_real_scores": {
      "description": "CompletedCard rendered with curated option carrying compositeScore ~0.82 + mileage",
      "seed_method": "ui_flow",
      "records": ["routing_card option with scores.composite ~0.82", "real road name", "mileage populated"]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the plan view with a route selected and plotted WHEN the map renders, the rider taps the tag, and pages THEN route-tag is present with archetype label + distance; tapping opens route-details-sheet (not save-route-sheet); paging leaves exactly one tag with the second route label",
      "verify": "pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "plan_view_route_selected",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "@testing-library/react-native (Convex+RN mocked per harness reality)",
        "must_observe": ["queryByTestId('route-tag') !== null", "route-tag text includes 'Scenic' and '78mi'", "after press: queryByTestId('route-details-sheet') !== null", "after press: queryByTestId('save-route-sheet') === null", "after paging: queryAllByTestId('route-tag').length === 1"],
        "must_not_observe": ["route-tag === null on render", "generic/empty label", "'--mi' placeholder", "save-route-sheet !== null after press", "queryAllByTestId('route-tag').length > 1 after paging"],
        "negative_control": { "would_fail_if": ["the tag renders a generic/empty label instead of the real archetype + distance", "no tag renders when a route is selected", "the distance substring is missing from the tag text"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "plan_view_route_selected", "action": { "actor": "user", "steps": ["render with Scenic route selected", "read route-tag text", "fireEvent.press(route-tag)", "press route-carousel-next-arrow"] }, "end_state": { "must_observe": ["queryByTestId('route-tag') !== null with text matching /Scenic.*78mi/", "queryByTestId('route-details-sheet') !== null after press", "queryByTestId('save-route-sheet') === null after press", "queryAllByTestId('route-tag').length === 1 after paging"], "must_not_observe": ["queryByTestId('route-tag') === null (empty/no tag)", "save-route-sheet !== null (wrong sheet)", "queryAllByTestId('route-tag').length === 0 or > 1 after paging"] } }]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the plan view in map mode with createCuratedPlan pending WHEN handleSelectCuratedRoute runs and the mutation resolves THEN map-planning-indicator is present while pending and absent after resolve, and the transcript message count delta === 0",
      "verify": "pnpm test app/(app)/(tabs)/index.card-loading.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "map_mode_card_tap_pending",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "@testing-library/react-native (jsdom, Convex+RN mocked)",
        "must_observe": ["while pending: queryByTestId('map-planning-indicator') !== null", "after resolve: queryByTestId('map-planning-indicator') === null", "transcript count delta === 0"],
        "must_not_observe": ["indicator === null throughout (0 shown)", "indicator !== null after resolve (stuck)", "transcript count === N+1"],
        "negative_control": { "would_fail_if": ["setMapPlanningVisible call is omitted from the loading path", "the finally clear is removed so indicator sticks", "the card tap path re-introduces a session_messages write"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "map_mode_card_tap_pending", "action": { "actor": "user", "steps": ["fireEvent.press(card) with pending mutation", "assert indicator present", "resolve mutation", "assert indicator absent"] }, "end_state": { "must_observe": ["queryByTestId('map-planning-indicator') !== null while pending (1 shown)", "queryByTestId('map-planning-indicator') === null after resolve", "transcript count after === N (delta === 0)"], "must_not_observe": ["queryByTestId('map-planning-indicator') === null throughout (0 shown / empty)", "indicator !== null after resolve (stuck)", "transcript count === N+1 (delta !== 0)"] } }]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the plan view with curated discovery cards and transcript count N WHEN tapping a discovery-suggestion-pill, fitting centroid + multi-point routes, and typing+sending THEN tap renders home-route-polyline with count unchanged; centroid setCameraPosition zoom 12; multi-point fitToCoordinates >1 coord; typed send count N+1",
      "verify": "pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "plan_view_discovery_cards",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "@testing-library/react-native (Convex+RN mocked, additive camera/fit spies)",
        "must_observe": ["after tap: queryByTestId('home-route-polyline') !== null", "after tap: transcript count === N (unchanged)", "centroid: setCameraPosition.mock.calls.length === 1 with zoom 12", "multi-point: fitToCoordinates called with coords.length > 1", "after send: transcript count === N+1"],
        "must_not_observe": ["transcript count === N+1 from pill tap", "home-route-polyline === null after tap", "setCameraPosition.mock.calls.length === 0", "send count stays N (no-op)"],
        "negative_control": { "would_fail_if": ["the tap still calls handleSendMessage instead of only plotting", "doFit is never invoked for a selected curated route", "the message-send path is accidentally removed"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "plan_view_discovery_cards", "action": { "actor": "user", "steps": ["press discovery-suggestion-pill-{routeId}", "assert polyline + count", "press centroid-only pill", "type + send"] }, "end_state": { "must_observe": ["queryByTestId('home-route-polyline') !== null after tap", "transcript count === N after tap (delta === 0)", "setCameraPosition.mock.calls.length === 1 (zoom 12) for centroid", "fitToCoordinates coords.length > 1 for multi-point", "transcript count === N+1 after send"], "must_not_observe": ["transcript count === N+1 after tap (wrong — tap should not send)", "queryByTestId('home-route-polyline') === null (empty map)", "setCameraPosition.mock.calls.length === 0 (no camera call)", "transcript count === N after send (no-op / 0 increment)"] } }]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a completed curated routing_card with compositeScore ~0.82 WHEN CompletedCard renders the curated branch, an earlier card is pressed, and a centroid-only option is selected THEN score shown as 82% (not 0.82, not 0%); pressing calls setSelectedRouteId+setDisplayedRoutePlanId and flips chatMode false; centroid setCameraPosition zoom 12",
      "verify": "pnpm test components/chat/cards/curated-route-card.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "curated_routing_card_real_scores",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "@testing-library/react-native (Convex+RN mocked)",
        "must_observe": ["getByText('82%') !== null OR bar fillWidth === '82%'", "getByText(real road name) !== null", "setDisplayedRoutePlanId called once", "chatMode === false after press", "setCameraPosition zoom === 12 for centroid"],
        "must_not_observe": ["getByText('0%') for a non-zero route", "queryByText('0.82') !== null (raw decimal)", "chatMode === true after press", "setCameraPosition.mock.calls.length === 0"],
        "negative_control": { "would_fail_if": ["DATA-008b score normalization not applied (shows 0%)", "raw decimal compositeScore rendered instead of percentage", "curated branch in CompletedCard disconnected (onSelect/onViewOnMap missing)", "doFit lacks centroid fallback"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "curated_routing_card_real_scores", "action": { "actor": "user", "steps": ["render CompletedCard curated branch with composite 0.82", "read score text", "fireEvent.press(curated card)", "select centroid-only option"] }, "end_state": { "must_observe": ["getByText('82%') !== null (Math.round(0.82*100) === 82)", "setDisplayedRoutePlanId called 1 time with routePlanId", "chatMode === false after press", "setCameraPosition.mock.calls.length === 1 with zoom === 12"], "must_not_observe": ["getByText('0%') !== null (zero for non-zero route)", "queryByText('0.82') !== null (raw decimal shown)", "chatMode === true (stuck in chat)", "setCameraPosition.mock.calls.length === 0 (no camera call / empty)"] } }]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "tagShowsLabelAndDistance + tagTapOpensDetails + tagFollowsPaging pass — route-tag renders archetype+distance, tap opens details (not save), paging leaves one tag.",
      "verify": "pnpm test app/(app)/(tabs)/index.route-tag.integration.test.tsx",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "cardTapShowsThenHidesMapPlanningIndicator + cardTapDoesNotAppendChatMessage pass — indicator visible while pending, gone after resolve, transcript delta 0.",
      "verify": "pnpm test app/(app)/(tabs)/index.card-loading.integration.test.tsx",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "tapPlotsRouteWithoutChatMessage + cameraFitsTappedRouteIncludingCentroid + typedMessageStillSends pass — tap plots route without chat, camera fits centroid+multi-point, typed send increments count.",
      "verify": "pnpm test app/(app)/(tabs)/index.discovery.integration.test.tsx",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "curatedCardShowsScoreAsPercentOnZeroToOneScale + earlierCuratedCardReRendersAndReturnsToMap + centroidOnlyCuratedPlotsViaFallback pass — score as %, card press to map, centroid camera zoom 12.",
      "verify": "pnpm test components/chat/cards/curated-route-card.integration.test.tsx",
      "maps_to_ac": "AC-4"
    }
  ]
}
-->
