# RUX-005: Fix the Route Overview / details sheet so it expands fully and the action buttons (Save / Ride It) are never cut off

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** M · **Estimate:** 120 min
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** react-native-ui-planner
**Agent rationale:** Fixes the sheet snap-point/scroll architecture: `route-details-sheet` uses `preset='half'` (single `['60%']` snap, actions OUTSIDE the ScrollView → cut off) and `route-directions-sheet` ("Route Overview", line 222) keeps everything inside `BottomSheetScrollView` with no pinned footer. Both are bottom-sheet layout fixes — no Convex change.

> **Remedial — Sprint 1 testing feedback (item 2):** "route overview doesn't expand fully and buttons are hidden." (Image #2) Implements [DESIGN-S01-007](./DESIGN-S01-007-route-overview-details-sheet-expand-spec.md).

## Outcome

Opening the Route Details / Route Overview sheet shows the Save (and Ride It) action buttons fully visible and tappable at the initial snap; expanding to 90% scrolls the body without ever hiding the actions; on a notched device the action row sits above the home indicator.

## Specification

`route-details-sheet.tsx` renders a `flex:1` ScrollView then an `actions` View under `BottomSheetWrapper preset='half'` (single `['60%']` snap) — on tall content the actions get pushed off the visible 60% sheet. Fix by (a) giving the sheet a multi-stop snap that can expand to 90%, and (b) restructuring so the action footer is pinned (BottomSheetWrapper `footer` slot / non-scrolling pinned row) above `insets.bottom` while the body scrolls in a `BottomSheetScrollView`. Adopt the ALREADY-PROVEN pattern in `route-directions-sheet.tsx` (`snapPoints ['50%','90%']` + `wrapChildren=false` + sticky footer + `paddingBottom insets.bottom`). Apply the same pinned-footer guarantee to the "Route Overview" directions sheet (verify no regression). Save + Ride It as `Button size='lg'` (≥44pt) with testIDs `route-details-sheet-save-button` / `route-details-sheet-ride-button`.

## Critical Constraints

- **MUST** make the Route Details sheet expandable so its action buttons (Save / Ride It) are ALWAYS reachable: multi-stop snap (e.g. `['60%','90%']`) and the action row pinned/visible while the body scrolls — actions never pushed below the snapped height. The "Route Overview"-titled directions sheet MUST likewise keep its actions reachable at every snap.
- **NEVER** place the action buttons in a fixed View AFTER a flex ScrollView inside a single fixed-height snap such that they overflow off-screen (the current `route-details-sheet` pattern). **NEVER** hardcode hex/spacing — via semantic. **NEVER** add safe-area-bottom-blind padding that re-cuts the actions on a notched device.
- **STRICTLY** pin the action footer above the safe-area bottom inset (`useSafeAreaInsets().bottom`) so on iOS+Android the Save/Ride action row sits fully above the home indicator, and the scrollable body owns the remaining space. Investigate BOTH sheets; fix whichever is the cut-off one (the "Route Overview" titled sheet in the reported screenshot) and ensure the other does not regress.

## Acceptance Criteria

### AC-1: Action buttons reachable at the initial snap with long content
*(PRIMARY)*
- **GIVEN** the Route Details sheet open for a route with long rationale/stats content (enough to overflow the initial snap height)
- **WHEN** the sheet renders at its initial snap point
- **THEN** the Save action button is present AND within the sheet's visible bounds (not clipped/offset below the snapped height)
- **Test tier:** `integration` · **Service:** @gorhom/bottom-sheet rendered via @testing-library/react-native (real sheet, layout measured)
- **Verify:** `pnpm test components/sheets/route-details-sheet.integration.test.tsx -t actionsReachableAtInitialSnap`

### AC-2: Sheet expands to a larger snap and the body scrolls under a pinned footer
- **GIVEN** the Route Details sheet open at its initial snap
- **WHEN** the sheet is expanded to its larger snap point (e.g. 90%)
- **THEN** the body content scrolls and the action footer remains pinned and fully visible at every snap (multi-stop snap configured)
- **Test tier:** `integration` · **Service:** @gorhom/bottom-sheet via @testing-library/react-native
- **Verify:** `pnpm test components/sheets/route-details-sheet.integration.test.tsx -t expandsAndFooterStaysPinned`

### AC-3: Action footer clears the safe-area bottom inset (edge/device)
- **GIVEN** a device with a non-zero bottom safe-area inset (home indicator)
- **WHEN** the sheet renders its action footer
- **THEN** the footer's bottom padding accounts for `insets.bottom` so the Save/Ride buttons sit fully above the home indicator
- **Test tier:** `integration` · **Service:** @gorhom/bottom-sheet + SafeAreaProvider mock inset via @testing-library/react-native
- **Verify:** `pnpm test components/sheets/route-details-sheet.integration.test.tsx -t footerClearsSafeArea`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | With long content, the Save action button is present and within the snapped sheet bounds (pinned footer, not clipped). | AC-1 | `pnpm test components/sheets/route-details-sheet.integration.test.tsx -t actionsReachableAtInitialSnap` |
| TC-2 | The sheet has ≥2 snap stops (incl. ≥85%) and the action footer stays pinned across snaps while the body scrolls. | AC-2 | `pnpm test components/sheets/route-details-sheet.integration.test.tsx -t expandsAndFooterStaysPinned` |
| TC-3 | The action footer's bottom padding clears `insets.bottom` on a notched device. | AC-3 | `pnpm test components/sheets/route-details-sheet.integration.test.tsx -t footerClearsSafeArea` |

## Reading List

- `components/sheets/route-details-sheet.tsx` (82-240) — `BottomSheetWrapper preset='half'`, the flex ScrollView (103-214), and the actions View (217-236) that gets cut off — restructure to a pinned footer + multi-snap
- `components/sheets/route-details-sheet.tsx` (269-306) — `styles.scrollView`/`styles.actions` — adjust so the footer is pinned and clears `insets.bottom`
- `components/sheets/bottom-sheet-wrapper.tsx` (8-101) — SNAP_PRESETS (half=['60%'], full=['90%']) + the footer slot in the unwrapped path — use a multi-stop snapPoints and the footer slot
- `components/sheets/route-directions-sheet.tsx` (158-235) — the "Route Overview" titled sheet (title at 222), `snapPoints ['50%','90%']`, BottomSheetScrollView — ensure its actions also stay reachable
- `components/CLAUDE.md` (1-40) — bottom-sheet conventions (BottomSheetInput, hasTextInput) — do not regress keyboard handling

## Guardrails

**WRITE-ALLOWED:** `components/sheets/route-details-sheet.tsx`, `components/sheets/route-directions-sheet.tsx`, `components/sheets/route-details-sheet.integration.test.tsx` (NEW)
**WRITE-PROHIBITED:** `components/sheets/bottom-sheet-wrapper.tsx`, `components/ui/bottom-action-sheet.tsx`, `convex/**`

## Design

- ref: DESIGN-S01-007 (route details/overview sheet layout: expandable snap + pinned action footer above the safe area)
- **Pattern:** Scrollable body + pinned action footer above the safe-area inset within a multi-stop snap sheet.
- **Pattern source:** `components/sheets/route-directions-sheet.tsx` (the proven sticky-footer + multi-snap pattern)
- **Anti-pattern:** A flex ScrollView followed by an unpinned actions View inside a single fixed-height snap (the current cut-off layout).
- **Interaction notes:** multi-stop snap (initial ~60% → expand ~90%); action footer pinned above `insets.bottom`, body scrolls beneath it; both the "Route Details" and "Route Overview" sheets keep Save/Ride reachable.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test components/sheets/route-details-sheet.integration.test.tsx` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'components/sheets/route-details-sheet.tsx' 'components/sheets/route-directions-sheet.tsx'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: the AC-1 test must FAIL on the current preset='half' layout (Save button measured below the snapped height) before the snap/footer fix makes it pass` |
| human_gate | `On-device (real iOS+Android): open Route Overview/Details → the Save and Ride It buttons are fully visible and tappable; expanding scrolls content without hiding the actions; buttons clear the home indicator` |

## Coding Standards

- All colors/spacing/radii via `useSemanticTheme()`; no hardcoded hex.
- Pin the action footer via the `BottomSheetWrapper` footer slot (or a non-scrolling sibling) — never as a trailing View after a flex ScrollView under a single snap.
- Apply `useSafeAreaInsets().bottom` to the footer container so actions clear the home indicator on iOS+Android.
- Use a multi-stop `snapPoints` (e.g. `['60%','90%']`) so the body has room to scroll under the pinned footer.
- Integration test renders the real `@gorhom/bottom-sheet` via @testing-library/react-native and measures layout; no mocked sheet.
- Do not regress the "Route Overview" directions sheet's existing `['50%','90%']` behavior; verify its actions stay reachable.

## Dependencies

- Depends on: RUX-003 (mounts RouteDetailsSheet into the active tap flow — this task makes that sheet's actions reliably reachable)
- Blocks: (none)

## Notes

The reported cut-off sheet (Image #2, titled "Route Overview") is `route-directions-sheet.tsx` (title at 222, `snapPoints ['50%','90%']`, BottomSheetScrollView). The structurally-worse one is `route-details-sheet.tsx`: `preset='half'` (single `['60%']` snap) with the actions View OUTSIDE the flex ScrollView, so on tall content the Save button overflows the 60% sheet. Fix both: give route-details-sheet a multi-stop snap + pinned footer; verify route-directions-sheet's actions stay reachable. Assumption flagged: 'Ride It' may not exist yet as a button in route-details-sheet (only Save does today) — if added by a parallel task keep both pinned; otherwise the AC focuses on the Save action that exists.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "details_sheet_long_content": {
      "description": "RouteDetailsSheet rendered visible for a PlannedRouteOptionView with a long rationale + full stats/conditions so content exceeds the initial snap height, with onSave provided so the action footer renders",
      "seed_method": "ui_flow",
      "records": [ "route with a long rationale string", "full stats (distance/duration/legs)", "overlaysPreview windSummary + conditionsStatus", "onSave handler provided" ]
    },
    "details_sheet_notched_device": {
      "description": "RouteDetailsSheet rendered inside a SafeAreaProvider with initialMetrics insets.bottom = 34 (notched device) and a route + onSave handler",
      "seed_method": "ui_flow",
      "records": [ "SafeAreaProvider initialMetrics bottom inset 34", "a route with onSave provided" ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the Route Details sheet open with long content WHEN it renders at the initial snap THEN the Save button is present and within the visible snapped bounds (not clipped)",
      "verify": "pnpm test components/sheets/route-details-sheet.integration.test.tsx -t actionsReachableAtInitialSnap",
      "scenario": {
        "start_ref": "details_sheet_long_content", "tier": "visible", "test_tier": "integration",
        "verification_service": "@gorhom/bottom-sheet via @testing-library/react-native",
        "negative_control": { "would_fail_if": [
          "the Save button's measured y-offset exceeds the sheet's snapped height (clipped off-screen — the current bug)",
          "the Save button is absent from the tree (footer not rendered)",
          "the actions are inside the scroll body so they sit below the fold and require scrolling past all content"
        ] },
        "evidence": { "artifact_type": "screenshot", "required_capture": true },
        "cases": [ {
          "start_ref": "details_sheet_long_content",
          "action": { "actor": "user", "steps": [
            "open the Route Details sheet for a long-content route",
            "measure the Save button's onLayout y relative to the sheet container at the initial snap",
            "assert it is within the visible snapped bounds"
          ] },
          "end_state": {
            "must_observe": [
              "getByTestId('route-details-sheet-save-button') is present (!== null)",
              "saveButton.measuredTop <= sheetSnappedHeight (within visible bounds, e.g. <= 0.6 * screenHeight — not clipped)",
              "the action footer node is a sibling of the BottomSheetScrollView (footer.parent !== scrollView), not nested inside it"
            ],
            "must_not_observe": [
              "the Save button measured below the snapped sheet height (off-screen)",
              "queryByTestId('route-details-sheet-save-button') === null (no button rendered)",
              "the actions nested inside the ScrollView content so they require scrolling all content first"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN the sheet at its initial snap WHEN expanded to a larger snap THEN the body scrolls and the action footer stays pinned/visible (>=2 snap stops configured)",
      "verify": "pnpm test components/sheets/route-details-sheet.integration.test.tsx -t expandsAndFooterStaysPinned",
      "scenario": {
        "start_ref": "details_sheet_long_content", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "@gorhom/bottom-sheet via @testing-library/react-native",
        "negative_control": { "would_fail_if": [
          "the sheet has only a single snap point (cannot expand — preset='half' ['60%'] unchanged)",
          "expanding hides or detaches the action footer",
          "the body does not scroll (content clipped instead of scrollable)"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "details_sheet_long_content",
          "action": { "actor": "user", "steps": [
            "render the sheet and read its configured snapPoints",
            "assert there are >=2 snap stops with a high (>=85%) stop",
            "assert the action footer remains present after expanding"
          ] },
          "end_state": {
            "must_observe": [
              "the resolved snapPoints have length >= 2 and include a >= 85% stop",
              "the action footer getByTestId('route-details-sheet-save-button') remains present (!== null) after expanding to the 90% snap"
            ],
            "must_not_observe": [
              "a single-snap sheet with no expand stop (snapPoints.length === 1)",
              "the action footer detaching/hiding on expansion"
            ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN a non-zero bottom safe-area inset WHEN the footer renders THEN its bottom padding accounts for insets.bottom so the buttons clear the home indicator",
      "verify": "pnpm test components/sheets/route-details-sheet.integration.test.tsx -t footerClearsSafeArea",
      "scenario": {
        "start_ref": "details_sheet_notched_device", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "@gorhom/bottom-sheet + SafeAreaProvider via @testing-library/react-native",
        "negative_control": { "would_fail_if": [
          "the footer uses a hardcoded fixed paddingBottom that ignores insets.bottom (re-cuts on a notched device)",
          "insets.bottom is read but not applied to the footer container",
          "the footer overlaps the home-indicator region (paddingBottom < insets.bottom)"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "details_sheet_notched_device",
          "action": { "actor": "user", "steps": [
            "render with a SafeAreaProvider inset of bottom=34",
            "read the action footer container's effective bottom padding"
          ] },
          "end_state": {
            "must_observe": [
              "the footer container's bottom padding >= insets.bottom (34)"
            ],
            "must_not_observe": [
              "a hardcoded bottom padding < insets.bottom",
              "footer paddingBottom === 0 (no safe-area padding)"
            ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "Long content: Save button present and within snapped bounds (pinned, not clipped).", "maps_to_ac": "AC-1", "verify": "pnpm test components/sheets/route-details-sheet.integration.test.tsx -t actionsReachableAtInitialSnap" },
    { "id": "TC-2", "type": "test_criterion", "description": ">=2 snap stops incl. >=85%; footer pinned across snaps while body scrolls.", "maps_to_ac": "AC-2", "verify": "pnpm test components/sheets/route-details-sheet.integration.test.tsx -t expandsAndFooterStaysPinned" },
    { "id": "TC-3", "type": "test_criterion", "description": "Footer bottom padding clears insets.bottom on a notched device.", "maps_to_ac": "AC-3", "verify": "pnpm test components/sheets/route-details-sheet.integration.test.tsx -t footerClearsSafeArea" }
  ]
}
-->
