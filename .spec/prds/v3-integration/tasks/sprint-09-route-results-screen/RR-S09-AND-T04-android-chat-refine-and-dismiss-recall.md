# RR-S09-AND-T04 — Android chat-refine + dismiss/recall parity on MapApp

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z (retrofitted for MAPAPP-DOCTRINE 2026-05-14)

> **Task ID:** RR-S09-AND-T04
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

**Doctrine:** Per `RULES.md` § Design Rules › One View, Many States, this task wires chat-refine and dismiss/recall behaviors on `MapApp.kt` when sealed `MapAppState == RouteResults(...)`. Refine is a STATE MUTATION on `MapAppState` (back to `Planning(sessionId)`) — never a Jetpack Navigation event. Dismiss/recall is purely client-side state on `MapAppViewModel` driving overlay visibility inside `MapApp.kt`'s state-derived overlay branch.

Android parity for RR-S09-IOS-T04. Unlock `LSChatInput` (rendered by MapApp's `RouteResults` overlay), swap placeholder to "Refine your ride…", wire submit to `viewModel.refine(prompt)` which mutates `MapAppState` to `Planning(sessionId)` reusing the active `sessionId`. Wire dismiss chevron on `LSNavigatorMessage` to `viewModel.dismissMessage()`. Render copper "Recall" `LSChromeChip` bottom-anchored via MapApp's `bottomOverlays` when `state.routeResults.isMessageDismissed`; tap calls `viewModel.recallMessage()`. Honor system animation scale = 0 (reduce-motion).

## Critical Constraints

**MUST:**
- MUST unlock `LSChatInput` (rendered by MapApp's `RouteResults` overlay): `isThinking = false`, `placeholder = stringResource(R.string.route_results_refine_placeholder)`, `enabled = true`
- MUST wire `onSubmit` to `viewModel.refine(prompt)` on `MapAppViewModel`; the view-model **mutates `_state.value` to `MapAppState.Planning(sessionId)`** (RR-S09-AND-T01 owns the mutation) — DO NOT emit a Jetpack Navigation event; DO NOT mint a new `sessionId`
- MUST wire dismiss chevron in `LSNavigatorMessage` to `viewModel.dismissMessage()`
- MUST render `LSChromeChip(label = "Recall")` via MapApp's `bottomOverlays` array when `state.routeResults.isMessageDismissed == true` AND `MapAppState == RouteResults`, with copper `LaneShadowTheme.colors.signal.default` background, semantics testTag `mapapp-routeresults-recall-chip`, contentDescription "Recall Navigator message"
- MUST wire Recall chip tap to `viewModel.recallMessage()`; on recall, `LSNavigatorMessage` re-renders with identical content
- MUST honor `Settings.Global.getFloat(contentResolver, ANIMATOR_DURATION_SCALE, 1.0f) == 0f` (reduce-motion): collapse message slide-out / Recall slide-in / message slide-in to instantaneous transitions
- MUST place new code under `android/app/src/main/java/com/laneshadow/ui/mapapp/routeresults/` (NOT `ui/routeresults/`)
- MUST add Compose tests in `android/app/src/test/java/com/laneshadow/ui/mapapp/MapAppRouteResultsRefineDismissTest.kt` covering: refine submit → viewModel.refine + state mutates to Planning; dismiss flips isMessageDismissed and hides message; Recall chip renders when dismissed; Recall tap re-pins; reduce-motion path instantaneous

**NEVER:**
- NEVER call repository / agent.sendMessage directly from this composition; go through `viewModel.refine` on `MapAppViewModel`
- NEVER emit a Jetpack Navigation event on refine; mutate `MapAppState` to `Planning` instead
- NEVER persist dismiss/recall to Convex
- NEVER hardcode hex for Recall chip background; use `LaneShadowTheme.colors.signal.default`
- NEVER hardcode placeholder string; use `stringResource(R.string.route_results_refine_placeholder)` (add if missing)
- NEVER place this code under `ui/routeresults/` — it lives under `ui/mapapp/routeresults/`

**STRICTLY:**
- STRICTLY follow `RULES.md` §"Accessibility Standards Android" — Recall chip MUST have `contentDescription`
- STRICTLY pass `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin`
- STRICTLY follow V03 design for Recall chip placement (bottom-anchored, copper, chrome-glass surface) via MapApp's `bottomOverlays`

## Specification

**Objective:** Unlock chat input inside MapApp's `RouteResults` overlay branch with refine placeholder; wire refine submit → view-model → state mutates to `Planning` reusing sessionId; wire dismiss chevron → view-model → message hidden; render bottom-anchored copper Recall chip via MapApp's `bottomOverlays` when dismissed; tap re-pins message. Honor reduce-motion.

**Success State:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest` exits 0; stories `templates.map-app.route-results-message-dismissed-light` + `...refining-light` render the new state correctly; `./gradlew :app:compileDebugKotlin && :app:detekt` exit 0.

## Acceptance Criteria

### AC-1 — LSChatInput unlocked with refine placeholder in RouteResults state

**GIVEN** `MapAppState == RouteResults`
**WHEN** Compose tree queried
**THEN** `LSChatInput` (rendered by MapApp's `RouteResults` overlay) has `isThinking = false`, `enabled = true`, `placeholder = stringResource(R.string.route_results_refine_placeholder)`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.chatInput_unlockedWithRefinePlaceholder`

### AC-2 — Refine submit calls viewModel.refine + mutates MapAppState to Planning

**GIVEN** `state.routeResults.sessionId == "sess-xyz"`, input has "make it shorter"
**WHEN** the user taps send
**THEN** `viewModel.refine("make it shorter")` is called once; `viewModel.state.value == MapAppState.Planning(sessionId="sess-xyz")` (state mutation); NO Jetpack Navigation event emitted
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.refine_submit_callsViewModelAndMutatesState`

### AC-3 — Dismiss chevron hides LSNavigatorMessage

**GIVEN** `state.routeResults.isMessageDismissed == false`; message visible inside MapApp's `RouteResults` overlay
**WHEN** dismiss chevron tapped
**THEN** `viewModel.dismissMessage()` called; `state.routeResults.isMessageDismissed == true`; LSNavigatorMessage Composable not present in semantics tree; polylines remain on MapApp's persistent `LSMapHost`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.dismissChevron_hidesMessage`

### AC-4 — Recall chip renders bottom-anchored copper via MapApp.bottomOverlays when dismissed

**GIVEN** `state.routeResults.isMessageDismissed == true` AND `MapAppState == RouteResults`
**WHEN** MapApp renders
**THEN** `LSChromeChip` labeled "Recall" present in `LSMapHost.bottomOverlay` (as produced by MapApp's `RouteResults` bottom-overlay branch); background uses `LaneShadowTheme.colors.signal.default`; testTag `mapapp-routeresults-recall-chip`; contentDescription "Recall Navigator message"
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.recallChip_rendersBottomAnchoredCopperWhenDismissed`

### AC-5 — Recall chip tap re-pins message

**GIVEN** `state.routeResults.isMessageDismissed == true`; Recall chip visible via MapApp's `bottomOverlays`
**WHEN** Recall chip tapped
**THEN** `viewModel.recallMessage()` called; `state.routeResults.isMessageDismissed == false`; LSNavigatorMessage re-appears in MapApp's overlay with identical content; Recall chip not rendered
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.recallChip_tap_repinsMessageAndHidesChip`

### AC-6 — Reduce-motion: transitions instantaneous

**GIVEN** system animation scale = 0
**WHEN** dismiss + recall sequence runs
**THEN** both transitions complete in zero duration; test asserts no animation Composable block runs
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.reducedMotion_transitionsAreInstantaneous`

### AC-7 — Detekt + compile + accessibility clean

**GIVEN** modified Kotlin files under `ui/mapapp/routeresults/`
**WHEN** detekt + compile run
**THEN** exit 0; Recall chip Composable has `contentDescription` (assertable via grep)
**Verify:** `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin && grep -E 'contentDescription' android/app/src/main/java/com/laneshadow/ui/mapapp/routeresults/RouteResultsRecallChip.kt | wc -l` ≥ 1

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Chat input unlocked with refine placeholder in RouteResults | AC-1 | `./gradlew :app:testDebugUnitTest --tests ...chatInput_unlockedWithRefinePlaceholder` | happy_path |
| TC-2 | Refine submit + state mutates to Planning (no nav event) | AC-2 | `./gradlew :app:testDebugUnitTest --tests ...refine_submit_callsViewModelAndMutatesState` | happy_path |
| TC-3 | Dismiss hides message | AC-3 | `./gradlew :app:testDebugUnitTest --tests ...dismissChevron_hidesMessage` | happy_path |
| TC-4 | Recall chip render via MapApp.bottomOverlays | AC-4 | `./gradlew :app:testDebugUnitTest --tests ...recallChip_rendersBottomAnchoredCopperWhenDismissed` | happy_path |
| TC-5 | Recall tap re-pins | AC-5 | `./gradlew :app:testDebugUnitTest --tests ...recallChip_tap_repinsMessageAndHidesChip` | happy_path |
| TC-6 | Reduce-motion instantaneous | AC-6 | `./gradlew :app:testDebugUnitTest --tests ...reducedMotion_transitionsAreInstantaneous` | edge |
| TC-7 | Detekt + compile + accessibility | AC-7 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin && grep contentDescription` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` | all (extended by RR-S09-AND-T02) | Persistent host — where chat input + dismiss + Recall chip wiring plugs into MapApp's `RouteResults` overlay branch |
| `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppViewModel.kt` | extended by RR-S09-AND-T01 | `refine`, `dismissMessage`, `recallMessage`, `isMessageDismissed` |
| `android/app/src/main/java/com/laneshadow/ui/mapapp/MapAppState.kt` | all | `RouteResults` ↔ `Planning(sessionId)` mutation contract |
| `android/app/src/main/java/com/laneshadow/ui/components/molecules/LSChatInput.kt` | all | Public API — placeholder, enabled, onSubmit |
| `android/app/src/main/java/com/laneshadow/ui/components/organisms/LSNavigatorMessage.kt` | all | Dismiss chevron callback |
| `android/app/src/main/java/com/laneshadow/ui/components/atoms/LSChromeChip.kt` (or equivalent) | all | Chrome chip atom |
| `.spec/design/system/views/route-results-screen/route-results-screen.html` | S04 + V03 | Refine + Message Dismissed variants |
| `.spec/design/system/views/route-results-screen/refining/refining.light.png` | full | S04 reference |
| `.spec/design/system/views/route-results-screen/message-dismissed/message-dismissed.light.png` | full | V03 reference |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T04-android-locked-chat-input-and-cancel-confirm.md` | all | Sprint 08 sibling — chat input state pattern inside MapApp |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/mapapp/routeresults/RouteResultsRecallChip.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` (MODIFY — wire chat input + dismiss + Recall chip into the `RouteResults` overlay branch)
- `android/app/src/main/java/com/laneshadow/ui/mapapp/routeresults/RouteResultsOverlays.kt` (MODIFY — extend helper from RR-S09-AND-T02 with Recall chip in `bottomOverlays`)
- `android/app/src/test/java/com/laneshadow/ui/mapapp/MapAppRouteResultsRefineDismissTest.kt` (NEW)
- `android/app/src/main/res/values/strings.xml` (MODIFY — add `route_results_refine_placeholder` string)

**Write-Prohibited:**
- `LSChatInput.kt`, `LSNavigatorMessage.kt`, `LSChromeChip.kt` — existing components
- `MapAppViewModel.kt` — RR-S09-AND-T01 ownership in this sprint
- `MapAppState.kt` — MAPAPP-UNIFY ownership
- `android/app/src/main/java/com/laneshadow/ui/routeresults/` — legacy sandbox-only directory
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope

## Design

**References:**
- `.spec/design/system/views/route-results-screen/route-results-screen.html` (S04 Refining + V03 Message Dismissed)
- `.spec/design/system/views/route-results-screen/refining/refining.light.png`
- `.spec/design/system/views/route-results-screen/message-dismissed/message-dismissed.light.png`
- Sprint 08 PLAN-S08-AND-T04
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt`

**Interaction Notes:** REQUIRED READING: `.spec/design/system/views/route-results-screen/route-results-screen.html` § Refining + Message Dismissed. Three new gestures: refine submit (chat input → `MapAppState` mutates to `Planning` reusing sessionId); dismiss chevron (hides message, shows Recall chip via MapApp's `bottomOverlays`); Recall tap (re-pins message, hides chip). All dismiss/recall is client-side state on `MapAppViewModel`. NO Jetpack Navigation events.

**Pattern:** Sprint 08 PLAN-S08-AND-T04 chat input state binding inside MapApp's `Planning` branch. Mirror for refine submit on the `RouteResults` branch. Recall chip is a thin Composable wrapping `LSChromeChip` with copper styling, registered in MapApp's `bottomOverlays` array for the `RouteResults` branch.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T04-android-locked-chat-input-and-cancel-confirm.md`

**Anti-Pattern:** Direct repository calls from composition; persisting dismiss/recall to Convex; emitting Jetpack Navigation events on refine; hardcoding placeholder string; using custom chip instead of `LSChromeChip`; non-reduce-motion-aware animations; placing code under `ui/routeresults/` instead of `ui/mapapp/routeresults/`.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.chatInput_unlockedWithRefinePlaceholder` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.refine_submit_callsViewModelAndMutatesState` |
| AC-3 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.dismissChevron_hidesMessage` |
| AC-4 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.recallChip_rendersBottomAnchoredCopperWhenDismissed` |
| AC-5 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.recallChip_tap_repinsMessageAndHidesChip` |
| AC-6 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.reducedMotion_transitionsAreInstantaneous` |
| AC-7 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin && grep contentDescription` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Compose wiring + Recall chip Composable under `ui/mapapp/routeresults/`. Matches kotlin-implementer mandate. Reviewer: `kotlin-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md` § State-Driven Views (Persistent Host)
- `RULES.md` § Design Rules › One View, Many States, §"Accessibility Standards Android"

## Dependencies

**Depends on:**
- RR-S09-AND-T01 (`viewModel.refine`, `dismissMessage`, `recallMessage`, `state.routeResults.isMessageDismissed`)
- RR-S09-AND-T02 (composition slot for chat input + bottomOverlay + RouteResultsOverlays helper)

**Blocks:**
- RR-S09-AND-T05 (capture tests need refining + message-dismissed variants)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"LSChatInput rendered by MapApp's RouteResults overlay is unlocked: isThinking=false, enabled=true, placeholder from string resource","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.chatInput_unlockedWithRefinePlaceholder","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Refine submit calls viewModel.refine + MapAppState mutates to Planning(sessionId) with same sessionId; no Jetpack Navigation event","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.refine_submit_callsViewModelAndMutatesState","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Dismiss chevron calls viewModel.dismissMessage; hides LSNavigatorMessage; polylines remain on MapApp's LSMapHost","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.dismissChevron_hidesMessage","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Recall chip renders bottom-anchored copper via MapApp.bottomOverlays with mapapp-routeresults-recall-chip testTag when state.routeResults.isMessageDismissed","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.recallChip_rendersBottomAnchoredCopperWhenDismissed","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Recall tap calls viewModel.recallMessage; re-pins LSNavigatorMessage; chip hidden","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.recallChip_tap_repinsMessageAndHidesChip","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Reduce-motion: dismiss + recall transitions instantaneous","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.reducedMotion_transitionsAreInstantaneous","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Detekt + compile + Recall chip contentDescription present","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin && grep contentDescription file","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Chat unlocked test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.chatInput_unlockedWithRefinePlaceholder","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Refine + state mutation test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.refine_submit_callsViewModelAndMutatesState","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Dismiss test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.dismissChevron_hidesMessage","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Recall chip render test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.recallChip_rendersBottomAnchoredCopperWhenDismissed","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Recall tap re-pin test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.recallChip_tap_repinsMessageAndHidesChip","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Reduce-motion test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.mapapp.MapAppRouteResultsRefineDismissTest.reducedMotion_transitionsAreInstantaneous","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Detekt + compile + accessibility grep clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
