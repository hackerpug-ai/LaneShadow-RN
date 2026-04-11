================================================================================
TASK: CONVEX-001 - Create curated routes model validators
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

**Problem:** The curation feature requires three new Convex tables (curated_routes, curated_route_enrichments, route_feedback) but no typed validators exist for them yet. The schema.ts file imports validators from models/ files, following the validator-first pattern established in the codebase.

**Why it matters:** Without validators, the Convex schema cannot define the curation tables. Every downstream task (schema registration, HTTP endpoints, sync) depends on these types being correct.

**Current state:** No curation model files exist. The codebase uses a validator-first pattern (see models/osm-data.ts) where typed validators are defined in models/ and imported into convex/schema.ts.

**Desired state:** Three new model files export typed validators for the three curation tables, with all field names matching the PRD schema exactly (S9-Data Schema in 09-technical-requirements.md).

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: curatedRouteValidator has all 20+ lean fields
  GIVEN: the models/curated-routes.ts file is imported
  WHEN: the curatedRouteValidator is inspected
  THEN: it contains all 20+ fields defined in the PRD lean tier schema: routeId, name, state, source (union of 5 literals), primaryArchetype (union of 6 literals), secondaryTags, centroidLat, centroidLng, boundsNeLat, boundsNeLng, boundsSwLat, boundsSwLng, lengthMiles, compositeScore, curvatureScore, scenicScore, technicalScore, trafficScore, remotenessScore, oneLiner, summary, badges, season (union of 4 literals), contentVersion, enrichmentVersion, seededAt

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: models/__tests__/curated-routes.test.ts
  TEST_FUNCTION: test_curatedRouteValidator_has_all_lean_fields

AC-2: enrichmentValidator handles nested photo/source objects
  GIVEN: the models/curated-route-enrichments.ts file is imported
  WHEN: the curatedRouteEnrichmentValidator is inspected
  THEN: it contains all fields from the PRD rich tier schema including nested photos array (url, caption, attribution), sources array (site, url, lastFetched, extractionConfidence), recommendedStarts array, fuelStops array, and all scalar fields (routeId, fullDescription, history, roadClassification, surfaceMaterial, totalElevationGainM, elevationProfile, nearestCities, ridershipLevel, seasonalNotes, safetyWarnings, gpxUrl, extractedBy, extractedAt, extractionSchemaVersion, enrichmentVersion, lastEnrichedAt)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: models/__tests__/curated-route-enrichments.test.ts
  TEST_FUNCTION: test_enrichmentValidator_has_nested_photo_source_objects

AC-3: feedbackValidator has action union
  GIVEN: the models/route-feedback.ts file is imported
  WHEN: the routeFeedbackValidator is inspected
  THEN: it contains all fields from the PRD feedback schema: routeId, userId, action (union of 4 literals: "save", "hide", "complete", "rate"), rating (optional number), locationLat (optional number), locationLng (optional number), archetypeFilter (optional string), timestamp

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: models/__tests__/route-feedback.test.ts
  TEST_FUNCTION: test_feedbackValidator_has_action_union

Quality Criteria:
- [ ] All tests pass (one test per AC minimum)
- [ ] Lint passes with zero errors
- [ ] Type check passes
- [ ] RED evidence in Linear comments

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | curatedRouteValidator exports an object with 20+ fields matching PRD lean tier schema when imported | AC-1 | `npx vitest run models/__tests__/curated-routes.test.ts` | [ ] TRUE  [ ] FALSE |
| 2 | curatedRouteValidator source field accepts exactly 5 literal values (fhwa, motorcycleroads, bestbikingroads, bdr, editorial) when validated | AC-1 | `npx vitest run models/__tests__/curated-routes.test.ts` | [ ] TRUE  [ ] FALSE |
| 3 | curatedRouteEnrichmentValidator exports nested photo objects with url, caption, attribution fields when imported | AC-2 | `npx vitest run models/__tests__/curated-route-enrichments.test.ts` | [ ] TRUE  [ ] FALSE |
| 4 | curatedRouteEnrichmentValidator exports nested source objects with site, url, lastFetched, extractionConfidence fields when imported | AC-2 | `npx vitest run models/__tests__/curated-route-enrichments.test.ts` | [ ] TRUE  [ ] FALSE |
| 5 | routeFeedbackValidator action field accepts exactly 4 literal values (save, hide, complete, rate) when validated | AC-3 | `npx vitest run models/__tests__/route-feedback.test.ts` | [ ] TRUE  [ ] FALSE |
| 6 | routeFeedbackValidator rating field is optional (nullable) when validated | AC-3 | `npx vitest run models/__tests__/route-feedback.test.ts` | [ ] TRUE  [ ] FALSE |

TC-1: curatedRouteValidator lean fields complete
  Statement: curatedRouteValidator contains all 20+ lean fields from the PRD schema when the validator object is inspected
  Maps To: AC-1
  Verify: `npx vitest run models/__tests__/curated-routes.test.ts`
  Status: [ ] TRUE  [ ] FALSE

TC-2: enrichmentValidator nested structures correct
  Statement: curatedRouteEnrichmentValidator contains nested photo and source object arrays when the validator object is inspected
  Maps To: AC-2
  Verify: `npx vitest run models/__tests__/curated-route-enrichments.test.ts`
  Status: [ ] TRUE  [ ] FALSE

TC-3: feedbackValidator action union correct
  Statement: routeFeedbackValidator action field accepts exactly 4 literal string values when validated
  Maps To: AC-3
  Verify: `npx vitest run models/__tests__/route-feedback.test.ts`
  Status: [ ] TRUE  [ ] FALSE

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. models/osm-data.ts
   - Lines: ALL
   - Focus: Validator-first pattern using v.object(), v.union(v.literal(...)), exported validators

2. convex/schema.ts
   - Lines: 1-20
   - Focus: Import pattern for model validators, how defineTable consumes them

3. .spec/prds/curation/09-technical-requirements.md
   - Sections: Data Schema (curated_routes, curated_route_enrichments, route_feedback)
   - Focus: Exact field names, types, and literal values for all three validators

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- models/curated-routes.ts (NEW)
- models/curated-route-enrichments.ts (NEW)
- models/route-feedback.ts (NEW)
- models/__tests__/curated-routes.test.ts (NEW)
- models/__tests__/curated-route-enrichments.test.ts (NEW)
- models/__tests__/route-feedback.test.ts (NEW)

WRITE-PROHIBITED:
- convex/schema.ts - schema registration is CONVEX-002
- convex/http.ts - HTTP endpoints are CONVEX-003
- models/osm-data.ts - existing file, not to be modified
- Any file not explicitly listed above

MUST:
- [x] Follow existing code patterns from models/osm-data.ts
- [x] Use v.union(v.literal(...)) for source, archetype, season, and action enums
- [x] Field names match PRD schema exactly (camelCase)
- [x] Export typed validators as named exports
- [x] One test per acceptance criterion
- [x] Tests verify behavior, not implementation

MUST NOT:
- [x] Use v.any() where a specific type is known
- [x] Write implementation before test fails
- [x] Add features beyond AC requirements
- [x] Use filter() instead of indexes (not applicable here, but noted)
- [x] Modify unrelated files

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

```typescript
// Pattern from models/osm-data.ts
import { v } from "convex/values";

export const CURATED_ROUTE_FIELDS = {
  routeId: v.string(),
  name: v.string(),
  state: v.string(),
  source: v.union(
    v.literal("fhwa"),
    v.literal("motorcycleroads"),
    v.literal("bestbikingroads"),
    v.literal("bdr"),
    v.literal("editorial")
  ),
  primaryArchetype: v.union(
    v.literal("twisties"),
    v.literal("mountain"),
    v.literal("coastal"),
    v.literal("adventure"),
    v.literal("scenic_byway"),
    v.literal("desert")
  ),
  // ... remaining fields
} as const;

export const curatedRouteValidator = v.object(CURATED_ROUTE_FIELDS);
```

```typescript
// Test pattern
import { curatedRouteValidator } from '../curated-routes';
import { v } from 'convex/values';

describe('curatedRouteValidator', () => {
  test('has all lean fields', () => {
    // GIVEN: validator is imported
    // WHEN: inspect the fields property
    // THEN: all required fields exist
    const fields = Object.keys(CURATED_ROUTE_FIELDS);
    expect(fields).toContain('routeId');
    expect(fields).toContain('compositeScore');
    // ... etc
  });
});
```

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: convex-implementer

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ: Current AC definition, models/osm-data.ts for pattern, PRD schema
  WRITE: ONE test that exercises GIVEN-WHEN-THEN
  RUN: npx vitest run models/__tests__/curated-routes.test.ts --reporter=verbose
  VERIFY: Test FAILS (not errors - fails)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

  MUST: Show actual test failure output
  MUST NOT: Write ANY implementation code yet

### GREEN PHASE (after orchestrator VERIFY_RED passes)
  READ: Failing test, AC definition, models/osm-data.ts pattern
  WRITE: MINIMAL code to make test pass
  RUN: npx vitest run models/__tests__/curated-routes.test.ts --reporter=verbose
  VERIFY: Test PASSES
  RETURN: { phase: "GREEN", files_changed, test_output }

  MUST: Only write enough code to pass
  MUST NOT: Add features beyond test requirements

### REFACTOR PHASE (after orchestrator VERIFY_GREEN passes)
  READ: Implementation just written
  WRITE: Improved code (if needed)
  RUN: npx vitest run models/__tests__/ --reporter=verbose
  VERIFY: Tests still pass
  RETURN: { phase: "REFACTOR", files_changed, still_passing }

  MUST: Keep tests green
  MUST NOT: Add new behavior

## AFTER ALL ACs COMPLETE:
  Orchestrator dispatches convex-reviewer

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

After each agent phase, orchestrator MUST verify independently:

AFTER RED PHASE:
  RUN: npx vitest run models/__tests__/curated-routes.test.ts --reporter=verbose
  EXPECT: Exit code != 0, test failure for new test
  IF PASS: Reject "Vanity test - test passes without implementation"
  IF ERROR: Reject "Test has syntax/import error, not valid failure"
  COMMENT: Post VERIFY_RED result to Linear

AFTER GREEN PHASE:
  RUN: npx vitest run models/__tests__/ --reporter=verbose
  EXPECT: Exit code 0, all tests pass
  IF FAIL: Return to agent with failure output
  COMMENT: Post VERIFY_GREEN result to Linear

AFTER REFACTOR PHASE:
  RUN: npx vitest run models/__tests__/ --reporter=verbose
  EXPECT: Exit code 0, all tests still pass
  IF FAIL: Return to agent with failure output
  COMMENT: Post result to Linear, advance to next AC or REVIEW

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: convex-implementer
**Rationale**: Task creates Convex model validators following the validator-first pattern. convex-implementer knows Convex value validator API and the project's model conventions.

**Review Agent**: convex-reviewer
**Rationale**: Review should verify correct use of v.union/v.literal for enums, field name alignment with PRD schema, and adherence to the models/osm-data.ts pattern.

**Assignment Date**: 2026-04-10

**Agent Pairing**: This task follows standard agent-reviewer pairing per brain/docs/kanban/agent-assignment.md

**Assignment Logic**:
- Task Type: FEATURE (DEV)
- File Patterns: models/*.ts (Convex validators)
- Implementation: convex-implementer — creates typed validators for Convex tables
- Review: convex-reviewer — validates enum completeness and schema correctness

**Override**: If manual agent assignment is needed, specify agents in task labels

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All Tests Pass
  Command: npx vitest run models/__tests__/ --reporter=verbose
  Expected: Exit 0, all tests pass

Gate 2: Each AC Has Test
  Verify: Test files contain one test per AC across 3 test files

Gate 3: RED Phase Evidence
  Required: Linear comments show each test failed before implementation

Gate 4: Type Check
  Command: npx convex typecheck
  Expected: Exit 0

Gate 5: Lint
  Command: npx eslint models/curated-routes.ts models/curated-route-enrichments.ts models/route-feedback.ts
  Expected: Exit 0

Gate 6: Scope Compliance
  Command: git diff --name-only
  Expected: Only models/curated-routes.ts, models/curated-route-enrichments.ts, models/route-feedback.ts, and their test files

--------------------------------------------------------------------------------
REVIEW CRITERIA (for convex-reviewer)
--------------------------------------------------------------------------------

TDD Quality:
- [ ] One test per acceptance criterion
- [ ] Tests verify behavior, not implementation
- [ ] RED evidence in Linear comments
- [ ] Minimal implementation (no gold-plating)

Code Quality:
- [ ] Pattern consistent with models/osm-data.ts
- [ ] No unnecessary duplication
- [ ] All enums use v.union(v.literal(...)) — no v.string() where literal is known

Domain-Specific:
- [ ] Source literals: fhwa, motorcycleroads, bestbikingroads, bdr, editorial
- [ ] Archetype literals: twisties, mountain, coastal, adventure, scenic_byway, desert
- [ ] Season literals: year_round, apr_nov, may_sep, spring_fall
- [ ] Feedback action literals: save, hide, complete, rate
- [ ] Field names match PRD schema exactly (camelCase)
- [ ] enrichmentVersion is v.optional(v.number()) in curated_routes (null = not yet enriched)
- [ ] rating is optional in route_feedback

Security (if applicable):
- [ ] No credential exposure
- [ ] Input validation present (validators ARE the validation)
- [ ] No injection vulnerabilities

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

Feedback (required if NEEDS_FIXES):
```
[Reviewer documents specific, actionable issues here]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- (none — this is the first task)

Blocks:
- CONVEX-002 - needs validators to register tables in schema
- CONVEX-003 - needs validators for HTTP endpoint request validation

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] models/osm-data.ts exists (exists on main)
- [ ] PRD section S9-Data Schema reviewed

Can Execute In Parallel With: CONVEX-008, PIPE-001

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- This is the foundational task for the entire curation backend. Field names must match the PRD exactly because downstream Python pipeline code and mobile client code will reference these names.
- The validator-first pattern (define validators in models/, import into schema.ts) is a project convention. See models/osm-data.ts for the canonical example.
- Season literals use underscores (year_round, apr_nov, etc.) to match Python pipeline conventions.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
