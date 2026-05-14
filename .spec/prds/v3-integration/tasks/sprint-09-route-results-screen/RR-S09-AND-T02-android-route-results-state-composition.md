# RR-S09-AND-T02 — Android route-results Compose composition on persistent map host

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z

> **Task ID:** RR-S09-AND-T02
> **Sprint:** [Sprint 09 — Map View · Route Results State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 300 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** XL
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03, UC-FID-01, Sprint 09

## Background

Android parity for RR-S09-IOS-T02. Replace `RouteResultsRoute.kt`'s scaffold-only path with the live composition: `LSContextCapsule(state = ContextCapsuleState.Results)` + `LSNavigatorMessage` with three `LSRouteAttachmentCard` molecules in the `LSMapHost.topOverlays` slot. Reuse Sprint 06 `LSMapHost`. Configure Sprint 07 `LSMapControls` for results state. Preserve `LSMapHost` identity across planning→results transition.

## Critical Constraints

**MUST:**
- MUST update `RouteResultsRoute.kt` (and create `RouteResultsScreen.kt` Composable if not present) to consume `RouteResultsViewModel` (RR-S09-AND-T01) state
- MUST compose `LSContextCapsule(state = ContextCapsuleState.Results(headline = state.navigatorHeadline))` above `LSNavigatorMessage` with three `LSRouteAttachmentCard` molecules in `LSMapHost.topOverlays`
- MUST reuse `LSMapHost` (Sprint 06); the Mapbox view identity MUST be preserved across planning→results transition (assertable via Compose semantics or a remember-key invariance test)
- MUST configure Sprint 07 `LSMapControls` for results state in the right-edge slot
- MUST add accessibility identifiers (semantics testTags) `routeresultsscreen`, `routeresultsscreen-map`, `routeresultsscreen-context-capsule`, `routeresultsscreen-navigator-message`, `routeresultsscreen-card-{0,1,2}`, `routeresultsscreen-controls`, `routeresultsscreen-chat-input` mirroring the iOS canonical identifiers
- MUST add sandbox stories in `android/app/src/debug/.../sandbox/stories/templates/RouteResultsScreenStories.kt` with canonical IDs `templates.route-results-screen.{variant}-{theme}` per VARIANTS.md
- MUST add Compose UI tests in `android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsScreenTest.kt` (Robolectric or Paparazzi) covering composition + ID parity + map identity

**NEVER:**
- NEVER modify `LSMapHost.kt`, `LSContextCapsule.kt`, `LSMapControls.kt`, `LSNavigatorMessage.kt`, `LSRouteAttachmentCard.kt` — all consumed write-prohibited
- NEVER re-implement the Mapbox view as a sibling Composable; reuse `LSMapHost`
- NEVER hardcode hex / numeric font / hardcoded dp values; resolve via `LaneShadowTheme`
- NEVER render polylines in this task (RR-S09-AND-T03 owns)
- NEVER wire chat-refine submit or dismiss/recall in this task (RR-S09-AND-T04 owns)

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/android-principles.md` §"Compose composition"
- STRICTLY follow `RULES.md` §"Cross-Platform Component Parity" — Android sandbox story IDs MUST match iOS canonical IDs from VARIANTS.md
- STRICTLY pass `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin`

## Specification

**Objective:** Compose the route-results state on the persistent `LSMapHost`: top-overlay slot renders `LSContextCapsule(--results)` above `LSNavigatorMessage` with three `LSRouteAttachmentCard` molecules; right-edge `LSMapControls` reconfigures for results state; map host identity preserved across planning→results. View-model wired via Hilt.

**Success State:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest` exits 0; opening `templates.route-results-screen.*` stories in the Android sandbox renders the new composition for each variant in light + dark; `./gradlew :app:compileDebugKotlin && :app:detekt` exits 0.

## Acceptance Criteria

### AC-1 — Top-overlay composition: capsule above, message+cards below

**GIVEN** `RouteResultsScreen` rendered with `RouteResultsUiState.Loaded` containing 3 polylines+cards
**WHEN** the Compose tree is queried via semantics
**THEN** `LSMapHost.topOverlays` contains in order: `LSContextCapsule(state = Results(headline))`, then `LSNavigatorMessage` wrapping a `Row` of three `LSRouteAttachmentCard` Composables
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.topOverlay_capsuleAboveMessageWithCards`

### AC-2 — LSContextCapsule binds to state.navigatorHeadline

**GIVEN** `state.navigatorHeadline == "Three rides scored for you"`
**WHEN** the screen renders
**THEN** the `LSContextCapsule`'s `state` is `Results(headline = "Three rides scored for you")` verbatim
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.capsule_bindsViewModelHeadline`

### AC-3 — Three LSRouteAttachmentCard Composables render with state.cards

**GIVEN** `state.cards.size == 3` with distinct content
**WHEN** the screen renders
**THEN** semantics tree has exactly three Composables with testTag matching `routeresultsscreen-card-{0,1,2}` bound to `state.cards[0..2]`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.cards_renderWithViewModelData`

### AC-4 — LSMapControls renders in results configuration

**GIVEN** results state
**WHEN** Compose tree is queried
**THEN** `LSMapControls` Composable is present in `LSMapHost.rightEdgeOverlay` (or equivalent slot), configured for results state per Sprint 07 spec, with testTag `routeresultsscreen-controls`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.mapControls_resultsConfiguration`

### AC-5 — Map host identity preserved across planning→results transition

**GIVEN** `LSMapHost` was mounted under the planning composition
**WHEN** the app transitions to results
**THEN** the Composable's `remember` key for `LSMapHost` is unchanged; Mapbox view instance identity is preserved (verified via a stable-key remember assertion)
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.mapHost_identityPreservedAcrossPlanningToResults`

### AC-6 — Sandbox stories registered with canonical IDs

**GIVEN** `RouteResultsScreenStories.all` is included in `LaneShadowSandboxEntry.templates`
**WHEN** the sandbox app builds
**THEN** stories exist with IDs `templates.route-results-screen.{default-best-pre-selected,alt1-tapped-sage-promoted,default-dark,refining,two-candidates,weather-divergent,message-dismissed}-{light,dark}` matching VARIANTS.md
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.sandboxStories_registered`

### AC-7 — Detekt + compile clean

**GIVEN** modified Kotlin files
**WHEN** `./gradlew :app:detekt` and `./gradlew :app:compileDebugKotlin` run
**THEN** both exit 0
**Verify:** `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | topOverlays order: capsule, message+cards | AC-1 | `./gradlew :app:testDebugUnitTest --tests ...topOverlay_capsuleAboveMessageWithCards` | happy_path |
| TC-2 | Capsule receives Results(headline) verbatim | AC-2 | `./gradlew :app:testDebugUnitTest --tests ...capsule_bindsViewModelHeadline` | happy_path |
| TC-3 | Three card Composables with parity testTags | AC-3 | `./gradlew :app:testDebugUnitTest --tests ...cards_renderWithViewModelData` | happy_path |
| TC-4 | LSMapControls results configuration with testTag | AC-4 | `./gradlew :app:testDebugUnitTest --tests ...mapControls_resultsConfiguration` | happy_path |
| TC-5 | LSMapHost identity preserved across transition | AC-5 | `./gradlew :app:testDebugUnitTest --tests ...mapHost_identityPreservedAcrossPlanningToResults` | edge |
| TC-6 | Sandbox stories registered with canonical IDs | AC-6 | `./gradlew :app:testDebugUnitTest --tests ...sandboxStories_registered` | happy_path |
| TC-7 | Detekt + compile clean | AC-7 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRoute.kt` | all | [PRIMARY PATTERN] Existing route — extend, don't rewrite |
| `android/app/src/main/java/com/laneshadow/ui/components/organisms/LSMapHost.kt` (path may differ) | all | Map host shape; topOverlays + rightEdgeOverlay slots |
| `android/app/src/main/java/com/laneshadow/ui/components/molecules/LSContextCapsule.kt` | all | Public API; `ContextCapsuleState.Results` |
| `android/app/src/main/java/com/laneshadow/ui/components/organisms/LSMapControls.kt` | all | Sprint 07 controls workbar API |
| `android/app/src/main/java/com/laneshadow/ui/components/organisms/LSNavigatorMessage.kt` | all | Navigator message organism with attached cards |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T02-android-planning-state-overlay-composition.md` | all | Sprint 08 sibling task pattern |
| `.spec/design/system/views/route-results-screen/route-results-screen.html` | all | Visual contract |
| `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` | all | Canonical variant matrix |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRoute.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsScreen.kt` (NEW or MODIFY)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/templates/RouteResultsScreenStories.kt` (NEW or MODIFY — canonical IDs)
- `android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsScreenTest.kt` (NEW)

**Write-Prohibited:**
- `LSMapHost.kt`, `LSContextCapsule.kt`, `LSMapControls.kt`, `LSNavigatorMessage.kt`, `LSRouteAttachmentCard.kt` — write-prohibited consumed components
- `RouteResultsViewModel.kt` — RR-S09-AND-T01 ownership
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope

## Design

**References:**
- `.spec/design/system/views/route-results-screen/route-results-screen.html`
- `.spec/design/system/views/route-results-screen/README.md`
- `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md`
- Sprint 08 PLAN-S08-AND-T02 (composition pattern)

**Interaction Notes:** No new gestures in this task. Card-tap, dismiss, refine submit wire in RR-S09-AND-T03 / T04. Sandbox stories must mirror canonical IDs.

**Pattern:** Sprint 08 `PlanningRoute.kt` / `PlanningScreen.kt` composition (PLAN-S08-AND-T02). Same approach: keep `LSMapHost`, swap overlay composition, bind to view-model state.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T02-android-planning-state-overlay-composition.md`

**Anti-Pattern:** Re-rendering `LSMapHost`; modifying consumed components; hardcoding dp / hex; rendering polylines from this task.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.topOverlay_capsuleAboveMessageWithCards` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.capsule_bindsViewModelHeadline` |
| AC-3 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.cards_renderWithViewModelData` |
| AC-4 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.mapControls_resultsConfiguration` |
| AC-5 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.mapHost_identityPreservedAcrossPlanningToResults` |
| AC-6 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.sandboxStories_registered` |
| AC-7 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Compose composition + Hilt-injected ViewModel binding + sandbox story registration. Matches kotlin-implementer mandate. Reviewer: `kotlin-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md` (Compose composition; `hiltViewModel()`)
- `brain/docs/mobile-architecture/testing-strategy.md` (Compose UI tests, Robolectric)
- `RULES.md` §"Cross-Platform Component Parity", §"Accessibility Standards Android"

## Dependencies

**Depends on:**
- RR-S09-DR-T01 (VARIANTS.md canonical matrix)
- RR-S09-AND-T01 (view-model surface)

**Blocks:**
- RR-S09-AND-T03 (polylines render inside this composition)
- RR-S09-AND-T04 (chat-refine + dismiss/recall wire the callback hooks)
- RR-S09-AND-T05 (capture tests target the new sandbox story IDs)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"topOverlays contains LSContextCapsule(Results) then LSNavigatorMessage with 3 LSRouteAttachmentCard composables","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.topOverlay_capsuleAboveMessageWithCards","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"LSContextCapsule receives state Results(headline=state.navigatorHeadline) verbatim","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.capsule_bindsViewModelHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Three LSRouteAttachmentCard composables with testTag routeresultsscreen-card-{0..2}","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.cards_renderWithViewModelData","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"LSMapControls in results configuration with testTag routeresultsscreen-controls","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.mapControls_resultsConfiguration","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"LSMapHost identity preserved across planning→results transition","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.mapHost_identityPreservedAcrossPlanningToResults","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Sandbox stories registered with canonical IDs templates.route-results-screen.{variant}-{theme}","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.sandboxStories_registered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Detekt + compileDebugKotlin clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"topOverlay order test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.topOverlay_capsuleAboveMessageWithCards","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Capsule binding verbatim test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.capsule_bindsViewModelHeadline","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Three cards with parity testTags","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.cards_renderWithViewModelData","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"LSMapControls results testTag","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.mapControls_resultsConfiguration","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Map host identity preserved","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.mapHost_identityPreservedAcrossPlanningToResults","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Stories canonical IDs","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsScreenTest.sandboxStories_registered","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Detekt + compile clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
