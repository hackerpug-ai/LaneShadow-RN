# Run verification gates and fix remaining issues

> Task ID: US-004
> Type: INFRA
> Priority: P0
> Estimate: 60 minutes
> Assignee: infrastructure-engineer

## CRITICAL CONSTRAINTS

### MUST
- Run `pnpm typecheck` and fix all type errors
- Run `pnpm lint` and fix all lint violations
- Run `pnpm dev:client` and verify web platform loads without errors
- All fixes must be scoped to issues introduced or revealed by US-001, US-002, US-003

### NEVER
- Fix pre-existing issues unrelated to Phase 0 changes
- Suppress or disable lint rules to pass gates

### STRICTLY
- This task cannot begin until US-001, US-002, and US-003 are complete

## SPECIFICATION

**Objective:** Validate that all Phase 0 remediation changes compile, lint, and run correctly on web platform.

**Success looks like:** `pnpm typecheck && pnpm lint` exits 0. `pnpm dev:client` loads without errors.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | US-001, US-002, US-003 are complete | `pnpm typecheck` is run | Zero type errors | `pnpm typecheck` exits 0 |
| 2 | US-001, US-002, US-003 are complete | `pnpm lint` is run | Zero lint violations | `pnpm lint` exits 0 |
| 3 | US-001, US-002, US-003 are complete | `pnpm dev:client` is run | Web platform loads without errors | Manual verification in browser |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | TypeScript compilation succeeds with zero errors | AC-1 | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |
| 2 | Lint passes with zero violations | AC-2 | `pnpm lint` exits 0 | [ ] TRUE [ ] FALSE |
| 3 | Web client loads without console errors | AC-3 | `pnpm dev:client` — no errors | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- Any file that has type or lint errors caused by US-001, US-002, US-003 changes (MODIFY)

### WRITE-PROHIBITED
- Files unrelated to Phase 0 remediation

## DESIGN

### References
- N/A

### Code Pattern
N/A

### Anti-pattern (DO NOT)
- Do not add `@ts-ignore` or `eslint-disable` comments to pass gates

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
- US-001: Replace @expo/vector-icons imports
- US-002: Replace React Native Text imports
- US-003: Replace hardcoded map colors

## NOTES
- This is the final gate task for Epic 1. All subsequent epics are blocked until this passes.
- If issues are found, fix them in the same PR — do not create follow-up tickets for Phase 0 issues.
