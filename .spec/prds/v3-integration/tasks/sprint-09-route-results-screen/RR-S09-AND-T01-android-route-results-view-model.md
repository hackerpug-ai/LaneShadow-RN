# RR-S09-AND-T01 — Android MapAppViewModel RouteResults state extension: live Convex bindings

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z (retrofitted for MAPAPP-DOCTRINE 2026-05-14)

> **Task ID:** RR-S09-AND-T01
> **Sprint:** [Sprint 09 — MapApp · Route Results State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03, UC-CHAT-04, Sprint 09

## Background

**Doctrine:** Per `RULES.md` § Design Rules › One View, Many States, the Android route-results experience lives on `MapAppViewModel` + sealed `MapAppState.RouteResults(...)` — never a sibling `RouteResultsViewModel.kt`. Android parity for RR-S09-IOS-T01: extend the Android `MapAppViewModel` to handle the `RouteResults` branch of `MapAppState`.

**Android MapApp foundation:** The Android `MapApp.kt` Composable + `MapAppViewModel` + sealed `MapAppState` are landing as part of MAPAPP-UNIFY's Android phase (parallel to the iOS Sprint 08 cycle 1 work). This Sprint 09 task assumes that foundation is in place. If the Android `MapAppViewModel` does not exist yet at task pickup, dispatch coordinator MUST block on MAPAPP-UNIFY Android before starting this task. The pre-doctrine Android files at `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt`, `RouteResultsUiState.kt`, and `RouteResultsRoute.kt` are sandbox-only fixtures and are NOT extended here; MAPAPP-UNIFY will remove them.

Sprint 09 extends `MapAppViewModel` to (a) match the iOS view-model's intent surface (`selectAlt`, `refine`, `dismissMessage`, `recallMessage`, `isMessageDismissed`), (b) derive the `{best, alt1, alt2}` triple per RR-S09-CVX-T01's documented ordering, (c) emit per-variant polyline + card models with `LaneShadowTheme` Compose tokens, (d) emit a Convex-backed `WeatherBadgeModel` when route_enrichments status == "completed". The view-model's `state: StateFlow<MapAppState>` mutates to `MapAppState.RouteResults(...)` and back to `MapAppState.Planning(sessionId:)` on refine — never via Jetpack Navigation route changes.

## Critical Constraints

**MUST:**
- MUST extend the Android `MapAppViewModel` (Hilt-injected, owning the sealed `MapAppState` flow) with the RouteResults state handler; do NOT create a sibling `RouteResultsViewModel.kt`
- MUST keep `@HiltViewModel` constructor + `RouteRepository` injection (existing wiring on `MapAppViewModel`) — Hilt graph unchanged
- MUST bind `routePlans.getPlanById(routePlanId)` via the existing repository subscription when `MapAppState` transitions to `RouteResults(...)`; reuse existing flow combinators (do NOT roll a new subscription manager)
- MUST emit `MapAppState.RouteResults` with `polylines: List<PolylineData>`, `cards: List<RouteAttachmentCardModel>`, `selectedRouteId: String?`, `isMessageDismissed: Boolean` matching the iOS view-model's published surface — these may live on a `RouteResultsData` value class inside the sealed case
- MUST resolve per-variant tokens via `LaneShadowTheme.colors.route.{best,alt1,alt2}` (Compose `MaterialTheme.colorScheme` extension or equivalent project-specific theme accessor)
- MUST expose `fun selectAlt(id: String)`, `fun refine(prompt: String)`, `fun dismissMessage()`, `fun recallMessage()` intent functions on `MapAppViewModel`; `refine` reuses the active `sessionId` and **mutates `_state.value` to `MapAppState.Planning(sessionId)`** (do NOT emit a Jetpack Navigation event; do NOT mint a new sessionId)
- MUST add unit tests in `android/app/src/test/java/com/laneshadow/ui/mapapp/MapAppViewModelRouteResultsTest.kt` covering the same seven behavioral invariants as iOS T01 (subscription → 3 polylines, selectAlt idempotency, refine reuses sessionId + state mutates to Planning, dismiss/recall flag flip with zero Convex calls, weather badge from enrichments, two-candidates edge case, empty-options error state)
- MUST mirror canonical IDs from the iOS view-model — `RouteAttachmentCardModel.id`, polyline layer IDs, etc. — for cross-platform parity

**NEVER:**
- NEVER create `RouteResultsViewModel.kt` as a sibling — the RouteResults state belongs on `MapAppViewModel`
- NEVER extend the legacy `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt` or `RouteResultsUiState.kt`; those are pre-doctrine sandbox-only fixtures awaiting MAPAPP-UNIFY cleanup
- NEVER hardcode hex literals; use `LaneShadowTheme` token accessor
- NEVER persist `selectedRouteId` to Convex
- NEVER mint a new `sessionId` on refine
- NEVER emit a Jetpack Navigation event on refine; mutate `MapAppState` to `Planning` instead
- NEVER decode polylines in the view-model; delegate to the existing Kotlin decoder helper (`PolylineDecoder.decodeOrNull`)
- NEVER add a new repository method; the subscription helper already exists

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/android-principles.md` § State-Driven Views (Persistent Host) + § "ViewModel + StateFlow"
- STRICTLY pass `./gradlew :app:detekt` and `./gradlew :app:compileDebugKotlin` exit 0
- STRICTLY mirror the iOS view-model's intent surface signature-for-signature; deviations are a parity violation per RULES.md
- STRICTLY place new code under `android/app/src/main/java/com/laneshadow/ui/mapapp/routeresults/` (sub-package of `mapapp`), NOT under `ui/routeresults/`

## Specification

**Objective:** Extend `MapAppViewModel.kt` to expose the four RouteResults intent functions, derive the deterministic polyline+card triple with token-driven styling, surface `isMessageDismissed` and `selectedRouteId` on `MapAppState.RouteResults`, and add unit tests mirroring the iOS T01 coverage. Refine mutates `MapAppState` to `Planning` rather than emitting a navigation event.

**Success State:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest` exits 0; `./gradlew :app:compileDebugKotlin` exits 0; `./gradlew :app:detekt` exits 0; iOS twin (RR-S09-IOS-T01) and Android `MapAppViewModel` expose identical intent function signatures.

## Acceptance Criteria

### AC-1 — Subscription produces three PolylineData entries with correct tokens (in MapAppState.RouteResults)

**GIVEN** `MapAppState` transitions to `RouteResults(sessionId, routePlanId)` and repository delivers a plan with 3 options
**WHEN** the view-model state collects
**THEN** `(state as RouteResults).polylines.size == 3`; tokens match best/alt1/alt2 from `LaneShadowTheme.colors.route.*`; stroke widths + dash arrays match design-system constants
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.subscription_producesThreePolylinesWithTokens`

### AC-2 — selectAlt updates selectedRouteId; idempotent on same id

**GIVEN** initial `(state as RouteResults).selectedRouteId == "best-id"`
**WHEN** `viewModel.selectAlt("alt1-id")` is called twice
**THEN** first call updates; second call is no-op (no spurious state emissions)
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.selectAlt_updatesAndIsIdempotent`

### AC-3 — refine reuses sessionId; mutates MapAppState to Planning

**GIVEN** stub repository observer; `MapAppState == RouteResults(sessionId="sess-xyz", ...)`
**WHEN** `viewModel.refine("make it shorter")` is called
**THEN** stub records one call to `agent.sendMessage(sessionId="sess-xyz", message="make it shorter")` AND `viewModel.state.value == MapAppState.Planning(sessionId="sess-xyz")` (state mutation, NOT a Jetpack Navigation event)
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.refine_reusesSessionIdAndMutatesStateToPlanning`

### AC-4 — dismissMessage / recallMessage flip isMessageDismissed; no Convex call

**GIVEN** stub Convex repository
**WHEN** dismiss + recall sequence runs
**THEN** `(state as RouteResults).isMessageDismissed` transitions false→true→false; stub records zero Convex mutations
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.dismissAndRecall_flipsFlagWithNoConvexCall`

### AC-5 — Weather badge populates from enrichments completed status

**GIVEN** route_enrichments emit `{best: completed/clear, alt1: completed/rain, alt2: pending}`
**WHEN** cards derive
**THEN** `cards[0].weatherBadge == WeatherBadge.Clear`; `cards[1].weatherBadge == WeatherBadge.Rain`; `cards[2].weatherBadge == null`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.weatherBadge_populatesFromCompletedEnrichments`

### AC-6 — Two-options edge case yields 2 polylines + 2 cards

**GIVEN** plan with 2 options
**WHEN** subscription delivers
**THEN** `(state as RouteResults).polylines.size == 2`, `cards.size == 2`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.twoCandidates_yieldsTwoEntries`

### AC-7 — Empty options surfaces error state (inside RouteResults branch)

**GIVEN** plan with `options == emptyList()`
**WHEN** subscription delivers
**THEN** `state` mutates to a terminal error overlay representation inside `RouteResults` (e.g., `RouteResults(error = RouteResultsError.NoOptions(...))`) — NOT to a separate Error route via Jetpack Navigation
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.emptyOptions_surfacesErrorState`

### AC-8 — Detekt + compile clean

**GIVEN** the modified view-model files under `ui/mapapp/`
**WHEN** `./gradlew :app:detekt` and `./gradlew :app:compileDebugKotlin` run
**THEN** both exit 0
**Verify:** `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Three options → three PolylineData with correct tokens in RouteResults state | AC-1 | `./gradlew :app:testDebugUnitTest --tests ...subscription_producesThreePolylinesWithTokens` | happy_path |
| TC-2 | selectAlt idempotency | AC-2 | `./gradlew :app:testDebugUnitTest --tests ...selectAlt_updatesAndIsIdempotent` | happy_path |
| TC-3 | refine reuses sessionId + mutates MapAppState to Planning (no nav event) | AC-3 | `./gradlew :app:testDebugUnitTest --tests ...refine_reusesSessionIdAndMutatesStateToPlanning` | happy_path |
| TC-4 | dismiss/recall flag flip without Convex | AC-4 | `./gradlew :app:testDebugUnitTest --tests ...dismissAndRecall_flipsFlagWithNoConvexCall` | happy_path |
| TC-5 | weatherBadge from completed enrichments | AC-5 | `./gradlew :app:testDebugUnitTest --tests ...weatherBadge_populatesFromCompletedEnrichments` | edge |
| TC-6 | Two-options edge | AC-6 | `./gradlew :app:testDebugUnitTest --tests ...twoCandidates_yieldsTwoEntries` | edge |
| TC-7 | Empty options error state inside RouteResults branch | AC-7 | `./gradlew :app:testDebugUnitTest --tests ...emptyOptions_surfacesErrorState` | error |
| TC-8 | Detekt + compile clean | AC-8 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppViewModel.kt` | all (from MAPAPP-UNIFY Android phase) | [PRIMARY ARCHITECTURE] Hilt-injected view-model owning sealed `MapAppState` flow — extend with RouteResults handler |
| `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppState.kt` | all (from MAPAPP-UNIFY Android phase) | [PRIMARY ARCHITECTURE] Sealed `MapAppState` — `RouteResults(sessionId, routePlanId, ...)` is the branch this task populates |
| `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` | all (from MAPAPP-UNIFY Android phase) | Persistent host — understand how state-derived overlays consume view-model data |
| `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt` | all | [LEGACY — read for shape only] Pre-doctrine sandbox-only view-model; understand its published surface to mirror on `MapAppViewModel`; do NOT extend this file |
| `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsUiState.kt` | all | [LEGACY — read for shape only] Sealed state shape; mirror as `RouteResultsData` inside `MapAppState.RouteResults` |
| `android/app/src/main/java/com/laneshadow/data/repository/RouteRepository.kt` | all | `subscribeToActiveRoutePlans(sessionId)` + `getPlanById(routePlanId)` API |
| `android/app/src/main/java/com/laneshadow/data/PolylineDecoder.kt` (or equivalent) | all | Polyline decoder — reuse |
| `.spec/prds/v3-integration/architecture/android-architecture.md` | §6.3 RouteResultsRoute | Historical architecture spec — read for context; canonical home is now `MapAppViewModel` |
| `RULES.md` | "Design Rules › One View, Many States", "Cross-Platform Component Parity", "Verification Standards by Platform", "Accessibility Standards Android" | Project rules |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppViewModel.kt` (MODIFY — extend with RouteResults handler + intents)
- `android/app/src/main/java/com/laneshadow/ui/mapapp/routeresults/RouteResultsData.kt` (NEW — `PolylineData`, `RouteAttachmentCardModel`, `WeatherBadgeModel`, `RouteResultsError`, etc.)
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppState.kt` (MODIFY — populate the `RouteResults` sealed case with data fields; coordinate with MAPAPP-UNIFY Android owner)
- `android/app/src/test/java/com/laneshadow/ui/mapapp/MapAppViewModelRouteResultsTest.kt` (NEW)

**Write-Prohibited:**
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt` — legacy sandbox-only; MAPAPP-UNIFY will remove
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsUiState.kt` — legacy sandbox-only
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRoute.kt` — legacy sandbox-only
- `android/app/src/main/java/com/laneshadow/data/repository/RouteRepository.kt` — existing repo
- `android/app/src/main/java/com/laneshadow/data/PolylineDecoder.kt` — existing decoder
- `android/app/src/main/java/com/laneshadow/ui/planning/**` — Sprint 08 ownership (or folded into mapapp by MAPAPP-UNIFY)
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope

## Design

**References:**
- `.spec/design/system/views/mapapp/route-results/README.md`
- `.spec/prds/v3-integration/architecture/android-architecture.md` §6.3
- RR-S09-IOS-T01 (parity twin)
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppViewModel.kt` + `MapAppState.kt` (foundation)

**Interaction Notes:** No user-facing interactions; this is pure view-model surface authoring. Composition + interaction wiring lands in RR-S09-AND-T02 / T04.

**Pattern:** `MapAppViewModel.kt` from MAPAPP-UNIFY Android phase + the iOS twin's published surface. Mirror the iOS view-model's intent surface; mirror the planning-branch handling for the RouteResults branch.

**Pattern Source:** `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppViewModel.kt` (MAPAPP-UNIFY Android phase) — and `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` (iOS reference)

**Anti-Pattern:** Creating sibling `RouteResultsViewModel.kt`; extending legacy `ui/routeresults/RouteResultsViewModel.kt`; decoding polylines in the view-model; persisting selectedRouteId to Convex; minting new sessionId on refine; emitting Jetpack Navigation events on refine (mutate `MapAppState` to `Planning` instead); rolling a new subscription manager.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.subscription_producesThreePolylinesWithTokens` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.selectAlt_updatesAndIsIdempotent` |
| AC-3 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.refine_reusesSessionIdAndMutatesStateToPlanning` |
| AC-4 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.dismissAndRecall_flipsFlagWithNoConvexCall` |
| AC-5 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.weatherBadge_populatesFromCompletedEnrichments` |
| AC-6 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.twoCandidates_yieldsTwoEntries` |
| AC-7 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.emptyOptions_surfacesErrorState` |
| AC-8 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Kotlin view-model extension under `android/app/src/main/java/com/laneshadow/ui/mapapp/`. Matches kotlin-implementer mandate. Reviewer: `kotlin-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md` § State-Driven Views (Persistent Host) + § ViewModel + StateFlow patterns
- `brain/docs/mobile-architecture/testing-strategy.md` (Turbine for flow testing)
- `RULES.md` § Design Rules › One View, Many States, §"Convex Backend", §"Verification Standards by Platform", §"Accessibility Standards Android"

## Dependencies

**Depends on:**
- RR-S09-CVX-T01 (consumes the deterministic option ordering contract + chat-refine sessionId reuse)
- MAPAPP-UNIFY Android phase (provides `MapApp.kt` + `MapAppViewModel.kt` + sealed `MapAppState` foundation)

**Blocks:**
- RR-S09-AND-T02 (composition consumes the extended view-model)
- RR-S09-AND-T03 (polyline rendering binds to `state.polylines`)
- RR-S09-AND-T04 (refine + dismiss/recall wires the intent functions)
- RR-S09-AND-T05 (capture tests use the view-model with stub Convex data)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Three options in MapAppState.RouteResults → polylines.size == 3 with best/alt1/alt2 tokens","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.subscription_producesThreePolylinesWithTokens","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"selectAlt updates state and is idempotent on repeat call","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.selectAlt_updatesAndIsIdempotent","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"refine calls sendMessage with same sessionId AND mutates MapAppState to Planning (no Jetpack Navigation event)","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.refine_reusesSessionIdAndMutatesStateToPlanning","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"dismissMessage + recallMessage flip isMessageDismissed with zero Convex mutations","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.dismissAndRecall_flipsFlagWithNoConvexCall","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Weather badge populates from completed enrichments; null for pending","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.weatherBadge_populatesFromCompletedEnrichments","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Two-options edge → 2 polylines + 2 cards inside RouteResults branch","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.twoCandidates_yieldsTwoEntries","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Empty options surfaces error overlay inside RouteResults branch (not Jetpack Navigation to ErrorRoute)","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.emptyOptions_surfacesErrorState","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-8","type":"acceptance_criterion","description":"Detekt + compileDebugKotlin clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"3 polylines test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.subscription_producesThreePolylinesWithTokens","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"selectAlt idempotency test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.selectAlt_updatesAndIsIdempotent","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"refine reuses sessionId + mutates state to Planning","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.refine_reusesSessionIdAndMutatesStateToPlanning","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"dismiss/recall no Convex","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.dismissAndRecall_flipsFlagWithNoConvexCall","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"weatherBadge derivation","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.weatherBadge_populatesFromCompletedEnrichments","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Two-options yields 2 entries","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.twoCandidates_yieldsTwoEntries","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Empty options error state","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppViewModelRouteResultsTest.emptyOptions_surfacesErrorState","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Detekt + compile clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-8"}
  ]
}
-->
