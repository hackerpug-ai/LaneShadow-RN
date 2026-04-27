# FID-S01-T04 — iOS LSRouteSheet bottom-sheet shell + scenic strip + body.sm + 1:2 button proportion

**Sprint:** [SPRINT.md](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 240 min · **Type:** FEATURE · **Priority:** P0 · **Effort:** M · **Status:** Backlog

## BACKGROUND

iOS `LSRouteSheet` ships as a plain VStack — no LSBottomSheet wrapper, no drag handle, no dismiss gesture. The 5-dot scenic strip beside LSBestBadge is missing entirely. The "via …" subtitle uses body.md instead of body.sm. The Save / Ride buttons both use `.frame(maxWidth: .infinity)` instead of the design's 1:2 proportion.

## CRITICAL CONSTRAINTS

- MUST wrap LSRouteSheet body in `LSBottomSheet(detent: .large, onDismiss: onDismiss)`.
- MUST render 5-dot scenic strip with copper-filled dots (`theme.colors.signal.default`) for `score` count and `theme.colors.border.strong` for empty dots.
- MUST change via subtitle Text from `theme.type.body.md` → `theme.type.body.sm`.
- MUST size Save / Ride proportionally (1:2) using GeometryReader-based widths or a Layout — NOT both `.frame(maxWidth: .infinity)`.
- STRICTLY do NOT modify `android/**`, `server/**`, `*.pbxproj`, `ios/project.yml`, or rename existing iOS sandbox story IDs.

## SPECIFICATION

**Objective:** Wrap iOS LSRouteSheet in the canonical LSBottomSheet shell (drag handle + dismiss gesture), add the missing 5-dot scenic strip beside LSBestBadge, fix the via subtitle typography to body.sm, and enforce the 1:2 Save/Ride action button proportion.

**Success state:** All 5 LSRouteSheet stories present as a bottom sheet at `.large` detent with a drag handle, dismiss-on-drag gesture, a 5-dot scenic strip beside the best badge with copper-filled dots equal to scenic score, the via subtitle in body.sm typography, and the action row showing Save at relative width 1 and "Ride this" at relative width 2.

## ACCEPTANCE CRITERIA

- **AC-1** GIVEN `organisms.route-sheet.best`, WHEN LSRouteSheet renders, THEN the outermost view is `LSBottomSheet(detent: .large, onDismiss: onDismiss)` wrapping the existing VStack content; sheet exposes a drag handle and responds to dismiss-drag.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteSheetSnapshotTests/test_best_isWrappedInLSBottomSheet`
- **AC-2** GIVEN LSRouteSheet renders with `scenicScore = 4`, WHEN the scenic-dot strip is drawn beside LSBestBadge, THEN exactly 5 dot atoms render in an HStack; first 4 filled with `theme.colors.signal.default`, 5th with `theme.colors.border.strong`.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteSheetSnapshotTests/test_scenicStrip_rendersFiveDotsWithScoreFill`
- **AC-3** GIVEN LSRouteSheet renders the via subtitle, WHEN inspected, THEN Text uses `theme.type.body.sm.font` — not `theme.type.body.md.font`.
  - verify: `grep -nE 'body\.sm' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift && ! grep -nE 'subtitle.*body\.md' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift`
- **AC-4** GIVEN LSRouteSheet renders the action row, WHEN Save and Ride are sized, THEN they occupy widths in 1:2 ratio (Save : Ride) and neither uses `.frame(maxWidth: .infinity)`.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteSheetSnapshotTests/test_actionRow_oneToTwoProportion`
- **AC-5** GIVEN the user drags LSRouteSheet down past the dismiss threshold, WHEN the dismiss gesture completes, THEN the `onDismiss` closure is invoked.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteSheetInteractionTests/test_dismissGesture_invokesOnDismiss`

## TEST CRITERIA

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | LSRouteSheet.swift wraps body in LSBottomSheet detent .large | AC-1 | `grep -nE 'LSBottomSheet\(detent: \.large' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift` |
| TC-2 | Scenic strip subview renders 5 dots conditional on score | AC-2 | `grep -nE 'scenicScore\|scenic.*ForEach.*0\.\.<5' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift` |
| TC-3 | Via subtitle uses body.sm | AC-3 | `grep -n 'body.sm' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift` |
| TC-4 | Action row no longer uses dual maxWidth: .infinity | AC-4 | `[ $(grep -cE 'frame\(maxWidth: \.infinity\)' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift) -le 0 ]` |
| TC-5 | All 5 LSRouteSheet stories pass snapshot diff | AC-1..AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteSheetSnapshotTests` |
| TC-6 | Token compliance passes | AC-2,AC-3 | `scripts/tokens/enforce-native-compliance.sh` |
| TC-7 | Snapshot parity passes | AC-1,AC-2 | `pnpm snapshots:check` |

## READING LIST

- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/05-organisms-content.md` — Gaps E2-01..E2-04
- `[PHASE: RED]` `.spec/design/system/organisms/route-sheet/route-sheet.html` — lines 159–168 scenic strip
- `[PHASE: RED]` `.spec/design/system/organisms/route-sheet/README.md` — detent + dismiss spec
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Organisms/LSRouteSheet.swift` — lines 47–66 wrapper, 73–85 subtitle, 112–132 action row
- `[PHASE: BOTH]` `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` — confirm LSBottomSheet exists with `.large` + onDismiss
- `[PHASE: BOTH]` `ios/LaneShadow/Sandbox/Stories/Organisms/LSRouteSheetStory.swift` — 5 story IDs are parity keys

## GUARDRAILS

**WRITE-ALLOWED:**
- `ios/LaneShadow/Views/Organisms/LSRouteSheet.swift`
- `ios/LaneShadowTests/Snapshots/LSRouteSheetSnapshotTests.swift`
- `ios/LaneShadowTests/Interaction/LSRouteSheetInteractionTests.swift`

**WRITE-PROHIBITED:** `android/**`, `server/**`, `react-native/**`, `web/**`, `tokens/**`, `**/*.pbxproj`, `ios/project.yml`, `LSMapLayer.swift`, `LSRouteSheetStory.swift`

## DESIGN

**References:**
- `.spec/prds/v3-integration/remediations/05-organisms-content.md` Gaps E2-01..E2-04
- `.spec/design/system/organisms/route-sheet/route-sheet.html` lines 159–168
- `.spec/design/system/organisms/route-sheet/README.md`

**Pattern:** LSBottomSheet wrapper around content with internal subviews for scenic strip and action row.
**Pattern source:** Android LSRouteSheet.kt lines 84–88 already wraps in LSBottomSheet — mirror structural approach.
**Anti-pattern:** Plain VStack pretending to be a sheet, hardcoded Save/Ride width literals.

## RED PHASE INSTRUCTIONS

Author snapshot tests for the 5 LSRouteSheet story IDs and one interaction test for AC-5 dismiss gesture (use ViewInspector or wrapping NavigationStack with `@State` binding to verify onDismiss fires). The first run MUST FAIL because (a) body is plain VStack, (b) no scenic strip rendered, (c) via subtitle is body.md, (d) action buttons equal width. Diff against design PNGs at `.spec/design/system/organisms/route-sheet/`. Avoid vanity tests that re-record current broken visuals as baselines.

## GREEN PHASE INSTRUCTIONS

Order: (1) Wrap existing VStack in `LSBottomSheet(detent: .large, onDismiss: onDismiss) { /* body */ }`. If LSBottomSheet's API doesn't expose onDismiss, escalate — do not silently change LSMapLayer.swift's contract. (2) Build private `ScenicDotStrip(score: Int)`: `HStack(spacing: theme.space.xxs) { ForEach(0..<5) { i in Circle().fill(i < score ? theme.colors.signal.default : theme.colors.border.strong).frame(width: theme.space.xs, height: theme.space.xs) } }`. Place adjacent to LSBestBadge. (3) Change via Text variant from `.body.md` to `.body.sm` at line ~80. (4) Replace action row's two `.frame(maxWidth: .infinity)` with GeometryReader: outer width W → Save = W * 1/3 - spacing, Ride = W * 2/3 - spacing. Reference Android's `weight(1f)` / `weight(2f)` in LSRouteSheet.kt (do not edit it). After: swiftformat, build, snapshot tests.

## REVIEW NOTES

- **LSBottomSheet contract:** if must be extended for onDismiss, change must be additive and non-breaking. If extension is large, surface as follow-up task instead of ballooning this one.
- **Cross-platform parity:** verify 5 story IDs match Android — Android side has 0 stories so iOS leads parity here; record IDs Android task FID-S02 must adopt.
- **Accessibility:** drag handle needs `accessibilityLabel("Bottom sheet handle")`; dismiss gesture reachable via VoiceOver.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| swift-format | `swiftformat --quiet ios/**/*.swift` | exit 0 |
| ios-build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build` | BUILD SUCCEEDED |
| ios-tests | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | LSRouteSheet snapshot + interaction tests pass |
| token-compliance | `scripts/tokens/enforce-native-compliance.sh` | exit 0 |
| snapshot-parity | `pnpm snapshots:check` | exit 0 |

## CODING STANDARDS

`RULES.md#accessibility-standards`, `RULES.md#cross-platform-component-parity`, `styles/RULES.md`

## DEPENDENCIES

- **depends_on:** []
- **blocks:** [FID-S01-T09]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"Wrapped in LSBottomSheet detent .large","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteSheetSnapshotTests/test_best_isWrappedInLSBottomSheet","phase":"review"},{"id":"AC-2","type":"acceptance_criterion","description":"5-dot scenic strip with score fill","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteSheetSnapshotTests/test_scenicStrip_rendersFiveDotsWithScoreFill","phase":"review"},{"id":"AC-3","type":"acceptance_criterion","description":"Via subtitle uses body.sm","verify":"grep -nE 'body\\.sm' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift && ! grep -nE 'subtitle.*body\\.md' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift","phase":"green"},{"id":"AC-4","type":"acceptance_criterion","description":"Save/Ride 1:2 proportion","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteSheetSnapshotTests/test_actionRow_oneToTwoProportion","phase":"review"},{"id":"AC-5","type":"acceptance_criterion","description":"Drag-down invokes onDismiss","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteSheetInteractionTests/test_dismissGesture_invokesOnDismiss","phase":"green"},{"id":"TC-1","type":"test_criterion","description":"LSBottomSheet wrapper present","maps_to_ac":"AC-1","verify":"grep -nE 'LSBottomSheet\\(detent: \\.large' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift","phase":"green"},{"id":"TC-2","type":"test_criterion","description":"Scenic ForEach 0..<5","maps_to_ac":"AC-2","verify":"grep -nE 'scenicScore|scenic.*ForEach.*0\\.\\.<5' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift","phase":"green"},{"id":"TC-3","type":"test_criterion","description":"Via uses body.sm","maps_to_ac":"AC-3","verify":"grep -n 'body.sm' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift","phase":"green"},{"id":"TC-4","type":"test_criterion","description":"No dual maxWidth infinity in action row","maps_to_ac":"AC-4","verify":"[ $(grep -cE 'frame\\(maxWidth: \\.infinity\\)' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift) -le 0 ]","phase":"green"},{"id":"TC-5","type":"test_criterion","description":"All 5 stories pass","maps_to_ac":"AC-1","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteSheetSnapshotTests","phase":"review"},{"id":"TC-6","type":"test_criterion","description":"Token compliance","maps_to_ac":"AC-2","verify":"scripts/tokens/enforce-native-compliance.sh","phase":"green"},{"id":"TC-7","type":"test_criterion","description":"Snapshot parity","maps_to_ac":"AC-1","verify":"pnpm snapshots:check","phase":"green"}]}
-->
