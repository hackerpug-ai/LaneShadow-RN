# FIX-S08-CVX-T03 — Convex: add warn-log to empty failed-variant loop in planRideOrchestrator

> **Task ID:** FIX-S08-CVX-T03 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** convex-implementer · **Estimate:** 15 min · **Type:** INFRA · **Status:** Backlog · **Priority:** P2 · **Effort:** S
> **PRD Refs:** red-hat review 2026-05-19 finding F13

## Background

Red-hat review found `server/convex/actions/agent/lib/planRideOrchestrator.ts:78-80` contains `for (const _f of failed) { }` — an empty loop body. When all route variants fail, the thrown `NO_ROUTES_GENERATED` is the only visible signal; the individual variant failures are silently dropped. Production debugging is blind.

Add a `console.warn` (or the project's structured backend logger if present) inside the loop body to record each failed variant's reason. This is a one-line debug improvement.

## Critical Constraints

**MUST:**
- Add a single `console.warn(...)` call inside the loop body that logs at minimum the variant index, error code, and error message (or whatever fields the `_f` object exposes)
- Rename `_f` to `failedVariant` since it is now used
- Preserve the surrounding error-throw and control flow

**NEVER:**
- Throw inside the loop; the rethrow at the end of the surrounding flow is the authoritative failure signal
- Swallow the thrown error or replace `NO_ROUTES_GENERATED` with a different code

**STRICTLY:**
- One line of logging; do not introduce a new logging utility or restructure the error handling

## Specification

**Objective:** Make individual variant failures observable for production debugging.

**Success State:** Running an agent flow where all variants fail emits a warn-log line per variant in Convex logs (`pnpm convex logs --tail`).

## Acceptance Criteria

### AC-1 — Loop body contains a warn-log
**GIVEN** `server/convex/actions/agent/lib/planRideOrchestrator.ts`
**WHEN** the file is read
**THEN** the previously empty `for (const _f of failed)` body contains a `console.warn(...)` (or structured logger) call including variant identifier and error reason; `_f` is renamed to `failedVariant`
**Verify:** `grep -A 3 "for (const failedVariant of failed)" server/convex/actions/agent/lib/planRideOrchestrator.ts | grep -E "console\.warn|backend\.warn"`

### AC-2 — Existing failure-path test still passes
**GIVEN** existing `planRideOrchestrator` failure tests
**WHEN** the suite is run
**THEN** all pre-existing tests pass; the rethrow behavior is unchanged
**Verify:** `pnpm --filter @laneshadow/server test -- planRideOrchestrator`

### AC-3 — Live failure invocation produces logs
**GIVEN** a forced all-variants-fail scenario (e.g., via mocked routing failure)
**WHEN** the agent runs
**THEN** Convex logs contain at least one warn line per failed variant
**Verify:** unit test asserting `console.warn` is invoked N times for N failed variants

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Loop body contains `console.warn` (or structured logger) call | AC-1 | edge |
| TC-2 | Existing failure tests pass after change | AC-2 | happy_path |
| TC-3 | Forced N-variant failure invokes warn N times | AC-3 | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `server/convex/actions/agent/lib/planRideOrchestrator.ts` | 70-95 | Empty loop body site |
| Existing tests for `planRideOrchestrator` | discover via `find server -name '*planRide*test*'` | Preserve regression |

## Guardrails

**Write-Allowed:**
- `server/convex/actions/agent/lib/planRideOrchestrator.ts` (MODIFY — add warn log)
- A relevant test file under `server/convex/actions/agent/__tests__/` (MODIFY/ADD — unit test for warn invocation)

**Write-Prohibited:**
- Any other file

## Design

**References:** red-hat review 2026-05-19 finding F13

**Pattern:** Use `console.warn` if no structured backend logger is wired; otherwise use the project's existing logger module (search first)

**Anti-Pattern:** Empty loop bodies silently dropping iteration values

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -A 3 "for (const failedVariant of failed)" server/convex/actions/agent/lib/planRideOrchestrator.ts` |
| AC-2 | `pnpm --filter @laneshadow/server test -- planRideOrchestrator` |
| AC-3 | unit test (see test file under `__tests__/`) |

## Agent Assignment

**Agent:** convex-implementer
**Rationale:** Trivial debug log addition; ~5 lines of code change.

## Coding Standards

- `brain/docs/coding-standards/typescript.md`

## Dependencies

**Depends on:** —
**Blocks:** —

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Loop body contains warn log", "verify": "grep -A 3 'for (const failedVariant of failed)' server/convex/actions/agent/lib/planRideOrchestrator.ts", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Existing failure tests pass", "verify": "pnpm --filter @laneshadow/server test -- planRideOrchestrator", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Forced N-variant failure invokes warn N times", "verify": "unit test asserts warn invocation count", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "Loop body contains warn call", "verify": "grep -A 3 'for (const failedVariant of failed)' server/convex/actions/agent/lib/planRideOrchestrator.ts", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Existing failure-path tests pass", "verify": "pnpm --filter @laneshadow/server test -- planRideOrchestrator", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Warn invoked N times for N failed variants", "verify": "unit test", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" }
  ]
}
-->
