# FIX-S08-IOS-T03 — iOS: fix `observe()` session-ID race in PlanningViewModel

> **Task ID:** FIX-S08-IOS-T03 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 60 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P0 · **Effort:** S
> **PRD Refs:** UC-CHAT-01, red-hat review 2026-05-19 finding F8

## Background

Red-hat review found that `PlanningViewModel.swift:64-69` early-returns from `observe()` if `resolvedSessionId` is nil. The container calls `observe()` exactly once on `.task`. In the submit-then-show flow common to V3, `chatStore.flowState.sessionId` may be nil at mount time and resolve later (after the optimistic write completes). When that happens, `observe()` has already returned and `startObserving` is never invoked — the Convex subscription never starts, so no phase updates arrive.

Fix: use Swift `Observation` / `withObservationTracking` (or an `onChange` modifier in the container) to re-trigger `observe()` whenever `resolvedSessionId` becomes non-nil. The simplest approach is to expose an async sequence or `@Observable` published property and have the container re-call `observe()` on change.

## Critical Constraints

**MUST:**
- Make `observe()` re-subscribe when `resolvedSessionId` transitions nil → non-nil, OR change non-nil → different non-nil (session swap)
- Cancel the previous subscription before starting a new one (the existing `stopObserving()` helper at `PlanningViewModel.swift:72` already does this)
- Preserve the existing `observationTasks` cancellation semantics
- The container's `.task` modifier or equivalent must trigger the re-subscription path

**NEVER:**
- Poll for session ID in a loop
- Subscribe with a nil session ID (the early-return guard must stay; the issue is that the *outer* call never re-fires)
- Touch backend code

**STRICTLY:**
- If session ID changes mid-flight (rare but possible during /new session), the new subscription must replace the old one cleanly with no orphan tasks
- Add a unit test that mounts a `PlanningViewModel` with `resolvedSessionId == nil`, then triggers a session ID resolution, and asserts that `startObserving` was invoked

## Specification

**Objective:** Ensure the Convex subscription starts whenever a session ID becomes available, regardless of whether it was nil at mount time.

**Success State:** A test that constructs `PlanningViewModel` with a deferred session ID (resolves 100ms after mount) sees `startObserving` called once after the resolution. The live submit-then-show flow on Simulator shows phase indicator advancing immediately after the optimistic message reconciles to the server `_id`.

## Acceptance Criteria

### AC-1 — `observe()` re-subscribes when session ID resolves
**GIVEN** a `PlanningViewModel` whose `resolvedSessionId` is nil at construction time
**WHEN** the underlying `chatStore.flowState.sessionId` updates from nil to a real ID
**THEN** `startObserving(sessionId:)` is invoked exactly once with the resolved ID
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_observe_subscribesWhenSessionIdResolvesLate`

### AC-2 — Session swap cleanly replaces the subscription
**GIVEN** a `PlanningViewModel` already subscribed to session A
**WHEN** the session ID changes to B
**THEN** the previous subscription's `observationTasks` are all cancelled and a new subscription to B is started; no orphan tasks remain
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_sessionSwap_replacesSubscription`

### AC-3 — Nil-only session does not subscribe
**GIVEN** a `PlanningViewModel` whose session ID never resolves
**WHEN** `observe()` is awaited
**THEN** `startObserving` is NOT invoked (the existing guard still holds when no resolution occurs)
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_observe_skipsWhenSessionIdRemainsNil`

### AC-4 — Live submit-then-show flow advances phase indicator
**GIVEN** a Simulator build with FIX-S08-CVX-T01 + FIX-S08-IOS-T01 + this fix
**WHEN** the rider sends a planning prompt from the idle state (the submit-then-show flow)
**THEN** the `LSPhaseIndicator` advances within ≤2s of the optimistic message becoming visible
**Verify:** recorded trace `.tmp/FIX-S08-IOS-T03/ac-4-trace.mp4`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Late session-ID resolution triggers exactly one `startObserving` call | AC-1 | happy_path |
| TC-2 | Session swap cancels prior tasks and starts a fresh subscription | AC-2 | edge |
| TC-3 | Persistent-nil session does not trigger `startObserving` | AC-3 | edge |
| TC-4 | Live submit-then-show shows indicator advancing within 2s | AC-4 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | 60-115 | `observe`, `startObserving`, `stopObserving` |
| `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` | all | Container `.task` modifier that calls `observe()` |
| `ios/LaneShadow/Stores/ChatStore.swift` (or equivalent) | search `flowState.sessionId` | Understand session-id mutation pattern |
| `ios/LaneShadowTests/Features/Planning/PlanningViewModelTests.swift` | all | Existing test scaffolding for view model |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (MODIFY — add re-subscribe logic)
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` (MODIFY only if container needs an `.onChange` modifier)
- `ios/LaneShadowTests/Features/Planning/PlanningViewModelTests.swift` (MODIFY — add the three new tests)

**Write-Prohibited:**
- `server/**`, `android/**`, `react-native/**`
- `ios/LaneShadow/Stores/ChatStore.swift` (session-ID mutation is store-owned)

## Design

**References:** red-hat review 2026-05-19 finding F8

**Pattern:** Use `withObservationTracking` or container-side `.onChange(of: viewModel.resolvedSessionId) { _, new in if new != nil { Task { await viewModel.observe() } } }`

**Anti-Pattern:** Polling in a loop; calling `observe()` from a constructor (race with @Observable's tracking establishment)

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_observe_subscribesWhenSessionIdResolvesLate` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_sessionSwap_replacesSubscription` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_observe_skipsWhenSessionIdRemainsNil` |
| AC-4 | recorded trace `.tmp/FIX-S08-IOS-T03/ac-4-trace.mp4` |
| regression | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** SwiftUI observability + AsyncStream cancellation; pure view-model logic.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`

## Dependencies

**Depends on:** —
**Blocks:** —

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "observe re-subscribes when session ID resolves", "verify": "xcodebuild test ... test_observe_subscribesWhenSessionIdResolvesLate", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Session swap cleanly replaces subscription", "verify": "xcodebuild test ... test_sessionSwap_replacesSubscription", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Persistent-nil session does not subscribe", "verify": "xcodebuild test ... test_observe_skipsWhenSessionIdRemainsNil", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Live submit-then-show shows indicator advancing within 2s", "verify": "recorded trace .tmp/FIX-S08-IOS-T03/ac-4-trace.mp4", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "Late resolution triggers one startObserving call", "verify": "xcodebuild test ... test_observe_subscribesWhenSessionIdResolvesLate", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Swap cancels prior tasks and starts fresh", "verify": "xcodebuild test ... test_sessionSwap_replacesSubscription", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Nil session never invokes startObserving", "verify": "xcodebuild test ... test_observe_skipsWhenSessionIdRemainsNil", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "Indicator advances within 2s on Simulator", "verify": "recorded trace .tmp/FIX-S08-IOS-T03/ac-4-trace.mp4", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-4" }
  ]
}
-->
