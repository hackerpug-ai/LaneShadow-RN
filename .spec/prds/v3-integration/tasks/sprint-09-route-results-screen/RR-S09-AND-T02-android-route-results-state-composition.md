# RR-S09-AND-T02 — Android route-results Compose composition on MapApp (persistent host)

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z (retrofitted for MAPAPP-DOCTRINE 2026-05-14)

> **Task ID:** RR-S09-AND-T02
> **Sprint:** [Sprint 09 — MapApp · Route Results State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 300 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** XL
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03, UC-FID-01, Sprint 09

## Background

**Doctrine:** Per `RULES.md` § Design Rules › One View, Many States, the Android route-results experience is a STATE composition inside the single `MapApp.kt` Composable (the canonical persistent host from MAPAPP-UNIFY Android phase), not a sibling `RouteResultsRoute.kt`. Android parity for RR-S09-IOS-T02: extend `MapApp.kt` so when sealed `MapAppState` is `RouteResults(...)` its top-overlay slot composes `LSContextCapsule(state = ContextCapsuleState.Results)` + `LSNavigatorMessage` with three `LSRouteAttachmentCard` molecules. Reuse Sprint 06 `LSMapHost` already mounted by `MapApp.kt`. Configure Sprint 07 `LSMapControls` for results state. Preserve `LSMapHost` identity across Planning→RouteResults transition.

The legacy `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRoute.kt` and `RouteResultsScreen.kt` (or equivalent scaffold) are pre-doctrine sandbox-only fixtures and are NOT extended here. MAPAPP-UNIFY Android phase will remove them.

## Critical Constraints

**MUST:**
- MUST extend `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` (single Composable + sealed `MapAppState`) so when state is `RouteResults(...)` its `topOverlays` slot composes the capsule + navigator-message+cards content
- MUST consume the extended `MapAppViewModel` (RR-S09-AND-T01) via `hiltViewModel()` already injected by `MapApp.kt`
- MUST compose `LSContextCapsule(state = ContextCapsuleState.Results(headline = state.routeResults.navigatorHeadline))` above `LSNavigatorMessage` with three `LSRouteAttachmentCard` molecules in `LSMapHost.topOverlays`
- MUST reuse `LSMapHost` (Sprint 06) already mounted by `MapApp.kt`; the Mapbox view identity MUST be preserved across Planning→RouteResults transition (assertable via Compose semantics or a remember-key invariance test); no second `LSMapHost`, no remount
- MUST configure Sprint 07 `LSMapControls` for results state in the right-edge slot
- MUST add accessibility identifiers (semantics testTags) `mapapp-routeresults-context-capsule`, `mapapp-routeresults-navigator-message`, `mapapp-routeresults-card-{0,1,2}`, `mapapp-routeresults-controls`, `mapapp-routeresults-chat-input`, `mapapp-routeresults-recall-chip` mirroring the iOS canonical identifiers per RR-S09-IOS-T02 / T04
- MUST add sandbox stories in `android/app/src/debug/.../sandbox/stories/templates/MapAppRouteResultsStories.kt` with canonical IDs `templates.map-app.route-results-{variant}-{theme}` per VARIANTS.md
- MUST add Compose UI tests in `android/app/src/test/java/com/laneshadow/ui/mapapp/MapAppRouteResultsCompositionTest.kt` (Robolectric or Paparazzi) covering composition + ID parity + map identity preservation across `Planning → RouteResults`

**NEVER:**
- NEVER create `RouteResultsScreen.kt` / `RouteResultsRoute.kt` as siblings — the RouteResults state lives inside `MapApp.kt`
- NEVER extend the legacy `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRoute.kt` or `RouteResultsScreen.kt`; MAPAPP-UNIFY will remove
- NEVER modify `LSMapHost.kt`, `LSContextCapsule.kt`, `LSMapControls.kt`, `LSNavigatorMessage.kt`, `LSRouteAttachmentCard.kt` — all consumed write-prohibited
- NEVER mount a second `LSMapHost` instance; reuse the one MapApp already mounts
- NEVER hardcode hex / numeric font / hardcoded dp values; resolve via `LaneShadowTheme`
- NEVER render polylines in this task (RR-S09-AND-T03 owns)
- NEVER wire chat-refine submit or dismiss/recall in this task (RR-S09-AND-T04 owns)
- NEVER use Jetpack Navigation to "navigate" to RouteResults — entry is a `MapAppState` mutation only
- NEVER place this code under `ui/routeresults/` — it lives under `ui/mapapp/` (sub-package `ui/mapapp/routeresults/` for helpers)

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/android-principles.md` § State-Driven Views (Persistent Host) + § "Compose composition"
- STRICTLY follow `RULES.md` §"Cross-Platform Component Parity" — Android sandbox story IDs MUST match iOS canonical IDs `templates.map-app.route-results-{variant}-{theme}` from VARIANTS.md
- STRICTLY pass `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin`

## Specification

**Objective:** Extend `MapApp.kt` so when sealed `MapAppState` is `RouteResults(...)` it composes the route-results experience on the persistent `LSMapHost`: top-overlay slot 1 renders `LSContextCapsule(--results)`; top-overlay slot 2 renders `LSNavigatorMessage` with three `LSRouteAttachmentCard` molecules; right-edge `LSMapControls` reconfigures for results state; `LSMapHost` identity preserved across Planning→RouteResults. View-model wired via `hiltViewModel()` on `MapApp.kt`.

**Success State:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest` exits 0; opening `templates.map-app.route-results-*` stories in the Android sandbox renders the new composition for each variant in light + dark; `./gradlew :app:compileDebugKotlin && :app:detekt` exits 0.

## Acceptance Criteria

### AC-1 — When state == RouteResults, top-overlay composition is capsule then message+cards

**GIVEN** `MapApp.kt` rendered with `MapAppState == RouteResults` containing 3 polylines+cards
**WHEN** the Compose tree is queried via semantics
**THEN** `LSMapHost.topOverlays` (as produced by MapApp's state-derived overlay branch for the `RouteResults` case) contains in order: `LSContextCapsule(state = Results(headline))`, then `LSNavigatorMessage` wrapping a `Row` of three `LSRouteAttachmentCard` Composables
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.topOverlay_capsuleAboveMessageWithCards`

### AC-2 — LSContextCapsule binds to state.routeResults.navigatorHeadline

**GIVEN** `state.routeResults.navigatorHeadline == "Three rides scored for you"`
**WHEN** MapApp renders
**THEN** the `LSContextCapsule`'s `state` is `Results(headline = "Three rides scored for you")` verbatim
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.capsule_bindsViewModelHeadline`

### AC-3 — Three LSRouteAttachmentCard Composables render with state.routeResults.cards

**GIVEN** `state.routeResults.cards.size == 3` with distinct content
**WHEN** MapApp renders
**THEN** semantics tree has exactly three Composables with testTag matching `mapapp-routeresults-card-{0,1,2}` bound to `state.routeResults.cards[0..2]`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.cards_renderWithViewModelData`

### AC-4 — LSMapControls renders in results configuration

**GIVEN** `MapAppState == RouteResults`
**WHEN** Compose tree is queried
**THEN** `LSMapControls` Composable is present in `LSMapHost.rightEdgeOverlay` (or equivalent slot owned by MapApp), configured for results state per Sprint 07 spec, with testTag `mapapp-routeresults-controls`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.mapControls_resultsConfiguration`

### AC-5 — Persistent-host invariant: LSMapHost identity preserved across Planning → RouteResults transition

**GIVEN** `LSMapHost` was mounted under MapApp.kt while state was `Planning`
**WHEN** `MapAppState` mutates to `RouteResults`
**THEN** the Composable's `remember` key for `LSMapHost` is unchanged; Mapbox view instance identity is preserved (verified via a stable-key remember assertion); MapApp itself does not remount
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.mapHost_identityPreservedAcrossPlanningToRouteResults`

### AC-6 — Sandbox stories registered with canonical IDs templates.map-app.route-results-*

**GIVEN** `MapAppRouteResultsStories.all` is included in `LaneShadowSandboxEntry.templates`
**WHEN** the sandbox app builds
**THEN** stories exist with IDs `templates.map-app.route-results-{default-best-pre-selected,alt1-tapped-sage-promoted,default-dark,refining,two-candidates,weather-divergent,message-dismissed}-{light,dark}` matching VARIANTS.md; each story renders `MapApp.kt` with `MapAppState.RouteResults` injected via a story seed
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.sandboxStories_registered`

### AC-7 — Detekt + compile clean

**GIVEN** modified Kotlin files under `ui/mapapp/`
**WHEN** `./gradlew :app:detekt` and `./gradlew :app:compileDebugKotlin` run
**THEN** both exit 0
**Verify:** `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | topOverlays order for RouteResults: capsule, message+cards | AC-1 | `./gradlew :app:testDebugUnitTest --tests ...topOverlay_capsuleAboveMessageWithCards` | happy_path |
| TC-2 | Capsule receives Results(headline) verbatim | AC-2 | `./gradlew :app:testDebugUnitTest --tests ...capsule_bindsViewModelHeadline` | happy_path |
| TC-3 | Three card Composables with parity testTags `mapapp-routeresults-card-*` | AC-3 | `./gradlew :app:testDebugUnitTest --tests ...cards_renderWithViewModelData` | happy_path |
| TC-4 | LSMapControls results configuration with testTag `mapapp-routeresults-controls` | AC-4 | `./gradlew :app:testDebugUnitTest --tests ...mapControls_resultsConfiguration` | happy_path |
| TC-5 | LSMapHost identity preserved across Planning→RouteResults transition | AC-5 | `./gradlew :app:testDebugUnitTest --tests ...mapHost_identityPreservedAcrossPlanningToRouteResults` | edge |
| TC-6 | Sandbox stories registered with canonical `templates.map-app.route-results-*` IDs | AC-6 | `./gradlew :app:testDebugUnitTest --tests ...sandboxStories_registered` | happy_path |
| TC-7 | Detekt + compile clean | AC-7 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` | all (from MAPAPP-UNIFY Android phase) | [PRIMARY ARCHITECTURE] Persistent-host Composable — extend its state-derived overlays for `RouteResults` branch |
| `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppState.kt` | all | [PRIMARY ARCHITECTURE] Sealed state with `RouteResults` branch |
| `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppViewModel.kt` | extended by RR-S09-AND-T01 | View-model published surface |
| `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRoute.kt` | all | [LEGACY — read for shape only] Pre-doctrine route — understand composition pattern; do NOT extend |
| `android/app/src/main/java/com/laneshadow/ui/components/organisms/LSMapHost.kt` (path may differ) | all | Map host shape; topOverlays + rightEdgeOverlay slots |
| `android/app/src/main/java/com/laneshadow/ui/components/molecules/LSContextCapsule.kt` | all | Public API; `ContextCapsuleState.Results` |
| `android/app/src/main/java/com/laneshadow/ui/components/organisms/LSMapControls.kt` | all | Sprint 07 controls workbar API |
| `android/app/src/main/java/com/laneshadow/ui/components/organisms/LSNavigatorMessage.kt` | all | Navigator message organism with attached cards |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T02-android-planning-state-overlay-composition.md` | all | Sprint 08 sibling task — composition pattern inside MapApp.kt |
| `.spec/design/system/views/mapapp/route-results/route-results.html` | all | Visual contract |
| `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` | all | Canonical variant matrix + `templates.map-app.route-results-*` story ID convention |
| `RULES.md` | "Design Rules › One View, Many States" | The doctrine this task implements |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` (MODIFY — extend state-derived overlays for `RouteResults` branch)
- `android/app/src/main/java/com/laneshadow/ui/mapapp/routeresults/RouteResultsOverlays.kt` (NEW — extracted overlay-builder helpers consumed by `MapApp.kt` for the `RouteResults` case)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/MapAppRouteResultsStories.kt` (NEW — canonical IDs `templates.map-app.route-results-*`)
- `android/app/src/test/java/com/laneshadow/ui/mapapp/MapAppRouteResultsCompositionTest.kt` (NEW)

**Write-Prohibited:**
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRoute.kt` — pre-doctrine sandbox-only fixture
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsScreen.kt` (if exists) — pre-doctrine sandbox-only fixture
- `LSMapHost.kt`, `LSContextCapsule.kt`, `LSMapControls.kt`, `LSNavigatorMessage.kt`, `LSRouteAttachmentCard.kt` — write-prohibited consumed components
- `MapAppViewModel.kt` — RR-S09-AND-T01 ownership in this sprint
- `MapAppState.kt` — MAPAPP-UNIFY ownership (coordinate any structural changes)
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope

## Design

**References:**
- `.spec/design/system/views/mapapp/route-results/route-results.html`
- `.spec/design/system/views/mapapp/route-results/README.md`
- `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md`
- Sprint 08 PLAN-S08-AND-T02 (composition pattern inside MapApp.kt)
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` (foundation)

**Interaction Notes:** No new gestures in this task. Card-tap, dismiss, refine submit wire in RR-S09-AND-T03 / T04. Sandbox stories must mirror canonical IDs `templates.map-app.route-results-*`.

**Pattern:** Sprint 08 PLAN-S08-AND-T02 — keep `LSMapHost`, swap overlay composition for the `RouteResults` sealed-state branch, bind to view-model state.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T02-android-planning-state-overlay-composition.md`

**Anti-Pattern:** Creating `RouteResultsRoute.kt` / `RouteResultsScreen.kt` as siblings; re-rendering `LSMapHost`; using Jetpack Navigation to enter RouteResults; modifying consumed components; hardcoding dp / hex; rendering polylines from this task.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.topOverlay_capsuleAboveMessageWithCards` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.capsule_bindsViewModelHeadline` |
| AC-3 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.cards_renderWithViewModelData` |
| AC-4 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.mapControls_resultsConfiguration` |
| AC-5 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.mapHost_identityPreservedAcrossPlanningToRouteResults` |
| AC-6 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.sandboxStories_registered` |
| AC-7 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Compose composition + Hilt-injected ViewModel binding + sandbox story registration under `ui/mapapp/`. Matches kotlin-implementer mandate. Reviewer: `kotlin-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md` § State-Driven Views (Persistent Host) + Compose composition; `hiltViewModel()`
- `brain/docs/mobile-architecture/testing-strategy.md` (Compose UI tests, Robolectric)
- `RULES.md` § Design Rules › One View, Many States, §"Cross-Platform Component Parity", §"Accessibility Standards Android"

## Dependencies

**Depends on:**
- RR-S09-DR-T01 (VARIANTS.md canonical matrix + `templates.map-app.route-results-*` story ID convention)
- RR-S09-AND-T01 (extended `MapAppViewModel` surface)
- MAPAPP-UNIFY Android phase (provides `MapApp.kt` + `MapAppState.kt` foundation)

**Blocks:**
- RR-S09-AND-T03 (polylines render inside MapApp's `RouteResults` overlay branch)
- RR-S09-AND-T04 (chat-refine + dismiss/recall wire the callback hooks)
- RR-S09-AND-T05 (capture tests target the new sandbox story IDs)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"When state == RouteResults, MapApp's topOverlays contains LSContextCapsule(Results) then LSNavigatorMessage with 3 LSRouteAttachmentCard composables","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.topOverlay_capsuleAboveMessageWithCards","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"LSContextCapsule receives state Results(headline=state.routeResults.navigatorHeadline) verbatim","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.capsule_bindsViewModelHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Three LSRouteAttachmentCard composables with testTag mapapp-routeresults-card-{0..2}","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.cards_renderWithViewModelData","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"LSMapControls in results configuration with testTag mapapp-routeresults-controls","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.mapControls_resultsConfiguration","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Persistent-host invariant: LSMapHost identity preserved across Planning → RouteResults transition; MapApp does not remount","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.mapHost_identityPreservedAcrossPlanningToRouteResults","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Sandbox stories registered with canonical IDs templates.map-app.route-results-{variant}-{theme}","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.sandboxStories_registered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Detekt + compileDebugKotlin clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"topOverlay order test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.topOverlay_capsuleAboveMessageWithCards","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Capsule binding verbatim test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.capsule_bindsViewModelHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Three cards with parity testTags","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.cards_renderWithViewModelData","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"LSMapControls results testTag","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.mapControls_resultsConfiguration","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"LSMapHost identity preserved","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.mapHost_identityPreservedAcrossPlanningToRouteResults","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Stories canonical IDs","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsCompositionTest.sandboxStories_registered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Detekt + compile clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
