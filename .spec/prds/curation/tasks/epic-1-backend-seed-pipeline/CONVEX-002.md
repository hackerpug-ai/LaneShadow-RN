================================================================================
TASK: CONVEX-002 - Add curation tables to Convex schema with indexes
================================================================================

TASK_TYPE: FEATURE
STATUS: Backlog
TDD_PHASE: RED
CURRENT_AC: AC-1
PRIORITY: P0
EFFORT: S
TYPE: DEV
ITERATION: 1

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** CONVEX-001 created the three validators (curatedRouteValidator, curatedRouteEnrichmentValidator, routeFeedbackValidator) in models/, but these tables do not yet exist in convex/schema.ts. Without schema registration, Convex cannot create the tables or accept writes, which blocks every downstream curation backend task.

**Why it matters:** The HTTP ingest endpoints (CONVEX-003) and the Python seed pipeline (PIPE-*) cannot write data until the tables are registered and indexes are provisioned. Missing indexes will force query-time filter() scans, violating the CONVEX-RULES "no filter()" guidance and causing the curation feed to regress in performance.

**Current state:** convex/schema.ts imports ~15 validators and registers their tables with indexes, following the pattern `defineTable(validator).index('by_x', ['x'])`. The three curation validators exist in models/ but are not imported or registered.

**Desired state:** convex/schema.ts imports the three curation validators and registers `curated_routes`, `curated_route_enrichments`, and `route_feedback` tables with the minimal index set described below. `npx convex dev --once` pushes the schema cleanly and generates updated `_generated/dataModel.d.ts` types.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: curated_routes table registered with 4 indexes
  GIVEN: convex/schema.ts imports curatedRouteValidator from models/curated-routes
  WHEN: the defineSchema default export is inspected
  THEN: it contains a `curated_routes` table defined via `defineTable(curatedRouteValidator)` with exactly these indexes: `by_source` on ["source"], `by_archetype` on ["primaryArchetype"], `by_state` on ["state"], and `by_composite_score` on ["compositeScore"]

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/schema.curation.test.ts
  TEST_FUNCTION: test_curated_routes_table_registered_with_indexes

AC-2: curated_route_enrichments table registered with by_routeId index
  GIVEN: convex/schema.ts imports curatedRouteEnrichmentValidator from models/curated-route-enrichments
  WHEN: the defineSchema default export is inspected
  THEN: it contains a `curated_route_enrichments` table defined via `defineTable(curatedRouteEnrichmentValidator)` with exactly one index: `by_routeId` on ["routeId"]

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/schema.curation.test.ts
  TEST_FUNCTION: test_curated_route_enrichments_table_registered_with_by_routeId

AC-3: route_feedback table registered with 3 indexes
  GIVEN: convex/schema.ts imports routeFeedbackValidator from models/route-feedback
  WHEN: the defineSchema default export is inspected
  THEN: it contains a `route_feedback` table defined via `defineTable(routeFeedbackValidator)` with exactly these indexes: `by_user` on ["userId"], `by_route` on ["routeId"], `by_action` on ["action"]

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/schema.curation.test.ts
  TEST_FUNCTION: test_route_feedback_table_registered_with_indexes

AC-4: convex dev --once pushes schema cleanly
  GIVEN: curated_routes, curated_route_enrichments, and route_feedback are all registered in convex/schema.ts
  WHEN: `npx convex dev --once` is executed from the repo root
  THEN: the command exits with code 0, prints successful schema deploy output, and regenerates convex/_generated/dataModel.d.ts to include the three new tables

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (integration gate — verified by orchestrator via EVIDENCE GATE 4)
  TEST_FUNCTION: n/a

Quality Criteria:
- [ ] All tests pass (one unit test per AC-1..AC-3, integration verification for AC-4)
- [ ] Lint passes with zero errors
- [ ] Type check passes (`npx tsc -p convex/tsconfig.json --noEmit`)
- [ ] `npx convex dev --once` exits 0
- [ ] RED evidence captured in task comments

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | convex/schema.ts imports curatedRouteValidator from ../models/curated-routes | AC-1 | `grep -n "curatedRouteValidator" convex/schema.ts` | [ ] TRUE [ ] FALSE |
| 2 | defineSchema exports a curated_routes table with indexes by_source, by_archetype, by_state, by_composite_score | AC-1 | `npx vitest run convex/__tests__/schema.curation.test.ts` | [ ] TRUE [ ] FALSE |
| 3 | defineSchema exports a curated_route_enrichments table with index by_routeId on ["routeId"] | AC-2 | `npx vitest run convex/__tests__/schema.curation.test.ts` | [ ] TRUE [ ] FALSE |
| 4 | defineSchema exports a route_feedback table with indexes by_user, by_route, by_action | AC-3 | `npx vitest run convex/__tests__/schema.curation.test.ts` | [ ] TRUE [ ] FALSE |
| 5 | `npx convex dev --once` exits with code 0 after schema registration | AC-4 | `npx convex dev --once` | [ ] TRUE [ ] FALSE |
| 6 | convex/_generated/dataModel.d.ts contains type entries for all three curation tables | AC-4 | `grep -n "curated_routes\|curated_route_enrichments\|route_feedback" convex/_generated/dataModel.d.ts` | [ ] TRUE [ ] FALSE |

TC-1: curated_routes indexes complete
  Statement: The defineSchema default export contains a `curated_routes` table whose index list equals exactly [by_source, by_archetype, by_state, by_composite_score]
  Maps To: AC-1
  Verify: `npx vitest run convex/__tests__/schema.curation.test.ts`
  Status: [ ] TRUE  [ ] FALSE

TC-2: curated_route_enrichments by_routeId index present
  Statement: The defineSchema default export contains a `curated_route_enrichments` table with a single index `by_routeId` on ["routeId"]
  Maps To: AC-2
  Verify: `npx vitest run convex/__tests__/schema.curation.test.ts`
  Status: [ ] TRUE  [ ] FALSE

TC-3: route_feedback indexes complete
  Statement: The defineSchema default export contains a `route_feedback` table whose index list equals exactly [by_user, by_route, by_action]
  Maps To: AC-3
  Verify: `npx vitest run convex/__tests__/schema.curation.test.ts`
  Status: [ ] TRUE  [ ] FALSE

TC-4: schema push clean
  Statement: `npx convex dev --once` exits 0 after the new tables are registered
  Maps To: AC-4
  Verify: `npx convex dev --once`
  Status: [ ] TRUE  [ ] FALSE

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. convex/schema.ts
   - Lines: 1-60
   - Focus: Existing import style for validators, `defineTable(validator).index('by_x', ['x'])` chain pattern, how multi-index tables are declared (org_memberships is the canonical 3-index example).

2. models/curated-routes.ts
   - Lines: ALL
   - Focus: curatedRouteValidator field names — especially `source`, `primaryArchetype`, `state`, `compositeScore` (indexed fields must be top-level scalars for Convex indexes)

3. models/curated-route-enrichments.ts
   - Lines: ALL
   - Focus: curatedRouteEnrichmentValidator `routeId` field type (must be v.string() for stable cross-table reference keyed on pipeline routeId)

4. models/route-feedback.ts
   - Lines: ALL
   - Focus: routeFeedbackValidator field names — `userId`, `routeId`, `action`

5. .spec/prds/curation/09-technical-requirements.md
   - Sections: S9-Data Schema, S9-TRD-7 Convex Backend
   - Focus: Which query patterns the curation feed performs, to confirm the minimal index set matches actual read patterns (single-field filter by source/archetype/state, sort by compositeScore)

6. brain/docs/CONVEX-RULES.md
   - Sections: Schema, Indexes, No filter()
   - Focus: Index naming convention (`by_fieldA_and_fieldB`), prohibition on runtime filter() in query code

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- convex/schema.ts
- convex/__tests__/schema.curation.test.ts (NEW)

WRITE-PROHIBITED:
- models/curated-routes.ts — frozen by CONVEX-001
- models/curated-route-enrichments.ts — frozen by CONVEX-001
- models/route-feedback.ts — frozen by CONVEX-001
- convex/http.ts — HTTP endpoints are CONVEX-003
- convex/curationAdmin.ts — CONVEX-003
- Any file not explicitly listed above

MUST:
- [ ] Follow existing import + defineTable().index() chain style from convex/schema.ts
- [ ] Use snake_case for Convex table names (curated_routes, curated_route_enrichments, route_feedback)
- [ ] Use camelCase for index field references (primaryArchetype, compositeScore, routeId, userId)
- [ ] Register exactly the indexes listed in the scope — no more, no fewer
- [ ] Write the unit tests that inspect the schema export BEFORE modifying schema.ts (RED first)
- [ ] Run `npx convex dev --once` once as the final AC-4 verification

MUST NOT:
- [ ] Add indexes beyond the minimal set (fuller discovery indexes belong to a later task)
- [ ] Modify the validator shape in models/ (frozen by CONVEX-001)
- [ ] Introduce composite indexes in this task
- [ ] Run `npx convex dev` without `--once` (leaves a watcher running)
- [ ] Skip RED phase for AC-1..AC-3

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Source: `convex/schema.ts` lines 29-42 (existing users / saved_routes / org_memberships patterns)

```typescript
// Add to the imports block at the top of convex/schema.ts:
import { curatedRouteValidator } from '../models/curated-routes'
import { curatedRouteEnrichmentValidator } from '../models/curated-route-enrichments'
import { routeFeedbackValidator } from '../models/route-feedback'

// Inside defineSchema({ ... }):
curated_routes: defineTable(curatedRouteValidator)
  .index('by_source', ['source'])
  .index('by_archetype', ['primaryArchetype'])
  .index('by_state', ['state'])
  .index('by_composite_score', ['compositeScore']),

curated_route_enrichments: defineTable(curatedRouteEnrichmentValidator)
  .index('by_routeId', ['routeId']),

route_feedback: defineTable(routeFeedbackValidator)
  .index('by_user', ['userId'])
  .index('by_route', ['routeId'])
  .index('by_action', ['action']),
```

```typescript
// convex/__tests__/schema.curation.test.ts
import schema from '../schema'

describe('curation schema registration', () => {
  test('curated_routes has all required indexes', () => {
    const tables = (schema as any).tables
    const table = tables.curated_routes
    expect(table).toBeDefined()
    const indexNames = table.indexes.map((i: any) => i.indexDescriptor)
    expect(indexNames).toEqual(
      expect.arrayContaining(['by_source', 'by_archetype', 'by_state', 'by_composite_score'])
    )
  })
})
```

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: convex-implementer

## FOR EACH ACCEPTANCE CRITERION (AC-1..AC-3):

### RED PHASE
  READ: Current AC, convex/schema.ts for pattern, the target model validator
  WRITE: ONE test in convex/__tests__/schema.curation.test.ts that inspects the defineSchema export
  RUN: npx vitest run convex/__tests__/schema.curation.test.ts --reporter=verbose
  VERIFY: Test FAILS because the table is not yet registered
  RETURN: { phase: "RED", test_file, test_function, failure_output }

  MUST: Show actual test failure output
  MUST NOT: Touch convex/schema.ts yet

### GREEN PHASE (after orchestrator VERIFY_RED passes)
  READ: Failing test, convex/schema.ts imports + defineSchema block
  WRITE: Minimal schema.ts edit — import the validator and register the table with its indexes
  RUN: npx vitest run convex/__tests__/schema.curation.test.ts --reporter=verbose
  VERIFY: Test PASSES
  RETURN: { phase: "GREEN", files_changed, test_output }

  MUST: Only add the indexes required by the current AC
  MUST NOT: Add unrelated indexes, edit other tables, or touch models/

### REFACTOR PHASE (after orchestrator VERIFY_GREEN passes)
  READ: schema.ts diff
  WRITE: Tidy import grouping / comment block if needed
  RUN: npx vitest run convex/__tests__/ --reporter=verbose
  VERIFY: All tests still pass
  RETURN: { phase: "REFACTOR", files_changed, still_passing }

## AFTER AC-1..AC-3 COMPLETE — RUN AC-4 INTEGRATION GATE:
  RUN: npx convex dev --once
  VERIFY: Exit code 0, successful deploy output, dataModel.d.ts regenerated
  RETURN: { phase: "INTEGRATION", command_output, exit_code }

## AFTER ALL ACs COMPLETE:
  Orchestrator dispatches convex-reviewer

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER RED PHASE (each AC):
  RUN: npx vitest run convex/__tests__/schema.curation.test.ts --reporter=verbose
  EXPECT: Exit code != 0, test failure for the new test
  IF PASS: Reject "Vanity test — schema already contained the table"
  IF ERROR: Reject "Test has syntax/import error, not a valid failure"

AFTER GREEN PHASE (each AC):
  RUN: npx vitest run convex/__tests__/schema.curation.test.ts --reporter=verbose
  EXPECT: Exit code 0
  IF FAIL: Return to agent with failure output

AFTER AC-4 INTEGRATION:
  RUN: npx convex dev --once
  EXPECT: Exit code 0, "Schema validated" output
  RUN: grep -q "curated_routes" convex/_generated/dataModel.d.ts
  EXPECT: Exit code 0

AFTER REFACTOR PHASE:
  RUN: npx vitest run convex/__tests__/ --reporter=verbose && npx convex dev --once
  EXPECT: Both exit 0

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: convex-implementer
**Rationale**: Task edits convex/schema.ts — core Convex schema work using defineTable + index chaining. convex-implementer owns the schema DSL and knows the project's table-naming conventions.

**Review Agent**: convex-reviewer
**Rationale**: Review must confirm correct index naming, minimal index set, no runtime filter() introduction, and clean `convex dev --once` push. convex-reviewer owns these conventions.

**Assignment Date**: 2026-04-11

**Agent Pairing**: Standard implementer-reviewer pairing per brain/docs/kanban/agent-assignment.md

**Assignment Logic**:
- Task Type: FEATURE (DEV)
- File Patterns: convex/schema.ts, convex/__tests__/*.ts
- Implementation: convex-implementer
- Review: convex-reviewer

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Unit Tests Pass
  Command: npx vitest run convex/__tests__/schema.curation.test.ts --reporter=verbose
  Expected: Exit 0, 3 tests pass (one per AC-1..AC-3)

Gate 2: Each AC Has Test
  Verify: convex/__tests__/schema.curation.test.ts contains tests for curated_routes, curated_route_enrichments, route_feedback

Gate 3: RED Phase Evidence
  Required: Task comments show each test failed before schema.ts was modified

Gate 4: Schema Push Clean
  Command: npx convex dev --once
  Expected: Exit 0

Gate 5: Generated Types Include New Tables
  Command: grep -n "curated_routes\|curated_route_enrichments\|route_feedback" convex/_generated/dataModel.d.ts
  Expected: At least one hit per table

Gate 6: Type Check
  Command: npx tsc -p convex/tsconfig.json --noEmit
  Expected: Exit 0

Gate 7: Lint
  Command: npx eslint convex/schema.ts convex/__tests__/schema.curation.test.ts
  Expected: Exit 0

Gate 8: Scope Compliance
  Command: git diff --name-only
  Expected: Only convex/schema.ts, convex/__tests__/schema.curation.test.ts, and convex/_generated/** (regenerated)

--------------------------------------------------------------------------------
REVIEW CRITERIA (for convex-reviewer)
--------------------------------------------------------------------------------

TDD Quality:
- [ ] One unit test per AC-1..AC-3
- [ ] Tests inspect the schema export, not re-declare the validators
- [ ] RED evidence captured
- [ ] Minimal index set (no gold-plated indexes)

Code Quality:
- [ ] Imports grouped consistently with existing schema.ts style
- [ ] Table names are snake_case, index names are `by_<camelCaseField>`
- [ ] No runtime filter() calls introduced anywhere

Domain-Specific:
- [ ] curated_routes has exactly 4 indexes: by_source, by_archetype, by_state, by_composite_score
- [ ] curated_route_enrichments has exactly 1 index: by_routeId
- [ ] route_feedback has exactly 3 indexes: by_user, by_route, by_action
- [ ] `npx convex dev --once` exits 0 with the new tables present in _generated/dataModel.d.ts
- [ ] `curatedRoutes.enrichmentVersion` being `v.optional(v.number())` does not block schema push (optional accepts missing, not explicit null)

Security:
- [ ] No credentials touched
- [ ] No schema fields exposing PII beyond userId foreign key (route_feedback)

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

Feedback (required if NEEDS_FIXES):
```
[Reviewer documents specific, actionable issues here]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- CONVEX-001 — validators must exist in models/ before they can be imported

Blocks:
- CONVEX-003 — HTTP ingest endpoints write to these tables
- PIPE-* tasks that upload seed data via CONVEX-003 endpoints

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [x] CONVEX-001 merged to main (commit 0d67ee3)
- [ ] `npx convex dev --once` runs clean against current main (baseline check)

Can Execute In Parallel With: CONVEX-008, PIPE-001

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- The index set registered here is the deliberate MINIMAL set per user task spec. A later task will add the richer discovery index set: `by_state_and_archetype`, `by_archetype_and_score`, `by_centroid` (spatial), and a Convex searchIndex over name/oneLiner/summary. Do not pre-empt that work here.
- `route_feedback.by_action` is a low-cardinality index (only 4 possible literal values). It is acceptable for admin-style aggregate queries but is not a good feed-serving index. A future task may replace it with a composite `by_action_and_timestamp` once real query patterns are known.
- `curated_routes.enrichmentVersion` is `v.optional(v.number())` in the committed validator. Convex treats optional as "may be missing," not "may be null" — the reviewer should confirm the schema pushes cleanly and that seed documents simply omit the field until enrichment runs.
- Table name style: Convex project convention in this repo uses snake_case table names (see `saved_routes`, `org_memberships`, `osm_nodes`). Follow that convention.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================