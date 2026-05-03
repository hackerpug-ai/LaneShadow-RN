================================================================================
TASK: CHAT-S04-R15 - Fix completeEnrichment silent no-op when enrichments arg absent
================================================================================

TASK_TYPE:  BUGFIX
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  test:      cd server && pnpm test -- routeEnrichments
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched server/convex/db/routeEnrichments.ts
  build:     pnpm --dir server run convex:dev -- --once

PROGRESS: 0/3 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`completeEnrichment` mutation no longer silently no-ops when `enrichments` arg is absent. Row status transitions from PENDING to a terminal state (FAILED or COMPLETED with empty entries) instead of hanging forever.

--------------------------------------------------------------------------------
SOURCE
--------------------------------------------------------------------------------

Finding F-13 from red-hat round-1 review (2026-05-03T14:19:50Z), verified still open in round-2 (2026-05-03T21:43:36Z):
- `routeEnrichments.ts:410-416` wraps handler in `if (args.enrichments) { ... }`
- When `enrichments` is `undefined`, mutation returns `null` without touching the row
- Row stays PENDING forever — enrichment pipeline can silently fail

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST handle the case where `args.enrichments` is undefined or empty
- MUST transition the row to a terminal state (FAILED or COMPLETED with empty entries) when enrichments are absent
- MUST NOT break the happy path where enrichments are provided
- NEVER silently return null without updating row status

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] completeEnrichment handles absent enrichments arg gracefully (AC-1)
- [ ] Row status transitions to terminal state when enrichments absent (AC-2)
- [ ] Happy path (enrichments present) still works (AC-3)
- [ ] `cd server && pnpm test -- routeEnrichments` passes
- [ ] `pnpm --dir server run convex:dev -- --once` clean

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: completeEnrichment handles absent enrichments arg gracefully
  GIVEN: A route enrichment row exists in PENDING status
  WHEN:  completeEnrichment is called with enrichments = undefined or not provided
  THEN:  The mutation updates the row (does NOT return null silently)

AC-2: Row status transitions to terminal state when enrichments absent
  GIVEN: A route enrichment row exists in PENDING status
  WHEN:  completeEnrichment is called without enrichments
  THEN:  Row status becomes FAILED (or COMPLETED with empty entries) — NOT PENDING

AC-3: Happy path still works
  GIVEN: A route enrichment row exists in PENDING status with valid forecast data
  WHEN:  completeEnrichment is called with enrichments payload
  THEN:  Row status becomes COMPLETED with entries populated

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- server/convex/db/routeEnrichments.ts (MODIFY — fix no-op branch)
- server/convex/db/routeEnrichments.test.ts (MODIFY — add test for absent enrichments)

writeProhibited:
- server/convex/_generated/**
- ios/** + android/**

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     (none — independent correctness fix)

================================================================================
