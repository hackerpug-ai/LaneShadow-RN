# PLAN-S08-AND-T02 — Android planning-state overlay composition (LSContextCapsule(--planning) + LSPhaseIndicator on persistent map host)

> Status: 🟡 In Progress
> Cycle: 1
> Updated: 2026-05-07T19:05:00.000Z

> **Task ID:** PLAN-S08-AND-T02
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 300 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** XL
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-CHAT-01, UC-CHAT-02, UC-FID-01, Sprint 08 Map View — Planning State (Map View Redesign 2026-05-06)

## Background

Sprint 08 ships the planning state of the **canonical map view** — not a standalone screen. The Sprint 06 map host (`LSMapHost`) is reused as-is; the change is a configuration of the persistent map plus a swap of the top-overlay surface composition. Per the 2026-05-07 layout decision, the planning-state top overlay renders the Sprint 07 `LSContextCapsule(--planning)` **above** the existing `LSPhaseIndicator` molecule (separate molecules in the `org-map-layer__top-overlay` slot). The capsule owns the italic phase-line headline + copper pulse spinner; the indicator owns the explicit 5-step pipeline pulsing through phases driven by real Convex `sessionMessages` updates.

This task replaces the legacy `PlanningScreen.kt` composition (which currently renders an LSPhaseIndicator-only top-overlay using the legacy floating layout) with the new composed layout, binding both surfaces to `PlanningViewModel.state` from PLAN-S08-AND-T01. The Sprint 06 `LSMapHost` and Sprint 07 `LSContextCapsule` / `LSMapControls` are consumed unchanged — re-implementing any of them is a planning anti-pattern called out in `SPRINT.md`.

## Critical Constraints

**MUST:**
- Compose the planning-state map view at `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` so the persistent `LSMapHost` (Sprint 06) stays mounted and only its overlay slots and per-state map configuration change between idle and planning
- Render `LSContextCapsule(state = .planning(headline = state.capsuleHeadline))` in the `org-map-layer__top-overlay` upper slot and `LSPhaseIndicator(phases = state.phaseSteps, header = state.headerLabel)` directly below it — both molecules visible simultaneously per the 2026-05-07 layout decision
- Bind to `PlanningViewModel` (PLAN-S08-AND-T01) via `hiltViewModel<PlanningViewModel, PlanningViewModel.Factory> { it.create(sessionId) }`; collect `state` as `StateFlow` via `collectAsStateWithLifecycle`; never re-derive phase state in the View layer
- Configure the existing `LSMapControls` (Sprint 07) workbar for the planning state per `org-map-controls` planning-state spec — recenter remains active; chat-mode toggle remains; save / layers reconfigure per design (read PLAN-S08-DR-T01 outputs)
- Create or evolve `android/app/src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt` as the Hilt-aware container that injects the ViewModel and passes a stateless `state: PlanningUiState` + intent callbacks (`onCancel`, `onSendMessage`) to the stateless `PlanningScreen` composable
- Update `android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenTest.kt` to assert: capsule renders with `state.capsuleHeadline`, indicator renders directly below capsule with `state.phaseSteps`, MapHost stays mounted across idle→planning transition (no remount), MapControls render in planning configuration

**NEVER:**
- NEVER modify or re-implement `LSMapHost.kt`, `LSMap.kt`, `LSContextCapsule.kt`, `LSMapControls.kt`, or `LSPhaseIndicator.kt` — all are consumed components owned by prior sprints (write-prohibited list below)
- NEVER hardcode token literals in `PlanningScreen.kt` — every spacing, color, radius, motion value resolves through `LocalLaneShadowTheme.current`
- NEVER bypass the ViewModel and bind directly to `chatRepository.subscribeToMessages` from the view layer — phase state is owned by the ViewModel
- NEVER remount `LSMapHost` between idle and planning states — the host is persistent; only overlay slot composition and map source configuration change
- NEVER hide the `LSPhaseIndicator` in the planning state — both capsule and indicator are visible per the 2026-05-07 decision (the ROADMAP wording "replaces LSPhaseIndicator-as-top-overlay" refers only to the *primary* role, not retirement)

**STRICTLY:**
- STRICTLY follow the per-state-overlay pattern from CAPS-S07-T06 (idle retrofit) — same map host, same controls workbar, only the top-overlay composition swaps; this is the pattern Sprint 09 inherits
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0 on the touched Kotlin files
- STRICTLY align the composable testTag values to the iOS twin's accessibility ids per `RULES.md §Cross-Platform Component Parity` so PLAN-S08-AND-T05 captures match iOS

## Specification

**Objective:** Replace the legacy `PlanningScreen.kt` top-overlay composition with the post-Sprint-07 composed layout — `LSContextCapsule(--planning)` above `LSPhaseIndicator` in the `org-map-layer__top-overlay` slot of the persistent Sprint 06 `LSMapHost`, with the Sprint 07 `LSMapControls` reconfigured for the planning state. Bind both overlay surfaces to `PlanningViewModel.state` (PLAN-S08-AND-T01) via a Hilt-injected container. The map host stays mounted across idle→planning transitions.

**Success State:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest'` exits 0; `assembleDebug` builds; the planning-state composition renders the capsule above the indicator above the persistent map host with planning-state map controls; no consumed component (LSMapHost, LSContextCapsule, LSMapControls, LSPhaseIndicator) is modified by this task.

## Acceptance Criteria

### AC-1 — LSContextCapsule renders in --planning state with state.capsuleHeadline

**GIVEN** a `PlanningUiState(capsuleHeadline = "Sketching a coastal loop…", currentPhase = Phase.Drafting)`
**WHEN** `PlanningScreen(state = ...)` composes
**THEN** `LSContextCapsule` is in the `--planning` state, displays the italic single-line headline `"Sketching a coastal loop…"`, shows a copper pulse spinner, has no meta row; the composable is reachable via `testTag("planning.context-capsule")`
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.context_capsule_renders_in_planning_state'`

### AC-2 — LSPhaseIndicator renders directly below the capsule with state.phaseSteps

**GIVEN** the same state from AC-1 with `phaseSteps[2].state == PhaseDotState.Active`
**WHEN** `PlanningScreen` composes
**THEN** `LSPhaseIndicator` is reachable via `testTag("planning.phase-indicator")`, displays exactly 5 step rows in the order parsing/searching/drafting/enriching/finalizing, and the visual order in the layout tree places the indicator immediately below the capsule (both inside the `org-map-layer__top-overlay` slot)
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.phase_indicator_renders_below_capsule'`

### AC-3 — LSMapHost stays mounted across idle→planning transition

**GIVEN** the composable hosts both idle and planning states on the same `LSMapHost` instance (per Sprint 08 reuse contract)
**WHEN** the route navigates from idle to planning (state swap, not destination change)
**THEN** the `LSMapHost` composable does NOT recompose with a new instance; the underlying map view (Mapbox layer / paper substrate) does not unmount; verified by a recomposition counter testTag `planning.map-host-instance` that stays at 1 across transitions
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.map_host_stays_mounted_across_state_transition'`

### AC-4 — LSMapControls workbar configures for planning state

**GIVEN** `PlanningScreen` composes with the planning state active
**WHEN** the workbar renders
**THEN** the `LSMapControls` workbar is reachable via `testTag("planning.map-controls")`, recenter remains enabled, chat-mode toggle remains enabled, save/layers behave per the planning-state spec (per PLAN-S08-DR-T01 outputs); workbar is anchored at the right-edge midline per `org-map-controls`
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.map_controls_in_planning_configuration'`

### AC-5 — PlanningScreenContainer injects ViewModel and binds state + cancel intent

**GIVEN** the `PlanningScreenContainer` is composed inside the navigation graph
**WHEN** the container resolves
**THEN** `PlanningViewModel` is obtained via `hiltViewModel<PlanningViewModel, PlanningViewModel.Factory> { it.create(sessionId) }`; the resulting `state` is collected via `collectAsStateWithLifecycle`; `onCancel` callback wires to `viewModel::cancel`
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningScreenContainerTest.container_injects_view_model_and_binds_state'`

### AC-6 — Token purity and lint gates pass on touched files

**GIVEN** the modified `PlanningScreen.kt` + new/modified `PlanningScreenContainer.kt`
**WHEN** `scripts/tokens/enforce-native-compliance.sh` and `cd android && ./gradlew ktlintCheck` run
**THEN** both exit 0; no hex literals, no hardcoded dp/sp constants outside the existing token-driven helpers, no raw color literals
**Verify:** `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck`

### AC-7 — Build passes and no consumed component is modified

**GIVEN** the working tree after this task's edits
**WHEN** `git diff --name-only` is inspected
**THEN** none of `LSMapHost.kt`, `LSMap.kt`, `LSContextCapsule.kt`, `LSMapControls.kt`, `LSPhaseIndicator.kt`, `LSChatInput.kt` appear in the diff; `cd android && ./gradlew assembleDebug` exits 0
**Verify:** `cd android && ./gradlew assembleDebug && ! git diff --name-only HEAD | grep -E '(LSMapHost|LSMap\.kt|LSContextCapsule|LSMapControls|LSPhaseIndicator|LSChatInput)\.kt$'`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | LSContextCapsule renders in --planning state with state.capsuleHeadline; copper pulse spinner present; no meta row | AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.context_capsule_renders_in_planning_state'` | happy_path |
| TC-2 | LSPhaseIndicator renders directly below the capsule with 5 step rows in stable id order | AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.phase_indicator_renders_below_capsule'` | happy_path |
| TC-3 | LSMapHost recomposition counter remains 1 across idle→planning state transition | AC-3 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.map_host_stays_mounted_across_state_transition'` | edge |
| TC-4 | LSMapControls workbar in planning configuration with recenter + chat-mode active | AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.map_controls_in_planning_configuration'` | happy_path |
| TC-5 | PlanningScreenContainer injects PlanningViewModel via assisted Hilt + binds state + cancel intent | AC-5 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningScreenContainerTest.container_injects_view_model_and_binds_state'` | happy_path |
| TC-6 | Token purity (enforce-native-compliance.sh) + ktlintCheck both exit 0 on touched files | AC-6 | `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck` | edge |
| TC-7 | assembleDebug exits 0; no consumed-component .kt files appear in git diff | AC-7 | `cd android && ./gradlew assembleDebug && ! git diff --name-only HEAD \| grep -E '(LSMapHost\|LSMap\.kt\|LSContextCapsule\|LSMapControls\|LSPhaseIndicator\|LSChatInput)\.kt$'` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` | all | Existing PlanningScreen composition — currently uses legacy LSPhaseIndicator-only top-overlay; this task replaces with capsule+indicator composed layout |
| `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsule.kt` | all | Sprint 07 component — read-only consumer; understand `--planning` state input shape and `testTag` contract |
| `android/app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt` | all | Existing molecule — read-only consumer; `phases: List<PlanningPhase>` + `header: String` input contract |
| `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` | all | Sprint 06 host — read-only; understand persistent-host contract + slot model (org-map-layer + top/bottom overlay) |
| `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` | all | Pattern reference — Hilt-injected container that resolves the ViewModel and passes a stateless screen down |
| `.spec/design/system/views/planning-screen/planning-screen.html` | all | Visual contract — capsule above + indicator below in top-overlay slot; org-map-controls planning-state configuration |
| `.spec/design/system/views/planning-screen/README.md` | all | Composes table + responsive + token recipe; note 2026-05-07 layout decision (capsule + indicator both visible) |
| `.spec/prds/v3-integration/tasks/sprint-07-context-capsule-map-controls/CAPS-S07-T06-android-idle-screen-retrofit.md` | all | Pattern source — Android idle retrofit; this task is the planning-state twin of that retrofit |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` (MODIFY — replace top-overlay composition with LSContextCapsule(--planning) + LSPhaseIndicator)
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt` (NEW or MODIFY — Hilt-aware container resolving PlanningViewModel and passing state down to stateless PlanningScreen)
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt` (MODIFY — wire PlanningScreenContainer into navigation graph if needed)
- `android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenTest.kt` (MODIFY — add tests for new composed layout, mount-stability, controls config)
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningScreenContainerTest.kt` (NEW — Hilt-injection + state-binding test)

**Write-Prohibited:**
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — Sprint 06 host, never modify
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap*Host*.kt` — Sprint 06 host, never modify
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsule.kt` — Sprint 07 component, never modify
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSMapControls.kt` (or equivalent organism) — Sprint 07 component, never modify
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt` — existing molecule, never modify in this task
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` — modified by PLAN-S08-AND-T04, not this task
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope

## Design

**References:**
- `.spec/design/system/views/planning-screen/planning-screen.html` (post-PLAN-S08-DR-T01 update — composed capsule + indicator layout)
- `.spec/design/system/views/planning-screen/README.md` (Composes table + token recipe)
- `.spec/design/system/molecules/context-capsule/README.md` (--planning state contract)
- `.spec/design/system/molecules/phase-indicator/README.md` (5-step pipeline)

**Interaction Notes:** The planning state is a configuration of the persistent map host plus an overlay-state swap, NOT a navigation to a new screen. The Sprint 06 `LSMapHost` stays mounted; the `org-map-layer__top-overlay` slot swaps from idle's `LSContextCapsule(--idle)` (Sprint 07 retrofit) to `LSContextCapsule(--planning)` + `LSPhaseIndicator` stack. The Sprint 07 `LSMapControls` workbar reconfigures for planning per the design spec. The chat input lock is owned by PLAN-S08-AND-T04 (separate task); the cancel intent surface is owned by PLAN-S08-AND-T04. The sketch-polyline animation is owned by PLAN-S08-AND-T03.

**Pattern:** `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` + the post-CAPS-S07-T06 retrofitted IdleScreen — Hilt container + stateless screen + per-state-overlay composition on the same map host.

**Pattern Source:** Sprint 06 `LSMapHost` persistent-host model + Sprint 07 `LSContextCapsule` state machine + Sprint 04 `LSPhaseIndicator` molecule. Sprint 08 is the first sprint to compose two top-overlay molecules in the same slot — the layout pattern this task ships is reused by Sprint 09 (route-results) and Sprint 10 (route-details).

**Anti-Pattern:** Re-implementing LSMapHost / LSContextCapsule / LSMapControls / LSPhaseIndicator inside `PlanningScreen.kt`; remounting the map host across state transitions; deriving phase state from `chatRepository` directly inside the View layer; hiding `LSPhaseIndicator` in planning state (both capsule and indicator are visible per 2026-05-07 decision); hardcoding spacing/color literals.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.context_capsule_renders_in_planning_state'` |
| AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.phase_indicator_renders_below_capsule'` |
| AC-3 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.map_host_stays_mounted_across_state_transition'` |
| AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.map_controls_in_planning_configuration'` |
| AC-5 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningScreenContainerTest.container_injects_view_model_and_binds_state'` |
| AC-6 | `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck` |
| AC-7 | `cd android && ./gradlew assembleDebug && ! git diff --name-only HEAD \| grep -E '(LSMapHost\|LSMap\.kt\|LSContextCapsule\|LSMapControls\|LSPhaseIndicator\|LSChatInput)\.kt$'` |
| build | `cd android && ./gradlew assembleDebug` |
| lint | `cd android && ./gradlew ktlintCheck` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Compose-driven view-template composition wiring three existing Compose molecules (Sprint 04 `LSPhaseIndicator`, Sprint 06 `LSMapHost`, Sprint 07 `LSContextCapsule` + `LSMapControls`) onto a persistent map host, plus a Hilt-injected container resolving an assisted `PlanningViewModel`. Pure Android/Compose/Hilt territory matching kotlin-implementer's mandate. No SwiftUI, no Convex backend, no design-token authoring (only consumption).

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `brain/docs/mobile-architecture/performance-optimization.md`
- `RULES.md` (LaneShadow §Cross-Platform Component Parity, §Accessibility Standards Android)

## Dependencies

**Depends on:** PLAN-S08-AND-T01 (consumes `state.capsuleHeadline` + `state.phaseSteps` + `cancel()` intent), CAPS-S07-T02 (LSContextCapsule Android), CAPS-S07-T04 (LSMapControls Android), CAPS-S07-T06 (Android idle retrofit pattern reference)
**Blocks:**
- PLAN-S08-AND-T03 (sketch-polyline overlay layer composes onto this `PlanningScreen`)
- PLAN-S08-AND-T04 (locked chat input + cancel-confirm sheet wires into this composition)
- PLAN-S08-AND-T05 (capture tests render this PlanningScreen)
- PLAN-S08-T11 (sprint gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN PlanningUiState with capsuleHeadline WHEN PlanningScreen composes THEN LSContextCapsule renders in --planning state with italic headline + copper pulse spinner + no meta row","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.context_capsule_renders_in_planning_state'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN PlanningUiState with 5 phaseSteps WHEN composes THEN LSPhaseIndicator renders directly below capsule with 5 stable-id rows","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.phase_indicator_renders_below_capsule'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN idle→planning transition WHEN state swaps THEN LSMapHost instance count remains 1 (no remount)","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.map_host_stays_mounted_across_state_transition'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN planning state active WHEN workbar renders THEN LSMapControls in planning configuration with recenter + chat-mode active at right-edge midline","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.map_controls_in_planning_configuration'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN PlanningScreenContainer composed WHEN resolves THEN PlanningViewModel obtained via assisted Hilt + state collected + cancel intent wired","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningScreenContainerTest.container_injects_view_model_and_binds_state'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN modified files WHEN enforce-native-compliance.sh + ktlintCheck run THEN both exit 0","verify":"scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"GIVEN working tree after task WHEN git diff inspected THEN no consumed-component .kt files modified; assembleDebug exits 0","verify":"cd android && ./gradlew assembleDebug && ! git diff --name-only HEAD | grep -E '(LSMapHost|LSMap\\.kt|LSContextCapsule|LSMapControls|LSPhaseIndicator|LSChatInput)\\.kt$'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"LSContextCapsule renders in --planning state with state.capsuleHeadline","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.context_capsule_renders_in_planning_state'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"LSPhaseIndicator below capsule with 5 stable-id step rows","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.phase_indicator_renders_below_capsule'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"LSMapHost remains mounted across idle→planning state transition","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.map_host_stays_mounted_across_state_transition'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"LSMapControls in planning configuration with recenter + chat-mode active","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.templates.PlanningScreenTest.map_controls_in_planning_configuration'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"PlanningScreenContainer injects ViewModel and binds state + cancel","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningScreenContainerTest.container_injects_view_model_and_binds_state'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"enforce-native-compliance.sh + ktlintCheck both exit 0","verify":"scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"assembleDebug exits 0 and no consumed-component .kt files in diff","verify":"cd android && ./gradlew assembleDebug && ! git diff --name-only HEAD | grep -E '(LSMapHost|LSMap\\.kt|LSContextCapsule|LSMapControls|LSPhaseIndicator|LSChatInput)\\.kt$'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
