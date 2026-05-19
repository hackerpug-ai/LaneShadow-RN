# FIX-S08-IOS-T01 — iOS: simplify PlanningPhase derivation; trust `message.phase`

> **Task ID:** FIX-S08-IOS-T01 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 60 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P0 · **Effort:** S
> **PRD Refs:** UC-CHAT-02, red-hat review 2026-05-19 findings F1, F4

## Background

Red-hat review 2026-05-19 found that `PlanningPhase.derive` in `ios/LaneShadow/Features/Planning/PlanningPhase.swift` calls `deriveFromThinkingSteps(message.thinkingSteps)` first (line 78), but `message.thinkingSteps` on a `kind='planning'` row is ALWAYS nil — the backend writes thinkingSteps to `kind='thinking_card'` rows, which iOS filters out at line 70 (`guard message.kind == "planning"`). The path is structurally dead. Additionally, `enrichingToolNames` at line 168 contains `"fetchWeather"` — no backend tool with that name exists; the real name is `getRouteWeather` (fixed in FIX-S08-CVX-T01).

Once FIX-S08-CVX-T01 lands, the backend writes intermediate phase values directly to the planning row's `phase` field. iOS should trust that field and drop the dead derivation paths. This task simplifies `PlanningPhase.derive` to read `message.phase` as the canonical source, removes the unreachable `fetchWeather` mapping, and deletes the dead `deriveFromThinkingSteps` codepath.

## Critical Constraints

**MUST:**
- Remove `deriveFromThinkingSteps` from `PlanningPhase.swift` (helper function AND its callsite in `derive`)
- Remove `"fetchWeather"` from `enrichingToolNames`; keep `"searchNearby"`, `"webSearchResults"`, `"enrichment_agent"` and ADD `"getRouteWeather"`
- Make `message.phase` the FIRST check in `derive`, before `deriveFromPlanningContent`
- Preserve the `deriveFromPlanningContent` fallback for compatibility — if backend phase is nil (legacy rows), the iOS client still derives correctly
- Keep `latest(in:)` returning `.parsing` when no planning messages exist (initial state)

**NEVER:**
- Read `message.thinkingSteps` anywhere in the planning derivation flow
- Hardcode an initial phase that overrides a real backend update
- Touch backend code (`server/**` is owned by FIX-S08-CVX-T01)
- Change the public `PlanningPhase` enum cases or their `stepLabel` / `capsuleHeadline` strings

**STRICTLY:**
- Tests in `LaneShadowTests/Features/Planning/PlanningViewModelTests.swift` MUST be updated to reflect that phase is read from `message.phase`, not derived from thinkingSteps
- If `message.phase == "finalizing"`, return `.finalizing` even if status is still `"streaming"` (terminal-state wins)

## Specification

**Objective:** Reduce `PlanningPhase.derive` to a thin reader over `message.phase` with a content-event fallback, eliminating the dead thinkingSteps path and the unreachable `fetchWeather` mapping.

**Success State:** A backend-emitted phase value of `"searching"` on the planning row produces `PlanningPhase.searching` from `PlanningPhase.derive` — verified by a unit test with a mock `LaneShadowSessionMessage{ kind: "planning", phase: "searching" }`. The 5-step indicator advances in lockstep with backend phase mutations during a live planning run on Simulator.

## Acceptance Criteria

### AC-1 — `deriveFromThinkingSteps` removed
**GIVEN** `ios/LaneShadow/Features/Planning/PlanningPhase.swift`
**WHEN** the file is read
**THEN** `deriveFromThinkingSteps` does not exist as a function name and no call site references it
**Verify:** `grep -c "deriveFromThinkingSteps" ios/LaneShadow/Features/Planning/PlanningPhase.swift` returns `0`

### AC-2 — `fetchWeather` removed, `getRouteWeather` added
**GIVEN** `enrichingToolNames` in `PlanningPhase.swift`
**WHEN** inspected
**THEN** the set contains `"getRouteWeather"` and does NOT contain `"fetchWeather"`
**Verify:** `grep -E '"fetchWeather"|"getRouteWeather"' ios/LaneShadow/Features/Planning/PlanningPhase.swift`

### AC-3 — `message.phase` is the primary source
**GIVEN** a `LaneShadowSessionMessage` with `kind == "planning"`, `phase == "drafting"`, and no content events
**WHEN** `PlanningPhase.derive(from:)` is called
**THEN** it returns `.drafting`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_derive_returnsPhaseFromMessagePhaseField`

### AC-4 — content-event fallback still works for legacy rows
**GIVEN** a `LaneShadowSessionMessage` with `kind == "planning"`, `phase == nil`, and content containing `{"events":[{"type":"tool_pending","tool":"geocode"}]}`
**WHEN** `PlanningPhase.derive(from:)` is called
**THEN** it returns `.searching` (via content-event derivation fallback)
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_derive_fallsBackToContentEvents`

### AC-5 — Live Simulator run shows phase progression
**GIVEN** a real Simulator build with FIX-S08-CVX-T01 deployed to dev Convex
**WHEN** the rider sends "Plan a scenic 2-hour ride"
**THEN** the `LSPhaseIndicator` in the planning state visibly advances through ≥3 of the 5 steps over the run's duration (recorded via `xcrun simctl io ... recordVideo` or screenshot sequence)
**Verify:** record `.tmp/FIX-S08-IOS-T01/ac-5-trace.mp4` or photo sequence

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | `deriveFromThinkingSteps` is absent from `PlanningPhase.swift` | AC-1 | edge |
| TC-2 | `enrichingToolNames` contains `"getRouteWeather"` and not `"fetchWeather"` | AC-2 | edge |
| TC-3 | `derive` returns `.drafting` for `phase: "drafting"` row | AC-3 | happy_path |
| TC-4 | `derive` returns `.searching` for legacy row with content event `tool: "geocode"` | AC-4 | edge |
| TC-5 | Live simulator phase indicator advances through ≥3 steps | AC-5 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Features/Planning/PlanningPhase.swift` | all | Primary site to simplify |
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | 149-162 | `updateMessages` reads `PlanningPhase.latest` — confirm no change needed |
| `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` | 130-150 | `LaneShadowSessionMessage` struct — confirm `phase` field is decoded |
| `ios/LaneShadowTests/Features/Planning/PlanningViewModelTests.swift` | all | Update tests for new derivation contract |
| `server/models/session-messages.ts` | 90-180 | Reference for canonical phase values (do not edit) |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/Planning/PlanningPhase.swift` (MODIFY — simplify derivation)
- `ios/LaneShadowTests/Features/Planning/PlanningViewModelTests.swift` (MODIFY — update + add tests)

**Write-Prohibited:**
- `server/**`, `android/**`, `react-native/**`
- `ios/LaneShadow/Views/**` (this is data-layer only)
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` (decoded `phase` field already exists)

## Design

**References:** red-hat review 2026-05-19 finding F1, F4; `server/models/session-messages.ts` phase contract

**Pattern:** Read `message.phase` directly when non-nil; fall back to content-event derivation only for legacy rows. Mirror of backend's `derivePlanningPhase` contract.

**Anti-Pattern:** Maintaining two parallel derivation paths (thinkingSteps + content) when only one path is ever populated; using fake tool names that don't exist in the backend registry.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -c "deriveFromThinkingSteps" ios/LaneShadow/Features/Planning/PlanningPhase.swift` |
| AC-2 | `grep -E '"fetchWeather"\|"getRouteWeather"' ios/LaneShadow/Features/Planning/PlanningPhase.swift` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_derive_returnsPhaseFromMessagePhaseField` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_derive_fallsBackToContentEvents` |
| AC-5 | recorded trace `.tmp/FIX-S08-IOS-T01/ac-5-trace.mp4` |
| regression | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Planning` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Pure Swift data-layer simplification with unit-test coverage; no SwiftUI or networking changes.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`

## Dependencies

**Depends on:** FIX-S08-CVX-T01 (backend must write reliable `phase` field before iOS trusts it)
**Blocks:** FIX-S08-IOS-T04 (polyline wiring uses phase as a gating signal)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "deriveFromThinkingSteps removed from PlanningPhase.swift", "verify": "grep -c 'deriveFromThinkingSteps' ios/LaneShadow/Features/Planning/PlanningPhase.swift returns 0", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "enrichingToolNames contains getRouteWeather, not fetchWeather", "verify": "grep -E '\"fetchWeather\"|\"getRouteWeather\"' ios/LaneShadow/Features/Planning/PlanningPhase.swift", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "derive returns .drafting when message.phase == 'drafting'", "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_derive_returnsPhaseFromMessagePhaseField", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Content-event fallback returns .searching for legacy row with tool geocode", "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_derive_fallsBackToContentEvents", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Live simulator phase indicator advances through >=3 steps", "verify": "recorded trace .tmp/FIX-S08-IOS-T01/ac-5-trace.mp4", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "deriveFromThinkingSteps absent from file", "verify": "grep -c 'deriveFromThinkingSteps' ios/LaneShadow/Features/Planning/PlanningPhase.swift", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "enrichingToolNames replaces fetchWeather with getRouteWeather", "verify": "grep -E '\"fetchWeather\"|\"getRouteWeather\"' ios/LaneShadow/Features/Planning/PlanningPhase.swift", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "derive returns .drafting for phase:'drafting'", "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_derive_returnsPhaseFromMessagePhaseField", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "derive returns .searching for legacy content event", "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_derive_fallsBackToContentEvents", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-4" },
    { "id": "TC-5", "type": "test_criterion", "description": "Live simulator advances through >=3 indicator steps", "verify": "recorded trace .tmp/FIX-S08-IOS-T01/ac-5-trace.mp4", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-5" }
  ]
}
-->
