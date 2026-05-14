# RR-S09-AND-T01 — Android RouteResultsViewModel: live Convex bindings

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z

> **Task ID:** RR-S09-AND-T01
> **Sprint:** [Sprint 09 — Map View · Route Results State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03, UC-CHAT-04, Sprint 09

## Background

Android parity for RR-S09-IOS-T01. The existing `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt` exposes `state: StateFlow<RouteResultsUiState>` and consumes `routeRepository.subscribeToActiveRoutePlans(sessionId)`. Sprint 09 extends it to (a) match the iOS view-model's intent surface (`selectAlt`, `refine`, `dismissMessage`, `recallMessage`, `isMessageDismissed`), (b) derive the `{best, alt1, alt2}` triple per RR-S09-CVX-T01's documented ordering, (c) emit per-variant polyline + card models with `LaneShadowTheme` Compose tokens, (d) emit a Convex-backed `WeatherBadgeModel` when route_enrichments status == "completed".

## Critical Constraints

**MUST:**
- MUST keep `@AssistedInject` constructor + `RouteRepository` injection (existing wiring) — Hilt graph unchanged
- MUST bind `routePlans.getPlanById(routePlanId)` via the existing repository subscription; reuse existing flow combinators (do NOT roll a new subscription manager)
- MUST emit `RouteResultsUiState.Loaded` with `polylines: List<PolylineData>`, `cards: List<RouteAttachmentCardModel>`, `selectedRouteId: String?`, `isMessageDismissed: Boolean` matching the iOS view-model's published surface
- MUST resolve per-variant tokens via `LaneShadowTheme.colors.route.{best,alt1,alt2}` (Compose `MaterialTheme.colorScheme` extension or equivalent project-specific theme accessor)
- MUST expose `fun selectAlt(id: String)`, `fun refine(prompt: String)`, `fun dismissMessage()`, `fun recallMessage()` intent functions; `refine` reuses the active `sessionId` and emits a navigation event to PlanningRoute (via `MutableSharedFlow<NavigationEvent>` or equivalent existing pattern)
- MUST add unit tests in `android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsViewModelTest.kt` covering the same six behavioral invariants as iOS T01 (subscription → 3 polylines, selectAlt idempotency, refine reuses sessionId, dismiss/recall flag flip with zero Convex calls, weather badge from enrichments, two-candidates edge case, empty-options error state)
- MUST mirror canonical IDs from the iOS view-model — `RouteAttachmentCardModel.id`, polyline layer IDs, etc. — for cross-platform parity

**NEVER:**
- NEVER hardcode hex literals; use `LaneShadowTheme` token accessor
- NEVER persist `selectedRouteId` to Convex
- NEVER mint a new `sessionId` on refine
- NEVER decode polylines in the view-model; delegate to the existing Kotlin decoder helper (`PolylineDecoder.decodeOrNull` per `RouteDetailsScreen.kt` precedent)
- NEVER add a new repository method; the subscription helper already exists

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/android-principles.md` §"ViewModel + StateFlow"
- STRICTLY pass `./gradlew :app:detekt` and `./gradlew :app:compileDebugKotlin` exit 0
- STRICTLY mirror the iOS view-model's intent surface signature-for-signature; deviations are a parity violation per RULES.md

## Specification

**Objective:** Extend `RouteResultsViewModel.kt` to expose the four intent functions, derive the deterministic polyline+card triple with token-driven styling, surface `isMessageDismissed` as a `StateFlow` property, and add unit tests mirroring the iOS T01 coverage.

**Success State:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest` exits 0; `./gradlew :app:compileDebugKotlin` exits 0; `./gradlew :app:detekt` exits 0; iOS twin (RR-S09-IOS-T01) and Android view-model expose identical intent function signatures.

## Acceptance Criteria

### AC-1 — Subscription produces three PolylineData entries with correct tokens

**GIVEN** repository delivers a plan with 3 options
**WHEN** the view-model state collects
**THEN** `state.polylines.size == 3`; tokens match best/alt1/alt2 from `LaneShadowTheme.colors.route.*`; stroke widths + dash arrays match design-system constants
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.subscription_producesThreePolylinesWithTokens`

### AC-2 — selectAlt updates selectedRouteId; idempotent on same id

**GIVEN** initial `selectedRouteId == "best-id"`
**WHEN** `viewModel.selectAlt("alt1-id")` is called twice
**THEN** first call updates; second call is no-op (no spurious state emissions)
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.selectAlt_updatesAndIsIdempotent`

### AC-3 — refine reuses sessionId; emits navigation event to PlanningRoute

**GIVEN** stub repository observer; `sessionId == "sess-xyz"`
**WHEN** `viewModel.refine("make it shorter")` is called
**THEN** stub records one call to `agent.sendMessage(sessionId="sess-xyz", message="make it shorter")` AND `navigationEvents` flow emits `NavigateToPlanning(sessionId="sess-xyz")`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.refine_reusesSessionIdAndNavigates`

### AC-4 — dismissMessage / recallMessage flip isMessageDismissed; no Convex call

**GIVEN** stub Convex repository
**WHEN** dismiss + recall sequence runs
**THEN** `state.isMessageDismissed` transitions false→true→false; stub records zero Convex mutations
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.dismissAndRecall_flipsFlagWithNoConvexCall`

### AC-5 — Weather badge populates from enrichments completed status

**GIVEN** route_enrichments emit `{best: completed/clear, alt1: completed/rain, alt2: pending}`
**WHEN** cards derive
**THEN** `cards[0].weatherBadge == WeatherBadge.Clear`; `cards[1].weatherBadge == WeatherBadge.Rain`; `cards[2].weatherBadge == null`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.weatherBadge_populatesFromCompletedEnrichments`

### AC-6 — Two-options edge case yields 2 polylines + 2 cards

**GIVEN** plan with 2 options
**WHEN** subscription delivers
**THEN** `state.polylines.size == 2`, `state.cards.size == 2`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.twoCandidates_yieldsTwoEntries`

### AC-7 — Empty options surfaces error state

**GIVEN** plan with `options == emptyList()`
**WHEN** subscription delivers
**THEN** `state` becomes `RouteResultsUiState.Error("Plan returned zero options")` (or equivalent sealed-class error variant); navigation to ErrorRoute emitted
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.emptyOptions_surfacesErrorState`

### AC-8 — Detekt + compile clean

**GIVEN** the modified view-model file
**WHEN** `./gradlew :app:detekt` and `./gradlew :app:compileDebugKotlin` run
**THEN** both exit 0
**Verify:** `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Three options → three PolylineData with correct tokens | AC-1 | `./gradlew :app:testDebugUnitTest --tests ...subscription_producesThreePolylinesWithTokens` | happy_path |
| TC-2 | selectAlt idempotency | AC-2 | `./gradlew :app:testDebugUnitTest --tests ...selectAlt_updatesAndIsIdempotent` | happy_path |
| TC-3 | refine reuses sessionId + nav event | AC-3 | `./gradlew :app:testDebugUnitTest --tests ...refine_reusesSessionIdAndNavigates` | happy_path |
| TC-4 | dismiss/recall flag flip without Convex | AC-4 | `./gradlew :app:testDebugUnitTest --tests ...dismissAndRecall_flipsFlagWithNoConvexCall` | happy_path |
| TC-5 | weatherBadge from completed enrichments | AC-5 | `./gradlew :app:testDebugUnitTest --tests ...weatherBadge_populatesFromCompletedEnrichments` | edge |
| TC-6 | Two-options edge | AC-6 | `./gradlew :app:testDebugUnitTest --tests ...twoCandidates_yieldsTwoEntries` | edge |
| TC-7 | Empty options error state | AC-7 | `./gradlew :app:testDebugUnitTest --tests ...emptyOptions_surfacesErrorState` | error |
| TC-8 | Detekt + compile clean | AC-8 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt` | all | [PRIMARY PATTERN] Existing view-model — extend, don't rewrite |
| `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsUiState.kt` | all | Sealed-class state shape — extend with new fields |
| `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` | all | Sprint 08 view-model — intent-function pattern (refine reuses sessionId mirrors cancel mutation pattern) |
| `android/app/src/main/java/com/laneshadow/data/repository/RouteRepository.kt` | all | `subscribeToActiveRoutePlans(sessionId)` + `getPlanById(routePlanId)` API |
| `android/app/src/main/java/com/laneshadow/data/PolylineDecoder.kt` (or equivalent) | all | Polyline decoder — reuse |
| `.spec/prds/v3-integration/architecture/android-architecture.md` | §6.3 RouteResultsRoute | Architectural reference |
| `RULES.md` | "Cross-Platform Component Parity", "Verification Standards by Platform", "Accessibility Standards Android" | Project rules |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsUiState.kt` (MODIFY — add `polylines`, `cards`, `selectedRouteId`, `isMessageDismissed` to `Loaded` variant)
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsModels.kt` (NEW — `PolylineData`, `RouteAttachmentCardModel`, `WeatherBadgeModel`, etc.)
- `android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsViewModelTest.kt` (NEW)

**Write-Prohibited:**
- `android/app/src/main/java/com/laneshadow/data/repository/RouteRepository.kt` — existing repo
- `android/app/src/main/java/com/laneshadow/data/PolylineDecoder.kt` — existing decoder
- `android/app/src/main/java/com/laneshadow/ui/planning/**` — Sprint 08 ownership
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope

## Design

**References:**
- `.spec/design/system/views/route-results-screen/README.md`
- `.spec/prds/v3-integration/architecture/android-architecture.md` §6.3
- RR-S09-IOS-T01 (parity twin)

**Interaction Notes:** No user-facing interactions; this is pure view-model surface authoring. Composition + interaction wiring lands in RR-S09-AND-T02 / T04.

**Pattern:** `RouteResultsViewModel.kt` existing scaffolding + Sprint 08 PlanningViewModel intent-function pattern. Mirror the iOS view-model's published surface.

**Pattern Source:** `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` (Sprint 08)

**Anti-Pattern:** Decoding polylines in the view-model; persisting selectedRouteId to Convex; minting new sessionId on refine; rolling a new subscription manager.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.subscription_producesThreePolylinesWithTokens` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.selectAlt_updatesAndIsIdempotent` |
| AC-3 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.refine_reusesSessionIdAndNavigates` |
| AC-4 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.dismissAndRecall_flipsFlagWithNoConvexCall` |
| AC-5 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.weatherBadge_populatesFromCompletedEnrichments` |
| AC-6 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.twoCandidates_yieldsTwoEntries` |
| AC-7 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.emptyOptions_surfacesErrorState` |
| AC-8 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Kotlin view-model extension under `android/app/src/main/java/com/laneshadow/ui/routeresults/`. Matches kotlin-implementer mandate. Reviewer: `kotlin-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md` (ViewModel + StateFlow patterns)
- `brain/docs/mobile-architecture/testing-strategy.md` (Turbine for flow testing)
- `RULES.md` §"Convex Backend", §"Verification Standards by Platform", §"Accessibility Standards Android"

## Dependencies

**Depends on:**
- RR-S09-CVX-T01 (consumes the deterministic option ordering contract + chat-refine sessionId reuse)

**Blocks:**
- RR-S09-AND-T02 (composition consumes the view-model)
- RR-S09-AND-T03 (polyline rendering binds to `state.polylines`)
- RR-S09-AND-T04 (refine + dismiss/recall wires the intent functions)
- RR-S09-AND-T05 (capture tests use the view-model with stub Convex data)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Three options → state.polylines.size == 3 with best/alt1/alt2 tokens","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.subscription_producesThreePolylinesWithTokens","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"selectAlt updates state and is idempotent on repeat call","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.selectAlt_updatesAndIsIdempotent","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"refine calls sendMessage with same sessionId and emits NavigateToPlanning event","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.refine_reusesSessionIdAndNavigates","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"dismissMessage + recallMessage flip isMessageDismissed with zero Convex mutations","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.dismissAndRecall_flipsFlagWithNoConvexCall","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Weather badge populates from completed enrichments; null for pending","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.weatherBadge_populatesFromCompletedEnrichments","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Two-options edge → 2 polylines + 2 cards","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.twoCandidates_yieldsTwoEntries","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Empty options surfaces error state and navigates to error route","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.emptyOptions_surfacesErrorState","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-8","type":"acceptance_criterion","description":"Detekt + compileDebugKotlin clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"3 polylines test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.subscription_producesThreePolylinesWithTokens","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"selectAlt idempotency test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.selectAlt_updatesAndIsIdempotent","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"refine reuses sessionId + navigates","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.refine_reusesSessionIdAndNavigates","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"dismiss/recall no Convex","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.dismissAndRecall_flipsFlagWithNoConvexCall","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"weatherBadge derivation","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.weatherBadge_populatesFromCompletedEnrichments","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Two-options yields 2 entries","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.twoCandidates_yieldsTwoEntries","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Empty options error state","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsViewModelTest.emptyOptions_surfacesErrorState","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Detekt + compile clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-8"}
  ]
}
-->
