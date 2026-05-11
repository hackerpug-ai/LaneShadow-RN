# PLAN-S08-AND-T04 — Android locked chat input + cancel-confirm BottomSheet wiring db.routePlans.cancelPlan + return-to-idle restoration

> Status: 🟡 In Progress
> Cycle: 1
> Updated: 2026-05-07T19:05:00.000Z

> **Task ID:** PLAN-S08-AND-T04
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 180 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-CHAT-04, UC-FID-01, Sprint 08 Map View — Planning State (Map View Redesign 2026-05-06)

## Background

In the planning state of the map view, the chat input is locked: the rider's filled prompt is visible (`has-value`), typing is disabled, the leading icon is dimmed, and the send button is replaced by a copper spinner — all driven by the `is-thinking` modifier on the existing `LSChatInput` molecule. The only exit during planning is the back button → cancel-confirm BottomSheet (V02 variant per the design contract) → on confirm fires `db.routePlans.cancelPlan` → on success returns the map view to its idle state (capsule swaps back to `--idle`, indicator unmounts, chat input unlocks, session preserved).

This task wires three things together: (1) bind `LSChatInput.isThinking` modifier to `PlanningViewModel.state.isThinking` (already exposed by PLAN-S08-AND-T01); (2) build a new `PlanningCancelConfirmSheet` composable (V02 variant) that opens on back-tap and surfaces "Cancel ride" / "Keep planning" actions; (3) on confirm, invoke `viewModel.cancel()` (which fires `routePlans.cancelPlan` per PLAN-S08-AND-T01 contract) and observe `state.transition == PlanningTransition.Cancelled` to navigate the map view back to its idle state on the same `LSMapHost`. The existing `LSCancelConfirmSheet.kt` molecule may be reusable; this task either composes it or builds a thin planning-specific wrapper.

## Critical Constraints

**MUST:**
- Bind `LSChatInput`'s `is-thinking` mode (locked + spinner) to `PlanningViewModel.state.isThinking` from inside the planning composition (PLAN-S08-AND-T02 owns the screen composition; this task wires the chat input modifier and back-tap handler)
- Build a new `PlanningCancelConfirmSheet` composable at `android/app/src/main/java/com/laneshadow/ui/planning/PlanningCancelConfirmSheet.kt` matching the V02 cancel-confirm variant from `.spec/design/system/views/planning-screen/planning-screen.html` — `role="alertdialog"` + `aria-modal="true"` semantics; "Cancel ride" + "Keep planning" actions; copper-tinted "Cancel ride" CTA
- On "Cancel ride" tap: invoke `viewModel.cancel()` (PLAN-S08-AND-T01 contract) which fires `routeRepository.cancelPlan(activePlanId)`; on success, `viewModel.state.transition == PlanningTransition.Cancelled` triggers navigation back to the idle state on the same `LSMapHost`
- Return-to-idle restoration: the map view returns to its idle state with capsule swapping back to `--idle`, indicator unmounting, chat input unlocking, and the session preserved (marked `archived` if applicable per backend contract); `LSMapHost` instance MUST stay mounted across the cancel→idle transition
- Update `PlanningScreenContainer` to react to `state.transition` and call `onReturnToIdle` callback (provided by the navigation graph) when `PlanningTransition.Cancelled` is observed; consume the transition via `viewModel.consumeTransition()`
- Add unit tests at `android/app/src/test/java/com/laneshadow/ui/planning/PlanningCancelConfirmTest.kt` covering: back-tap opens the sheet, "Cancel ride" tap invokes `viewModel.cancel()`, "Keep planning" dismisses without invoking cancel, observed `Cancelled` transition triggers `onReturnToIdle`

**NEVER:**
- NEVER modify `LSChatInput.kt` — it is a consumed component (write-prohibited); this task only binds its existing `isThinking` parameter
- NEVER fire `routePlans.cancelPlan` directly from the View layer — the cancel intent must go through `viewModel.cancel()` per PLAN-S08-AND-T01 contract
- NEVER navigate to a new screen on cancel — the map view returns to its idle state on the same `LSMapHost` (the host stays mounted)
- NEVER skip the "Keep planning" path — it must dismiss the sheet without firing the mutation
- NEVER hardcode token literals in the new sheet composable — every spacing/color/radius resolves through `LocalLaneShadowTheme.current`

**STRICTLY:**
- STRICTLY use the existing `LSCancelConfirmSheet.kt` molecule if its API supports the V02 variant; otherwise build `PlanningCancelConfirmSheet` as a thin planning-specific wrapper that internally uses `LSBottomSheet`
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0 + `cd android && ./gradlew ktlintCheck` exit 0 on touched files
- STRICTLY align the sheet's testTags + accessibility ids to the iOS twin (PLAN-S08-IOS-T04) per `RULES.md §Cross-Platform Component Parity`

## Specification

**Objective:** Wire `LSChatInput.isThinking` to `PlanningViewModel.state.isThinking`; build the `PlanningCancelConfirmSheet` (V02 variant) that opens on back-tap with "Cancel ride" + "Keep planning" actions; on confirm fire `viewModel.cancel()` (which fires `routePlans.cancelPlan`); on observed `PlanningTransition.Cancelled`, return the map view to its idle state on the same persistent `LSMapHost` (capsule swaps to `--idle`, indicator unmounts, chat input unlocks, session preserved).

**Success State:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest'` exits 0; tapping back during planning opens the V02 sheet; tapping "Cancel ride" fires `routePlans.cancelPlan` and returns the map view to idle on the same `LSMapHost`; tapping "Keep planning" dismisses the sheet without mutation; `LSChatInput.kt` not modified.

## Acceptance Criteria

### AC-1 — LSChatInput renders is-thinking mode bound to state.isThinking

**GIVEN** `PlanningUiState(isThinking = true, lastRiderPrompt = "Plan a scenic 2-hour ride")`
**WHEN** the planning composition renders
**THEN** the `LSChatInput` shows `has-value` filled prompt with the rider's text, the leading icon is dimmed (per `is-thinking` modifier), the send button is replaced by a copper spinner; the input field's editable flag is `false`
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.chat_input_renders_in_thinking_mode'`

### AC-2 — Back-tap opens the V02 cancel-confirm BottomSheet

**GIVEN** the planning composition is rendered with `isThinking = true`
**WHEN** the user invokes the back gesture (or taps the back chip)
**THEN** `PlanningCancelConfirmSheet` opens (V02 variant) with the scrim rising over the dimmed planning composition; the sheet has `role="alertdialog"` semantics; "Cancel ride" + "Keep planning" actions are reachable by `testTag("planning.cancel-confirm.cancel-button")` and `testTag("planning.cancel-confirm.keep-button")`
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.back_tap_opens_v02_cancel_confirm_sheet'`

### AC-3 — "Cancel ride" tap invokes viewModel.cancel() exactly once

**GIVEN** the cancel-confirm sheet is open with a fake `PlanningViewModel` whose `cancel()` is recorded
**WHEN** the user taps "Cancel ride"
**THEN** `viewModel.cancel()` is invoked exactly once; the sheet dismisses
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.cancel_button_invokes_view_model_cancel'`

### AC-4 — "Keep planning" tap dismisses sheet without invoking cancel

**GIVEN** the cancel-confirm sheet is open with a fake `PlanningViewModel`
**WHEN** the user taps "Keep planning"
**THEN** the sheet dismisses; `viewModel.cancel()` is NOT invoked; the planning composition resumes its un-dimmed state; chat input remains in `is-thinking` mode
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.keep_planning_dismisses_without_invoking_cancel'`

### AC-5 — Observed PlanningTransition.Cancelled triggers return-to-idle

**GIVEN** the planning composition is mounted with `PlanningTransition.Cancelled` emitted by the ViewModel
**WHEN** `PlanningScreenContainer` observes the transition
**THEN** the navigation `onReturnToIdle` callback is invoked exactly once; `viewModel.consumeTransition()` is called to clear the transition; the underlying `LSMapHost` instance counter remains 1 (no remount across cancel→idle)
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.cancelled_transition_triggers_return_to_idle_without_remount'`

### AC-6 — Token purity, lint, and consumed-component non-modification gates pass

**GIVEN** the new `PlanningCancelConfirmSheet.kt` + modified `PlanningScreenContainer.kt` + tests
**WHEN** `scripts/tokens/enforce-native-compliance.sh` and `cd android && ./gradlew ktlintCheck` run AND `git diff --name-only HEAD` is inspected
**THEN** both gates exit 0; `LSChatInput.kt` does NOT appear in the diff
**Verify:** `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck && ! git diff --name-only HEAD | grep -E 'LSChatInput\.kt$'`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | LSChatInput in is-thinking mode shows filled rider prompt + dimmed leading icon + copper spinner; field editable=false | AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.chat_input_renders_in_thinking_mode'` | happy_path |
| TC-2 | Back-tap during planning opens V02 cancel-confirm sheet with alertdialog semantics + Cancel/Keep buttons reachable | AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.back_tap_opens_v02_cancel_confirm_sheet'` | happy_path |
| TC-3 | "Cancel ride" tap invokes viewModel.cancel() exactly once + dismisses sheet | AC-3 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.cancel_button_invokes_view_model_cancel'` | happy_path |
| TC-4 | "Keep planning" dismisses without invoking cancel(); chat input remains is-thinking | AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.keep_planning_dismisses_without_invoking_cancel'` | edge |
| TC-5 | PlanningTransition.Cancelled observed → onReturnToIdle invoked once + consumeTransition called + LSMapHost not remounted | AC-5 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.cancelled_transition_triggers_return_to_idle_without_remount'` | happy_path |
| TC-6 | enforce-native-compliance.sh + ktlintCheck exit 0; LSChatInput.kt unmodified | AC-6 | `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` | all | Read-only consumer; understand `isThinking` parameter contract + `has-value` rendering + spinner-in-trailing-slot semantics |
| `android/app/src/main/java/com/laneshadow/ui/molecules/LSCancelConfirmSheet.kt` | all | Existing cancel-confirm molecule — assess if reusable for V02 variant; otherwise this task wraps it |
| `android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt` | all | Bottom-sheet primitive used by the cancel-confirm composable |
| `.spec/design/system/views/planning-screen/planning-screen.html` | V02 cancel-confirm variant | Visual contract — scrim rises, planning composition dims to 38%, sheet presents with copper Cancel CTA + ghost Keep CTA |
| `.spec/design/system/molecules/chat-input/README.md` | is-thinking section | Locked-state contract: `has-value` filled prompt, dimmed leading icon, copper spinner replacing send |
| `.spec/design/system/molecules/chat-input/chat-input.html` | is-thinking class | Visual contract for the locked state |
| `server/convex/db/routePlans.ts` | 231-340 | `cancelPlan` mutation handler signature consumed via `routeRepository.cancelPlan(planId)` |
| `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` | all | `cancel()` intent + `state.transition: PlanningTransition?` contract from PLAN-S08-AND-T01 |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningCancelConfirmSheet.kt` (NEW — V02 cancel-confirm sheet wrapper composable)
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt` (MODIFY — observe `state.transition`, call `onReturnToIdle`, wire chat-input `isThinking` binding, wire back-tap → sheet)
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` (MODIFY — extend if needed to expose `lastRiderPrompt: String?` for the locked input display; otherwise no change)
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningCancelConfirmTest.kt` (NEW — Compose test rule with fake ViewModel for cancel-flow + return-to-idle assertions)

**Write-Prohibited:**
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` — consumed component, never modify in this task
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsule.kt` — Sprint 07 component, never modify
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt` — existing molecule, never modify
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` / `LSMapHost*.kt` — Sprint 06 host, never modify
- `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` — modified by PLAN-S08-AND-T02, this task only touches the container
- `server/**`, `ios/**`, `react-native/**`, `tokens/**` — out of scope (cancelPlan mutation already shipped)

## Design

**References:**
- `.spec/design/system/views/planning-screen/planning-screen.html` (V02 cancel-confirm variant — scrim, dimmed planning composition, copper Cancel CTA, ghost Keep CTA)
- `.spec/design/system/molecules/chat-input/README.md` (`is-thinking` locked-state contract)
- `.spec/design/system/molecules/chat-input/chat-input.html` (visual reference)

**Interaction Notes:** The chat input is non-interactive in the locked state — typing is disabled, the send button is replaced by a copper spinner. The only exit during planning is the back gesture which opens the V02 cancel-confirm sheet. The sheet has `role="alertdialog"` + `aria-modal="true"` so SR users hear it as a confirmation dialog. On "Cancel ride", `viewModel.cancel()` fires the Convex `routePlans.cancelPlan` mutation; the ViewModel emits `PlanningTransition.Cancelled` after the mutation resolves; the container observes the transition and invokes `onReturnToIdle` which navigates the map view back to its idle state on the **same** `LSMapHost` instance (no remount). The session is preserved (marked `archived` if applicable per backend contract).

**Pattern:** `android/app/src/main/java/com/laneshadow/ui/molecules/LSCancelConfirmSheet.kt` — existing cancel-confirm bottom-sheet molecule using `LSBottomSheet` primitive + token-driven CTA buttons. This task either reuses it directly (preferred) or wraps it in a thin planning-specific composable.

**Pattern Source:** Sprint 04 cancel-confirm pattern; the V02 variant from the planning-screen design spec scopes the existing molecule for the planning-state context. The `is-thinking` chat-input modifier already exists on `LSChatInput.kt` — this task only binds it to `state.isThinking`, never modifies the molecule.

**Anti-Pattern:** Modifying `LSChatInput.kt` to add new behavior (the existing `isThinking` parameter is the contract); calling `routePlans.cancelPlan` from the View layer (must go through `viewModel.cancel()`); navigating to a new screen on cancel (the map view stays mounted on the same `LSMapHost`); skipping the "Keep planning" dismiss path; hardcoding spacing/color literals in the new sheet composable.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.chat_input_renders_in_thinking_mode'` |
| AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.back_tap_opens_v02_cancel_confirm_sheet'` |
| AC-3 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.cancel_button_invokes_view_model_cancel'` |
| AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.keep_planning_dismisses_without_invoking_cancel'` |
| AC-5 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.cancelled_transition_triggers_return_to_idle_without_remount'` |
| AC-6 | `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck` |
| build | `cd android && ./gradlew assembleDebug` |
| lint | `cd android && ./gradlew ktlintCheck` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Compose composable wrapping the existing `LSBottomSheet` / `LSCancelConfirmSheet` primitive + Hilt-injected ViewModel observation + back-handler wiring. Pure Android/Compose territory matching kotlin-implementer's mandate. No SwiftUI, no Convex backend (the `cancelPlan` mutation is already shipped — this task only invokes it via `routeRepository`), no design-token authoring (only consumption).

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `brain/docs/mobile-architecture/performance-optimization.md`
- `RULES.md` (LaneShadow §Cross-Platform Component Parity, §Accessibility Standards Android, §Convex Backend Guidelines)

## Dependencies

**Depends on:** PLAN-S08-AND-T01 (consumes `state.isThinking`, `cancel()` intent, `state.transition`), PLAN-S08-CVX-T01 (verified `cancelPlan` end-to-end)
**Blocks:**
- PLAN-S08-AND-T05 (capture tests assert cancel-confirm + return-to-idle visuals)
- PLAN-S08-T11 (sprint gate — cancel-confirm walk on both platforms is gate evidence)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN PlanningUiState.isThinking=true WHEN composition renders THEN LSChatInput in is-thinking mode with filled rider prompt + dimmed leading icon + copper spinner + editable=false","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.chat_input_renders_in_thinking_mode'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN planning composition WHEN back gesture invoked THEN V02 cancel-confirm sheet opens with alertdialog semantics + reachable Cancel/Keep buttons","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.back_tap_opens_v02_cancel_confirm_sheet'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN cancel-confirm sheet open WHEN Cancel ride tapped THEN viewModel.cancel() invoked exactly once + sheet dismisses","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.cancel_button_invokes_view_model_cancel'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN cancel-confirm sheet open WHEN Keep planning tapped THEN sheet dismisses + cancel() not invoked + chat input remains is-thinking","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.keep_planning_dismisses_without_invoking_cancel'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN PlanningTransition.Cancelled emitted WHEN container observes THEN onReturnToIdle invoked once + consumeTransition called + LSMapHost instance count remains 1","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.cancelled_transition_triggers_return_to_idle_without_remount'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN modified files WHEN enforce-native-compliance.sh + ktlintCheck run + git diff inspected THEN gates exit 0 and LSChatInput.kt unmodified","verify":"scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"LSChatInput in is-thinking mode shows filled prompt + dimmed icon + spinner; field editable=false","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.chat_input_renders_in_thinking_mode'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Back-tap opens V02 sheet with alertdialog semantics","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.back_tap_opens_v02_cancel_confirm_sheet'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Cancel ride invokes viewModel.cancel() exactly once + dismisses","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.cancel_button_invokes_view_model_cancel'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Keep planning dismisses without invoking cancel; chat input remains thinking","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.keep_planning_dismisses_without_invoking_cancel'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Cancelled transition triggers onReturnToIdle without remounting LSMapHost","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.planning.PlanningCancelConfirmTest.cancelled_transition_triggers_return_to_idle_without_remount'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"enforce-native-compliance.sh + ktlintCheck exit 0; LSChatInput.kt unmodified","verify":"scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"}
  ]
}
-->
