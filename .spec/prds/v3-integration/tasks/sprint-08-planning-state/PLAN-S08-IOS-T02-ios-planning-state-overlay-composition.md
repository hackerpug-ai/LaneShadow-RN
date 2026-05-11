# PLAN-S08-IOS-T02 — iOS planning-state overlay composition (capsule + indicator on persistent map host)

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-07T19:10:00.000Z

> **Task ID:** PLAN-S08-IOS-T02
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 300 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** XL
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-CHAT-02 (phase progression streaming), UC-FID-01 (planning-screen variants), Sprint 08 — Map View Planning State (Map View Redesign 2026-05-06)

## Background

Sprint 08 ships the planning state of the canonical map view as a configuration change on the persistent Sprint 06 map host (`LSMap` atom + `LSMapLayer` organism + `LSTopBar`), NOT as a navigation to a new screen. The legacy `PlanningScreen.swift` (Sprint 04) renders a floating phase indicator + chat-input overlay over `LSMapLayer`. The 2026-05-06 redesign retires that overlay layout: the top-overlay slot now hosts `LSContextCapsule(state: .planning(headline:))` (Sprint 07) above and `LSPhaseIndicator` (Sprint 04 component) directly below as separate molecules in the `org-map-layer__top-overlay` slot. The Sprint 07 `LSMapControls` workbar reconfigures for the planning state (recenter + chat-mode active; save/layers behavior per design enrichment). The map host itself stays mounted continuously across idle → planning → results — implementers MUST NOT re-mount or re-implement the map.

This task composes the new overlay layout in `PlanningScreen.swift` and `PlanningScreenContainer.swift`, binding to the `PlanningViewModel.capsuleHeadline` / `phaseSteps` / `cancelConfirmationVisible` properties from PLAN-S08-IOS-T01. The cancel-confirm sheet UI itself lands in PLAN-S08-IOS-T04; this task wires the request-cancel intent and the visibility binding so T04 can drop in the sheet. The sketch-polyline overlay layer lands in PLAN-S08-IOS-T03 — this task leaves a clean injection point on the map slot. Components consumed (LSMap, LSMapLayer, LSContextCapsule, LSPhaseIndicator, LSMapControls, LSChatInput) are write-prohibited — bind to existing public APIs.

## Critical Constraints

**MUST:**
- Replace `PlanningScreen.swift` top-overlay composition with TWO ordered slots: (1) `LSContextCapsule(state: .planning(headline: viewModel.capsuleHeadline))` and (2) `LSPhaseIndicator(phases: viewModel.phaseSteps, header: viewModel.capsuleHeadline)` rendered directly below; both inside `LSMapLayer.topOverlays` via the existing `GlassOverlaySlot` pattern
- Reuse the Sprint 06 `LSMap` atom + `LSMapLayer` organism — keep the same `mapView` slot and `LSMapLayer(map:topOverlays:bottomOverlays:topBar:)` shape; do NOT add a sibling map view, do NOT create a `LSMapHost` wrapper, do NOT remount the map between states
- Bind `LSMapControls` (Sprint 07 workbar) into `LSMapLayer` via the existing right-edge slot per the Sprint 07 spec (recenter active; chat-mode active; save/layers behavior per design — wire `viewModel.canSave`/`viewModel.canShowLayers` if present, else pass the documented planning-state defaults)
- Wire the back chip in the top bar to call `viewModel.requestCancelConfirmation()` (NOT direct mutation); keep the `cancelConfirmationVisible` overlay rendering hook in place so PLAN-S08-IOS-T04 can drop in `PlanningCancelConfirmSheet`
- Bind `LSChatInput` to the locked/`is-thinking` modifier driven by `viewModel.isThinking` per existing `isThinking: liveState.isThinking` plumbing — do NOT change `LSChatInput.swift`
- Preserve all existing accessibility identifiers (`planningscreen`, `planningscreen-map`, `planningscreen-phase-indicator`, `planningscreen-chat-input`) AND add new identifiers `planningscreen-context-capsule` (capsule) and `planningscreen-controls` (controls workbar) for design-review capture in PLAN-S08-IOS-T05
- Add tests in `ios/LaneShadowTests/Templates/PlanningScreenTests.swift` (or `Views/Templates/`) covering: context capsule renders with `--planning` state and viewModel headline; phase indicator renders directly below capsule with viewModel `phaseSteps`; back-chip tap triggers `requestCancelConfirmation`; chat input is locked in `is-thinking` mode when `viewModel.isThinking == true`; map host is the same `LSMap` instance (identity check) when transitioning from idle into planning
- Add or update sandbox story `ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift` with story IDs `templates.planning-screen.{state}-{theme}` per cross-platform parity (canonical lowercase dot-separated IDs matching the Android twin PLAN-S08-AND-T02)

**NEVER:**
- NEVER modify `LSMap.swift`, `LSMapLayer.swift`, `LSContextCapsule.swift`, `LSMapControls.swift`, `LSPhaseIndicator.swift`, or `LSChatInput.swift` — all consumed components, write-prohibited
- NEVER re-implement the map host as a sibling component or wrap `LSMap` in a new `LSMapHost` shell — the Sprint 06 composition is canonical
- NEVER hardcode hex literals, RGB tuples, numeric font sizes/weights, or pixel paddings — every visual must resolve through `LaneShadowTheme` tokens
- NEVER use `.foregroundColor` (deprecated); use `.foregroundStyle`
- NEVER call `viewModel.confirmCancellation()` from this task — confirmation lives in PLAN-S08-IOS-T04's sheet
- NEVER bake the 5 phase strings into this view; read them off `viewModel.phaseSteps` so the model owns the contract

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/ios-principles.md` §"SwiftUI body" — keep `PlanningScreen.body` small; extract subviews per existing `phaseIndicatorView` / `chatInputView` / `mapView` pattern
- STRICTLY follow `RULES.md` §"Cross-Platform Component Parity" — the Android twin (PLAN-S08-AND-T02) MUST share the exact sandbox story IDs created here; canonical naming spec lowercase dot-separated kebab-case
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0 — the screen file must remain token-pure

## Specification

**Objective:** Compose the planning-state overlay on the persistent Sprint 06 map host: top-overlay slot renders `LSContextCapsule(--planning)` above `LSPhaseIndicator` below, both bound to `PlanningViewModel`; right-edge `LSMapControls` (Sprint 07) reconfigures for the planning state; bottom `LSChatInput` is locked via `is-thinking`; back chip wires the cancel-request intent. Map host stays mounted; no remount, no re-implementation.

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests` exits 0; opening `templates.planning-screen.*` stories in the iOS sandbox renders the new composition for each state in light + dark glass; `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` succeeds; `scripts/tokens/enforce-native-compliance.sh` exits 0; `swiftlint lint` clean across modified files.

## Acceptance Criteria

### AC-1 — Top-overlay composition: capsule above, indicator below

**GIVEN** `PlanningScreen` is rendered with a non-nil `liveState` and `viewModel.phaseSteps` populated
**WHEN** the view tree is inspected
**THEN** the `LSMapLayer.topOverlays` array contains exactly two `GlassOverlaySlot`s: the first hosts `LSContextCapsule(state: .planning(headline:))`, the second hosts `LSPhaseIndicator(phases:header:)`, in that exact order; both are token-driven via `theme.space.*` for inter-slot spacing
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_topOverlay_capsuleAboveIndicator`

### AC-2 — LSContextCapsule binds to viewModel.capsuleHeadline

**GIVEN** `viewModel.capsuleHeadline == "Drafting candidates…"`
**WHEN** `PlanningScreen` renders
**THEN** the rendered `LSContextCapsule`'s `state` is `.planning(headline: "Drafting candidates…")` exactly (no transformation, no fallback string)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_capsule_bindsViewModelHeadline`

### AC-3 — LSPhaseIndicator binds to viewModel.phaseSteps with 5 entries

**GIVEN** `viewModel.phaseSteps` is the 5-entry `LSPhaseIndicator.Phase` array (drafting → [done, done, active, pending, pending])
**WHEN** `PlanningScreen` renders
**THEN** the rendered `LSPhaseIndicator`'s `phases` parameter is exactly `viewModel.phaseSteps` (5 entries) and `accessibilityIdentifier == "planningscreen-phase-indicator"`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_indicator_bindsViewModelPhaseSteps`

### AC-4 — Back chip triggers requestCancelConfirmation (no direct mutation)

**GIVEN** `PlanningScreen` is mounted with a stub view-model
**WHEN** the user taps the back affordance in the top bar / chat input collapse handler
**THEN** `viewModel.requestCancelConfirmation()` is called exactly once AND `viewModel.confirmCancellation()` / `viewModel.cancelPlanning()` are NOT called from this view
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_backChip_callsRequestCancelConfirmation`

### AC-5 — LSChatInput renders in is-thinking lock when viewModel.isThinking

**GIVEN** `viewModel.isThinking == true`
**WHEN** `PlanningScreen` renders
**THEN** the rendered `LSChatInput` instance has `isThinking: true` AND `isEnabled: false` (per existing `LSChatInput` API), with the bound placeholder showing the rider's prompt or the documented locked-state placeholder
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_chatInput_lockedWhenThinking`

### AC-6 — LSMapControls renders in planning configuration

**GIVEN** `PlanningScreen` is mounted in the planning state
**WHEN** the view tree is inspected
**THEN** the `LSMapControls` workbar is present in the right-edge slot of `LSMapLayer`, configured for planning state per the Sprint 07 spec (recenter active; chat-mode active; save/layers behavior per design — verified via the LSMapControls API surface), with `accessibilityIdentifier == "planningscreen-controls"`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_mapControls_planningConfiguration`

### AC-7 — Map host identity preserved across idle→planning transition

**GIVEN** the same `LSMap` SwiftUI identity is mounted under the idle state container
**WHEN** the app transitions from idle into planning
**THEN** the underlying `LSMap` instance identity is preserved (no remount of the Mapbox view); test asserts via SwiftUI inspection or hosting controller identity that the `LSMap` Vertex view is reused (not a new instance)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_mapHost_identityPreserved`

### AC-8 — Token purity (zero hex / numeric typography / hardcoded spacing)

**GIVEN** the modified `PlanningScreen.swift` and `PlanningScreenContainer.swift`
**WHEN** `scripts/tokens/enforce-native-compliance.sh` runs
**THEN** exit 0 with no findings; both files contain zero `Color(red:...)`, zero hex strings, zero numeric font-size literals, zero hardcoded spacing CGFloat constants outside theme tokens
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -E 'Color\(red:|#[0-9A-Fa-f]{6}|\.font\(\.system\(size:' ios/LaneShadow/Views/Templates/PlanningScreen.swift ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift | wc -l`

### AC-9 — Sandbox stories registered with canonical IDs

**GIVEN** `PlanningScreenStory.all` is included in `TemplatesStories.all`
**WHEN** the sandbox app builds and the story registry is queried
**THEN** stories exist with IDs `templates.planning-screen.{scouting,drawing,weather,scoring,slow-planning,cancel-prompt,single-candidate}-{light,dark}` (per design-system README naming) AND each story renders the corresponding state without runtime errors
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_sandboxStories_registered`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | topOverlays array contains capsule slot first, indicator slot second, in order | AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_topOverlay_capsuleAboveIndicator` | happy_path |
| TC-2 | LSContextCapsule receives `state: .planning(headline: viewModel.capsuleHeadline)` exactly | AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_capsule_bindsViewModelHeadline` | happy_path |
| TC-3 | LSPhaseIndicator receives `phases: viewModel.phaseSteps` (5 entries) with correct accessibility id | AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_indicator_bindsViewModelPhaseSteps` | happy_path |
| TC-4 | Back chip tap calls requestCancelConfirmation; confirmCancellation NOT called from this view | AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_backChip_callsRequestCancelConfirmation` | happy_path |
| TC-5 | LSChatInput renders with isThinking=true, isEnabled=false when viewModel.isThinking | AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_chatInput_lockedWhenThinking` | happy_path |
| TC-6 | LSMapControls present in planning configuration with correct accessibility id | AC-6 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_mapControls_planningConfiguration` | happy_path |
| TC-7 | Map host identity preserved across idle→planning transition (no remount) | AC-7 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_mapHost_identityPreserved` | edge |
| TC-8 | Token compliance script + grep show zero violations in PlanningScreen / Container | AC-8 | `scripts/tokens/enforce-native-compliance.sh` | edge |
| TC-9 | Sandbox stories registered with canonical lowercase dot-separated IDs matching design-system README naming | AC-9 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_sandboxStories_registered` | happy_path |
| TC-10 | Build + lint clean across modified files | AC-1, AC-8 | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Views/Templates/PlanningScreen.swift ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Templates/PlanningScreen.swift` | 1-571 | Existing legacy composition — `LSMapLayer` slot pattern, `topOverlays`/`bottomOverlays` shape, `liveContent(for:)` flow, `phaseIndicatorView`/`chatInputView`/`mapView` extraction; replace top-overlay slot composition |
| `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` | 1-46 | Container — `@Bindable` view-model wiring, `liveState` construction, `task { observe() }`/`onDisappear { stopObserving() }`; extend with `cancelConfirmationVisible` binding |
| `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` | all | Public API surface — `CapsuleState.planning(headline:)` shape, accessibility, token consumption (read-only — do NOT modify) |
| `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` | all | Public API surface — `Phase` struct shape, `phases:header:showWarningChrome:` parameters (read-only — do NOT modify) |
| `ios/LaneShadow/Views/Organisms/LSMapControls.swift` | all | Sprint 07 workbar API — planning-state configuration parameters, slot pattern (read-only — do NOT modify) |
| `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` | 1-116 | Map layer organism — `topOverlays:bottomOverlays:topBar:` slot shape, `GlassOverlaySlot` usage |
| `ios/LaneShadow/Views/Atoms/LSMap.swift` | 1-100 | Map atom — `LSMap(mode:camera:polylines:annotations:)` shape; identity preservation across state transitions |
| `.spec/design/system/views/planning-screen/planning-screen.html` | all | Visual contract — capsule-above-indicator layout, controls placement, chat-input lock state |
| `.spec/design/system/views/planning-screen/README.md` | all | State variant matrix (S01 Scouting, S02 Drawing, S03 Weather, S04 Scoring, V01 Slow, V02 Cancel-Prompt, V03 Single-Candidate) — drives sandbox story IDs |
| `ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift` | all | Existing story registration — extend with canonical IDs |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` (MODIFY — replace top-overlay composition; add capsule slot; preserve identity contract)
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` (MODIFY — bind `cancelConfirmationVisible` per state, propagate `requestCancelConfirmation`)
- `ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift` (MODIFY — canonical IDs aligned to design-system README naming)
- `ios/LaneShadowTests/Templates/PlanningScreenTests.swift` (NEW or MODIFY — composition + binding + identity tests)
- `ios/LaneShadowTests/Views/Templates/PlanningScreenTests.swift` (alternate path — pick one consistent location)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 atom, do NOT modify
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` — Sprint 06 organism, do NOT modify
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` — Sprint 07 component, do NOT modify
- `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` — Sprint 04 component, do NOT modify
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` — Sprint 07 component, do NOT modify
- `ios/LaneShadow/Views/Molecules/LSChatInput.swift` — existing component, do NOT modify
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` — owned by PLAN-S08-IOS-T01
- `ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift` — owned by PLAN-S08-IOS-T03
- `android/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `.spec/design/system/views/planning-screen/planning-screen.html` (post-PLAN-S08-DR-T01 update)
- `.spec/design/system/views/planning-screen/README.md`
- `.spec/design/system/molecules/context-capsule/README.md`
- `.spec/design/system/molecules/phase-indicator/README.md`

**Interaction Notes:** No new gestures introduced. Back chip in top bar wires `requestCancelConfirmation` (intent only — sheet rendering lands in PLAN-S08-IOS-T04). Map host stays mounted continuously; the only thing that changes between idle ↔ planning is overlay-slot composition + chat-input lock + map controls config. Sketch polyline injection point lives on the `mapView` slot; PLAN-S08-IOS-T03 will drop the animation layer in.

**Pattern:** Existing `PlanningScreen.liveContent(for:)` flow (lines 346-376) — the slot composition pattern is correct; the bindings inside the slots get retargeted from legacy floating phase indicator to capsule + indicator pair.

**Pattern Source:** Sprint 06 `IdleScreen` retrofit (CAPS-S07-T05 idle retrofit) — mirror the approach: keep map host identity, swap top-overlay composition, bind to view-model published properties only.

**Anti-Pattern:** Creating a new `PlanningMapHost.swift` wrapper around `LSMap`; rendering capsule + indicator in the same `GlassOverlaySlot` (must be two slots so each can adapt independently); inlining strings for capsule headline (must read off view-model); calling `viewModel.confirmCancellation()` from this view (confirmation belongs in PLAN-S08-IOS-T04's sheet).

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_topOverlay_capsuleAboveIndicator` |
| AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_capsule_bindsViewModelHeadline` |
| AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_indicator_bindsViewModelPhaseSteps` |
| AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_backChip_callsRequestCancelConfirmation` |
| AC-5 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_chatInput_lockedWhenThinking` |
| AC-6 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_mapControls_planningConfiguration` |
| AC-7 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_mapHost_identityPreserved` |
| AC-8 | `scripts/tokens/enforce-native-compliance.sh` |
| AC-9 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_sandboxStories_registered` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Views/Templates/PlanningScreen.swift ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** SwiftUI composition task in `Views/Templates/` + `Features/Planning/` + `Sandbox/Stories/Templates/` consuming existing molecules + organisms via published APIs. Matches swift-implementer's mandate (SwiftUI bodies, theme tokens, sandbox story registration, view-level XCTest coverage). No Mapbox internals, no Convex schema, no Compose.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md` (`@Bindable`, small `body`, subview extraction)
- `brain/docs/mobile-architecture/testing-strategy.md` (view-level tests via SwiftUI inspection or hosting controller)
- `brain/docs/mobile-architecture/performance-optimization.md` (avoid full-tree recompositions; identity preservation across state transitions)
- `RULES.md` (LaneShadow §"Cross-Platform Component Parity", §"Design Review Pipeline — View Snapshot Testing", §"Accessibility Standards iOS")

## Dependencies

**Depends on:**
- PLAN-S08-IOS-T01 (consumes `viewModel.capsuleHeadline`, `phaseSteps`, `cancelConfirmationVisible`, `requestCancelConfirmation()`)
- CAPS-S07-T01 (`LSContextCapsule` shipped)
- CAPS-S07-T03 (`LSMapControls` shipped)
- CAPS-S07-T05 (idle retrofit pattern reference for state transitions on the persistent map host)

**Blocks:**
- PLAN-S08-IOS-T03 (sketch polyline drops into the `mapView` slot retained by this composition)
- PLAN-S08-IOS-T04 (cancel-confirm sheet binds `cancelConfirmationVisible`)
- PLAN-S08-IOS-T05 (capture tests target the new sandbox story IDs)
- PLAN-S08-T11 (Sprint 08 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"topOverlays array has 2 GlassOverlaySlots in order: LSContextCapsule(--planning) then LSPhaseIndicator","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_topOverlay_capsuleAboveIndicator","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"LSContextCapsule receives state .planning(headline: viewModel.capsuleHeadline) verbatim","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_capsule_bindsViewModelHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"LSPhaseIndicator receives phases: viewModel.phaseSteps (5 entries) with accessibility identifier planningscreen-phase-indicator","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_indicator_bindsViewModelPhaseSteps","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Back chip tap calls viewModel.requestCancelConfirmation; confirmCancellation/cancelPlanning NOT called from this view","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_backChip_callsRequestCancelConfirmation","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"LSChatInput renders isThinking=true, isEnabled=false when viewModel.isThinking==true","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_chatInput_lockedWhenThinking","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"LSMapControls present in right-edge slot configured for planning state with accessibility id planningscreen-controls","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_mapControls_planningConfiguration","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Map host identity preserved across idle→planning — same LSMap instance, no remount","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_mapHost_identityPreserved","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-8","type":"acceptance_criterion","description":"Token compliance script exits 0; zero hex/RGB/numeric font/hardcoded spacing in PlanningScreen / Container","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-9","type":"acceptance_criterion","description":"Sandbox stories registered with canonical lowercase dot-separated IDs templates.planning-screen.{state}-{theme} aligned to design-system README naming","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_sandboxStories_registered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"topOverlays array order: capsule slot first, indicator slot second","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_topOverlay_capsuleAboveIndicator","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Capsule receives viewModel.capsuleHeadline verbatim","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_capsule_bindsViewModelHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Indicator receives 5-entry phaseSteps + correct accessibility id","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_indicator_bindsViewModelPhaseSteps","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Back chip → requestCancelConfirmation, NOT confirmCancellation","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_backChip_callsRequestCancelConfirmation","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Chat input locked when viewModel.isThinking","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_chatInput_lockedWhenThinking","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"LSMapControls planning configuration with correct id","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_mapControls_planningConfiguration","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Map host identity preserved across idle→planning transition","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_mapHost_identityPreserved","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Token compliance shell returns 0 + zero violations in screen+container","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-8"},
    {"id":"TC-9","type":"test_criterion","description":"Stories registered with canonical templates.planning-screen.{state}-{theme} ids","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenTests/test_sandboxStories_registered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-9"},
    {"id":"TC-10","type":"test_criterion","description":"Build + swiftlint clean across modified files","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Views/Templates/PlanningScreen.swift ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
