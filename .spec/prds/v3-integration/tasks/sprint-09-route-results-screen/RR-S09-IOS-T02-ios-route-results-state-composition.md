# RR-S09-IOS-T02 — iOS route-results state composition on MapApp (persistent host)

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z (retrofitted for MAPAPP-DOCTRINE 2026-05-14)

> **Task ID:** RR-S09-IOS-T02
> **Sprint:** [Sprint 09 — MapApp · Route Results State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 300 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** XL
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03, UC-FID-01 (route-results variants), Sprint 09

## Background

**Doctrine:** Per `RULES.md` § Design Rules › One View, Many States, the route-results experience is a STATE composition of `MapApp` (the canonical persistent host introduced in Sprint 08 cycle 1, commit `bc0a5976b`), not a sibling screen. This task extends `ios/LaneShadow/Views/Templates/MapApp.swift` so that when its `MapAppState == .routeResults(sessionId:routePlanId:)` it composes:

- **Top overlay slot 1:** `LSContextCapsule(state: .results(headline: mapAppViewModel.navigatorHeadline))`
- **Top overlay slot 2:** `LSNavigatorMessage` wrapping a horizontal `HStack` of three `LSRouteAttachmentCard` molecules bound to `mapAppViewModel.cards`
- **Right-edge slot:** Sprint 07 `LSMapControls` configured for results state
- **Map atom:** the SAME `LSMap` instance MapApp already mounts (no remount; identity preserved)

The composition consumes the extended `MapAppViewModel` (RR-S09-IOS-T01) via `@Bindable` injection from `MapApp.swift`'s existing view-model property. This task does NOT render polylines or wire alt-selection promotion — those land in RR-S09-IOS-T03. It also does NOT wire chat-refine or dismiss/recall — those land in RR-S09-IOS-T04. This task establishes the canonical state-derived overlay composition for the `.routeResults` branch of `MapApp`'s state-driven body.

The legacy `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` (259 lines, mock-provider-driven) is a pre-doctrine sandbox-only fixture and is NOT extended here. Its `RouteResultsScreenState` shape and `topOverlays`/`bottomOverlays` pattern are useful references, but the canonical live home is `MapApp.swift`'s state-derived overlay arrays.

## Critical Constraints

**MUST:**
- MUST extend `ios/LaneShadow/Views/Templates/MapApp.swift`'s state-derived `topOverlays` / `bottomOverlays` arrays (or equivalent state-switch within the body) so when `state == .routeResults(...)` the slots produce the capsule + navigator-message+cards composition
- MUST render `LSContextCapsule(state: .results(headline: mapAppViewModel.navigatorHeadline))` AND the `LSNavigatorMessage` organism wrapping three `LSRouteAttachmentCard` molecules in `LSMapLayer.topOverlays` (two separate `GlassOverlaySlot`s — capsule first, navigator-message second)
- MUST reuse the Sprint 06 `LSMap` atom + `LSMapLayer` organism already mounted by `MapApp.swift`; no second instance, no remount on `.planning → .routeResults`
- MUST bind Sprint 07 `LSMapControls` in the right-edge slot, configured for results state per design (recenter active; chat-mode active; save/layers behavior per `org-map-controls` results-state spec)
- MUST preserve all existing accessibility identifiers AND add new ones namespaced to MapApp's routeResults state: `mapapp-routeresults-context-capsule`, `mapapp-routeresults-navigator-message`, `mapapp-routeresults-controls`, `mapapp-routeresults-card-{0,1,2}`, `mapapp-routeresults-chat-input`. Cross-platform parity with Android (RR-S09-AND-T02) is required.
- MUST add tests in `ios/LaneShadowTests/Templates/MapAppRouteResultsCompositionTests.swift` covering: when `state == .routeResults`, the topOverlays array yields capsule then navigator-message+cards; LSMapControls renders in results configuration; `LSMap` host identity preserved across `.planning → .routeResults` transition (the canonical persistent-host invariant)
- MUST add or update sandbox stories in `ios/LaneShadow/Sandbox/Stories/Templates/MapAppStories.swift` (or a `MapAppRouteResultsStories.swift` companion file) with canonical IDs `templates.map-app.route-results-{variant}-{theme}` per the RR-S09-DR-T01 canonical matrix; each story renders `MapApp` with `MapAppState.routeResults(...)` injected via a story-specific seed (sandbox-only mock data through `RouteResultsMockProvider` is acceptable for stories — the state injection bypasses the live Convex subscription)

**NEVER:**
- NEVER create `RouteResultsScreen.swift`, `RouteResultsScreenContainer.swift`, or any sibling template — the routeResults state lives on `MapApp.swift` per the One View, Many States doctrine
- NEVER extend the legacy `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` in the live path; that file is a pre-doctrine sandbox-only fixture awaiting MAPAPP-UNIFY cleanup
- NEVER modify `LSMap.swift`, `LSMapLayer.swift`, `LSContextCapsule.swift`, `LSMapControls.swift`, `LSNavigatorMessage.swift`, or `mol-route-attachment-card` Swift component — all consumed write-prohibited
- NEVER mount a second `LSMap` instance; the Sprint 06 composition under `MapApp` is canonical
- NEVER hardcode hex/RGB/numeric font/hardcoded padding values; every visual MUST resolve through `LaneShadowTheme` tokens
- NEVER render polylines from this task (RR-S09-IOS-T03 owns polyline rendering and alt-selection)
- NEVER wire chat-refine submit or dismiss/recall in this task (RR-S09-IOS-T04 owns those)
- NEVER push a NavigationStack destination on entry to `.routeResults` — state mutation only
- NEVER consume `RouteResultsMockProvider` in the live `MapApp` path; the sandbox stories MAY use it for fixture rendering via `MapAppState` injection, but the live path consumes `MapAppViewModel`

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/ios-principles.md` § State-Driven Views (Persistent Host) AND § SwiftUI body — small body, extracted subviews per the existing `IdleScreen.swift` / `MapApp.swift` pattern
- STRICTLY follow `RULES.md` §"Cross-Platform Component Parity" — Android twin RR-S09-AND-T02 MUST share canonical sandbox story IDs `templates.map-app.route-results-{variant}-{theme}`
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0 across modified files

## Specification

**Objective:** Extend `MapApp.swift` so that when its state is `.routeResults(...)` it composes the route-results experience on the persistent map host: top-overlay slot 1 renders `LSContextCapsule(--results)`; top-overlay slot 2 renders `LSNavigatorMessage` with three attached `LSRouteAttachmentCard` molecules; right-edge `LSMapControls` (Sprint 07) reconfigures for results state; `LSMap` identity is preserved across `.planning → .routeResults` transition. Live data flows through `MapAppViewModel` (RR-S09-IOS-T01).

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests` exits 0; opening `templates.map-app.route-results-*` stories in the iOS sandbox renders the new composition for each variant in light + dark; `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` exits 0; `scripts/tokens/enforce-native-compliance.sh` exits 0; `swiftlint lint` clean across modified files.

## Acceptance Criteria

### AC-1 — When state == .routeResults, top-overlay composition is capsule then message+cards

**GIVEN** `MapApp` rendered with `MapAppViewModel.state == .routeResults(sessionId:routePlanId:)` and 3 polylines+cards available
**WHEN** the view tree is inspected
**THEN** `LSMapLayer.topOverlays` (as produced by `MapApp`'s state-derived array for the `.routeResults` case) contains in order: (1) `GlassOverlaySlot` hosting `LSContextCapsule(state: .results(headline:))`, (2) `GlassOverlaySlot` hosting `LSNavigatorMessage` wrapping a horizontal `HStack` of three `LSRouteAttachmentCard` molecules; both slots are token-driven via `theme.space.*`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_topOverlay_capsuleAboveMessageWithCards`

### AC-2 — LSContextCapsule binds to mapAppViewModel.navigatorHeadline in routeResults state

**GIVEN** `mapAppViewModel.navigatorHeadline == "Three rides scored for you"` and `state == .routeResults`
**WHEN** `MapApp` renders
**THEN** the rendered `LSContextCapsule`'s `state` is `.results(headline: "Three rides scored for you")` (no fallback, no transformation)
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_capsule_bindsViewModelHeadline`

### AC-3 — Three LSRouteAttachmentCard molecules render with mapAppViewModel.cards in routeResults

**GIVEN** `state == .routeResults` AND `mapAppViewModel.cards.count == 3` with distinct `(title, via, distanceMiles, durationMinutes, scenicScore, colorToken)` per card
**WHEN** `MapApp` renders
**THEN** the `LSNavigatorMessage` body contains exactly three `LSRouteAttachmentCard` instances bound to `mapAppViewModel.cards[0]`, `cards[1]`, `cards[2]`; each card has `accessibilityIdentifier == "mapapp-routeresults-card-{index}"`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_cards_renderWithViewModelData`

### AC-4 — LSMapControls renders in results configuration when state == .routeResults

**GIVEN** `MapApp` is mounted with `state == .routeResults`
**WHEN** the view tree is inspected
**THEN** `LSMapControls` is present in the right-edge slot of `LSMapLayer`, configured for results state (recenter active, chat-mode active, save/layers behavior per design), with `accessibilityIdentifier == "mapapp-routeresults-controls"`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_mapControls_resultsConfiguration`

### AC-5 — Persistent-host invariant: LSMap identity preserved across .planning → .routeResults

**GIVEN** an `LSMap` instance was mounted under `MapApp` while `state == .planning(sessionId:)`
**WHEN** the view-model mutates `state` to `.routeResults(sessionId:routePlanId:)`
**THEN** the underlying `LSMap` view instance identity is preserved (no remount of Mapbox view); test asserts identity via SwiftUI inspection or `ObjectIdentifier` capture before/after; `MapApp` itself does not remount (root view identity unchanged)
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_mapHost_identityPreservedAcrossPlanningToResults`

### AC-6 — Token purity (zero hex / numeric typography / hardcoded spacing)

**GIVEN** modified `MapApp.swift` and any new helper files under `ios/LaneShadow/Features/MapApp/RouteResults/`
**WHEN** `scripts/tokens/enforce-native-compliance.sh` runs
**THEN** exit 0; zero `Color(red:...)`, zero hex strings, zero numeric font-size literals, zero hardcoded spacing CGFloat constants
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -rE 'Color\(red:\|#[0-9A-Fa-f]{6}\|\.font\(\.system\(size:' ios/LaneShadow/Views/Templates/MapApp.swift ios/LaneShadow/Features/MapApp/ | wc -l` returns 0

### AC-7 — Sandbox stories registered with canonical IDs under templates.map-app.route-results-*

**GIVEN** `MapAppRouteResultsStories.all` (or `MapAppStories.all` extended) is included in `TemplatesStories.all`
**WHEN** the sandbox app builds and story registry is queried
**THEN** stories exist with IDs `templates.map-app.route-results-{default-best-pre-selected,alt1-tapped-sage-promoted,default-dark,refining,two-candidates,weather-divergent,message-dismissed}-{light,dark}` per the canonical matrix from RR-S09-DR-T01; each story renders `MapApp` with `MapAppState.routeResults(...)` and corresponding mock data without runtime errors
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_sandboxStories_registered`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | topOverlays array order when state==.routeResults: capsule slot first, message+cards slot second | AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_topOverlay_capsuleAboveMessageWithCards` | happy_path |
| TC-2 | Capsule receives state .results(headline: mapAppViewModel.navigatorHeadline) verbatim | AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_capsule_bindsViewModelHeadline` | happy_path |
| TC-3 | Three LSRouteAttachmentCard instances render with correct accessibility ids and viewModel data | AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_cards_renderWithViewModelData` | happy_path |
| TC-4 | LSMapControls present in results configuration with correct accessibility id | AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_mapControls_resultsConfiguration` | happy_path |
| TC-5 | LSMap host identity preserved across .planning → .routeResults transition | AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_mapHost_identityPreservedAcrossPlanningToResults` | edge |
| TC-6 | Token compliance script + grep show zero violations | AC-6 | `scripts/tokens/enforce-native-compliance.sh` | edge |
| TC-7 | Stories registered with canonical IDs `templates.map-app.route-results-*` | AC-7 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_sandboxStories_registered` | happy_path |
| TC-8 | Build + lint clean across modified files | AC-1, AC-6 | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Views/Templates/MapApp.swift ios/LaneShadow/Features/MapApp/` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Templates/MapApp.swift` | all | [PRIMARY ARCHITECTURE] Persistent host — extend its state-derived `topOverlays`/`bottomOverlays` arrays for the `.routeResults` case; mirror the existing IdleScreen.swift overlay-slot pattern that MapApp.swift was modeled on |
| `ios/LaneShadow/Features/MapApp/MapAppState.swift` | all | [PRIMARY ARCHITECTURE] `.routeResults(sessionId:routePlanId:)` case is the state branch this task composes |
| `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` | all (extended by RR-S09-IOS-T01) | View-model surface — `navigatorHeadline`, `cards`, `selectedRouteId`, `isMessageDismissed` |
| `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` | 1-259 | [LEGACY — read for shape only] Pre-doctrine sandbox template — understand `topOverlays`/`bottomOverlays` shape, `baseBody` flow, `navigatorMessageContainer` extraction; do NOT extend this file; mirror the composition pattern into MapApp.swift's state branch |
| `ios/LaneShadow/Views/Templates/IdleScreen.swift` | all | Sprint 06 idle-state composition that MapApp.swift was patterned on — `topOverlays` array literal returning state-derived overlays |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-IOS-T02-ios-planning-state-overlay-composition.md` | all | Sprint 08 architectural mirror — same composition pattern with different overlay content; if Sprint 08 has been folded into MapApp.swift, that integration is the reference |
| `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` | all | Public API surface — `CapsuleState.results(headline:)` shape (read-only) |
| `ios/LaneShadow/Views/Organisms/LSMapControls.swift` | all | Sprint 07 workbar API — results-state configuration parameters (read-only) |
| `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` | 1-116 | Map layer organism — `topOverlays:bottomOverlays:topBar:` shape, `GlassOverlaySlot` usage |
| `ios/LaneShadow/Views/Atoms/LSMap.swift` | 1-100 | Map atom — `LSMap(mode:camera:polylines:annotations:)` shape, identity preservation contract |
| `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` | all | Navigator message organism — pinned-message composition with attached cards |
| `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift` | all (or path equivalent) | Route attachment card molecule API |
| `.spec/design/system/views/route-results-screen/route-results-screen.html` | all | Visual contract — composition layout |
| `.spec/design/system/views/route-results-screen/README.md` | all | Variant matrix |
| `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` | all | RR-S09-DR-T01 output — canonical 7-variant matrix |
| `ios/LaneShadow/Sandbox/Stories/Templates/` | all | Existing story registration patterns; the new `MapAppRouteResultsStories.swift` lives here |
| `RULES.md` | "Design Rules › One View, Many States" | The doctrine this task implements |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Templates/MapApp.swift` (MODIFY — extend state-derived overlays for `.routeResults` case; compose capsule + message+cards in topOverlays; preserve identity contract)
- `ios/LaneShadow/Features/MapApp/RouteResults/RouteResultsOverlays.swift` (NEW — extracted overlay-builder helpers consumed by `MapApp.swift` for the `.routeResults` case; keeps `MapApp.swift` body small)
- `ios/LaneShadow/Sandbox/Stories/Templates/MapAppRouteResultsStories.swift` (NEW — canonical `templates.map-app.route-results-*` story IDs)
- `ios/LaneShadowTests/Templates/MapAppRouteResultsCompositionTests.swift` (NEW)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` — pre-doctrine sandbox-only fixture; do NOT extend; MAPAPP-UNIFY will remove
- `ios/LaneShadow/Features/RouteResults/` — do NOT create this directory; routeResults code lives under `ios/LaneShadow/Features/MapApp/RouteResults/`
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 atom
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` — Sprint 06 organism
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` — Sprint 07 component
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` — Sprint 07 component
- `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` — existing organism
- `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift` — existing molecule
- `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` — owned by RR-S09-IOS-T01 in this sprint
- `ios/LaneShadow/Features/MapApp/MapAppState.swift` — owned by MAPAPP-UNIFY; the `.routeResults` case is already declared
- `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift` — sandbox-only fixture; the sandbox story consumes it via `MapAppState` injection
- `android/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `.spec/design/system/views/route-results-screen/route-results-screen.html`
- `.spec/design/system/views/route-results-screen/README.md`
- `.spec/design/system/molecules/context-capsule/README.md`
- `.spec/design/system/refs/route-results-screen/default--best-pre-selected.light.png` (S01)
- `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` (RR-S09-DR-T01 output)
- `ios/LaneShadow/Views/Templates/MapApp.swift` + `ios/LaneShadow/Features/MapApp/MapAppState.swift` (foundation)

**Interaction Notes:** No new gestures introduced by this task. Card-tap, dismiss, refine submit are wired in RR-S09-IOS-T03 / T04. The composition only exposes binding-ready surfaces (callback hooks routed through `MapAppViewModel` intent methods); downstream tasks attach behaviors. Entry to `.routeResults` is via `MapAppState` mutation only (never a NavigationStack push).

**Pattern:** `IdleScreen.swift` (Sprint 06) overlay-slot pattern that `MapApp.swift` already follows for `.idle`. The `.routeResults` branch reuses the same pattern: state-derived `topOverlays`/`bottomOverlays` arrays returning `GlassOverlaySlot` instances. Keep map identity, swap overlay composition, bind to ViewModel published properties only.

**Pattern Source:** `ios/LaneShadow/Views/Templates/MapApp.swift` (Sprint 08 cycle 1, commit `bc0a5976b`) + `ios/LaneShadow/Views/Templates/IdleScreen.swift` (Sprint 06)

**Anti-Pattern:** Creating `RouteResultsScreen.swift` / `RouteResultsScreenContainer.swift` as siblings; wrapping `LSMap` in a new `RouteResultsMapHost.swift`; rendering capsule + message+cards in the same `GlassOverlaySlot` (must be two slots); inlining headline strings (must read off `mapAppViewModel.navigatorHeadline`); rendering polylines from this task; consuming `RouteResultsMockProvider` in the live `MapApp` path; pushing a NavigationStack destination on state entry.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_topOverlay_capsuleAboveMessageWithCards` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_capsule_bindsViewModelHeadline` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_cards_renderWithViewModelData` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_mapControls_resultsConfiguration` |
| AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_mapHost_identityPreservedAcrossPlanningToResults` |
| AC-6 | `scripts/tokens/enforce-native-compliance.sh` (exit 0); grep returns 0 |
| AC-7 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_sandboxStories_registered` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Views/Templates/MapApp.swift ios/LaneShadow/Features/MapApp/ ios/LaneShadow/Sandbox/Stories/Templates/MapAppRouteResultsStories.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** SwiftUI composition task on the canonical `MapApp.swift` persistent host, extracting per-state overlay helpers under `Features/MapApp/RouteResults/` and registering sandbox stories under `Sandbox/Stories/Templates/`. Consumes existing molecules/organisms via published APIs. No Mapbox internals, no Convex schema, no Compose. Reviewer: `swift-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md` § State-Driven Views (Persistent Host) + §"@Bindable", small `body`, subview extraction
- `brain/docs/mobile-architecture/testing-strategy.md` (view-level tests)
- `RULES.md` § Design Rules › One View, Many States, §"Cross-Platform Component Parity", §"Design Review Pipeline — View Snapshot Testing", §"Accessibility Standards iOS"

## Dependencies

**Depends on:**
- RR-S09-DR-T01 (canonical variant matrix in VARIANTS.md + `templates.map-app.route-results-*` story ID convention)
- RR-S09-IOS-T01 (consumes extended `MapAppViewModel` published properties)
- MAPAPP-UNIFY (#1361) Sprint 08 cycle 1 (provides `MapApp.swift` + `MapAppState.swift` foundation)

**Blocks:**
- RR-S09-IOS-T03 (polyline rendering binds inside this composition)
- RR-S09-IOS-T04 (chat-refine + dismiss/recall wires the composition's callback hooks)
- RR-S09-IOS-T05 (capture tests target the new `templates.map-app.route-results-*` sandbox story IDs)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"When state == .routeResults, MapApp's topOverlays has 2 GlassOverlaySlots in order: LSContextCapsule(.results) then LSNavigatorMessage with 3 attached LSRouteAttachmentCard molecules","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_topOverlay_capsuleAboveMessageWithCards","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"LSContextCapsule receives state .results(headline: mapAppViewModel.navigatorHeadline) verbatim when state == .routeResults","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_capsule_bindsViewModelHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Three LSRouteAttachmentCard instances render bound to mapAppViewModel.cards[0..2] with mapapp-routeresults-card-{0,1,2} ids","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_cards_renderWithViewModelData","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"LSMapControls renders in results state configuration with id mapapp-routeresults-controls","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_mapControls_resultsConfiguration","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Persistent-host invariant: LSMap identity preserved across .planning → .routeResults transition (no remount); MapApp itself does not remount","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_mapHost_identityPreservedAcrossPlanningToResults","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Token compliance script exits 0; zero hex/RGB/numeric font/hardcoded spacing in modified files","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Sandbox stories registered with canonical IDs templates.map-app.route-results-{variant}-{theme} per VARIANTS.md","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_sandboxStories_registered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"topOverlays ordered for .routeResults: capsule first, message+cards second","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_topOverlay_capsuleAboveMessageWithCards","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Capsule receives mapAppViewModel.navigatorHeadline verbatim","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_capsule_bindsViewModelHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Three LSRouteAttachmentCard instances with mapAppViewModel data and correct ids","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_cards_renderWithViewModelData","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"LSMapControls results configuration test passes","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_mapControls_resultsConfiguration","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"LSMap identity preserved across .planning → .routeResults transition","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_mapHost_identityPreservedAcrossPlanningToResults","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Token compliance returns zero violations in modified files","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Sandbox stories registered with canonical templates.map-app.route-results-* IDs","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsCompositionTests/test_routeResults_sandboxStories_registered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Build + swiftlint clean across modified files","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Views/Templates/MapApp.swift ios/LaneShadow/Features/MapApp/ ios/LaneShadow/Sandbox/Stories/Templates/MapAppRouteResultsStories.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
