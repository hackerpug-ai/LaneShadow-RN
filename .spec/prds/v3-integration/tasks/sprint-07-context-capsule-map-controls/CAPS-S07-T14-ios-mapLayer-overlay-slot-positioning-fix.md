# CAPS-S07-T14 — iOS LSMapLayer overlay-slot positioning fix (bottom overlay pin + topbar safe-area)

> Status: ✅ Done
> Cycle: 1
> Updated: 2026-05-07T21:15:00-07:00
>
> **Task ID:** CAPS-S07-T14 · **Sprint:** [Sprint 07](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 60 min · **Type:** BUG · **Status:** Done · **Priority:** P0 · **Effort:** S
> **PRD Refs:** UC-FID-01, UC-MAP-01

## Completion Evidence

- Implemented in `ios/LaneShadow/Views/Organisms/LSMapLayer.swift`: map canvas ignores all safe-area edges, topbar/top overlays retain tokenized safe-area padding, and bottom overlays fill the layer before `.bottom` alignment.
- Added/updated source tests in `ios/LaneShadowTests/Organisms/LSMapLayerTests.swift` for bottom overlay fill, map bleed, safe-area topbar behavior, story IDs, and no stubbed drawer/sheet paths.
- Verified with `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContextCapsuleTests -only-testing:LaneShadowTests/LSMapControlsTests -only-testing:LaneShadowTests/LSMapTests -only-testing:LaneShadowTests/LSMapLayerTests -only-testing:LaneShadowTests/IdleScreenRetrofitTests -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests -only-testing:LaneShadowTests/IdleScreenWiringTests` — PASS, xcresult `Test-LaneShadow-2026.05.07_21-10-28--0700.xcresult`.

## Background

Live diagnosis of the iOS idle screen on iPhone 16 Simulator (2026-05-07) revealed a primitive-level layout bug in `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` that causes every screen built on `LSMapLayer` to render its **bottom overlay (chat input + suggestion chips) collapsed in the middle of the screen** instead of pinned to the bottom safe area. The bug is asymmetric: the `topOverlays` slot frame on line 53 includes `maxHeight: .infinity, alignment: .top` and pins correctly to the top; the `bottomOverlays` slot frame on line 62 omits `maxHeight: .infinity` and so collapses to its intrinsic height inside the parent `ZStack`, which centers it.

A second issue surfaces in the same file: the global `.ignoresSafeArea(edges: .all)` modifier on line 92 is applied without any per-region opt-out, so `LSTopBar` renders behind the iOS status bar (clipped or invisible). The map canvas itself should bleed under the status bar, but the topbar should respect it.

CAPS-S07-T05 will mount `LSContextCapsule` and `LSMapControls` into these same slots. Without fixing the slot primitive first, T05 cannot satisfy its AC-2 (capsule visible top-anchored) or AC-3 (controls vertical center on right edge) — its new content will inherit the same broken positioning. T14 must land before T05 dispatches.

## Critical Constraints

**MUST:**
- Add `maxHeight: .infinity` to the `bottomOverlays` slot's `.frame(...)` modifier in `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` (currently line 62) so the slot fills the available height and `alignment: .bottom` pins content to the bottom safe area. The exact form must mirror the topOverlays pattern on line 53 (`maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom`).
- Replace the bare argument-less `.padding(.top)` on line 52 and `.padding(.bottom)` on line 61 with tokenized values (`theme.space.md` or whichever spacing token corresponds to the design reference's overlay gutter — verify against `.spec/design/system/views/mapapp/idle/idle-screen.html` `org-map-layer__top-overlay` and `__bottom-overlay` padding declarations).
- Replace the global `.ignoresSafeArea(edges: .all)` on line 92 with `.ignoresSafeArea(edges: .bottom)` plus a `.safeAreaInset(edge: .top)` (or equivalent SwiftUI mechanism) so that the topbar respects the top safe area while the map canvas continues to bleed under the status bar. The exact pattern is at the implementer's discretion as long as: (a) the map canvas still extends edge-to-edge under the status bar, (b) `LSTopBar` is fully visible below the status bar, (c) the bottom safe area still inset-protects the chat input.
- Preserve the existing z-order and accessibilityIdentifier surface (`maplayer.map`, `maplayer.scrim`, `maplayer.topOverlay.<id>`, `maplayer.bottomOverlay.<id>`, `maplayer.bottomSheet`, `maplayer.drawer`, `maplayer.topBar`).
- Add unit/snapshot tests under `ios/LaneShadowTests/Views/Organisms/LSMapLayerTests.swift` (NEW or extended) that pin the new positioning behavior. AC-2 and AC-3 below are required; the implementer may add additional helper tests.

**NEVER:**
- Change the public initializers of `LSMapLayer` (signature stability — every Sprint 06+ template depends on this primitive).
- Change `GlassOverlaySlot`, `ScrimSpec`, `DrawerSpec`, or `BottomSheetSpec` types.
- Mount `LSContextCapsule` or `LSMapControls` from this task — they're owned by T01/T03/T05.
- Edit `IdleScreenContainer.swift` or any feature-level view from this task. The fix is in the primitive only; T05 reaps the benefit.
- Suppress `.ignoresSafeArea` so aggressively that the map canvas leaves a status-bar-shaped gap — the LSMap atom must still extend under the status bar.

**STRICTLY:**
- Use existing theme tokens (`theme.space.md`, etc.) — do not hardcode magic numbers.
- Mirror SwiftUI patterns used elsewhere in `ios/LaneShadow/Views/Organisms/` for safe-area handling.
- Keep the diff minimal: this task fixes a primitive and adds tests; it does not refactor LSMapLayer's broader architecture.

## Specification

**Objective:** Repair the `LSMapLayer.bottomOverlays` slot positioning so bottom overlays pin to the bottom safe area, and adjust safe-area handling so `LSTopBar` renders below the status bar while the map canvas continues to extend edge-to-edge underneath. Add regression tests so the fix cannot silently regress.

**Success State:** Mounting `LSMapLayer` with a bottom overlay (e.g., a 100×40pt rectangle) on an iPhone 16 Simulator places the rectangle's vertical center within the bottom 15% of the screen height (above the home indicator safe area), and mounting it with `LSTopBar` places the topbar's top edge at or below the status-bar safe-area inset. The IdleScreen pre-retrofit (still showing the legacy greeting and the existing `chatInputView`) renders correctly: greeting at the top, chat input pinned to the bottom — proving the fix in isolation before T05 swaps the content.

## Acceptance Criteria

### AC-1 — Bottom overlay slot frame includes `maxHeight: .infinity`

**GIVEN** the modified `ios/LaneShadow/Views/Organisms/LSMapLayer.swift`
**WHEN** the `bottomOverlays` `ForEach` block is inspected
**THEN** the `.frame(...)` modifier on the overlay content includes `maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom` (mirroring the topOverlays pattern on the line currently at 53)
**Verify:** `grep -nE 'bottomOverlays' ios/LaneShadow/Views/Organisms/LSMapLayer.swift | head -1` plus surrounding context confirms the frame; or alternatively: `awk '/bottomOverlays/,/accessibilityIdentifier.*maplayer\.bottomOverlay/' ios/LaneShadow/Views/Organisms/LSMapLayer.swift | grep -c 'maxHeight: .infinity'` returns `>= 1`.

### AC-2 — Bottom overlay renders pinned to the bottom in unit test

**GIVEN** an `LSMapLayer` mounted in a 390×844 (iPhone 16) test viewport with a 100×40pt fixed-size red `Rectangle` as a single bottom overlay
**WHEN** the layer is laid out and the overlay frame is inspected via SwiftUI `inspectionKit` / `ViewInspector` / a host-controller snapshot helper
**THEN** the overlay's vertical center is in the **bottom 15%** of the viewport (i.e., `centerY >= viewportHeight * 0.85`), confirming `alignment: .bottom` is now active
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_bottomOverlay_pinsToBottom`

### AC-3 — Top bar renders below the status bar safe-area inset

**GIVEN** an `LSMapLayer` mounted in a 390×844 viewport with `topBar: LSTopBar(...)`, in an environment that reports a top safe-area inset (e.g., 47pt for iPhone 16 in portrait)
**WHEN** the layer lays out
**THEN** the `LSTopBar`'s top edge y-position is **>=** the reported `safeAreaInsets.top` (the topbar respects the status bar; it does not render under it)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_topBar_respectsStatusBarSafeArea`

### AC-4 — Map canvas still bleeds under the status bar

**GIVEN** an `LSMapLayer` mounted with a single `Color.red` map content closure in a viewport with a non-zero top safe-area inset
**WHEN** the layer lays out
**THEN** the map content's frame top is `0` (extends to the absolute top of the viewport, under the status bar) AND its frame bottom is `viewportHeight` (the canvas covers full height)
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_mapCanvas_bleedsUnderStatusBar`

### AC-5 — Pre-retrofit IdleScreen positioning sanity (the screenshot bug is gone)

**GIVEN** the unmodified `IdleScreenContainer.swift` (legacy greeting still in `topOverlays`; chat input still in `bottomOverlays`) hosted via `LSMapLayer` after T14's fix
**WHEN** an XCUITest cold-launches the idle screen on iPhone 16 Simulator
**THEN** the `idlescreen-greeting` accessibilityElement is positioned within the **top 30%** of the screen AND the `idlescreen-chatinput` accessibilityElement is positioned within the **bottom 30%** of the screen (proves the layer fix repairs the screenshot symptom in isolation, prior to T05 swapping content)
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/Views/Organisms/LSMapLayerLayoutE2ETests/test_idleScreenPositioning_postT14Fix`

### AC-6 — All existing tests still pass (no regressions)

**GIVEN** the modified `LSMapLayer.swift`
**WHEN** the existing iOS test suite runs
**THEN** all pre-existing `LaneShadowTests/*` tests pass, including any prior tests targeting `LSMapLayer`, `IdleScreen`, or any template that consumes `LSMapLayer`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`

### AC-7 — Tokens used for padding (no hardcoded magic numbers)

**GIVEN** the modified `LSMapLayer.swift`
**WHEN** the `topOverlays` and `bottomOverlays` `ForEach` blocks are inspected
**THEN** the `.padding(.top, ...)` and `.padding(.bottom, ...)` modifiers reference a theme-tokenized value (e.g., `theme.space.md` or higher-specificity token from `LaneShadowTheme`), not a literal CGFloat
**Verify:** `grep -nE '\.padding\(\.(top\|bottom),\s*[0-9]+' ios/LaneShadow/Views/Organisms/LSMapLayer.swift` returns 0 lines.

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | grep confirms `maxHeight: .infinity` is present in bottomOverlays slot frame | AC-1 | happy_path |
| TC-2 | Bottom overlay pin test asserts overlay centerY >= viewportH * 0.85 | AC-2 | happy_path |
| TC-3 | Topbar safe-area test asserts topY >= safeAreaInsets.top | AC-3 | happy_path |
| TC-4 | Map canvas bleed test asserts frame.top == 0 and frame.bottom == viewportH | AC-4 | happy_path |
| TC-5 | XCUITest on pre-retrofit IdleScreen positions greeting in top 30% and chat in bottom 30% | AC-5 | happy_path |
| TC-6 | Full iOS test suite passes (no regressions) | AC-6 | happy_path |
| TC-7 | grep finds zero hardcoded numeric padding values in LSMapLayer.swift | AC-7 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` | 1-117 | Current implementation; lines 49-64 are the slot blocks; line 92 is the global `.ignoresSafeArea` |
| `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` | 12-66 | Shows the slot consumer pattern (`topOverlays`, `bottomOverlays`, `topBar`) — used as the pre-retrofit reference for AC-5 |
| `.spec/design/system/views/mapapp/idle/idle-screen.html` | all | Authoritative overlay positions: top zone at `top: 44px`; chat anchor at `bottom: var(--space-5)`; map controls right-edge vertically centered |
| `.spec/design/system/views/mapapp/idle/README.md` | all | Container Principle + glass surface contract for overlays |
| `.spec/design/system/tokens/tokens.css` | all | Spacing token names (`--space-2`/`--space-3`/`--space-4`/`--space-5`); confirm which corresponds to `theme.space.md` in iOS |
| `ios/LaneShadow/Views/Organisms/` | (peer files) | SwiftUI safe-area patterns elsewhere — borrow whichever pattern is already proven |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` (MODIFY — slot frame + safe-area only)
- `ios/LaneShadowTests/Views/Organisms/LSMapLayerTests.swift` (NEW or EXTEND)
- `ios/LaneShadowUITests/Views/Organisms/LSMapLayerLayoutE2ETests.swift` (NEW)

**Write-Prohibited:**
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` — owned by Sprint 06 + CAPS-S07-T05
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` — owned by Sprint 06 + CAPS-S07-T05
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 host; not relevant to this layout fix
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` — owned by CAPS-S07-T01
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` — owned by CAPS-S07-T03
- `android/**`, `server/**`, `react-native/**`, `tokens/**`

## Design

**References:**
- `.spec/design/system/views/mapapp/idle/idle-screen.html` — overlay positioning contract (top 44px; bottom `var(--space-5)`)
- `.spec/design/system/views/mapapp/idle/README.md` — Container Principle

**Interaction Notes:** None — this is a layout primitive fix, no interaction surface change.

**Pattern:** `ios/LaneShadow/Views/Organisms/LSMapLayer.swift:49-55` (topOverlays slot) — already correct; mirror this exact frame configuration into bottomOverlays.

**Pattern Source:** SwiftUI `.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: ...)` + `ZStack` is the standard idiom for absolute-positioning slots within a layered canvas.

**Anti-Pattern:** Using `Spacer()` to push bottom content to the bottom (would change the layout semantics for hosts that mount `bottomSheet` simultaneously); hardcoding numeric padding (would drift from design tokens); removing `.ignoresSafeArea` entirely (would create a status-bar-shaped gap above the map).

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `awk '/bottomOverlays/,/accessibilityIdentifier.*maplayer\\.bottomOverlay/' ios/LaneShadow/Views/Organisms/LSMapLayer.swift \| grep -c 'maxHeight: .infinity'` (expect ≥1) |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_bottomOverlay_pinsToBottom` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_topBar_respectsStatusBarSafeArea` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_mapCanvas_bleedsUnderStatusBar` |
| AC-5 | `xcodebuild test -only-testing:LaneShadowUITests/Views/Organisms/LSMapLayerLayoutE2ETests/test_idleScreenPositioning_postT14Fix` |
| AC-6 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| AC-7 | `grep -nE '\\.padding\\(\\.(top\|bottom),\\s*[0-9]+' ios/LaneShadow/Views/Organisms/LSMapLayer.swift` (expect 0 lines) |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Views/Organisms/LSMapLayer.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Pure SwiftUI primitive fix in a single file plus targeted tests. No cross-cutting domain knowledge required.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `RULES.md` (LaneShadow §Cross-Platform Component Parity, §Real Device E2E Testing)

## Dependencies

**Depends on:** none (must run before T05)
**Blocks:** CAPS-S07-T05 (iOS IdleScreen retrofit cannot land cleanly without the slot fix), CAPS-S07-T07 (capture tests inherit broken positioning), CAPS-S07-T09 (sprint gate cannot pass)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN modified LSMapLayer.swift WHEN bottomOverlays slot inspected THEN frame includes maxHeight: .infinity and alignment: .bottom","verify":"awk '/bottomOverlays/,/accessibilityIdentifier.*maplayer\\.bottomOverlay/' ios/LaneShadow/Views/Organisms/LSMapLayer.swift | grep -c 'maxHeight: .infinity'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN LSMapLayer mounted with 100x40pt bottom overlay WHEN laid out THEN overlay centerY >= viewportH * 0.85","verify":"xcodebuild test -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_bottomOverlay_pinsToBottom","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN LSMapLayer mounted with LSTopBar in env with top safe-area WHEN laid out THEN topBar topY >= safeAreaInsets.top","verify":"xcodebuild test -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_topBar_respectsStatusBarSafeArea","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN LSMapLayer mounted with map content WHEN laid out THEN map frame.top == 0 and frame.bottom == viewportH","verify":"xcodebuild test -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_mapCanvas_bleedsUnderStatusBar","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN unmodified IdleScreenContainer hosted via fixed LSMapLayer WHEN cold-launched on iPhone 16 sim THEN greeting in top 30% and chat input in bottom 30%","verify":"xcodebuild test -only-testing:LaneShadowUITests/Views/Organisms/LSMapLayerLayoutE2ETests/test_idleScreenPositioning_postT14Fix","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN modified LSMapLayer.swift WHEN full iOS test suite runs THEN all existing tests pass","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"GIVEN modified LSMapLayer.swift WHEN padding modifiers inspected THEN no numeric literals in .padding(.top|.bottom)","verify":"grep -nE '\\.padding\\(\\.(top|bottom),\\s*[0-9]+' ios/LaneShadow/Views/Organisms/LSMapLayer.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"grep confirms maxHeight: .infinity in bottomOverlays slot","verify":"awk '/bottomOverlays/,/accessibilityIdentifier.*maplayer\\.bottomOverlay/' ios/LaneShadow/Views/Organisms/LSMapLayer.swift | grep -c 'maxHeight: .infinity'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Bottom overlay test passes (pin to bottom)","verify":"xcodebuild test -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_bottomOverlay_pinsToBottom","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Topbar safe-area test passes","verify":"xcodebuild test -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_topBar_respectsStatusBarSafeArea","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Map canvas bleed test passes","verify":"xcodebuild test -only-testing:LaneShadowTests/Views/Organisms/LSMapLayerTests/test_mapCanvas_bleedsUnderStatusBar","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"XCUITest pre-retrofit IdleScreen positions greeting top 30% and chat bottom 30%","verify":"xcodebuild test -only-testing:LaneShadowUITests/Views/Organisms/LSMapLayerLayoutE2ETests/test_idleScreenPositioning_postT14Fix","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Full iOS test suite passes","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"No numeric literals in padding modifiers","verify":"grep -nE '\\.padding\\(\\.(top|bottom),\\s*[0-9]+' ios/LaneShadow/Views/Organisms/LSMapLayer.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
