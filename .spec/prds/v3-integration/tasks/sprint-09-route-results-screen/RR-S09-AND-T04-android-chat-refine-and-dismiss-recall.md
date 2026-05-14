# RR-S09-AND-T04 — Android chat-refine + dismiss/recall parity

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z

> **Task ID:** RR-S09-AND-T04
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

Android parity for RR-S09-IOS-T04. Unlock `LSChatInput`, swap placeholder to "Refine your ride…", wire submit to `viewModel.refine(prompt)` which navigates to `PlanningRoute` reusing the active `sessionId`. Wire dismiss chevron on `LSNavigatorMessage` to `viewModel.dismissMessage()`. Render copper "Recall" `LSChromeChip` bottom-anchored when `state.isMessageDismissed`; tap calls `viewModel.recallMessage()`. Honor system animation scale = 0 (reduce-motion).

## Critical Constraints

**MUST:**
- MUST unlock `LSChatInput`: `isThinking = false`, `placeholder = LaneShadowStrings.routeResultsRefinePlaceholder`, `enabled = true`
- MUST wire `onSubmit` to `viewModel.refine(prompt)`; the view-model emits `NavigateToPlanning(sessionId = state.sessionId)` (existing nav-event pattern); reuse the active `sessionId` — DO NOT mint a new one
- MUST wire dismiss chevron in `LSNavigatorMessage` to `viewModel.dismissMessage()`
- MUST render `LSChromeChip(label = "Recall")` in `LSMapHost.bottomOverlay` when `state.isMessageDismissed == true`, with copper `LaneShadowTheme.colors.signal.default` background, semantics testTag `routeresultsscreen-recall-chip`, contentDescription "Recall Navigator message"
- MUST wire Recall chip tap to `viewModel.recallMessage()`; on recall, `LSNavigatorMessage` re-renders with identical content
- MUST honor `Settings.Global.getFloat(contentResolver, ANIMATOR_DURATION_SCALE, 1.0f) == 0f` (reduce-motion): collapse message slide-out / Recall slide-in / message slide-in to instantaneous transitions
- MUST add Compose tests covering: refine submit → viewModel.refine; dismiss flips state.isMessageDismissed and hides message; Recall chip renders when dismissed; Recall tap re-pins; reduce-motion path instantaneous

**NEVER:**
- NEVER call repository / agent.sendMessage directly from this composition; go through `viewModel.refine`
- NEVER persist dismiss/recall to Convex
- NEVER hardcode hex for Recall chip background; use `LaneShadowTheme.colors.signal.default`
- NEVER hardcode placeholder string; use `LaneShadowStrings.routeResultsRefinePlaceholder` (add if missing)

**STRICTLY:**
- STRICTLY follow `RULES.md` §"Accessibility Standards Android" — Recall chip MUST have `contentDescription`
- STRICTLY pass `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin`
- STRICTLY follow V03 design for Recall chip placement (bottom-anchored, copper, chrome-glass surface)

## Specification

**Objective:** Unlock chat input with refine placeholder; wire refine submit → view-model → navigation reuses sessionId; wire dismiss chevron → view-model → message hidden; render bottom-anchored copper Recall chip when dismissed; tap re-pins message. Honor reduce-motion.

**Success State:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest` exits 0; stories `templates.route-results-screen.message-dismissed-light` + `...refining-light` render the new state correctly; `./gradlew :app:compileDebugKotlin && :app:detekt` exit 0.

## Acceptance Criteria

### AC-1 — LSChatInput unlocked with refine placeholder

**GIVEN** results state mounted
**WHEN** Compose tree queried
**THEN** `LSChatInput` has `isThinking = false`, `enabled = true`, `placeholder = LaneShadowStrings.routeResultsRefinePlaceholder` (string resource)
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.chatInput_unlockedWithRefinePlaceholder`

### AC-2 — Refine submit calls viewModel.refine + navigates to planning

**GIVEN** `state.sessionId == "sess-xyz"`, input has "make it shorter"
**WHEN** the user taps send
**THEN** `viewModel.refine("make it shorter")` is called once; navigationEvents flow emits `NavigateToPlanning(sessionId = "sess-xyz")` with same sessionId
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.refine_submit_callsViewModelAndNavigates`

### AC-3 — Dismiss chevron hides LSNavigatorMessage

**GIVEN** `state.isMessageDismissed == false`; message visible
**WHEN** dismiss chevron tapped
**THEN** `viewModel.dismissMessage()` called; `state.isMessageDismissed == true`; LSNavigatorMessage Composable not present in semantics tree; polylines remain on map
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.dismissChevron_hidesMessage`

### AC-4 — Recall chip renders bottom-anchored copper when dismissed

**GIVEN** `state.isMessageDismissed == true`
**WHEN** screen renders
**THEN** `LSChromeChip` labeled "Recall" present in `LSMapHost.bottomOverlay`; background uses `LaneShadowTheme.colors.signal.default`; testTag `routeresultsscreen-recall-chip`; contentDescription "Recall Navigator message"
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.recallChip_rendersBottomAnchoredCopperWhenDismissed`

### AC-5 — Recall chip tap re-pins message

**GIVEN** `state.isMessageDismissed == true`; Recall chip visible
**WHEN** Recall chip tapped
**THEN** `viewModel.recallMessage()` called; `state.isMessageDismissed == false`; LSNavigatorMessage re-appears with identical content; Recall chip not rendered
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.recallChip_tap_repinsMessageAndHidesChip`

### AC-6 — Reduce-motion: transitions instantaneous

**GIVEN** system animation scale = 0
**WHEN** dismiss + recall sequence runs
**THEN** both transitions complete in zero duration; test asserts no animation Composable block runs
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.reducedMotion_transitionsAreInstantaneous`

### AC-7 — Detekt + compile + accessibility clean

**GIVEN** modified Kotlin files
**WHEN** detekt + compile run
**THEN** exit 0; Recall chip Composable has `contentDescription` (assertable via grep)
**Verify:** `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin && grep -E 'contentDescription' android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRecallChip.kt | wc -l` ≥ 1

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Chat input unlocked with refine placeholder | AC-1 | `./gradlew :app:testDebugUnitTest --tests ...chatInput_unlockedWithRefinePlaceholder` | happy_path |
| TC-2 | Refine submit + navigate | AC-2 | `./gradlew :app:testDebugUnitTest --tests ...refine_submit_callsViewModelAndNavigates` | happy_path |
| TC-3 | Dismiss hides message | AC-3 | `./gradlew :app:testDebugUnitTest --tests ...dismissChevron_hidesMessage` | happy_path |
| TC-4 | Recall chip render | AC-4 | `./gradlew :app:testDebugUnitTest --tests ...recallChip_rendersBottomAnchoredCopperWhenDismissed` | happy_path |
| TC-5 | Recall tap re-pins | AC-5 | `./gradlew :app:testDebugUnitTest --tests ...recallChip_tap_repinsMessageAndHidesChip` | happy_path |
| TC-6 | Reduce-motion instantaneous | AC-6 | `./gradlew :app:testDebugUnitTest --tests ...reducedMotion_transitionsAreInstantaneous` | edge |
| TC-7 | Detekt + compile + accessibility | AC-7 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin && grep contentDescription` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/components/molecules/LSChatInput.kt` | all | Public API — placeholder, enabled, onSubmit |
| `android/app/src/main/java/com/laneshadow/ui/components/organisms/LSNavigatorMessage.kt` | all | Dismiss chevron callback |
| `android/app/src/main/java/com/laneshadow/ui/components/atoms/LSChromeChip.kt` (or equivalent) | all | Chrome chip atom |
| `.spec/design/system/views/route-results-screen/route-results-screen.html` | S04 + V03 | Refine + Message Dismissed variants |
| `.spec/design/system/refs/route-results-screen/refining.light.png` | full | S04 reference |
| `.spec/design/system/refs/route-results-screen/message-dismissed.light.png` | full | V03 reference |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T04-android-locked-chat-input-and-cancel-confirm.md` | all | Sprint 08 sibling — chat input state pattern |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRecallChip.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsScreen.kt` (MODIFY — wire chat input + dismiss + Recall chip)
- `android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsRefineDismissTest.kt` (NEW)
- `android/app/src/main/res/values/strings.xml` (MODIFY — add `route_results_refine_placeholder` string)

**Write-Prohibited:**
- `LSChatInput.kt`, `LSNavigatorMessage.kt`, `LSChromeChip.kt` — existing components
- `RouteResultsViewModel.kt` — RR-S09-AND-T01 ownership
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope

## Design

**References:**
- `.spec/design/system/views/route-results-screen/route-results-screen.html` (S04 Refining + V03 Message Dismissed)
- `.spec/design/system/refs/route-results-screen/refining.light.png`
- `.spec/design/system/refs/route-results-screen/message-dismissed.light.png`
- Sprint 08 PLAN-S08-AND-T04

**Interaction Notes:** REQUIRED READING: `.spec/design/system/views/route-results-screen/route-results-screen.html` § Refining + Message Dismissed. Three new gestures: refine submit (chat input → planning navigation reusing sessionId); dismiss chevron (hides message, shows Recall chip); Recall tap (re-pins message, hides chip). All dismiss/recall is client-side state.

**Pattern:** Sprint 08 PLAN-S08-AND-T04 chat input state binding. Mirror for refine submit. Recall chip is a thin Composable wrapping `LSChromeChip` with copper styling.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T04-android-locked-chat-input-and-cancel-confirm.md`

**Anti-Pattern:** Direct repository calls from composition; persisting dismiss/recall to Convex; hardcoding placeholder string; using custom chip instead of `LSChromeChip`; non-reduce-motion-aware animations.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.chatInput_unlockedWithRefinePlaceholder` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.refine_submit_callsViewModelAndNavigates` |
| AC-3 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.dismissChevron_hidesMessage` |
| AC-4 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.recallChip_rendersBottomAnchoredCopperWhenDismissed` |
| AC-5 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.recallChip_tap_repinsMessageAndHidesChip` |
| AC-6 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.reducedMotion_transitionsAreInstantaneous` |
| AC-7 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin && grep contentDescription` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Compose wiring + Recall chip Composable. Matches kotlin-implementer mandate. Reviewer: `kotlin-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md`
- `RULES.md` §"Accessibility Standards Android"

## Dependencies

**Depends on:**
- RR-S09-AND-T01 (`viewModel.refine`, `dismissMessage`, `recallMessage`, `state.isMessageDismissed`)
- RR-S09-AND-T02 (composition slot for chat input + bottomOverlay)

**Blocks:**
- RR-S09-AND-T05 (capture tests need refining + message-dismissed variants)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"LSChatInput unlocked: isThinking=false, enabled=true, placeholder from string resource","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.chatInput_unlockedWithRefinePlaceholder","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Refine submit calls viewModel.refine + emits NavigateToPlanning with same sessionId","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.refine_submit_callsViewModelAndNavigates","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Dismiss chevron calls viewModel.dismissMessage; hides LSNavigatorMessage","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.dismissChevron_hidesMessage","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Recall chip renders bottom-anchored copper when state.isMessageDismissed","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.recallChip_rendersBottomAnchoredCopperWhenDismissed","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Recall tap calls viewModel.recallMessage; re-pins LSNavigatorMessage; chip hidden","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.recallChip_tap_repinsMessageAndHidesChip","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Reduce-motion: dismiss + recall transitions instantaneous","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.reducedMotion_transitionsAreInstantaneous","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Detekt + compile + Recall chip contentDescription present","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin && grep contentDescription file","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Chat unlocked test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.chatInput_unlockedWithRefinePlaceholder","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Refine + navigate test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.refine_submit_callsViewModelAndNavigates","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Dismiss test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.dismissChevron_hidesMessage","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Recall chip render test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.recallChip_rendersBottomAnchoredCopperWhenDismissed","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Recall tap re-pin test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.recallChip_tap_repinsMessageAndHidesChip","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Reduce-motion test","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsRefineDismissTest.reducedMotion_transitionsAreInstantaneous","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Detekt + compile + accessibility grep clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
