# FIX-S07-IOS-T03 — iOS: add logging to mode-toggle stub per SPRINT.md spec
> Status: ✅ Completed
> Cycle: 1
> Commit: 232fd7da1543eb10cd3f1e7dc35343c443f2b0ad
> Reviewer: swift-reviewer
> Updated: 2026-05-08T17:59:41.959Z

> **Task ID:** FIX-S07-IOS-T03 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 15 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P2 · **Effort:** XS
> **PRD Refs:** UC-MAP-01, Sprint 07 red-hat review finding H-5

## Background

Red-hat review found that Sprint 07's SPRINT.md and CAPS-S07-T05 spec explicitly say "mode-toggle stubbed to **log+no-op** until Sprint 08 wires chat-mode." The implementation at `IdleScreen.swift:120` is `onToggleView: {}` — a no-op with no logging. This is a spec contradiction. While mode-toggle wiring is Sprint 08 work, the stub should match the documented contract.

## Critical Constraints

**MUST:**
- Replace `onToggleView: {}` with `onToggleView: { os_log(.info, "[STUB] Mode toggle — Sprint 08 wiring") }` (or equivalent `Logger` call)
- The logging stub MUST be visible in DEBUG builds only if possible, but at minimum must not be a bare empty closure

**NEVER:**
- Wire mode-toggle to actual chat-mode switching (that's Sprint 08 work)
- Import MapboxMaps or other unrelated dependencies

## Specification

**Objective:** Add the missing logging to the mode-toggle stub per the documented SPRINT.md contract.

**Success State:** Tapping mode-toggle emits a console log entry. No functional change.

## Acceptance Criteria

### AC-1 — Mode-toggle callback contains a log call

**GIVEN** `ios/LaneShadow/Views/Templates/IdleScreen.swift`
**WHEN** the `onToggleView` callback definition is inspected
**THEN** it contains an `os_log` or `Logger` call (not a bare `{}`)
**Verify:** `grep -A1 'onToggleView' ios/LaneShadow/Views/Templates/IdleScreen.swift | grep -c 'os_log\|Logger'` returns >= 1

### AC-2 — Existing tests still pass

**GIVEN** the logging stub
**WHEN** the idle test suite runs
**THEN** all tests pass
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Idle`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | onToggleView contains os_log or Logger call | AC-1 | edge |
| TC-2 | Existing tests pass | AC-2 | happy_path |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` (MODIFY — add logging to onToggleView)

**Write-Prohibited:**
- All other files

## Dependencies

**Depends on:** Sprint 07 components
**Blocks:** PLAN-S08-IOS-T04 (chat input + mode-toggle wiring will replace this stub)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN IdleScreen.swift WHEN onToggleView inspected THEN contains os_log or Logger call",
      "verify": "grep -A1 'onToggleView' ios/LaneShadow/Views/Templates/IdleScreen.swift | grep -c 'os_log\\|Logger'",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Views/Templates/IdleScreen.swift:121-123 contains Logger(...).info(...) inside onToggleView",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "232fd7da1543eb10cd3f1e7dc35343c443f2b0ad",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN logging stub WHEN idle tests run THEN all pass",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Idle",
      "satisfied": true,
      "evidence": "xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Features/Idle -> EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "232fd7da1543eb10cd3f1e7dc35343c443f2b0ad",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "onToggleView contains os_log or Logger",
      "verify": "grep -A1 'onToggleView' ios/LaneShadow/Views/Templates/IdleScreen.swift | grep -c 'os_log\\|Logger'",
      "satisfied": true,
      "evidence": "grep -A1 'onToggleView' ios/LaneShadow/Views/Templates/IdleScreen.swift | grep -c 'os_log\\|Logger' -> 1",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "232fd7da1543eb10cd3f1e7dc35343c443f2b0ad",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Existing tests pass",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Idle",
      "satisfied": true,
      "evidence": "xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Features/Idle -> EXIT_CODE:0",
      "remediation": null,
      "last_evaluated_cycle": 1,
      "last_evaluated_commit": "232fd7da1543eb10cd3f1e7dc35343c443f2b0ad",
      "maps_to_ac": "AC-2"
    }
  ]
}
-->
