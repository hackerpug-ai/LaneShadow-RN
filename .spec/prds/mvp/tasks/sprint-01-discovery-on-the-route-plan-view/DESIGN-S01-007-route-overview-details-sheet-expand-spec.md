# DESIGN-S01-007: Route Overview / details sheet expand spec (snap points + sticky action footer so Save / Ride It are never cut off)

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** DESIGN · **Status:** ⬜ Backlog · **Priority:** P1 · **Effort:** M · **Estimate:** 60 min
**Agent:** frontend-designer · **Reviewer:** react-native-ui-reviewer
**Proposed By:** frontend-designer
**Agent rationale:** frontend-designer owns the sheet scroll/snap architecture spec; this writes a contract doc (no app source) the react-native-ui-implementer (RUX-005) reads to fix RouteDetailsSheet so Save / Ride It actions are never cut off. The fix adopts the ALREADY-PROVEN pattern in RouteDirectionsSheet (`snapPoints ['50%','90%']` + `wrapChildren=false` + sticky footer) — a Rule-of-2 reuse, since the directions sheet solved this and the details sheet did not.

> **Remedial — Sprint 1 testing feedback (item 2):** "route overview doesn't expand fully and buttons are hidden." (Image #2)

## Outcome

A written spec — `.spec/design/sprint-01/route-details-sheet-expand-spec.md` — for the sheet's snap points, max height, scroll architecture, and a sticky action footer so the Save and Ride It actions are always reachable: an expandable multi-snap (`['50%','90%']` or `['60%','90%']`) + `wrapChildren=false` + `BottomSheetScrollView` body + an absolute-bottom footer padded by `insets.bottom`.

## Specification

`route-details-sheet.tsx` uses `BottomSheetWrapper preset="half"` (single `60%` snap) with its `actions` View inline at the end of the container after the ScrollView, so on tall content the Save button overflows the snapped height (Image #2). The proven pattern lives in `route-directions-sheet.tsx` (the "Route Overview"-titled sheet): `snapPoints={['50%','90%']}` + `wrapChildren={false}` + everything in a `BottomSheetScrollView` + a sticky footer padded by `insets.bottom`. The spec directs RUX-005 to adopt that pattern in RouteDetailsSheet: an expandable multi-snap, the Save / Ride It actions in the absolute-bottom `footer` slot (pinned), `paddingBottom: semantic.space.lg + insets.bottom`, a `BottomSheetScrollView` whose `contentContainerStyle.paddingBottom` clears the sticky footer, Save + Ride It as `Button size='lg'` (≥44pt), and the testIDs `route-details-sheet-save-button` / `route-details-sheet-ride-button`.

## Critical Constraints

- **MUST** spec RouteDetailsSheet to adopt the expandable snap-point + reachable-action architecture proven in RouteDirectionsSheet: `snapPoints={['50%','90%']}` (or `['60%','90%']`), `wrapChildren={false}`, content in a `BottomSheetScrollView`, and the Save / Ride It actions in the absolute-bottom `footer` slot (sticky) — NOT inline at the end of the container (current `route-details-sheet.tsx:216-236`).
- **MUST** pad the action footer for the home indicator via `paddingBottom: semantic.space.lg + insets.bottom` (mirroring `route-directions-sheet.tsx:172`) so actions clear the iPhone home indicator at the smallest snap.
- **MUST** give every footer + scroll value as a `useSemanticTheme()` token path; the `BottomSheetScrollView contentContainerStyle` MUST include `paddingBottom` clearing the sticky footer height so the last content row is never hidden.
- **MUST** spec the explicit observable: at the SMALLEST snap point with the longest content, Save and Ride It remain fully visible (sticky footer) and the scroll content can reach its end above the footer.
- **NEVER** keep `preset="half"` (single 60% snap with inline actions) — that layout is the cut-off bug; never spec a full-screen ScrollView with the map nested (Android Mapbox scroll conflict); never use raw hex/rgba or magic numbers for the footer (flag the local `addOpacity()` helper + raw `borderRadius: 12` as legacy); never write to app source.
- **STRICTLY**: Save and Ride It carry stable testIDs (`route-details-sheet-save-button`, `route-details-sheet-ride-button`) and meet ≥44pt via `Button size='lg'`; reuse the existing `BottomSheetWrapper` footer slot + `Button` — no new sheet component.

## Acceptance Criteria

### AC-1: Expandable multi-snap + max-height architecture spec'd (replaces preset='half')
- **GIVEN** a reviewer opens `route-details-sheet-expand-spec.md`
- **WHEN** they read the snap-point section
- **THEN** it replaces `preset='half'` with explicit `snapPoints` containing ≥2 stops and a full-height (`90%`) max (e.g. `['50%','90%']`)
- **Verify:** `grep -Eq "snapPoints|'90%'" .spec/design/sprint-01/route-details-sheet-expand-spec.md && echo PASS`

### AC-2: Sticky action footer with insets.bottom padding spec'd (Save / Ride It never cut off)
- **GIVEN** the action footer section
- **WHEN** the reviewer checks where Save / Ride It live and how they clear the home indicator
- **THEN** Save and Ride It live in the `BottomSheetWrapper` absolute-bottom `footer` slot (with `wrapChildren={false}`), padded `paddingBottom: semantic.space.lg + insets.bottom`, and the spec states they remain fully visible at the smallest snap — NOT inline at the end of the scroll container
- **Verify:** `grep -q 'insets.bottom' … && grep -Eqi 'footer' .spec/design/sprint-01/route-details-sheet-expand-spec.md && echo PASS`

### AC-3: Scroll content clears the sticky footer (last row never hidden)
- **GIVEN** the scroll architecture section
- **WHEN** the reviewer checks how scroll content avoids being hidden behind the sticky footer
- **THEN** it requires a `BottomSheetScrollView` whose `contentContainerStyle.paddingBottom` clears the footer height (token-based), so the last content row scrolls fully into view
- **Verify:** `grep -q 'BottomSheetScrollView' … && grep -Eqi 'contentContainerStyle|paddingBottom' .spec/design/sprint-01/route-details-sheet-expand-spec.md && echo PASS`

### AC-4: Save / Ride It ≥44pt with stable testIDs and token-based footer styling
- **GIVEN** the action footer styling + testID section
- **WHEN** the reviewer checks button sizing, testIDs, and footer token usage
- **THEN** Save and Ride It are `Button size='lg'` (≥44pt), named testIDs `route-details-sheet-save-button` / `route-details-sheet-ride-button`, and all footer values are token paths (no `addOpacity()` helper or raw borderRadius)
- **Verify:** `grep -q 'route-details-sheet-save-button' … && grep -q 'route-details-sheet-ride-button' … && grep -q 'semantic.space' .spec/design/sprint-01/route-details-sheet-expand-spec.md && echo PASS`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | `.spec/design/sprint-01/route-details-sheet-expand-spec.md` exists and is non-empty. | AC-1 | `test -s .spec/design/sprint-01/route-details-sheet-expand-spec.md && echo PASS` |
| TC-2 | Spec specifies an expandable `90%` snap stop (not `preset='half'`). | AC-1 | `grep -q "'90%'" .spec/design/sprint-01/route-details-sheet-expand-spec.md && echo PASS` |
| TC-3 | Spec places actions in a footer padded by `insets.bottom`. | AC-2 | `grep -q 'insets.bottom' .spec/design/sprint-01/route-details-sheet-expand-spec.md && echo PASS` |
| TC-4 | Spec names both action testIDs. | AC-4 | `grep -q 'route-details-sheet-save-button' … && grep -q 'route-details-sheet-ride-button' .spec/design/sprint-01/route-details-sheet-expand-spec.md && echo PASS` |
| TC-5 | `pnpm tokens:validate` exits 0. | AC-4 | `pnpm tokens:validate` |

## Reading List

- `components/sheets/route-details-sheet.tsx` (82-240) — current `preset='half'` + inline `actions` View (216-236) that gets cut off; local `addOpacity()` (25-31) and raw `borderRadius:12` — the gaps to fix
- `components/sheets/route-directions-sheet.tsx` (157-204) — PROVEN pattern: `snapPoints ['50%','90%']` + `wrapChildren=false` + footer slot with `paddingBottom insets.bottom`
- `components/sheets/bottom-sheet-wrapper.tsx` (8-86) — SNAP_PRESETS, snapPoints override, `wrapChildren=false` footer slot rendered absolute-bottom
- `.spec/prds/mvp/09-technical-requirements/10-design-system.md` (98-109) — §6 route detail scroll architecture + action row reachability + `paddingBottom insets.bottom`
- `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` (55-60) — §6 ≥44pt, testIDs, theming

## Guardrails

**WRITE-ALLOWED:** `.spec/design/sprint-01/route-details-sheet-expand-spec.md`
**WRITE-PROHIBITED:** `components/sheets/route-details-sheet.tsx`, `components/sheets/route-directions-sheet.tsx`, `components/sheets/bottom-sheet-wrapper.tsx`, `tokens/**`, any file not in WRITE-ALLOWED

## Design

- **Pattern:** Multi-snap Gorhom sheet (50%/90%) with `BottomSheetScrollView` content + sticky absolute-bottom action footer.
- **Pattern source:** `components/sheets/route-directions-sheet.tsx`
- **Anti-pattern:** `preset='half'` single 60% snap with the action row inline at the end of the container (`route-details-sheet.tsx:216-236`) — actions get cut off; or a full-screen ScrollView with the map nested (Android Mapbox scroll conflict).
- **Interaction notes:** sheet opens at 50% (or 60%) and drag-expands to 90%; Save / Ride It in the absolute-bottom footer slot (sticky), always reachable; footer pads `semantic.space.lg + insets.bottom`; `BottomSheetScrollView` content pads its bottom by the sticky-footer height.

## Verification Gates

| Gate | Command |
|------|---------|
| gate_1_spec_exists | `test -s .spec/design/sprint-01/route-details-sheet-expand-spec.md && echo PASS` |
| gate_2_tokens_validate | `pnpm tokens:validate` |
| gate_3_component_snapshot | `pnpm test components/sheets/route-details-sheet.integration.test.tsx` (RUX-005 built sheet: snapPoints include 90%, Save/Ride It in footer with both testIDs, footer outside the scroll container) |
| gate_4_lint | `pnpm exec biome check .spec/design/sprint-01/route-details-sheet-expand-spec.md` |
| gate_5_scope | `git diff --name-only ⊆ {route-details-sheet-expand-spec.md}` |

## Coding Standards

- All footer spacing/color values are `semantic.space.*` / `semantic.color.*` token paths — no bare pixel numbers, no local `addOpacity()` helper, no raw borderRadius.
- Footer `paddingBottom = semantic.space.lg + insets.bottom` (clears home indicator).
- Actions use `Button size='lg'` (≥44pt) with stable testIDs.
- Reuse BottomSheetWrapper footer slot + BottomSheetScrollView; no new sheet component.
- Spec is read-only against the token system — no token JSON edits.

## Dependencies

- Depends on: (none)
- Blocks: RUX-005

## Notes

Modular-design flag (Rule of 2): RouteDirectionsSheet already solved sticky-actions (`snapPoints ['50%','90%']` + `wrapChildren=false` + footer + `insets.bottom`) while RouteDetailsSheet did not — the fix converges on the existing pattern, not a new one. Legacy in route-details-sheet.tsx to avoid in the new footer: local `addOpacity()` (25-31), raw `borderRadius:12` — the spec'd footer must be token-based per 10-design-system.md §1/§6. The reported cut-off sheet (Image #2, titled "Route Overview") is `route-directions-sheet.tsx`; the structurally-worse one is `route-details-sheet.tsx` — fix both, ensuring no regression to the directions sheet.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {},
  "requirements": [
    "RouteDetailsSheet expands fully (snapPoints with a 90% max) — replaces preset='half' single 60% snap",
    "Save / Ride It in the BottomSheetWrapper absolute-bottom footer slot (sticky), never inline where they get cut off",
    "Footer padded `semantic.space.lg + insets.bottom` so actions clear the iPhone home indicator at the smallest snap point",
    "BottomSheetScrollView content paddingBottom clears the sticky footer height (last row never hidden) — 10-design-system.md §6",
    "No full-screen ScrollView with nested map (Mapbox/Android scroll conflict) — §6",
    "Save + Ride It as Button size='lg' (>= 44pt); testIDs route-details-sheet-save-button / route-details-sheet-ride-button; token-based footer styling"
  ]
}
-->
