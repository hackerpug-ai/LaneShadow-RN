# Add error codes and model field extensions for agentic system

> Status: COMPLETE (2026-04-04)

> Task ID: US-008
> Type: INFRA
> Priority: P0
> Estimate: 30 minutes
> Assignee: backend-engineer

## CRITICAL CONSTRAINTS

### MUST
- Add `AGENTIC_PARSE_FAILED`, `PLAN_LIMIT_EXCEEDED`, `SESSION_NOT_FOUND` to `convex/errors.ts`
- Add `nlpText: v.optional(v.string())` to `planInputValidator` in `models/saved-routes.ts`
- Add `phase: v.optional(routePlanPhaseValidator)` to `routePlanValidator` in `models/route-plans.ts` with 4 phase values: 'reading', 'finding', 'weather', 'building'

### NEVER
- Remove or modify existing error codes
- Change existing field types — only additive changes

### STRICTLY
- All changes are additive optional fields — no migration needed

## SPECIFICATION

**Objective:** Extend the error system and data models to support the agentic conversational planning pipeline.

**Success looks like:** TypeScript compilation succeeds, all existing tests pass, new error codes and validators are available for use by downstream tasks.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | New error codes added | Errors are imported | AGENTIC_PARSE_FAILED, PLAN_LIMIT_EXCEEDED, SESSION_NOT_FOUND available | Code review |
| 2 | nlpText added to planInputValidator | Existing route plans | Remain valid (optional field) | Existing tests pass |
| 3 | phase added to routePlanValidator | Existing route plans | Remain valid (optional field) | Existing tests pass |
| 4 | All changes compile | TypeScript check | Zero errors | `pnpm typecheck` exits 0 |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | TypeScript compilation succeeds | AC-4 | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |
| 2 | Existing tests pass | AC-2, AC-3 | `pnpm test` exits 0 | [ ] TRUE [ ] FALSE |
| 3 | New error codes are exported | AC-1 | `grep "AGENTIC_PARSE_FAILED" convex/errors.ts` finds match | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/errors.ts` (MODIFY — add new error codes)
- `models/saved-routes.ts` (MODIFY — add nlpText to planInputValidator)
- `models/route-plans.ts` (MODIFY — add phase validator and field)

### WRITE-PROHIBITED
- `convex/schema.ts` (no table-level changes in this task)
- Any test files (existing tests must pass without modification)

## DESIGN

### References
- PRD 07-technical-backend.md §2.1, §2.5

### Code Pattern
```typescript
// convex/errors.ts
export const AGENTIC_PARSE_FAILED = 'AGENTIC_PARSE_FAILED';
export const PLAN_LIMIT_EXCEEDED = 'PLAN_LIMIT_EXCEEDED';
export const SESSION_NOT_FOUND = 'SESSION_NOT_FOUND';

// models/route-plans.ts
export const routePlanPhaseValidator = v.union(
  v.literal('reading'),
  v.literal('finding'),
  v.literal('weather'),
  v.literal('building'),
);
```

### Anti-pattern (DO NOT)
- Do not create new error classes — follow existing pattern in convex/errors.ts
- Do not make any field required that is currently optional

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
No task dependencies.

## NOTES
- `nlpText` on `PlanInput` propagates to `route_plans.planInput` and `saved_routes.planInput` without schema changes to either table
- Phase field enables the client to show progress indicators during route planning
