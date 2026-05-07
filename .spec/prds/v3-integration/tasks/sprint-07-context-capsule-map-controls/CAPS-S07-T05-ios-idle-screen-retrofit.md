# CAPS-S07-T05 — iOS IdleScreen retrofit (replace legacy greeting + advisory with LSContextCapsule + LSMapControls)

> **Task ID:** CAPS-S07-T05 · **Sprint:** [Sprint 07](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 180 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P0 · **Effort:** M
> **PRD Refs:** UC-FID-01, UC-MAP-01, UC-CHAT-01

## Background

After T01 ships `LSContextCapsule` and T03 ships `LSMapControls`, this task retrofits the Sprint 06 iOS `IdleScreen.swift` and extends `IdleViewModel` with a derived `capsuleState`. Removes the legacy `greetingOverlay` block (Newsreader t-opinion-xl headline + meta row + standalone advisory card) and replaces with the new components in the `LSMapLayer` top-overlay region.

## Critical Constraints

**MUST:**
- Remove the legacy floating greeting overlay from `ios/LaneShadow/Views/Templates/IdleScreen.swift` — specifically the `greetingOverlay` VStack (lines ~87-164) including the `Text(...)` block with t-opinion-xl headline, the metaRow Text, the italic-emphasis HStack split-by-space rendering, and the inline `weatherAdvisory` HStack-with-rectangle stripe (the standalone advisory card)
- Replace the removed greeting overlay with a single `LSContextCapsule(state: viewModel.capsuleState, isWarning: viewModel.weatherAdvisory != nil, isSaved: false)` placed in the same `topOverlays: [GlassOverlaySlot(id: "context-capsule", ...)]` slot of `LSMapLayer`, with accessibilityIdentifier `idle-context-capsule`
- Add `LSMapControls(mode: .map, hasRouteToSave: false, isSavedRoute: false, onZoomIn: ..., onZoomOut: ..., onRecenter: ..., onLayers: ..., onToggleView: ...)` positioned at the **vertical middle of the right edge** of the map canvas (NOT top-aligned). Use a dedicated `controlsSlot` overlay or position it via `.frame(maxHeight: .infinity, alignment: .trailing)` + center alignment so the workbar is equidistant from topbar and chat-input. Set accessibilityIdentifier `idle-map-controls`
- Add a computed `capsuleState: CapsuleState` to `IdleViewModel` derived from `greetingScope`, `greetingDisplayName`, `metaRow`, `locationLabel`, and `weatherAdvisory`: severity ≥ advisory → `.idleWarning(...)`; location unavailable → `.idle(headline: 'Where are we *starting* from?', ...)`; first ride → `.idle(headline: 'First ride? *Ask* me anything.', ...)`; otherwise default `.idle(headline: 'Where are we riding *{today|tonight}*, {firstName}?', metaItems: ['{Day}', '{Temp}°F', '{Condition}'])`
- Preserve all other idle-screen surfaces verbatim: LSChatInput bottom overlay, topbar, LSMapHost map background, favorite pin overlays, suggestion-chip tap → chat-input is-active flow
- Headline `AttributedString` keeps italic em on the scope-word using AttributedString italic+foregroundColor(signal.default)
- Maintain existing accessibility identifiers used by Sprint 06 capture tests for chat-input and suggestion-chips (`idlescreen-chatinput`, suggestion-chip ids); only the greeting overlay identifiers (`idlescreen-greeting`, `idlescreen-greeting-headline`, `idlescreen-greeting-meta`, `idlescreen-advisory-card`, `idlescreen-current-user-greeting`) go away

**NEVER:**
- Reintroduce the legacy `t-opinion-xl` Newsreader floating headline in IdleScreen
- Keep the standalone advisory card; its visual moves into the capsule's `--warning` modifier
- Instantiate a new LSMap host — the existing Sprint 06 `LSMapHost` / `LSPaperMap` continues to back the canvas
- Hardcode greeting copy in IdleScreen — copy lives on `viewModel.capsuleState`
- Edit `LSContextCapsule.swift` or `LSMapControls.swift` from this task; if a missing prop surfaces, escalate via Ask First and amend the upstream task instead

**STRICTLY:**
- Route map-controls callbacks through the existing LSMapHost camera proxy; zoom handlers must produce verifiable +1/-1 deltas on the persistent host
- Keep `IdleViewModel @Observable @MainActor` discipline; `capsuleState` is a pure computed property (recomposes when source fields change)
- Preserve the cross-platform parity story IDs and a11y identifier conventions per RULES.md

## Specification

**Objective:** Retrofit `IdleScreen.swift` and extend `IdleViewModel.swift` so the idle state composes `LSContextCapsule` + `LSMapControls` in the `LSMapLayer` top-overlay region, replacing the legacy floating greeting + standalone advisory card while preserving chat input, suggestion chips, location pill, topbar, favorite pins, and Sprint 06 LSMap host behavior.

**Success State:** Cold start on iOS Simulator lands on the idle state showing the new capsule centered below the topbar (in the correct state per location/favorites/severity) and the **right-edge vertically-centered** map controls workbar; legacy greeting overlay and advisory card absent from the view tree; existing Sprint 06 chat-input and suggestion-chip behaviors still pass.

## Acceptance Criteria

### AC-1 — Legacy greeting overlay removed from IdleScreen

**GIVEN** the modified `IdleScreen.swift`
**WHEN** grep is run for legacy markers
**THEN** no `Text(...)` views containing the legacy `greeting` headline remain, no `t-opinion-xl` font usage at the greeting site, no `idlescreen-greeting-headline` / `idlescreen-greeting-meta` / `idlescreen-advisory-card` / `idlescreen-current-user-greeting` accessibilityIdentifier references in the file
**Verify:** `grep -E 'opinion\.xl\.font|idlescreen-greeting-headline|idlescreen-greeting-meta|idlescreen-advisory-card|idlescreen-current-user-greeting' ios/LaneShadow/Views/Templates/IdleScreen.swift | wc -l  # expect 0`

### AC-2 — Capsule renders in --idle state with greeting copy

**GIVEN** IdleScreen mounted with viewModel where `greetingScope=.today`, `greetingDisplayName='Marcus'`, `metaRow='FRIDAY · 68°F · CLEAR'`, `weatherAdvisory=nil`, `locationLabel='Santa Cruz, CA'`, `favoriteLocations≥1`
**WHEN** the screen renders
**THEN** the view tree contains exactly one LSContextCapsule with accessibilityIdentifier `idle-context-capsule` showing the headline 'Where are we riding *today*, Marcus?' (italic em on 'today' in copper) and meta row spans 'FRIDAY' / '68°F' / 'CLEAR'; `isWarning=false`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idleDefault_rendersCapsuleWithGreeting`

### AC-3 — LSMapControls workbar renders right-edge vertically centered in idle

**GIVEN** IdleScreen mounted in default state
**WHEN** the screen renders
**THEN** the view tree contains exactly one LSMapControls with accessibilityIdentifier `idle-map-controls`, `mode=.map`, `hasRouteToSave=false`; positioned **vertically centered along the right edge** of LSMapLayer (the workbar's vertical center is within ±20pt of the map canvas vertical center); does not collide with the top-anchored centered capsule
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idle_rendersMapControlsVerticallyCentered`

### AC-4 — Weather-advisory variant uses --warning capsule (no separate card)

**GIVEN** `viewModel.weatherAdvisory != nil` with severity `.advisory` and `metaRow='FRIDAY · 52°F · RAIN · 0.4″'`
**WHEN** the screen renders
**THEN** the LSContextCapsule renders with `isWarning: true` and headline 'Not the *prettiest* day for it.' (italic em on 'prettiest'); the legacy advisory card (HStack with Rectangle stripe + tinted background) is NOT present anywhere in the view tree
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_advisorySeverity_rendersWarningCapsuleNoLegacyCard`

### AC-5 — Dark mode re-resolves capsule + controls without remount

**GIVEN** IdleScreen mounted in light then `colorScheme` flipped to `.dark`
**WHEN** the redraw completes
**THEN** LSContextCapsule and LSMapControls re-resolve to dark token surfaces; the LSMapHost is NOT remounted (camera identity stable, Sprint 06 AC-3 contract); scope-word swaps 'today' → 'tonight' if test clock crosses 18:00
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_darkMode_reResolvesCapsuleAndControls`

### AC-6 — Existing chat-input and suggestion-chip behaviors still pass

**GIVEN** the retrofitted IdleScreen + IdleViewModel
**WHEN** Sprint 06 IdleViewModel tests + chat-input is-active suggestion-chip flow tests run
**THEN** all pre-existing tests in `LaneShadowTests/IdleViewModelTests` and `LaneShadowTests/Features/Idle/*` pass with no regressions
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests && xcodebuild test -only-testing:LaneShadowTests/Features/Idle`

### AC-7 — Map-controls callbacks wired to LSMapHost camera

**GIVEN** IdleScreen with LSMapControls mounted on a real LSMapHost in the idle stack
**WHEN** an XCUITest taps `control-zoom-in` then `control-zoom-out`
**THEN** the LSMapHost camera proxy records +1 then -1 zoom delta; recenter and layers callbacks are non-nil and resolve without crash
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests/test_zoomChips_emitDeltasToHostCamera`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | grep over IdleScreen.swift for legacy greeting markers returns 0 lines | AC-1 | happy_path |
| TC-2 | Default idle viewModel state renders LSContextCapsule with idle-context-capsule a11y id and correct copy | AC-2 | happy_path |
| TC-3 | LSMapControls present with idle-map-controls a11y id, vertically centered along the right edge | AC-3 | happy_path |
| TC-4 | Severity≥advisory: capsule isWarning=true; legacy advisory card absent | AC-4 | edge |
| TC-5 | Dark theme re-resolves capsule+controls; LSMapHost camera identity stable across redraw | AC-5 | happy_path |
| TC-6 | All Sprint 06 idle-related tests still pass with retrofit | AC-6 | happy_path |
| TC-7 | XCUITest tap on control-zoom-in then control-zoom-out emits +1/-1 to LSMapHost camera | AC-7 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `.spec/design/system/views/idle-screen/idle-screen.html` | all | Updated 2026-05-06 — gold-standard pattern: capsule top-centered + map controls right-edge vertically-centered (`top: 50%; transform: translateY(-50%)`); advisory card consolidated into capsule --warning |
| `ios/LaneShadow/Views/Templates/IdleScreen.swift` | 1-241 | Current implementation — `greetingOverlay` (lines 87-164) is the block to remove; `LSMapLayer` slots are the integration site |
| `ios/LaneShadow/Features/Idle/IdleViewModel.swift` | 1-277 | Source state — `greetingScope`, `greetingDisplayName`, `metaRow`, `weatherAdvisory`, `locationLabel`; add `capsuleState` computed property |
| `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-IOS-T01-idle-viewmodel-evolution.md` | all | Greeting.scope state machine contract; baseline VM tests that must keep passing |
| `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-IOS-T02-real-mapbox-warm-paper-and-favorite-pins.md` | all | LSMap host overlay slot contract — capsule + controls slot into the same overlay layer |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` (MODIFY — remove greetingOverlay; add capsule + map controls)
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (MODIFY — add `capsuleState: CapsuleState` computed property)
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` (MODIFY only if controller-level wiring requires it)
- `ios/LaneShadowTests/Features/Idle/IdleScreenRetrofitTests.swift` (NEW)
- `ios/LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests.swift` (NEW — XCUITest for AC-7)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` — owned by CAPS-S07-T01
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` — owned by CAPS-S07-T03
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 host
- `ios/LaneShadow/AppFlow/MapView/**` — Sprint 06 host
- `ios/LaneShadow/Views/Molecules/LSAdvisoryCard.swift` — keep file but DO NOT reference it from IdleScreen anymore
- `android/**`, `server/**`, `react-native/**`, `tokens/**`

## Design

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html`
- `.spec/design/system/molecules/context-capsule/context-capsule.html` + README
- `.spec/design/system/organisms/map-controls/map-controls.html` + README

**Interaction Notes:** Capsule is non-interactive presentation; no tap targets. Map controls callbacks: zoom-in/out drive `mapHost.camera.zoom += 1 / -= 1`; recenter calls `mapHost.recenterToUserLocation()`; layers calls a stub `mapHost.toggleLayers()` (existing API or no-op closure if not yet implemented — flag in PR if missing); save chip is hidden in idle (`hasRouteToSave=false`); mode-toggle stubbed to log+no-op until Sprint 08 wires chat-mode. Suggestion-chip tap continues to flip LSChatInput is-active per Sprint 06 IDLE-S06-IOS-T03 contract — capsule remains in `--idle` (NOT `--planning`).

**Pattern:** `ios/LaneShadow/Views/Templates/IdleScreen.swift:47-73` — LSMapLayer composition with topOverlays slot pattern; reuse this slot to host capsule + controls

**Pattern Source:** Sprint 06 IDLE-S06-IOS-T02 LSMap overlay slot contract — `LSMapLayer(topOverlays: [GlassOverlaySlot...])` accepts arbitrary content closures

**Anti-Pattern:** Re-instantiating LSMap or LSMapHost; adding a third top-overlay slot for the legacy advisory card; flipping the capsule to `--planning` on suggestion-chip tap (Sprint 08 wiring); inlining map-controls callback bodies that import MapboxMaps (callbacks should call host methods, not raw SDK)

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -cE 'opinion\.xl\.font\|idlescreen-greeting-headline\|idlescreen-greeting-meta\|idlescreen-advisory-card\|idlescreen-current-user-greeting' ios/LaneShadow/Views/Templates/IdleScreen.swift` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idleDefault_rendersCapsuleWithGreeting` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idle_rendersMapControlsVerticallyCentered` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_advisorySeverity_rendersWarningCapsuleNoLegacyCard` |
| AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_darkMode_reResolvesCapsuleAndControls` |
| AC-6 | `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests && xcodebuild test -only-testing:LaneShadowTests/Features/Idle` |
| AC-7 | `xcodebuild test -only-testing:LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests/test_zoomChips_emitDeltasToHostCamera` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Features/Idle ios/LaneShadow/Views/Templates/IdleScreen.swift` |
| tokens | `scripts/tokens/enforce-native-compliance.sh` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Modifies `IdleScreen.swift` (template) and `IdleViewModel.swift` (state derivation) to compose the two new components. Pure SwiftUI/Observable wiring within the existing iOS feature surface.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `brain/docs/mobile-architecture/performance-optimization.md`
- `RULES.md` (LaneShadow §Cross-Platform Component Parity, §Accessibility Standards iOS, §Real Device E2E Testing)

## Dependencies

**Depends on:** CAPS-S07-T01 (LSContextCapsule molecule), CAPS-S07-T03 (LSMapControls organism)
**Blocks:** CAPS-S07-T07 (capture tests), CAPS-S07-T09 (sprint gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN modified IdleScreen.swift WHEN grep legacy markers THEN 0 hits","verify":"grep -cE 'opinion\\.xl\\.font|idlescreen-greeting-headline|idlescreen-greeting-meta|idlescreen-advisory-card|idlescreen-current-user-greeting' ios/LaneShadow/Views/Templates/IdleScreen.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN default viewModel WHEN renders THEN LSContextCapsule(idle-context-capsule) shows greeting + meta row","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idleDefault_rendersCapsuleWithGreeting","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN idle state WHEN renders THEN LSMapControls(mode=.map, idle-map-controls) right-edge vertically centered","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idle_rendersMapControlsVerticallyCentered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN severity≥advisory WHEN renders THEN capsule isWarning=true; no legacy advisory card","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_advisorySeverity_rendersWarningCapsuleNoLegacyCard","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN colorScheme flip WHEN redraws THEN capsule+controls re-resolve dark; LSMapHost camera identity stable","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_darkMode_reResolvesCapsuleAndControls","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN retrofitted view+VM WHEN existing tests run THEN IdleViewModelTests + Features/Idle suites all pass","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests && xcodebuild test -only-testing:LaneShadowTests/Features/Idle","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"GIVEN LSMapControls bound to LSMapHost camera WHEN XCUITest taps zoom-in/out THEN +1/-1 deltas observed on host","verify":"xcodebuild test -only-testing:LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests/test_zoomChips_emitDeltasToHostCamera","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"grep returns 0 lines for legacy greeting markers","verify":"grep -cE 'opinion\\.xl\\.font|idlescreen-greeting-headline|idlescreen-greeting-meta|idlescreen-advisory-card' ios/LaneShadow/Views/Templates/IdleScreen.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Default idle render contains LSContextCapsule with idle-context-capsule and greeting copy","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idleDefault_rendersCapsuleWithGreeting","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"LSMapControls present with idle-map-controls a11y id, vertically centered along the right edge","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idle_rendersMapControlsVerticallyCentered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Advisory severity → capsule isWarning=true; no LSAdvisoryCard subtree","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_advisorySeverity_rendersWarningCapsuleNoLegacyCard","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Dark theme redraw stable for components and LSMapHost","verify":"xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_darkMode_reResolvesCapsuleAndControls","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Existing IdleViewModelTests + Features/Idle suite pass","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests && xcodebuild test -only-testing:LaneShadowTests/Features/Idle","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Zoom chips drive +1/-1 deltas on LSMapHost camera in XCUITest","verify":"xcodebuild test -only-testing:LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests/test_zoomChips_emitDeltasToHostCamera","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
