# RR-S09-IOS-T02 — iOS route-results state composition on persistent map host

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z

> **Task ID:** RR-S09-IOS-T02
> **Sprint:** [Sprint 09 — Map View · Route Results State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 300 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** XL
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03, UC-FID-01 (route-results-screen variants), Sprint 09

## Background

Replace the existing `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` mock-provider data path with the live `RouteResultsViewModel` (RR-S09-IOS-T01) and compose the route-results state on the persistent Sprint 06 map host. The top-overlay slot renders `LSContextCapsule(state: .results(headline:))` above + a horizontal row of `mol-route-attachment-card` molecules below as a single `LSNavigatorMessage` composition. The Sprint 07 `LSMapControls` workbar reconfigures for the results state per design. `LSMap` identity is preserved across planning→results transition (no remount). This task does NOT render polylines or wire alt-selection promotion — those land in RR-S09-IOS-T03. It also does NOT wire chat-refine or dismiss/recall — those land in RR-S09-IOS-T04. This task establishes the canonical composition and the bindings to view-model published properties.

## Critical Constraints

**MUST:**
- MUST replace `RouteResultsScreen.swift`'s body composition to consume `RouteResultsViewModel` (NEW from RR-S09-IOS-T01) via `@Bindable` injection through `RouteResultsScreenContainer.swift` (NEW)
- MUST render `LSContextCapsule(state: .results(headline: viewModel.navigatorHeadline))` AND the `LSNavigatorMessage` organism wrapping the three `mol-route-attachment-card` molecules in `LSMapLayer.topOverlays`
- MUST reuse the Sprint 06 `LSMap` atom + `LSMapLayer` organism unchanged; the map host instance identity MUST be preserved across planning→results (assertable via SwiftUI inspection)
- MUST bind Sprint 07 `LSMapControls` in the right-edge slot, configured for results state per design (recenter active; chat-mode active; save/layers behavior per `org-map-controls` results-state spec)
- MUST preserve all existing accessibility identifiers (`routeresultsscreen`, `routeresultsscreen-map`, `routeresultsscreen-navigator-message`, `routeresultsscreen-chat-input`) AND add `routeresultsscreen-context-capsule`, `routeresultsscreen-controls`, `routeresultsscreen-card-{0,1,2}` per cross-platform parity for design-review capture in RR-S09-IOS-T05
- MUST add tests in `ios/LaneShadowTests/Templates/RouteResultsScreenTests.swift` covering: capsule renders with `--results` state; three cards render below the capsule; LSMapControls renders in results configuration; map host identity preserved across planning→results transition
- MUST add or update sandbox stories in `ios/LaneShadow/Sandbox/Stories/Templates/RouteResultsScreenStory.swift` with canonical IDs `templates.route-results-screen.{variant}-{theme}` per the RR-S09-DR-T01 canonical matrix

**NEVER:**
- NEVER modify `LSMap.swift`, `LSMapLayer.swift`, `LSContextCapsule.swift`, `LSMapControls.swift`, `LSNavigatorMessage.swift`, or `mol-route-attachment-card` Swift component — all consumed write-prohibited
- NEVER re-implement the map host as a sibling component; the Sprint 06 composition is canonical
- NEVER hardcode hex/RGB/numeric font/hardcoded padding values; every visual MUST resolve through `LaneShadowTheme` tokens
- NEVER render polylines from this task (RR-S09-IOS-T03 owns polyline rendering and alt-selection)
- NEVER wire chat-refine submit or dismiss/recall in this task (RR-S09-IOS-T04 owns those)
- NEVER consume `RouteResultsMockProvider` in the live path; the sandbox stories can still use it for fixture rendering, but the live `RouteResultsScreen` consumes `RouteResultsViewModel`

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/ios-principles.md` §"SwiftUI body" — small body, extracted subviews per the existing `navigatorMessageContainer`/`baseBody` pattern
- STRICTLY follow `RULES.md` §"Cross-Platform Component Parity" — Android twin RR-S09-AND-T02 MUST share canonical sandbox story IDs
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0 across modified files

## Specification

**Objective:** Compose the route-results state on the persistent Sprint 06 map host: top-overlay slot renders `LSContextCapsule(--results)` above `LSNavigatorMessage` with three attached `mol-route-attachment-card` molecules; right-edge `LSMapControls` (Sprint 07) reconfigures for results state; `LSMap` identity is preserved across planning→results transition. Live data flows through `RouteResultsViewModel` (RR-S09-IOS-T01).

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests` exits 0; opening `templates.route-results-screen.*` stories in the iOS sandbox renders the new composition for each variant in light + dark; `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` exits 0; `scripts/tokens/enforce-native-compliance.sh` exits 0; `swiftlint lint` clean across modified files.

## Acceptance Criteria

### AC-1 — Top-overlay composition: capsule above, message+cards below

**GIVEN** `RouteResultsScreen` rendered with a live `RouteResultsViewModel` containing 3 polylines
**WHEN** the view tree is inspected
**THEN** `LSMapLayer.topOverlays` contains in order: (1) `GlassOverlaySlot` hosting `LSContextCapsule(state: .results(headline:))`, (2) `GlassOverlaySlot` hosting `LSNavigatorMessage` wrapping a horizontal `HStack` of three `LSRouteAttachmentCard` molecules; both slots are token-driven via `theme.space.*`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_topOverlay_capsuleAboveMessageWithCards`

### AC-2 — LSContextCapsule binds to viewModel.navigatorHeadline

**GIVEN** `viewModel.navigatorHeadline == "Three rides scored for you"`
**WHEN** `RouteResultsScreen` renders
**THEN** the rendered `LSContextCapsule`'s `state` is `.results(headline: "Three rides scored for you")` (no fallback, no transformation)
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_capsule_bindsViewModelHeadline`

### AC-3 — Three LSRouteAttachmentCard molecules render with viewModel.cards

**GIVEN** `viewModel.cards.count == 3` with distinct `(title, via, distanceMiles, durationMinutes, scenicScore, colorToken)` per card
**WHEN** `RouteResultsScreen` renders
**THEN** the `LSNavigatorMessage` body contains exactly three `LSRouteAttachmentCard` instances bound to `viewModel.cards[0]`, `cards[1]`, `cards[2]`; each card has `accessibilityIdentifier == "routeresultsscreen-card-{index}"`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_cards_renderWithViewModelData`

### AC-4 — LSMapControls renders in results configuration

**GIVEN** `RouteResultsScreen` is mounted in the results state
**WHEN** the view tree is inspected
**THEN** `LSMapControls` is present in the right-edge slot of `LSMapLayer`, configured for results state (recenter active, chat-mode active, save/layers behavior per design), with `accessibilityIdentifier == "routeresultsscreen-controls"`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_mapControls_resultsConfiguration`

### AC-5 — Map host identity preserved across planning→results transition

**GIVEN** an `LSMap` instance was mounted under the planning-state container
**WHEN** the app transitions from planning into results
**THEN** the underlying `LSMap` instance identity is preserved (no remount of Mapbox view); test asserts identity via SwiftUI inspection or hosting controller
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_mapHost_identityPreservedAcrossPlanningToResults`

### AC-6 — Token purity (zero hex / numeric typography / hardcoded spacing)

**GIVEN** modified `RouteResultsScreen.swift` and `RouteResultsScreenContainer.swift`
**WHEN** `scripts/tokens/enforce-native-compliance.sh` runs
**THEN** exit 0; zero `Color(red:...)`, zero hex strings, zero numeric font-size literals, zero hardcoded spacing CGFloat constants
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -E 'Color\(red:\|#[0-9A-Fa-f]{6}\|\.font\(\.system\(size:' ios/LaneShadow/Views/Templates/RouteResultsScreen.swift ios/LaneShadow/Features/RouteResults/RouteResultsScreenContainer.swift | wc -l` returns 0

### AC-7 — Sandbox stories registered with canonical IDs

**GIVEN** `RouteResultsScreenStory.all` is included in `TemplatesStories.all`
**WHEN** the sandbox app builds and story registry is queried
**THEN** stories exist with IDs `templates.route-results-screen.{default-best-pre-selected,alt1-tapped-sage-promoted,default-dark,refining,two-candidates,weather-divergent,message-dismissed}-{light,dark}` per the canonical matrix from RR-S09-DR-T01; each story renders without runtime errors
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_sandboxStories_registered`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | topOverlays array order: capsule slot first, message+cards slot second | AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_topOverlay_capsuleAboveMessageWithCards` | happy_path |
| TC-2 | Capsule receives state .results(headline: viewModel.navigatorHeadline) verbatim | AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_capsule_bindsViewModelHeadline` | happy_path |
| TC-3 | Three LSRouteAttachmentCard instances render with correct accessibility ids and viewModel data | AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_cards_renderWithViewModelData` | happy_path |
| TC-4 | LSMapControls present in results configuration with correct accessibility id | AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_mapControls_resultsConfiguration` | happy_path |
| TC-5 | Map host identity preserved across planning→results transition | AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_mapHost_identityPreservedAcrossPlanningToResults` | edge |
| TC-6 | Token compliance script + grep show zero violations | AC-6 | `scripts/tokens/enforce-native-compliance.sh` | edge |
| TC-7 | Stories registered with canonical IDs matching RR-S09-DR-T01 matrix | AC-7 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_sandboxStories_registered` | happy_path |
| TC-8 | Build + lint clean across modified files | AC-1, AC-6 | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Views/Templates/RouteResultsScreen.swift ios/LaneShadow/Features/RouteResults/RouteResultsScreenContainer.swift` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` | 1-259 | [PRIMARY PATTERN] Existing template — `LSMapLayer` slot pattern, `topOverlays`/`bottomOverlays` shape, `baseBody` flow, `navigatorMessageContainer` extraction; this task replaces the mock data path with live ViewModel |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-IOS-T02-ios-planning-state-overlay-composition.md` | all | Sprint 08 architectural mirror — same composition pattern with different overlay content |
| `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` | all | Public API surface — `CapsuleState.results(headline:)` shape (read-only) |
| `ios/LaneShadow/Views/Organisms/LSMapControls.swift` | all | Sprint 07 workbar API — results-state configuration parameters (read-only) |
| `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` | 1-116 | Map layer organism — `topOverlays:bottomOverlays:topBar:` shape, `GlassOverlaySlot` usage |
| `ios/LaneShadow/Views/Atoms/LSMap.swift` | 1-100 | Map atom — `LSMap(mode:camera:polylines:annotations:)` shape, identity preservation contract |
| `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` | all | Navigator message organism — pinned-message composition with attached cards |
| `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift` | all (or path equivalent) | Route attachment card molecule API |
| `.spec/design/system/views/route-results-screen/route-results-screen.html` | all | Visual contract — composition layout |
| `.spec/design/system/views/route-results-screen/README.md` | all | Variant matrix |
| `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` | all | RR-S09-DR-T01 output — canonical 7-variant matrix |
| `ios/LaneShadow/Sandbox/Stories/Templates/RouteResultsScreenStory.swift` | all | Existing story registration — extend with canonical IDs |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` (MODIFY — replace mock-provider data path with live ViewModel binding; compose capsule + message+cards in topOverlays; preserve identity contract)
- `ios/LaneShadow/Features/RouteResults/RouteResultsScreenContainer.swift` (NEW — `@Bindable` ViewModel injection, lifecycle observe/stopObserving)
- `ios/LaneShadow/Sandbox/Stories/Templates/RouteResultsScreenStory.swift` (MODIFY — canonical IDs aligned to VARIANTS.md)
- `ios/LaneShadowTests/Templates/RouteResultsScreenTests.swift` (NEW or MODIFY — composition + binding + identity tests)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 atom
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` — Sprint 06 organism
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` — Sprint 07 component
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` — Sprint 07 component
- `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` — existing organism
- `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift` — existing molecule
- `ios/LaneShadow/Features/RouteResults/RouteResultsViewModel.swift` — owned by RR-S09-IOS-T01
- `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift` — sandbox-only fixture
- `android/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `.spec/design/system/views/route-results-screen/route-results-screen.html`
- `.spec/design/system/views/route-results-screen/README.md`
- `.spec/design/system/molecules/context-capsule/README.md`
- `.spec/design/system/refs/route-results-screen/default--best-pre-selected.light.png` (S01)
- `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` (RR-S09-DR-T01 output)

**Interaction Notes:** No new gestures introduced by this task. Card-tap, dismiss, refine submit are wired in RR-S09-IOS-T03 / T04. The composition only exposes binding-ready surfaces; downstream tasks attach callbacks.

**Pattern:** Sprint 08 `PlanningScreen` composition (PLAN-S08-IOS-T02) — keep map identity, swap top-overlay composition, bind to ViewModel published properties only.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-IOS-T02-ios-planning-state-overlay-composition.md`

**Anti-Pattern:** Wrapping `LSMap` in a new `RouteResultsMapHost.swift`; rendering capsule + message+cards in the same `GlassOverlaySlot` (must be two slots); inlining headline strings (must read off `viewModel.navigatorHeadline`); rendering polylines from this task; consuming `RouteResultsMockProvider` in the live `RouteResultsScreen`.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_topOverlay_capsuleAboveMessageWithCards` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_capsule_bindsViewModelHeadline` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_cards_renderWithViewModelData` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_mapControls_resultsConfiguration` |
| AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_mapHost_identityPreservedAcrossPlanningToResults` |
| AC-6 | `scripts/tokens/enforce-native-compliance.sh` (exit 0); grep returns 0 |
| AC-7 | `xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_sandboxStories_registered` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Views/Templates/RouteResultsScreen.swift ios/LaneShadow/Features/RouteResults/RouteResultsScreenContainer.swift ios/LaneShadow/Sandbox/Stories/Templates/RouteResultsScreenStory.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** SwiftUI composition task in `Views/Templates/` + `Features/RouteResults/` + `Sandbox/Stories/Templates/` consuming existing molecules/organisms via published APIs. No Mapbox internals, no Convex schema, no Compose. Reviewer: `swift-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md` (`@Bindable`, small `body`, subview extraction)
- `brain/docs/mobile-architecture/testing-strategy.md` (view-level tests)
- `RULES.md` §"Cross-Platform Component Parity", §"Design Review Pipeline — View Snapshot Testing", §"Accessibility Standards iOS"

## Dependencies

**Depends on:**
- RR-S09-DR-T01 (canonical variant matrix in VARIANTS.md)
- RR-S09-IOS-T01 (consumes `RouteResultsViewModel` published properties)

**Blocks:**
- RR-S09-IOS-T03 (polyline rendering binds inside this composition)
- RR-S09-IOS-T04 (chat-refine + dismiss/recall wires the composition's callback hooks)
- RR-S09-IOS-T05 (capture tests target the new sandbox story IDs)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"topOverlays has 2 GlassOverlaySlots in order: LSContextCapsule(--results) then LSNavigatorMessage with 3 attached LSRouteAttachmentCard molecules","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_topOverlay_capsuleAboveMessageWithCards","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"LSContextCapsule receives state .results(headline: viewModel.navigatorHeadline) verbatim","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_capsule_bindsViewModelHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Three LSRouteAttachmentCard instances render bound to viewModel.cards[0..2] with correct accessibility ids","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_cards_renderWithViewModelData","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"LSMapControls renders in results state configuration with id routeresultsscreen-controls","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_mapControls_resultsConfiguration","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Map host LSMap identity preserved across planning→results transition (no remount)","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_mapHost_identityPreservedAcrossPlanningToResults","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Token compliance script exits 0; zero hex/RGB/numeric font/hardcoded spacing in modified files","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Sandbox stories registered with canonical IDs templates.route-results-screen.{variant}-{theme} per VARIANTS.md","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_sandboxStories_registered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"topOverlays ordered: capsule first, message+cards second","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_topOverlay_capsuleAboveMessageWithCards","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Capsule receives viewModel.navigatorHeadline verbatim","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_capsule_bindsViewModelHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Three LSRouteAttachmentCard instances with viewModel data and correct ids","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_cards_renderWithViewModelData","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"LSMapControls results configuration test passes","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_mapControls_resultsConfiguration","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Map host identity preserved across planning→results transition","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_mapHost_identityPreservedAcrossPlanningToResults","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Token compliance returns zero violations in modified files","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Sandbox stories registered with canonical IDs","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/RouteResultsScreenTests/test_sandboxStories_registered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Build + swiftlint clean across modified files","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Views/Templates/RouteResultsScreen.swift ios/LaneShadow/Features/RouteResults/RouteResultsScreenContainer.swift ios/LaneShadow/Sandbox/Stories/Templates/RouteResultsScreenStory.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
