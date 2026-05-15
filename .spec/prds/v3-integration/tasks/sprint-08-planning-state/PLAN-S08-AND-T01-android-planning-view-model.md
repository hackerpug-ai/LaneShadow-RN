# PLAN-S08-AND-T01 — Android PlanningViewModel (sessionMessages flow → phase derivation → capsule + indicator state model + cancel intent)
> Status: ✅ Completed
> Cycle: 5
> Commit: 6ec09758b43bfde3939beeca61fbc36da9b63ab1
> Reviewer: kotlin-reviewer
> Review: .kb-run-sprint/tasks/PLAN-S08-AND-T01/review/5/response.json
> Updated: 2026-05-14T02:17:45Z
> **Task ID:** PLAN-S08-AND-T01
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-CHAT-01, UC-CHAT-02, UC-CHAT-04, Sprint 08 Map View — Planning State (Map View Redesign 2026-05-06)

## Background

Sprint 08 ships the planning state of the canonical map view. Production already contains a `PlanningViewModel` at `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` that subscribes to `chatRepository.subscribeToMessages(sessionId)` and derives a `currentPhase` (Parsing/Searching/Drafting/Enriching/Finalizing). That ViewModel was authored against the legacy floating `LSPhaseIndicator` top-overlay layout. Sprint 08 introduces a composed top-overlay where `LSContextCapsule(--planning)` renders **above** `LSPhaseIndicator` — the capsule owns the italic single-line headline + copper pulse spinner, the indicator owns the explicit 5-step pipeline. The ViewModel must be evolved to expose **both** surfaces deterministically from the same `sessionMessages` stream and the `routePlans` lifecycle, with first-class fields the new view layer (PLAN-S08-AND-T02) can bind to without re-deriving phase state.

This task is the Android twin of PLAN-S08-IOS-T01. The contract MUST match the iOS twin so the views compose identically and parity capture (PLAN-S08-AND-T05) renders the same per-phase variants. A small `PlanningPhase` sealed class clarifies the derivation and unit-tests pin the mapping from `sessionMessages.status` to phase + step states.

## Critical Constraints

**MUST:**
- Evolve `PlanningViewModel` to expose `state: StateFlow<PlanningUiState>` containing: `capsuleHeadline: String` (the italic single-line phrase displayed by `LSContextCapsule(--planning)`), `phaseSteps: List<PlanningPhaseStep>` (5 entries, each with `id`, `label`, `state: PhaseDotState` of `Pending|Active|Done`), `isThinking: Boolean`, `activePlanId: String?`, `transition: PlanningTransition?`, plus the cancel intent function `cancel()`
- Derive the active step deterministically from `sessionMessages` `status` field (`streaming`/`running`/`complete`/`failed`) and from latest `thinkingSteps` entries via the existing `Phase.fromLabel(...)` helper at `com.laneshadow.services.Phase`; failure to derive defaults to `Phase.Parsing` (step 0 active)
- Bind `chatRepository.subscribeToMessages(sessionId)` and `routeRepository.subscribeToActiveRoutePlans(sessionId)` as Convex `Flow`s on `viewModelScope`; both flows MUST `catch { ... }` and surface a `subscriptionError` without crashing the ViewModel
- Use Hilt DI: `@HiltViewModel(assistedFactory = PlanningViewModel.Factory::class)` is already in place; the assisted `sessionId: String` constructor injection MUST remain unchanged so PLAN-S08-AND-T02 can bind via `hiltViewModel<PlanningViewModel, PlanningViewModel.Factory> { it.create(sessionId) }`
- Add `PlanningPhase.kt` sealed class (or extend the existing `com.laneshadow.services.Phase` enum bridge) so the 5 phases (`Parsing`, `Searching`, `Drafting`, `Enriching`, `Finalizing`) each map to a stable string id (`parsing`/`searching`/`drafting`/`enriching`/`finalizing`) used by both indicator step ids and capsule copy lookup
- Implement `cancel()` as a `viewModelScope.launch { routeRepository.cancelPlan(activePlanId) }` no-op when `activePlanId` is null; the success callback (route plan transitions to `cancelled`) returns the screen to idle via `transition = PlanningTransition.Cancelled`
- Write unit tests in `android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt` covering: phase derivation per status, capsule headline lookup per phase, step state ordering (prior=Done, current=Active, future=Pending), cancel() no-ops with null planId, cancel() success emits `PlanningTransition.Cancelled`

**NEVER:**
- NEVER block the main thread; all repository calls remain on `viewModelScope` with the existing coroutine dispatcher injection
- NEVER hardcode phase copy in the View layer — the capsule headline and step labels MUST be sourced from `PlanningUiState`
- NEVER alter the assisted-injection signature `Factory.create(sessionId: String): PlanningViewModel` — PLAN-S08-AND-T02 wiring depends on it
- NEVER mutate `PlanningUiState` outside `_state.update { ... }`; concurrent flow collectors MUST go through atomic update
- NEVER short-circuit cancel by patching local state without invoking `routeRepository.cancelPlan`; the round-trip is the contract (TC-5 verifies)

**STRICTLY:**
- STRICTLY mirror the iOS twin's contract — `capsuleHeadline` + `phaseSteps` field names, value semantics, and the 5 stable phase ids are parity contract per `RULES.md §Cross-Platform Component Parity`
- STRICTLY follow `brain/docs/mobile-architecture/android-principles.md` ViewModel + Flow conventions (assisted DI, `viewModelScope`, `catch { }` boundaries, `StateFlow` exposure)
- STRICTLY keep this data/logic task token-free; repo-wide Android lint is baseline-dirty outside this task and must be documented rather than used as this task's focused gate

## Specification

**Objective:** Evolve the Android `PlanningViewModel` so it exposes a single `PlanningUiState` that drives both `LSContextCapsule(--planning)` (via `capsuleHeadline`) and `LSPhaseIndicator` (via `phaseSteps`) on the persistent map host, derived deterministically from Convex `sessionMessages.status` updates and the `routePlans` lifecycle, with a `cancel()` intent that fires `db.routePlans.cancelPlan` and emits `PlanningTransition.Cancelled` so PLAN-S08-AND-T04 can return the map view to idle.

**Success State:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest'` exits 0; `PlanningUiState` has stable `capsuleHeadline` + `phaseSteps` fields with parity to the iOS twin; `cancel()` emits `PlanningTransition.Cancelled` after the Convex mutation resolves; subscription failures surface `subscriptionError` without crashing.

## Acceptance Criteria

### AC-1 — sessionMessages.status maps to PlanningPhase deterministically

**GIVEN** a `chatRepository.subscribeToMessages` flow emits a list ending in a system message with `status = "drafting"`
**WHEN** the ViewModel collects the emission
**THEN** `state.value.currentPhase == Phase.Drafting`, `state.value.activePhaseIndex == 2`, and `state.value.phaseSteps[2].state == PhaseDotState.Active`; steps 0–1 are `Done`; steps 3–4 are `Pending`
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.derives_drafting_phase_from_status'`

### AC-2 — capsuleHeadline lookup per phase matches design copy

**GIVEN** the ViewModel transitions through phases parsing → searching → drafting → enriching → finalizing
**WHEN** each phase becomes active
**THEN** `state.value.capsuleHeadline` resolves to the corresponding italic line from the design contract (`Sketching…` / `Asking…` / `Refining…` / `Scoring…` / `Finalizing…` per `planning-screen/README.md` and `context-capsule/README.md`)
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.capsule_headline_per_phase'`

### AC-3 — phaseSteps emits 5 entries with stable ids

**GIVEN** the ViewModel is constructed with any `sessionId`
**WHEN** the initial state is read before any subscription emission
**THEN** `state.value.phaseSteps.size == 5` with ids `parsing,searching,drafting,enriching,finalizing` in that order; step 0 is `Active`, steps 1–4 are `Pending`
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.initial_phase_steps_have_5_stable_ids'`

### AC-4 — cancel() invokes routeRepository.cancelPlan with the active planId

**GIVEN** the ViewModel has an `activePlanId = "plan_abc"` populated from the routePlans flow
**WHEN** `cancel()` is invoked
**THEN** the fake `routeRepository.cancelPlan` is called exactly once with `"plan_abc"`; on success, `state.value.transition` is `PlanningTransition.Cancelled`; `isThinking` becomes `false`
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.cancel_invokes_repository_and_emits_cancelled_transition'`

### AC-5 — cancel() with null activePlanId is a no-op

**GIVEN** the ViewModel has no active plan (`activePlanId == null`)
**WHEN** `cancel()` is invoked
**THEN** `routeRepository.cancelPlan` is NOT called; `state.value.transition` remains null; no exception is thrown
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.cancel_with_null_planId_is_noop'`

### AC-6 — Subscription failure surfaces subscriptionError without crashing

**GIVEN** `chatRepository.subscribeToMessages` emits an error (`Flow.catch` triggers)
**WHEN** the ViewModel observes the failure
**THEN** `state.value.subscriptionError` is non-null and contains the error message; `state.value.isThinking == false`; the ViewModel does not throw
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.subscription_failure_surfaces_error_state'`

### AC-7 — Focused compile and unit-test gates pass

**GIVEN** the modified `PlanningViewModel.kt` + new `PlanningPhase.kt` + `PlanningViewModelTest.kt`
**WHEN** `cd android && ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest'` runs
**THEN** the focused compile and PlanningViewModel unit-test gates exit 0; repo-wide Android lint failures outside this task are documented as baseline issues and must not introduce new findings in touched files
**Verify:** `cd android && ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest'`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | drafting status emission yields currentPhase=Drafting, activePhaseIndex=2, step states Done/Done/Active/Pending/Pending | AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.derives_drafting_phase_from_status'` | happy_path |
| TC-2 | capsuleHeadline returns the design-contract italic line for each of the 5 phases | AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.capsule_headline_per_phase'` | happy_path |
| TC-3 | initial state contains 5 phaseSteps with stable parsing/searching/drafting/enriching/finalizing ids | AC-3 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.initial_phase_steps_have_5_stable_ids'` | happy_path |
| TC-4 | cancel() calls routeRepository.cancelPlan once with activePlanId; success emits PlanningTransition.Cancelled | AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.cancel_invokes_repository_and_emits_cancelled_transition'` | happy_path |
| TC-5 | cancel() with null activePlanId does NOT invoke routeRepository.cancelPlan and does not throw | AC-5 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.cancel_with_null_planId_is_noop'` | edge |
| TC-6 | Flow error path surfaces subscriptionError, sets isThinking=false, ViewModel survives | AC-6 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.subscription_failure_surfaces_error_state'` | error |
| TC-7 | Focused compile + PlanningViewModel unit-test gates exit 0, with unrelated repo-wide lint failures documented as baseline | AC-7 | `cd android && ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest'` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` | all | Existing ViewModel scaffold — assisted DI, viewModelScope, three subscribe methods, `Phase.fromLabel` derivation; this task evolves field surface to expose capsuleHeadline + phaseSteps |
| `android/app/src/main/java/com/laneshadow/ui/planning/PlanningUiState.kt` | all | Current `PlanningUiState` shape; this task extends with `capsuleHeadline`, `phaseSteps`, and adds `PlanningTransition.Cancelled` |
| `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` | 1-120 | Pattern reference — Hilt-injected repositories + viewModelScope.launch + StateFlow update pattern |
| `android/app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt` | 1-110 | Consumer contract — `PlanningPhase` data shape (id, label, PhaseDotState); ensure the new `phaseSteps` field aligns to the same molecule input type |
| `.spec/design/system/molecules/phase-indicator/README.md` | all | 5-step pipeline contract (parsing/searching/drafting/enriching/finalizing), Active/Done/Pending state semantics |
| `.spec/design/system/molecules/context-capsule/README.md` | 1-80 | --planning state contract: single italic line + copper pulse spinner; lookup table for headline copy per phase |
| `server/convex/db/sessionMessages.ts` | 1-120 | API contract: `status: 'streaming'|'running'|'complete'|'failed'` + `thinkingSteps[]` shape used for phase derivation |
| `server/convex/db/routePlans.ts` | 1-60 + 231-340 | `cancelPlan` mutation signature consumed by `routeRepository.cancelPlan(planId)` |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` (MODIFY — extend state mapping + add `cancel()` semantics + emit `PlanningTransition.Cancelled`)
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningPhase.kt` (NEW — sealed class / enum bridge for 5 stable phase ids + `PlanningPhaseStep` data class)
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningUiState.kt` (MODIFY — add `capsuleHeadline`, `phaseSteps: List<PlanningPhaseStep>`, `PlanningTransition.Cancelled`)
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt` (NEW — fakes for ChatRepository / RouteRepository / SessionRepository; coroutine test dispatcher)

**Write-Prohibited:**
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt` — consumed component, never modify in this task
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsule.kt` — consumed component (Sprint 07), never modify
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt`, `LSMapHost*` — Sprint 06 host, out of scope
- `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` — view layer modified by PLAN-S08-AND-T02
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- Any other ViewModel or repository file outside `ui/planning/`

## Design

**References:**
- `.spec/design/system/molecules/context-capsule/README.md` (--planning state contract)
- `.spec/design/system/molecules/phase-indicator/README.md` (5-step pipeline + state semantics)
- `.spec/design/system/views/mapapp/planning/README.md` (composed layout: capsule above + indicator below)

**Interaction Notes:** This is a logic-only task — no UI surface changes. The ViewModel is the single source of truth for both the capsule's italic single-line headline and the indicator's 5 step states. Phase progression is driven by Convex `sessionMessages.status`; the cancel intent fires the `routePlans.cancelPlan` mutation and emits `PlanningTransition.Cancelled` which PLAN-S08-AND-T02/T04 read to return the map view to its idle state on the same map host.

**Pattern:** `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` — Hilt-injected ViewModel with viewModelScope.launch + Flow subscription + atomic StateFlow.update + catch boundary

**Pattern Source:** Sprint 04 PlanningViewModel scaffold + Sprint 06 IdleViewModel maturation; this task brings PlanningViewModel parity with the post-redesign data contract used by the new top-overlay composition (capsule + indicator).

**Anti-Pattern:** Re-deriving phase state inside the View layer; emitting partial `PlanningUiState` updates outside `_state.update`; treating `cancel()` as a synchronous local state mutation (must invoke `routeRepository.cancelPlan` and await the routePlans flow to confirm); diverging from the iOS twin's field names.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.derives_drafting_phase_from_status'` |
| AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.capsule_headline_per_phase'` |
| AC-3 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.initial_phase_steps_have_5_stable_ids'` |
| AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.cancel_invokes_repository_and_emits_cancelled_transition'` |
| AC-5 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.cancel_with_null_planId_is_noop'` |
| AC-6 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.subscription_failure_surfaces_error_state'` |
| AC-7 | `cd android && ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest'` |
| build | `cd android && ./gradlew assembleDebug` |
| lint baseline | documented in `.tmp/PLAN-S08-AND-T01/pre-existing-issues.md`; not part of AC-7 because current repo-wide Android lint fails outside this task scope |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Pure Android/Kotlin ViewModel evolution + Hilt-injected coroutine flow handling + JUnit unit tests with coroutine test dispatcher. No SwiftUI, no Convex backend changes, no design tokens. The task targets `android/app/src/main/java/com/laneshadow/ui/planning/` and its `src/test` twin — squarely in kotlin-implementer's mandate per `brain/docs/mobile-architecture/android-principles.md`.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `brain/docs/mobile-architecture/performance-optimization.md`
- `RULES.md` (LaneShadow §Cross-Platform Component Parity, §Convex Backend Guidelines)

## Dependencies

**Depends on:** PLAN-S08-CVX-T01 (Convex phase contract verification + `cancelPlan` end-to-end check)
**Blocks:**
- PLAN-S08-AND-T02 (planning-state overlay composition consumes `state.capsuleHeadline` + `state.phaseSteps`)
- PLAN-S08-AND-T04 (locked chat input + cancel-confirm sheet consumes `state.isThinking` + `cancel()` + `state.transition`)
- PLAN-S08-AND-T05 (capture tests bind to PlanningScreenContainer driven by this ViewModel)
- PLAN-S08-T11 (sprint gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN sessionMessages emission with status=drafting WHEN ViewModel collects THEN currentPhase=Drafting, activePhaseIndex=2, phaseSteps states Done/Done/Active/Pending/Pending",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.derives_drafting_phase_from_status'",
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt:103-116 maps status-derived phase into currentPhase, activePhaseIndex, capsuleHeadline, and phaseSteps; android/app/src/main/java/com/laneshadow/ui/planning/PlanningPhase.kt:56-73 defines Done/Done/Active/Pending/Pending for Drafting at index 2; android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt:32-55 verifies drafting => Phase.Drafting, activePhaseIndex=2, and step states.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "fd5ac4cb58e36f939a1a4cee620317ad19fca491",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN phase transitions across 5 phases WHEN each becomes active THEN capsuleHeadline returns design-contract italic line per phase",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.capsule_headline_per_phase'",
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/planning/PlanningPhase.kt:19-49 defines capsule headlines parsing=Sketching\u2026, searching=Asking\u2026, drafting=Refining\u2026, enriching=Scoring\u2026, finalizing=Finalizing\u2026; android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt:58-85 verifies all five phrases.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "fd5ac4cb58e36f939a1a4cee620317ad19fca491",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN any sessionId WHEN initial state read THEN phaseSteps has 5 stable-id entries (parsing/searching/drafting/enriching/finalizing) with step 0 Active",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.initial_phase_steps_have_5_stable_ids'",
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/planning/PlanningUiState.kt:15-17 initializes phaseSteps from phaseStepsFor(Phase.Parsing); android/app/src/main/java/com/laneshadow/ui/planning/PlanningPhase.kt:19-49 defines stable ids parsing/searching/drafting/enriching/finalizing; android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt:87-105 verifies the initial 5 ids.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "fd5ac4cb58e36f939a1a4cee620317ad19fca491",
      "maps_to_ac": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN activePlanId set WHEN cancel() invoked THEN routeRepository.cancelPlan called once with planId; success emits PlanningTransition.Cancelled and isThinking=false",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.cancel_invokes_repository_and_emits_cancelled_transition'",
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt:53-65 calls routeRepository.cancelPlan(activePlanId) once and gates pendingCancelledPlanId behind onSuccess; android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt:131-160 and 190-203 emit PlanningTransition.Cancelled only when the same plan id is observed with status=cancelled; android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt:154-185 verifies the success path, :187-218 verifies failed cancel + disappearing plan does not emit Cancelled, and :220-253 verifies observed-cancelled-before-return still resolves only after success.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "fd5ac4cb58e36f939a1a4cee620317ad19fca491",
      "maps_to_ac": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN activePlanId null WHEN cancel() invoked THEN routeRepository.cancelPlan not called and no exception",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.cancel_with_null_planId_is_noop'",
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt:53-55 returns immediately when activePlanId is null; android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt:255-265 verifies no-op and no throw behavior.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "fd5ac4cb58e36f939a1a4cee620317ad19fca491",
      "maps_to_ac": null
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN Flow.catch triggers WHEN failure observed THEN subscriptionError set, isThinking=false, ViewModel survives",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.subscription_failure_surfaces_error_state'",
      "satisfied": true,
      "evidence": "android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt:74-90, 93-119, 122-188 wrap all subscriptions with catch -> reportSubscriptionFailure; android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt:219-241 sets subscriptionError and isThinking=false without rethrowing; android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt:267-295 verifies chat and route subscription failures surface error state and stop thinking.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "fd5ac4cb58e36f939a1a4cee620317ad19fca491",
      "maps_to_ac": null
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "GIVEN modified planning ViewModel files WHEN focused compile and PlanningViewModel unit tests run THEN both exit 0, with unrelated repo-wide Android lint failures documented as baseline",
      "verify": "cd android && ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest'",
      "satisfied": true,
      "evidence": "Command run directly: cd android && ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest' -> BUILD SUCCESSFUL, exit 0.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "fd5ac4cb58e36f939a1a4cee620317ad19fca491",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "drafting status emission yields phase=Drafting and step ordering Done/Done/Active/Pending/Pending",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.derives_drafting_phase_from_status'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "capsuleHeadline returns the design-contract italic line for each of the 5 phases",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.capsule_headline_per_phase'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "initial state contains 5 phaseSteps with stable parsing/searching/drafting/enriching/finalizing ids",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.initial_phase_steps_have_5_stable_ids'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "cancel() calls routeRepository.cancelPlan with planId; success emits PlanningTransition.Cancelled",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.cancel_invokes_repository_and_emits_cancelled_transition'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "cancel() with null activePlanId does NOT call routeRepository.cancelPlan and does not throw",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.cancel_with_null_planId_is_noop'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Flow.catch path surfaces subscriptionError without crashing ViewModel",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest.subscription_failure_surfaces_error_state'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": "AC-6"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Focused compile and PlanningViewModel unit-test gates exit 0; unrelated repo-wide lint failures are documented as baseline",
      "verify": "cd android && ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningViewModelTest'",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": "AC-7"
    }
  ]
}
-->