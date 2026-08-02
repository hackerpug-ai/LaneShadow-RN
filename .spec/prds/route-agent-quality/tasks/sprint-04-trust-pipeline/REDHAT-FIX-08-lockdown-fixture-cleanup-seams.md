# REDHAT-FIX-08 — Remove or founder/operator-gate public fixture and cleanup seams so authenticated callers cannot manufacture or erase production trust evidence (UC-VER-04)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-08 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | REDHAT-FIX-06 |
| BLOCKS | REDHAT-FIX-01 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX08-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Every public fixture/cleanup mutation that can manufacture or erase trust evidence (REVIEW seeds, couch seeds/teardown, waterfall seeds/teardown, couch-verdict clear) fails closed for an ordinary authenticated caller, while the legitimate internal/operator/test-env seeding path used by other REDHAT-FIX and existing S4 tests keeps working.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST make every fixture/cleanup seam fail-closed for an ordinary authenticated production caller: seedReviewQueueEntry (convex/reviewQueue.ts:96), seedCouchFixtures + teardownCouchFixtures (convex/couchSampleAssembler.ts:356,370), seedWaterfallFixtures + seedPassedSampleRoutes + seedCostBurnRoutes + teardownWaterfallFixtures (convex/waterfallOrchestrator.ts:249,284,342,367), clearCouchVerdicts (convex/couchVerdict.ts:157)
- MUST convert these seams to internalMutation (unreachable from any public client) OR gate them behind a single requireFixtureAccess(ctx) guard that requires BOTH test-environment (isTestEnvironment) AND operator capability (requireOperator from REDHAT-FIX-06) AND server-issued run scoping
- MUST keep the legitimate test/operator path functional so REDHAT-FIX-09 and existing S4 integration tests can still seed via server-side/internal dispatch

**NEVER**
- NEVER leave a fixture or cleanup mutation callable by requireIdentity alone (existence check with no role/environment decision)
- NEVER allow clearCouchVerdicts or teardownCouchFixtures to delete couch_verdicts / couch_samples / curated_routes rows when invoked by an ordinary authenticated public caller
- NEVER allow seedReviewQueueEntry to insert production-shaped curated_routes / curated_route_geometry rows from a public client

**STRICTLY**
- STRICTLY fail-closed: absence of operator capability or non-test environment denies the seam (deny by default), never a silent no-op that returns success
- STRICTLY preserve real provider/trust records untouched when a denied call is attempted (zero rows created or deleted on denial)

## DONE WHEN

- AC-1 [Ordinary authenticated caller cannot manufacture REVIEW/couch trust evidence via the fixture seams] [PRIMARY]: seedReviewQueueEntry called by an ordinary caller creates zero curated_routes rows for the forged routeId
- AC-2 [Ordinary authenticated caller cannot erase existing couch trust evidence]: clearCouchVerdicts / teardownCouchFixtures called by an ordinary caller leaves rows intact
- AC-3 [Legitimate internal/operator path still seeds fixtures]: seedWaterfallFixtures via the legitimate dispatch still creates its rows
- AC-4 [Non-operator caller on the operator-gated entry is denied with FORBIDDEN]: A non-operator gets FORBIDDEN with zero row-count delta
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Lock down the eight public fixture/cleanup seams that can manufacture or erase trust evidence by converting them to internalMutation and/or routing them through a single requireFixtureAccess guard (test-environment + operator capability + server-issued run scope), so an authenticated ordinary production caller can neither seed nor delete trust-bearing rows.

**Success state:** An ordinary authenticated public caller invoking any of the eight seams is rejected with zero state change; the same operations remain available to the internal/operator/test path used by legitimate seeding; couch verdicts, couch samples, review-queue rows, and waterfall fixtures cannot be manufactured or erased from a public client.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `existing-couch-verdict-evidence` (seed_method: `public_api`): A real couch sample + passing couch verdict created through the legitimate operator/internal seeding path
    - `couch_samples 'couch-redhat08' + couch_verdicts pass`
- `authenticated-ordinary-identity` (seed_method: `public_api`): A real authenticated but non-operator identity simulating an ordinary production user
    - identity subject 'user_ordinary_redhat08' with no operator capability
- `review-queue-seed-attempt` (seed_method: `public_api`): A candidate routeId + geometry payload an ordinary caller would try to push into REVIEW
    - routeId 'test:redhat08-forge', bestCandidateGeometry (valid polyline)

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Ordinary authenticated caller cannot manufacture REVIEW/couch trust evidence via the fixture seams

**Requirement:** GIVEN an authenticated non-operator identity against a non-test (production-shaped) deployment context WHEN the caller invokes seedReviewQueueEntry (and seedCouchFixtures) with a valid payload THEN the call is rejected fail-closed and zero curated_routes / curated_route_geometry / couch_samples rows are created for the forged routeId

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real mutations + requireFixtureAccess guard)
- FLOW_REF: UC-VER-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the seam still guards with a requireIdentity-only stub (ordinary caller succeeds and rows appear); operator check is mocked to always allow
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `review-queue-seed-attempt`
  - ACTION: Authenticate as authenticated-ordinary-identity; attempt seedReviewQueueEntry with a valid payload in a non-test context; query curated_routes and curation_artifacts by routeId 'test:redhat08-forge'
  - MUST_OBSERVE: the call throws error.code == 'FORBIDDEN'
  - MUST_NOT_OBSERVE: curated_routes count for routeId 'test:redhat08-forge' > 0; a review_candidate curation_artifact is present for 'test:redhat08-forge'

### AC-2 — Ordinary authenticated caller cannot erase existing couch trust evidence

**Requirement:** GIVEN a pre-existing passing couch verdict and couch sample created by the legitimate path, and an authenticated non-operator identity in a non-test context WHEN the caller invokes clearCouchVerdicts and teardownCouchFixtures THEN the call is rejected fail-closed and the couch_verdicts / couch_samples rows remain intact

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real mutations + guard)
- FLOW_REF: UC-VER-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: clearCouchVerdicts still deletes with a requireIdentity-only stub (verdict count drops to 0); teardownCouchFixtures still drops couch- prefixed samples for an ordinary caller
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `existing-couch-verdict-evidence`
  - ACTION: Seed existing-couch-verdict-evidence; authenticate as authenticated-ordinary-identity; attempt clearCouchVerdicts() and teardownCouchFixtures(); re-query couch_verdicts and couch_samples
  - MUST_OBSERVE: both calls throw error.code == 'FORBIDDEN'; couch_verdicts count for sample 'couch-redhat08' == 1 (unchanged)
  - MUST_NOT_OBSERVE: couch_verdicts count == 0 after the attempt; couch_samples row 'couch-redhat08' is absent

### AC-3 — Legitimate internal/operator path still seeds fixtures (capability preserved, not merely deleted)

**Requirement:** GIVEN the server-side internal/operator dispatch path in the test environment WHEN seedWaterfallFixtures (or the internal equivalent) is invoked through the legitimate path THEN the fixture rows are created successfully, proving the lockdown denies only the public/ordinary path

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (internal dispatch / operator path)
- FLOW_REF: UC-VER-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the seam was deleted outright so no seeding path remains (fixture rows never appear, absent); the internal path also throws so legitimate seeding is broken
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `authenticated-ordinary-identity`
  - ACTION: Invoke seedWaterfallFixtures via the legitimate internal/operator dispatch; query curated_routes for the three seeded waterfall routeIds
  - MUST_OBSERVE: curated_routes count for the three seeded waterfall routeIds == 3
  - MUST_NOT_OBSERVE: curated_routes count for the seeded routeIds == 0

### AC-4 — Non-operator caller on the operator-gated entry is denied with FORBIDDEN

**Requirement:** GIVEN the requireFixtureAccess guard active and an authenticated non-operator identity in the test environment WHEN the non-operator invokes any seam that is gated by requireOperator rather than internalMutation-only THEN the guard throws a FORBIDDEN error and no state change occurs

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (requireFixtureAccess + requireOperator)
- FLOW_REF: UC-VER-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: requireOperator returns true for any authenticated identity (a stub); the FORBIDDEN error is caught and swallowed so the seam proceeds
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `authenticated-ordinary-identity`
  - ACTION: Authenticate as authenticated-ordinary-identity in test env; invoke the operator-gated fixture entry; capture the thrown error code and re-query the target table for row-count delta
  - MUST_OBSERVE: error.code == 'FORBIDDEN'; target table row-count delta == 0
  - MUST_NOT_OBSERVE: the call succeeded for a non-operator (a row is present where none should be); target table row-count delta is empty/unmeasured

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | seedReviewQueueEntry invoked by an ordinary authenticated public caller creates zero curated_routes rows for the forged routeId | AC-1 | `npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts -t 'TC-1'` |
| TC-2 | clearCouchVerdicts invoked by an ordinary authenticated public caller leaves couch_verdicts row count unchanged | AC-2 | `npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts -t 'TC-2'` |
| TC-3 | teardownCouchFixtures invoked by an ordinary authenticated public caller does not delete the couch_samples row 'couch-redhat08' | AC-2 | `npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts -t 'TC-3'` |
| TC-4 | seedWaterfallFixtures invoked via the legitimate internal/operator path creates all three waterfall fixture rows | AC-3 | `npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts -t 'TC-4'` |
| TC-5 | The operator-gated fixture entry throws a FORBIDDEN error for a non-operator authenticated identity with zero row-count delta | AC-4 | `npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts -t 'TC-5'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/reviewQueue.ts (MODIFY — lock seedReviewQueueEntry)
- convex/couchSampleAssembler.ts (MODIFY — lock seedCouchFixtures/teardownCouchFixtures)
- convex/waterfallOrchestrator.ts (MODIFY — lock the four waterfall fixture seams)
- convex/couchVerdict.ts (MODIFY — lock clearCouchVerdicts)
- convex/guards.ts (MODIFY — add requireFixtureAccess composing requireOperator + isTestEnvironment)
- convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts (NEW)

**writeProhibited:**
- convex/schema.ts (no schema change required)
- Any RN/Expo file
- recordCouchVerdict / approveDisposition production trust logic — owned by REDHAT-FIX-04/05
- requireOperator implementation itself — owned by REDHAT-FIX-06
- Leaving any seam callable by requireIdentity alone

## READING LIST

- `convex/reviewQueue.ts` (96-229) — seedReviewQueueEntry — public mutation, requireIdentity only, inserts production-shaped curated_routes + curated_route_geometry + curation_artifacts
- `convex/couchSampleAssembler.ts` (356-419) — seedCouchFixtures / teardownCouchFixtures — public, requireIdentity only, teardown deletes any couch_samples sampleId starting with 'couch-'
- `convex/waterfallOrchestrator.ts` (249-419) — seedWaterfallFixtures, seedPassedSampleRoutes, seedCostBurnRoutes, teardownWaterfallFixtures — all public, requireIdentity only
- `convex/couchVerdict.ts` (157-167) — clearCouchVerdicts — deletes ALL couch_verdicts, requireIdentity only
- `convex/guards.ts` (1-90) — requireIdentity is an existence check only; add requireFixtureAccess wrapper composing isTestEnvironment + requireOperator
- `convex/lib/env.ts` (15-16,75) — isTestEnvironment / isTestOrVitest for environment gating

## CODE PATTERN

- Pattern: Deny-by-default fixture guard — convert seams to internalMutation and/or wrap in requireFixtureAccess(ctx) = isTestEnvironment && requireOperator(ctx) && server-issued run scope
- Pattern source: `convex/guards.ts:15-29` (requireIdentity) extended; `convex/lib/env.ts:75` (isTestEnvironment)
- Anti-pattern: requireIdentity-only guards on state-mutating fixture/cleanup seams; silent no-op success on denial

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-08-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; fixture/cleanup seam lockdown
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value

## DEPENDENCIES

- Depends on: REDHAT-FIX-06
- Blocks: REDHAT-FIX-01

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1
-->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-08",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "existing-couch-verdict-evidence": { "description": "A real couch sample + passing couch verdict created through the legitimate operator/internal seeding path.", "seed_method": "public_api", "records": ["couch_samples 'couch-redhat08' + couch_verdicts pass"] },
    "authenticated-ordinary-identity": { "description": "A real authenticated non-operator identity.", "seed_method": "public_api", "records": ["identity subject 'user_ordinary_redhat08', no operator capability"] },
    "review-queue-seed-attempt": { "description": "A candidate routeId + geometry payload an ordinary caller would try to push into REVIEW.", "seed_method": "public_api", "records": ["routeId 'test:redhat08-forge', bestCandidateGeometry valid polyline"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Ordinary authenticated caller cannot manufacture REVIEW/couch trust evidence via the fixture seams", "verify": "npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real mutations + requireFixtureAccess guard)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the seam still guards with a requireIdentity-only stub (ordinary caller succeeds and rows appear)", "operator check is mocked to always allow"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "review-queue-seed-attempt", "action": { "actor": "api_client", "steps": ["Authenticate as authenticated-ordinary-identity", "Attempt seedReviewQueueEntry with a valid payload in a non-test context", "Query curated_routes and curation_artifacts by routeId 'test:redhat08-forge'"] },
          "end_state": { "must_observe": ["the call throws error.code == 'FORBIDDEN'"], "must_not_observe": ["curated_routes count for routeId 'test:redhat08-forge' > 0", "a review_candidate curation_artifact is present for 'test:redhat08-forge'"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Ordinary authenticated caller cannot erase existing couch trust evidence", "verify": "npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real mutations + guard)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["clearCouchVerdicts still deletes with a requireIdentity-only stub (verdict count drops to 0)", "teardownCouchFixtures still drops couch- prefixed samples for an ordinary caller"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "existing-couch-verdict-evidence", "action": { "actor": "api_client", "steps": ["Seed existing-couch-verdict-evidence", "Authenticate as authenticated-ordinary-identity", "Attempt clearCouchVerdicts() and teardownCouchFixtures()", "Re-query couch_verdicts and couch_samples"] },
          "end_state": { "must_observe": ["both calls throw error.code == 'FORBIDDEN'", "couch_verdicts count for sample 'couch-redhat08' == 1 (unchanged)"], "must_not_observe": ["couch_verdicts count == 0 after the attempt", "couch_samples row 'couch-redhat08' is absent"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Legitimate internal/operator path still seeds fixtures", "verify": "npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (internal dispatch / operator path)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the seam was deleted outright so no seeding path remains (fixture rows never appear, absent)", "the internal path also throws so legitimate seeding is broken"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "authenticated-ordinary-identity", "action": { "actor": "api_client", "steps": ["Invoke seedWaterfallFixtures via the legitimate internal/operator dispatch", "Query curated_routes for the three seeded waterfall routeIds"] },
          "end_state": { "must_observe": ["curated_routes count for the three seeded waterfall routeIds == 3"], "must_not_observe": ["curated_routes count for the seeded routeIds == 0"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Non-operator caller on the operator-gated entry is denied with FORBIDDEN", "verify": "npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (requireFixtureAccess + requireOperator)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["requireOperator returns true for any authenticated identity (a stub)", "the FORBIDDEN error is caught and swallowed so the seam proceeds"] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [ { "start_ref": "authenticated-ordinary-identity", "action": { "actor": "api_client", "steps": ["Authenticate as authenticated-ordinary-identity in test env", "Invoke the operator-gated fixture entry", "Capture the thrown error code and re-query the target table for row-count delta"] },
          "end_state": { "must_observe": ["error.code == 'FORBIDDEN'", "target table row-count delta == 0"], "must_not_observe": ["the call succeeded for a non-operator (a row is present where none should be)", "target table row-count delta is empty/unmeasured"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "ordinary caller seedReviewQueueEntry creates 0 rows", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts -t 'TC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "ordinary caller clearCouchVerdicts leaves verdict count unchanged", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts -t 'TC-2'" },
    { "id": "TC-3", "type": "test_criterion", "description": "ordinary caller teardownCouchFixtures does not delete couch sample", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts -t 'TC-3'" },
    { "id": "TC-4", "type": "test_criterion", "description": "internal/operator seedWaterfallFixtures creates 3 rows", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts -t 'TC-4'" },
    { "id": "TC-5", "type": "test_criterion", "description": "non-operator on operator-gated entry throws FORBIDDEN, 0 delta", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX08-fixture-lockdown.integration.test.ts -t 'TC-5'" }
  ]
}
-->

</details>
