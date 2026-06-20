# RUX-007: Show the existing map loading-state on a discovery card tap (reuse the regular-search mechanism)

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** S · **Estimate:** 90 min
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** react-native-ui-planner
**Agent rationale:** The map loading indicator the founder wants on a card tap already exists and is wired by regular search — `handleSendMessage` calls `setMapPlanningVisible(true)` (`index.tsx:397`) which renders `MapPlanningIndicator` (the "Planning route" pill + typing dots). The discovery card-tap handler `handleSelectCuratedRoute` (`index.tsx:423-455`) never sets it, so tapping a card shows no feedback during the `createCuratedPlan` await. This task adds the two missing calls (show before the await, clear in `finally`) — pure reuse, no new component, no Convex change, and it must NOT re-introduce a chat message (preserves DISC-016).

> **Remedial — Sprint 1 testing feedback (2026-06-20, item #2):** "when you press the route card there's no loading state on map view … the system messages should push on in vanishing mode (ideally the same message as returned in chat mode … just temp). The UI should already have this logic. Make sure we're using it. It looks in regular search we are using this … just needs to be applied to discovery card click."

## Outcome

Tapping a discovery suggestion card shows the SAME map-mode loading affordance regular search shows — the existing `MapPlanningIndicator` ("thinking"/Planning pill) appears for the duration of the plan-resolution await and then dismisses when the route plots. No new chat transcript message is created (DISC-016's direct-plot contract is preserved).

## Specification

The loading/ephemeral mechanism already exists: `mapPlanningVisible` state (`index.tsx:97`) → `MapPlanningIndicator` rendered at `index.tsx:1417-1420` (component `components/map/map-planning-indicator.tsx:27-64`), with a separate ephemeral toast surface via `useToastMessages` (5s auto-dismiss) → `MapToastStack`. Regular search wires the loading state: `handleSendMessage` calls `setMapPlanningVisible(true)` at `index.tsx:397`; the dismiss effect at `index.tsx:343-344` clears it when `!isPlanning`. The discovery card tap `handleSelectCuratedRoute` (`index.tsx:423-455`) awaits `createCuratedPlan` (real Convex latency) with NO `setMapPlanningVisible` call → zero feedback. Add, at the start of `handleSelectCuratedRoute` (mirroring `index.tsx:396-398`): `if (!chatMode) setMapPlanningVisible(true)`. Because the curated plan is not a streaming `session_messages` row, the `isPlanning`-keyed dismiss effect (343-344) will not auto-clear it here — so clear it deterministically in a `finally` after the plan is set / fit requested: `setMapPlanningVisible(false)`. Reuse `MapPlanningIndicator` as the map-mode "thinking" affordance (it already is, for search). Do NOT write a `session_messages` row (that re-introduces the chat round-trip DISC-016 removed and breaks DISC-016 AC-1's "transcript count unchanged").

## Critical Constraints

- **MUST** make `MapPlanningIndicator` visible during the `createCuratedPlan` await in `handleSelectCuratedRoute` by reusing the existing `setMapPlanningVisible(true)` mechanism (the exact call regular search uses at index.tsx:397), and **MUST** clear it in a `finally` so it never sticks.
- **MUST** preserve DISC-016: tapping a card creates NO new `session_messages`/transcript bubble.
- **NEVER** build a new loading component/hook/state — reuse `mapPlanningVisible` + `MapPlanningIndicator`. **NEVER** add a `sendMessage`/Convex write to the card-tap path. **NEVER** leave the indicator visible after resolution (no orphaned spinner).

## Acceptance Criteria

### AC-1: Card tap shows the existing map loading indicator, then plots — no chat message (real device)
*(PRIMARY)*
- **GIVEN** the signed-in home in map mode with curated suggestion cards present
- **WHEN** the rider taps `discovery-suggestion-pill-{routeId}`
- **THEN** `map-planning-indicator` appears during the plan-resolution await and the route plots (`home-route-polyline`), with NO new chat transcript message
- **Test tier:** `e2e` · **Service:** dev client + live Convex dev + Simulator location
- **Verify:** `maestro test .maestro/rux-007-card-tap-loading-state.yaml -e EMAIL=$CLERK_TEST_EMAIL -e PASSWORD=$CLERK_TEST_PASSWORD`

### AC-2: handleSelectCuratedRoute toggles the indicator across the await (wiring)
*(SUPPLEMENTARY)*
- **GIVEN** the screen in map mode WHEN `handleSelectCuratedRoute` runs with `createCuratedPlan` pending
- **THEN** `MapPlanningIndicator` renders `visible` while the mutation promise is unresolved and stops rendering after it resolves
- **Test tier:** `integration` (jsdom; Convex+RN mocked per harness reality) · **Service:** @testing-library/react-native
- **Verify:** `pnpm test "app/(app)/(tabs)/index.card-loading.integration.test.tsx" -t cardTapShowsThenHidesMapPlanningIndicator`

### AC-3: card tap does not append a chat message (DISC-016 non-regression)
*(SUPPLEMENTARY)*
- **GIVEN** the card tap WHEN it completes
- **THEN** the transcript message count is unchanged (no `session_messages` write)
- **Test tier:** `integration` (jsdom; mocked per harness reality) · **Service:** @testing-library/react-native
- **Verify:** `pnpm test "app/(app)/(tabs)/index.card-loading.integration.test.tsx" -t cardTapDoesNotAppendChatMessage`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | On a real device, tapping a card shows `map-planning-indicator` before `home-route-polyline` appears, no new transcript bubble. | AC-1 | `maestro test .maestro/rux-007-card-tap-loading-state.yaml` |
| TC-2 | Indicator is visible while the mutation is pending and gone after it resolves. | AC-2 | `pnpm test "app/(app)/(tabs)/index.card-loading.integration.test.tsx" -t cardTapShowsThenHidesMapPlanningIndicator` |
| TC-3 | Transcript count N before === N after the card tap. | AC-3 | `pnpm test "app/(app)/(tabs)/index.card-loading.integration.test.tsx" -t cardTapDoesNotAppendChatMessage` |

## Reading List

- `app/(app)/(tabs)/index.tsx` (423-455) — `handleSelectCuratedRoute` (the card-tap path; add show + finally-clear)
- `app/(app)/(tabs)/index.tsx` (394-398) — `handleSendMessage` showing the regular-search pattern to mirror (`setMapPlanningVisible(true)`)
- `app/(app)/(tabs)/index.tsx` (97, 343-344, 1417-1420) — `mapPlanningVisible` state + the `isPlanning`-keyed dismiss effect + the `MapPlanningIndicator` render slot
- `components/map/map-planning-indicator.tsx` (27-64) — the reused indicator (read; do not change)
- `hooks/use-toast-messages.ts` (9, 162-179) + `MapToastStack` (index.tsx:1423-1434) — the ephemeral toast surface (reference only; not required by the minimal fix)

## Guardrails

**WRITE-ALLOWED:** `app/(app)/(tabs)/index.tsx` (only `handleSelectCuratedRoute`), `.maestro/rux-007-card-tap-loading-state.yaml` (NEW), `app/(app)/(tabs)/index.card-loading.integration.test.tsx` (NEW)
**WRITE-PROHIBITED:** `components/map/map-planning-indicator.tsx`, `hooks/use-toast-messages.ts`, `components/chat/chat-input.tsx`, `convex/**` (NO Convex change — DISC-016 mutation stays as-is)

## Design

- No DESIGN spec required — the loading pill/toast already exist and are specified by the search path's design; this is reuse-wiring with no new visual decisions.
- **Pattern:** card tap → `setMapPlanningVisible(true)` → await `createCuratedPlan` → plot → `finally setMapPlanningVisible(false)`.
- **Anti-pattern:** silent await with no feedback (current); or re-adding a `session_messages` chat round-trip (breaks DISC-016).
- **Founder-intent note:** the "vanishing/temp system message" is the existing map-mode thinking affordance (`MapPlanningIndicator`). The minimal contract-safe reuse is that indicator. ONLY if the founder specifically wants the toast-style copy, feed `useToastMessages`/`MapToastStack` a client-only ephemeral toast — do NOT add a Convex message either way.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test "app/(app)/(tabs)/index.card-loading.integration.test.tsx"` |
| e2e | `maestro test .maestro/rux-007-card-tap-loading-state.yaml -e EMAIL=$CLERK_TEST_EMAIL -e PASSWORD=$CLERK_TEST_PASSWORD` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'app/(app)/(tabs)/index.tsx'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: the AC-2 test must FAIL on the current handler (no setMapPlanningVisible call → indicator never shown) before the change makes it pass` |
| human_gate | `On-device (live Convex): tap a curated suggestion card → the Planning indicator shows on the map while the route resolves, then the route plots; no new chat bubble appears` |

## Coding Standards

- Reuse `mapPlanningVisible` + `MapPlanningIndicator`; no new loading UI.
- Clear the indicator in a `finally` (or equivalent guaranteed path) so it cannot stick if `createCuratedPlan` throws.
- Guard the show with `!chatMode` (mirror the search path), since the indicator is a map-mode affordance.

## Dependencies

- Depends on: DISC-016 (the landed card-tap handler — Completed) — build on the merged handler, preserve its no-transcript contract
- Coordinates with: RUX-006 / RUX-008 (same `index.tsx`, distinct functions); adjacent to RUX-008 in the index.tsx merge order (both touch the discovery/completion path)

## Notes

**Harness reality (carry into the test plan):** vitest aliases Convex `_generated/*` to mocks (vitest.config.ts:150-162) and stubs rnmapbox without an imperative handle (195). The vitest tier (AC-2/AC-3) asserts the indicator-toggle wiring and the no-transcript invariant against mocked Convex; the genuine "watched it work" tier is the Maestro e2e flow (AC-1) against live Convex dev. The `isPlanning`-keyed dismiss effect (index.tsx:343-344) will NOT auto-clear the indicator for the card path (the curated plan isn't a streaming message) — the `finally` clear is load-bearing, not optional.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "map_mode_with_curated_cards": {
      "description": "signed-in home in map mode with curated suggestion cards present (live Convex curated routes), no active route",
      "seed_method": "public_api",
      "records": [ "curated suggestion cards from listCuratedRoutes", "no active route on the map", "chatMode === false" ]
    },
    "map_mode_card_tap_pending_mutation": {
      "description": "the RN screen rendered via the testing-library UI-flow harness in map mode, where createCuratedPlan is wired to a controllable pending (unresolved) promise so the loading window is observable",
      "seed_method": "ui_flow",
      "records": [ "chatMode === false", "createCuratedPlan returns a controllable pending promise" ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN map mode with curated cards WHEN the rider taps a card THEN map-planning-indicator shows during the await and the route plots, with no new chat transcript message",
      "verify": "maestro test .maestro/rux-007-card-tap-loading-state.yaml -e EMAIL=$CLERK_TEST_EMAIL -e PASSWORD=$CLERK_TEST_PASSWORD",
      "scenario": {
        "start_ref": "map_mode_with_curated_cards", "tier": "visible", "test_tier": "e2e",
        "verification_service": "dev client + live Convex dev + Simulator location",
        "negative_control": { "would_fail_if": [
          "the setMapPlanningVisible(true) call is omitted from handleSelectCuratedRoute (current code) so map-planning-indicator is never shown on card tap",
          "a new transcript bubble appears because a session_messages write was re-introduced (the card re-added a chat message)",
          "the createCuratedPlan path is a no-op / disconnected so home-route-polyline never appears (route did not plot)"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "map_mode_with_curated_cards",
          "action": { "actor": "user", "steps": [
            "sign in via e2e-test-login-button; wait for chat-input + a discovery-suggestion-pill",
            "tap discovery-suggestion-pill-{routeId}",
            "assert map-planning-indicator visible (short extendedWaitUntil); capture 02-card-tap-loading",
            "wait for home-route-polyline visible"
          ] },
          "end_state": {
            "must_observe": [ "testID 'map-planning-indicator' is asserted visible after the tap and BEFORE testID 'home-route-polyline' (1 indicator shown during the await)", "testID 'home-route-polyline' is visible after resolution (the route line plots)" ],
            "must_not_observe": [ "a new transcript message bubble for the tapped card (transcript delta === 0)", "the map-planning-indicator staying empty / never appearing (0 indicators shown)" ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN map mode with createCuratedPlan pending WHEN handleSelectCuratedRoute runs THEN MapPlanningIndicator renders visible during the await and is gone after resolution",
      "verify": "pnpm test \"app/(app)/(tabs)/index.card-loading.integration.test.tsx\" -t cardTapShowsThenHidesMapPlanningIndicator",
      "scenario": {
        "start_ref": "map_mode_card_tap_pending_mutation", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "@testing-library/react-native (Convex+RN mocked per harness reality)",
        "negative_control": { "would_fail_if": [
          "the setMapPlanningVisible call is omitted so the indicator stays null throughout (current handler is a no-op for the loading state)",
          "the finally clear is removed so the indicator stays visible (stuck) after the mutation resolves"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "map_mode_card_tap_pending_mutation",
          "action": { "actor": "user", "steps": [
            "fireEvent.press(discovery-suggestion-pill) with createCuratedPlan pending",
            "assert map-planning-indicator present while pending",
            "resolve the mutation; assert map-planning-indicator absent"
          ] },
          "end_state": {
            "must_observe": [ "queryByTestId('map-planning-indicator') !== null while pending (chatMode === false)", "queryByTestId('map-planning-indicator') === null after resolution" ],
            "must_not_observe": [ "queryByTestId('map-planning-indicator') === null throughout (0 indicators, the empty no-op state)", "the indicator stuck visible after resolution (still !== null when 0 should remain)" ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN the card tap WHEN it completes THEN the transcript message count is unchanged (DISC-016 preserved)",
      "verify": "pnpm test \"app/(app)/(tabs)/index.card-loading.integration.test.tsx\" -t cardTapDoesNotAppendChatMessage",
      "scenario": {
        "start_ref": "map_mode_with_curated_cards", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "@testing-library/react-native (mocked per harness reality)",
        "negative_control": { "would_fail_if": [ "a session_messages write is re-introduced (not omitted) so transcript count increments by 1 instead of staying unchanged" ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "map_mode_with_curated_cards",
          "action": { "actor": "user", "steps": [ "record transcript message count N", "tap the card and let it complete", "record count again" ] },
          "end_state": { "must_observe": [ "transcript count after === N (delta === 0, unchanged)" ], "must_not_observe": [ "transcript count === N + 1 (delta !== 0 — an extra message bubble appeared instead of the expected empty delta of 0)" ] }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "Real-device card tap shows the indicator before the polyline; no new bubble.", "maps_to_ac": "AC-1", "verify": "maestro test .maestro/rux-007-card-tap-loading-state.yaml" },
    { "id": "TC-2", "type": "test_criterion", "description": "Indicator visible while pending, gone after resolve.", "maps_to_ac": "AC-2", "verify": "pnpm test \"app/(app)/(tabs)/index.card-loading.integration.test.tsx\" -t cardTapShowsThenHidesMapPlanningIndicator" },
    { "id": "TC-3", "type": "test_criterion", "description": "No transcript message appended on card tap.", "maps_to_ac": "AC-3", "verify": "pnpm test \"app/(app)/(tabs)/index.card-loading.integration.test.tsx\" -t cardTapDoesNotAppendChatMessage" }
  ]
}
-->
