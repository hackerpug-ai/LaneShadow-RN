# RUX-003: Tapping the route polyline opens RouteDetailsSheet (details), not SaveRouteSheet; remove the save-on-tap path

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** M · **Estimate:** 120 min
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** react-native-ui-planner
**Agent rationale:** Rewires `handleSegmentSelect` (`index.tsx:1099-1163`) so a polyline tap opens RouteDetailsSheet instead of building save data and calling `setSaveRouteSheetVisible(true)`. RouteDetailsSheet is not yet mounted in index.tsx, so it must be wired in. Pure plan-view UI/state — no Convex change.

> **Remedial — Sprint 1 testing feedback (item 5):** "clicking on the route line should open the route details not try to save the route, only in the route menu is that where you should save."

## Outcome

Tapping the route line opens the Route Details sheet (showing the active route's stats); the Save Route sheet does NOT open from the tap. Save remains reachable from the route menu (MapControls `onSaveRoute`) and from the details sheet's own Save action — never as a side effect of tapping the map.

## Specification

Today `route-polyline-component.tsx:150-170` `handlePress` → `onSegmentSelect` bubbles to `index.tsx:1099-1163` `handleSegmentSelect`, which builds save data and opens SaveRouteSheet (`setSaveRouteSheetVisible(true)`, ~line 1159). Rewire `handleSegmentSelect` to instead open RouteDetailsSheet for the active route, and MOUNT RouteDetailsSheet in index.tsx (it is not currently mounted — only SaveRouteSheet is) with `routeDetailsSheetVisible` state, passing `route = agentActiveOption || selectedOption` and `onSave = handleSaveRoutePress` so Save is still reachable from inside details. Remove the save-data construction + `setSaveRouteSheetVisible` from the tap path. Preserve haptic feedback on tap. Save stays reachable from MapControls `onSaveRoute` (`index.tsx:1368`).

## Critical Constraints

- **MUST** make a tap on the route polyline open RouteDetailsSheet (route details) for the active route. RouteDetailsSheet is not currently mounted in index.tsx — wire it in with state (`routeDetailsSheetVisible`) and pass the active PlannedRouteOptionView. Save remains reachable ONLY from the route menu (MapControls `onSaveRoute`) and/or the details sheet's Save action.
- **NEVER** call `setSaveRouteSheetVisible(true)` from the polyline-tap path (`handleSegmentSelect`, ~line 1159) — that save-on-tap path is the bug and MUST be removed. **NEVER** open the save sheet as a side effect of selecting/tapping a route line.
- **STRICTLY** preserve the existing save affordances elsewhere: MapControls `onSaveRoute` (`handleSaveRoutePress`, 1166+) and the details sheet's own `onSave` button must still open SaveRouteSheet — only the tap-on-line path changes from save→details. Touch still gives haptic feedback.

## Acceptance Criteria

### AC-1: Polyline tap opens RouteDetailsSheet, not SaveRouteSheet
*(PRIMARY)*
- **GIVEN** the plan view with an active route plotted and both the route-details and save sheets closed
- **WHEN** the rider taps the route polyline (`onSegmentSelect` fires)
- **THEN** the RouteDetailsSheet becomes visible (`route-details-sheet` present) and the SaveRouteSheet does NOT become visible
- **Test tier:** `integration` · **Service:** live Convex dev (route_plans) via @testing-library/react-native
- **Verify:** `pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t tapOpensDetailsNotSave`

### AC-2: Save is still reachable from the details sheet
- **GIVEN** the RouteDetailsSheet is open from a polyline tap
- **WHEN** the rider presses the details sheet's Save action
- **THEN** the SaveRouteSheet opens with the active route's save data (save path preserved, relocated off the tap)
- **Test tier:** `integration` · **Service:** live Convex dev via @testing-library/react-native
- **Verify:** `pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t saveReachableFromDetails`

### AC-3: Tap with no active route is a safe no-op (error/edge)
- **GIVEN** the plan view with NO active route (`agentActiveOption` and `selectedOption` both null)
- **WHEN** a polyline `onSegmentSelect` somehow fires (stale event)
- **THEN** neither the details nor the save sheet opens and no crash occurs
- **Test tier:** `integration` · **Service:** live Convex dev via @testing-library/react-native
- **Verify:** `pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t tapNoRouteIsNoop`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Polyline tap opens `route-details-sheet` and does NOT open `save-route-sheet`. | AC-1 | `pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t tapOpensDetailsNotSave` |
| TC-2 | Pressing Save in the details sheet opens `save-route-sheet` with the active route data. | AC-2 | `pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t saveReachableFromDetails` |
| TC-3 | A segment-select with no active route opens neither sheet and does not crash. | AC-3 | `pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t tapNoRouteIsNoop` |

## Reading List

- `app/(app)/(tabs)/index.tsx` (1099-1163) — `handleSegmentSelect` — builds save data + `setSaveRouteSheetVisible(true)` at ~1159; rewire to open RouteDetailsSheet instead
- `app/(app)/(tabs)/index.tsx` (1166-1223) — `handleSaveRoutePress` + `setSaveRouteSheetVisible` — keep as the save entry from MapControls/details (not from tap)
- `app/(app)/(tabs)/index.tsx` (1505-1512) — SaveRouteSheet render site — add the RouteDetailsSheet mount nearby
- `components/sheets/route-details-sheet.tsx` (33-100) — RouteDetailsSheetProps (isVisible/onClose/route/onSave/isSaving/testID) — mount with route=active option, onSave=handleSaveRoutePress
- `components/map/route-polyline-component.tsx` (150-170) — `handlePress` → `onSegmentSelect` — the tap source bubbling to handleSegmentSelect (unchanged)

## Guardrails

**WRITE-ALLOWED:** `app/(app)/(tabs)/index.tsx`, `app/(app)/(tabs)/index.route-tap.integration.test.tsx` (NEW)
**WRITE-PROHIBITED:** `components/sheets/route-details-sheet.tsx`, `components/ui/save-favorite-sheet.tsx`, `components/map/route-polyline-component.tsx`, `convex/**`

## Design

- ref: DESIGN-S01-007 (route details sheet as the tap destination; save relocated off the line)
- **Pattern:** Tap line → open details sheet for the active route; save is a secondary action inside details/menu.
- **Anti-pattern:** Opening the Save sheet directly on a line tap (the removed `setSaveRouteSheetVisible(true)` at ~`index.tsx:1159`).
- **Interaction notes:** tap on line → Route Details sheet (read-first, save-second); save reachable from details sheet Save action and the map-controls save button only; haptic feedback on tap preserved.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'app/(app)/(tabs)/index.tsx'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: the AC-1 test must FAIL on the current code (tap opens the save sheet) before the rewire makes it pass` |
| human_gate | `On-device (real iOS+Android, live Convex): tap the route line → Route Details opens (NOT Save); Save still reachable from the details sheet and the map save button` |

## Coding Standards

- Remove the save-data construction + `setSaveRouteSheetVisible` from `handleSegmentSelect`; keep the haptic + highlight if still desired.
- Mount RouteDetailsSheet with `testID='route-details-sheet'`; pass `route = agentActiveOption || selectedOption` (guard null) and `onSave = handleSaveRoutePress` so Save is preserved.
- All colors/spacing via `useSemanticTheme()`; no hardcoded hex (the route-details-sheet already complies — don't regress it).
- Integration test renders the real screen against live Convex; Mapbox handle stubbed only at the native boundary; Convex data NOT mocked.
- No `any` on the route prop passed to RouteDetailsSheet.

## Dependencies

- Depends on: (none — independent of the carousel)
- Blocks: RUX-004 (the tag tap reuses this open-details handler), RUX-005 (makes the mounted details sheet's actions reachable)

## Notes

RouteDetailsSheet (`components/sheets/route-details-sheet.tsx`) is NOT currently mounted in index.tsx — only SaveRouteSheet is. This task adds the mount + `routeDetailsSheetVisible` state and rewires the tap. RUX-005 then fixes the sheet's snap/scroll so its Save/Ride actions are never cut off. **Interpretation flag for the user:** the feedback says "only in the route menu is that where you should save" — this task keeps Save reachable from BOTH the map-controls menu AND the details sheet (a deliberate, non-tap action). If you want Save removed from the details sheet entirely (menu-only), say so and it's a one-line scope change.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "plan_view_active_route_sheets_closed": {
      "description": "plan view against live Convex with one active route plotted (agentActiveOption set), route-details and save sheets both closed",
      "seed_method": "public_api",
      "records": [ "one active route_plans option plotted", "routeDetailsSheetVisible=false", "saveRouteSheetVisible=false" ]
    },
    "plan_view_details_open": {
      "description": "plan view with the RouteDetailsSheet already opened via a polyline tap for the active route",
      "seed_method": "public_api",
      "records": [ "active route plotted", "route-details-sheet open with route=active option" ]
    },
    "plan_view_no_active_route": {
      "description": "plan view against live Convex with NO active route (agentActiveOption and selectedOption null)",
      "seed_method": "public_api",
      "records": [ "no active route_plans", "agentActiveOption null", "selectedOption null" ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN an active route with both sheets closed WHEN the rider taps the polyline THEN RouteDetailsSheet opens and SaveRouteSheet does not",
      "verify": "pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t tapOpensDetailsNotSave",
      "scenario": {
        "start_ref": "plan_view_active_route_sheets_closed", "tier": "visible", "test_tier": "integration",
        "verification_service": "live Convex dev via @testing-library/react-native",
        "negative_control": { "would_fail_if": [
          "the tap still opens the SaveRouteSheet (the old setSaveRouteSheetVisible(true) path)",
          "neither sheet opens (tap handler disconnected — no-op)",
          "RouteDetailsSheet opens but renders no route (route prop not wired to the active option)"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_active_route_sheets_closed",
          "action": { "actor": "user", "steps": [
            "render the plan view with an active route plotted",
            "fire the polyline onSegmentSelect (tap) via the route-polyline shape source",
            "query for the details and save sheets"
          ] },
          "end_state": {
            "must_observe": [
              "queryByTestId('route-details-sheet') !== null (Route Details sheet open)",
              "the details sheet shows the active route's label (e.g. 'Scenic Coastal')",
              "queryByTestId('save-route-sheet') === null (save sheet NOT open)"
            ],
            "must_not_observe": [
              "queryByTestId('save-route-sheet') !== null after the tap (save-on-tap regression)",
              "queryByTestId('route-details-sheet') === null after the tap (no sheet / no-op)"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN RouteDetailsSheet open from a tap WHEN the rider presses its Save action THEN SaveRouteSheet opens with the active route data",
      "verify": "pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t saveReachableFromDetails",
      "scenario": {
        "start_ref": "plan_view_details_open", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "live Convex dev via @testing-library/react-native",
        "negative_control": { "would_fail_if": [
          "removing save-on-tap also removed the save path entirely (Save button is a no-op)",
          "the Save button opens the save sheet with empty/undefined routeData",
          "the details Save button is absent (onSave not passed to the sheet)"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_details_open",
          "action": { "actor": "user", "steps": [
            "open RouteDetailsSheet via a polyline tap",
            "fireEvent.press the details sheet save button",
            "query for the save sheet"
          ] },
          "end_state": {
            "must_observe": [
              "queryByTestId('save-route-sheet') !== null after pressing Save in details",
              "the save sheet carries the active route's data (suggestedName === the route label, e.g. 'Scenic Coastal')"
            ],
            "must_not_observe": [
              "no save sheet opening on the details Save press (save path lost)",
              "save sheet opening with undefined/empty routeData"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN no active route WHEN a segment-select fires THEN neither sheet opens and no crash occurs",
      "verify": "pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t tapNoRouteIsNoop",
      "scenario": {
        "start_ref": "plan_view_no_active_route", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "live Convex dev via @testing-library/react-native",
        "negative_control": { "would_fail_if": [
          "a tap with no active route opens an empty details sheet (route null not guarded)",
          "it throws when agentRoutePlan/agentActiveOption are null",
          "it opens the save sheet with null routeData"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "plan_view_no_active_route",
          "action": { "actor": "user", "steps": [
            "render the plan view with no active route",
            "invoke the segment-select handler",
            "query for both sheets"
          ] },
          "end_state": {
            "must_observe": [
              "queryByTestId('route-details-sheet') === null",
              "queryByTestId('save-route-sheet') === null",
              "the screen renders with 0 thrown errors"
            ],
            "must_not_observe": [
              "an empty details sheet rendered with a null route",
              "a crash / unhandled exception"
            ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "Polyline tap opens route-details-sheet and not save-route-sheet.", "maps_to_ac": "AC-1", "verify": "pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t tapOpensDetailsNotSave" },
    { "id": "TC-2", "type": "test_criterion", "description": "Save reachable from the details sheet opens save-route-sheet with the route data.", "maps_to_ac": "AC-2", "verify": "pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t saveReachableFromDetails" },
    { "id": "TC-3", "type": "test_criterion", "description": "Segment-select with no active route opens neither sheet and does not crash.", "maps_to_ac": "AC-3", "verify": "pnpm test app/(app)/(tabs)/index.route-tap.integration.test.tsx -t tapNoRouteIsNoop" }
  ]
}
-->
