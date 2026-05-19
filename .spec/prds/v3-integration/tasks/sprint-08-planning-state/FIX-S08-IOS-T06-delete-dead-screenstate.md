# FIX-S08-IOS-T06 — iOS: collapse `screenState` to single source of truth

> **Task ID:** FIX-S08-IOS-T06 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 30 min · **Type:** REFACTOR · **Status:** Backlog · **Priority:** P2 · **Effort:** S
> **PRD Refs:** red-hat review 2026-05-19 finding F10

## Background

Red-hat review found that `PlanningViewModel.swift:44-54` defines a `var screenState: PlanningScreenLiveState { ... }` computed property — but `PlanningScreenContainer.swift:13-21` constructs `PlanningScreenLiveState(...)` manually from individual `viewModel.phases`, `viewModel.isThinking`, etc. The computed property is never called. As FIX-S08-IOS-T04 and FIX-S08-IOS-T05 add new fields (`polylines`, `isSingleCandidate`, `singleCandidateAdvisoryText`), the manual construction path will drift from the computed one. Pick one canonical path.

## Critical Constraints

**MUST:**
- EITHER rewire `PlanningScreenContainer` to call `viewModel.screenState` (preferred — single source of truth)
- OR delete the `screenState` computed property and document the manual-construction path in the container as canonical
- Pick ONE — do not leave both alive
- Update unit tests if they exercise either path

**NEVER:**
- Leave both paths alive (the maintenance trap that triggered this task)
- Add a new way to construct `PlanningScreenLiveState`
- Touch backend code

**STRICTLY:**
- This task is mechanical refactor; no behavior change is allowed
- Output must compile and pass all existing planning tests with zero behavior changes

## Specification

**Objective:** Reduce `PlanningScreenLiveState` construction to a single canonical path.

**Success State:** Either `PlanningScreenContainer` calls `viewModel.screenState` directly OR the `screenState` computed property is removed. Tests pass. Behavior unchanged.

## Acceptance Criteria

### AC-1 — Exactly one construction path exists
**GIVEN** the planning view-model + container files
**WHEN** grep'd
**THEN** EITHER `PlanningScreenLiveState(` appears once (in the computed property) and `PlanningScreenContainer.swift` calls `viewModel.screenState` — OR `screenState` is deleted and the container retains its single manual construction (no leftover dead `screenState` definition)
**Verify:** `grep -rn "PlanningScreenLiveState(" ios/LaneShadow/Features/Planning/ ios/LaneShadow/Views/Templates/PlanningScreen*.swift | wc -l` matches the chosen path (1 if container uses computed; 1 if computed is deleted and container constructs manually)

### AC-2 — Existing planning tests still pass
**GIVEN** the refactored code
**WHEN** the planning test suite runs
**THEN** all tests pass with no regressions
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning -destination 'platform=iOS Simulator,name=iPhone 16'`

### AC-3 — Container test verifies the canonical path
**GIVEN** the refactored container
**WHEN** a new unit test asserts the source of `liveState` (either via `screenState` or via direct construction)
**THEN** the test documents the chosen canonical path
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningScreenContainerTests/test_liveStateSource_isCanonical`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Exactly one `PlanningScreenLiveState(` construction site exists | AC-1 | edge |
| TC-2 | All existing planning tests still pass | AC-2 | happy_path |
| TC-3 | Container test documents the canonical path | AC-3 | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | 44-54 | `screenState` computed property |
| `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` | 13-21 | Manual construction site |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (MODIFY — either keep or delete `screenState`)
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` (MODIFY — either use `screenState` or retain manual)
- `ios/LaneShadowTests/Features/Planning/PlanningScreenContainerTests.swift` (MODIFY/CREATE)

**Write-Prohibited:**
- Any other file

## Design

**References:** red-hat review 2026-05-19 finding F10

**Pattern:** Computed property as single source of truth (recommended) — mirrors the project's other `viewModel.someState` patterns

**Anti-Pattern:** Two parallel ways to construct the same struct

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -rn "PlanningScreenLiveState(" ios/LaneShadow/Features/Planning/ ios/LaneShadow/Views/Templates/PlanningScreen*.swift` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning -destination 'platform=iOS Simulator,name=iPhone 16'` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningScreenContainerTests/test_liveStateSource_isCanonical` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Mechanical refactor, no behavior change.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`

## Dependencies

**Depends on:** FIX-S08-IOS-T04, FIX-S08-IOS-T05 (so the new fields exist and the consolidation reflects the complete struct)
**Blocks:** —

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Exactly one construction path exists", "verify": "grep -rn 'PlanningScreenLiveState(' ios/LaneShadow/Features/Planning/ ios/LaneShadow/Views/Templates/PlanningScreen*.swift", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Existing planning tests pass after refactor", "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Planning", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Container test documents canonical path", "verify": "xcodebuild test ... test_liveStateSource_isCanonical", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "One construction site", "verify": "grep", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Planning tests pass", "verify": "xcodebuild test", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Container test asserts canonical path", "verify": "xcodebuild test ... test_liveStateSource_isCanonical", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" }
  ]
}
-->
