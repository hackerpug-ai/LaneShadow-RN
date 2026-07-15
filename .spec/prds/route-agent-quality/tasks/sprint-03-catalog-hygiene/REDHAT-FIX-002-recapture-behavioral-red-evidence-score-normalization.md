# REDHAT-FIX-002 — Re-capture behavioral RED evidence for score normalization before GREEN (F-2)

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-002 |
| SPRINT | [Sprint 03 — Catalog hygiene](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 30 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | — (N/A: deterministic at-rest cleanup) |
| DEPENDS_ON | S3-T1 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Behavioral RED evidence is captured proving the S3-T1 score normalization integration test genuinely FAILS against the start state (before normalizeEditorialScores exists or is a no-op stub), recorded as a captured artifact, BEFORE re-running to GREEN. The RED output proves the test is not a tautology — it detects the absence of the handler.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Read convex/_generated/ai/guidelines.md first.
- The RED phase MUST run the integration test against a state where normalizeEditorialScores is absent (function not found) or a no-op stub (returns {scanned:0, normalized:0} without writing).
- The RED failure MUST be a genuine behavioral failure — the test must fail because score values are unchanged (compositeScore still 90 instead of 0.9), NOT just because of a syntax error or missing import.
- The RED failure output (stdout/stderr) MUST be captured verbatim and stored as an evidence artifact at `convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt`.
- After capturing RED, the handler MUST be restored/implemented and the test MUST pass GREEN.

**NEVER**
- Never fabricate RED evidence by typing a fake failure message — it MUST be real captured test output.
- Never run RED against a state where the handler already works — that is not RED.
- Never skip the RED phase by going straight to GREEN — the F-2 finding is specifically about missing RED evidence.
- Never edit convex/schema.ts, convex/actions/agent/**, app/**, or .spec/**.

**STRICTLY**
- RED capture Method: (1) Temporarily stub normalizeEditorialScores to a no-op, (2) Run `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts`, (3) Capture stdout+stderr to the evidence file, (4) Restore the real handler, (5) Re-run to confirm GREEN.
- The evidence file MUST contain the actual vitest failure output including the assertion that failed (e.g., 'expected 0.9 to be close to 90' or 'AssertionError').

## DONE WHEN

- AC-1 [PRIMARY]: with the handler stubbed to a no-op, the integration test FAILS with a genuine behavioral assertion error (compositeScore still 90 instead of 0.9), and the failure output is captured verbatim to the evidence file
- AC-2: after restoring the real handler, the same test passes GREEN
- Every behavioral AC scenario passes `validate_scenario` (exit 0)
- `pnpm type-check` clean + `pnpm exec biome check` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Fix the F-2 finding: the S3-T1 score normalization tests went GREEN without capturing behavioral RED evidence first. Re-run the RED phase by stubbing the handler, capture the genuine test failure output (proving the integration test detects the absence of working normalization), store it as evidence, then restore the handler and confirm GREEN.

**Success state:** An evidence file exists at `convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt` containing real captured vitest failure output showing the integration test failing because score values were not normalized (compositeScore still 90 instead of 0.9). After restoring the handler, the same test passes GREEN.

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `noOpStubState` (seed_method: `public_api`): The handler body is replaced with a no-op: `handler: async () => ({ scanned: 0, normalized: 0 })`. No rows are patched. The integration test's AC-1 assertion that compositeScore ≈ 0.9 will FAIL because compositeScore is still 90. Expected RED assertion: `AssertionError: expected 90 to be close to 0.9`.
- `outOfScaleRows` (seed_method: `public_api`): The same 3 rows from seedEditorialScoreRows (test:hyg-score-90, test:hyg-score-72, test:hyg-score-85) with all scores on 0–100 scale.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — RED: handler stubbed, integration test fails with behavioral assertion error

**Requirement:** GIVEN the normalizeEditorialScores handler is stubbed to a no-op (returns {scanned:0, normalized:0} without patching any rows) and the integration test suite at convex/__tests__/curatedGeometryHygiene.integration.test.ts is executed THEN the AC-1 test case ('divides composite and every dimension score by 100 at rest') MUST fail with a genuine behavioral assertion error — specifically, the assertion that row90.compositeScore ≈ 0.9 fails because the value is still 90 (unnormalized). The failure output MUST be captured verbatim to the evidence file.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment + vitest runner (real curated_routes rows seeded, real handler stubbed to no-op)
- FLOW_REF: F-2
- VERIFY: Read the evidence file at `convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt` and confirm it contains: (1) vitest 'FAIL' marker, (2) an assertion error referencing compositeScore, (3) the test name 'divides composite and every dimension score by 100 at rest'.

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the test is a tautology — a no-op stub passes because the test only asserts response.scanned >= 0 or similar weak assertion; the handler is NOT actually stubbed (still works normally) — the test passes, which is NOT RED; the RED evidence file contains a manually typed message instead of real captured vitest output; the evidence file does not contain a 'FAIL' marker or assertion error
- EVIDENCE: `test_output` (required_capture: true)
- CASE 1 — start_ref `noOpStubState`
    - ACTION (cli_user): stub normalizeEditorialScores handler body to: `async () => ({ scanned: 0, normalized: 0 })`; run `pnpm convex:dev --once` (to push the stubbed handler); run `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts 2>&1 | tee convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt`; inspect the evidence file for FAIL + assertion error
    - MUST_OBSERVE: evidence file exists at `convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt`; evidence file contains 'FAIL' (vitest failure marker); evidence file contains an assertion error involving compositeScore (the value 90 vs expected 0.9); evidence file contains the test name 'divides composite and every dimension score by 100 at rest'
    - MUST_NOT_OBSERVE: evidence file contains 'PASS' or 'Tests N passed' (would indicate the test passed against the stub — not genuine RED); evidence file contains only a syntax/import error (the failure must be behavioral); evidence file is empty or missing

### AC-2 — GREEN: handler restored, integration test passes

**Requirement:** GIVEN the RED evidence has been captured (AC-1 complete) and the real normalizeEditorialScores handler is restored WHEN the integration test suite is re-run THEN all AC-1 through AC-4 test cases PASS GREEN — confirming the RED evidence was genuine (the test fails without the handler and passes with it).

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment + vitest runner
- FLOW_REF: F-2
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` — all tests pass.

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the handler is not properly restored after stubbing — the test still fails; the RED-GREEN cycle is skipped — the handler was never actually stubbed (evidence is fabricated)
- EVIDENCE: `test_output` (required_capture: true)
- CASE 1 — start_ref `outOfScaleRows`
    - ACTION (cli_user): restore the real normalizeEditorialScores handler (undo the stub from AC-1); run `pnpm convex:dev --once` (push the real handler); run `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts`
    - MUST_OBSERVE: all integration test cases pass (AC-1: normalize-at-rest, AC-2: dry-run, AC-3: idempotent, AC-4: invariant); vitest output shows 'Tests N passed' with 0 failures
    - MUST_NOT_OBSERVE: any test failure (would indicate the handler was not properly restored); a segfault or crash unrelated to test assertions

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | RED evidence file exists at `convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt`, is non-empty, and contains the string 'FAIL' and an assertion reference to 'compositeScore' or '0.9' | AC-1 | `grep -E '(FAIL\|compositeScore\|0\.9)' convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt` |
| TC-2 | After restoring the real handler, `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` exits 0 with all tests passing | AC-2 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryHygiene.ts (MODIFY — temporarily stub for RED capture, then restore)
- convex/__tests__/curatedGeometryHygiene.integration.test.ts (MODIFY — if any test hardening is needed for RED to surface properly)
- convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt (NEW — captured RED evidence artifact)

**writeProhibited:**
- convex/schema.ts - no schema change
- convex/curatedGeometryTestSupport.ts - seed helpers unchanged
- convex/actions/agent/** - out of scope
- app/**, components/** - no UI
- .spec/** - planning docs are read-only
- unrelated Convex modules

## READING LIST

- `convex/curatedGeometryHygiene.ts` — normalizeEditorialScores handler (to be temporarily stubbed for RED capture)
- `convex/__tests__/curatedGeometryHygiene.integration.test.ts` — AC-1 through AC-4 (the test suite that must FAIL in RED)
- `convex/curatedGeometryTestSupport.ts` — seed/teardown helpers used by the integration test

## CODE PATTERN

- Pattern: // RED capture: stub handler, run test, capture output, restore
// 1. Temporarily replace handler body with: async () => ({ scanned: 0, normalized: 0 })
// 2. pnpm convex:dev --once
// 3. pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts 2>&1 | tee .red-evidence/s3-t1-normalize-scores.red.txt
// 4. Restore real handler
// 5. pnpm convex:dev --once
// 6. pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts → GREEN
- Pattern source: `TDD RED-GREEN-REFACTOR cycle — behavioral RED must show the test failing against the start state before GREEN`
- Anti-pattern: Asserting a value that would pass even without the handler (e.g., asserting response.scanned >= 0 — a stub returning {scanned:0} would pass, making the test a tautology).

## VERIFICATION GATES

- Integration tests pass (GREEN): `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` → Exit 0
- Typecheck: `pnpm type-check` → Exit 0
- Lint: `pnpm exec biome check` → Exit 0

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Requires temporarily modifying the Convex handler, running tests, capturing output, and restoring. Backend Convex + TDD process work.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: the captured evidence artifact at `convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt` proves the integration test genuinely fails against a no-op stub.
- GREEN phase: after restoring the handler, all tests pass.

## DEPENDENCIES

- Depends on: S3-T1
- Blocks: —

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-002",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "noOpStubState": {
      "description": "The handler body is replaced with a no-op: handler: async () => ({ scanned: 0, normalized: 0 }). No rows are patched. The integration test's AC-1 assertion that compositeScore \u2248 0.9 will FAIL because compositeScore is still 90.",
      "seed_method": "public_api",
      "records": [
        "Expected RED assertion: AssertionError: expected 90 to be close to 0.9 (or equivalent vitest failure message showing the test detected unnormalized scores)"
      ]
    },
    "outOfScaleRows": {
      "description": "The same 3 rows from seedEditorialScoreRows (test:hyg-score-90, test:hyg-score-72, test:hyg-score-85) with all scores on 0\u2013100 scale.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-score-90 compositeScore=90",
        "curated_routes routeId=test:hyg-score-72 compositeScore=72",
        "curated_routes routeId=test:hyg-score-85 compositeScore=85"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN the normalizeEditorialScores handler is stubbed to a no-op (returns {scanned:0, normalized:0} without patching any rows) and the integration test suite is executed THEN the AC-1 test case MUST fail with a genuine behavioral assertion error (compositeScore still 90 instead of 0.9) and the failure output MUST be captured verbatim to the evidence file",
      "verify": "Read evidence file at convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt and confirm FAIL marker + compositeScore assertion error",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment + vitest runner (real curated_routes rows seeded, real handler stubbed to no-op)",
        "negative_control": {
          "would_fail_if": [
            "the test is a tautology \u2014 a no-op stub passes because the test only asserts response.scanned >= 0 or similar weak assertion",
            "the handler is NOT actually stubbed (still works normally) \u2014 the test passes, which is NOT RED",
            "the RED evidence file contains a manually typed message instead of real captured vitest output",
            "the evidence file does not contain a 'FAIL' marker or assertion error"
          ]
        },
        "evidence": {
          "artifact_type": "test_output",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "noOpStubState",
            "action": {
              "actor": "cli_user",
              "steps": [
                "stub normalizeEditorialScores handler body to: async () => ({ scanned: 0, normalized: 0 })",
                "run pnpm convex:dev --once (push stubbed handler)",
                "run pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts 2>&1 | tee convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt",
                "inspect evidence file for FAIL + assertion error"
              ]
            },
            "end_state": {
              "must_observe": [
                "evidence file exists at convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt",
                "evidence file contains 'FAIL' (vitest failure marker)",
                "evidence file contains an assertion error involving compositeScore (value 90 vs expected 0.9)",
                "evidence file contains the test name 'divides composite and every dimension score by 100 at rest'"
              ],
              "must_not_observe": [
                "evidence file contains 'PASS' or 'Tests N passed' (would indicate the test passed against the stub)",
                "evidence file contains only a syntax/import error (failure must be behavioral)",
                "evidence file is empty or missing"
              ]
            }
          }
        ],
        "id": "AC-1",
        "primary": true
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the RED evidence has been captured and the real normalizeEditorialScores handler is restored WHEN the integration test suite is re-run THEN all AC-1 through AC-4 test cases PASS GREEN",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts \u2014 all tests pass",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment + vitest runner",
        "negative_control": {
          "would_fail_if": [
            "the handler is not properly restored after stubbing \u2014 the test still fails",
            "the RED-GREEN cycle is skipped \u2014 the handler was never actually stubbed (evidence is fabricated)"
          ]
        },
        "evidence": {
          "artifact_type": "test_output",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "outOfScaleRows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "restore the real normalizeEditorialScores handler (undo the stub from AC-1)",
                "run pnpm convex:dev --once (push real handler)",
                "run pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts"
              ]
            },
            "end_state": {
              "must_observe": [
                "all integration test cases pass (AC-1: normalize-at-rest, AC-2: dry-run, AC-3: idempotent, AC-4: invariant)",
                "vitest output shows 'Tests N passed' with 0 failures"
              ],
              "must_not_observe": [
                "any test failure (would indicate the handler was not properly restored)",
                "a segfault or crash unrelated to test assertions"
              ]
            }
          }
        ],
        "id": "AC-2",
        "primary": false
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "RED evidence file exists, is non-empty, contains 'FAIL' and an assertion reference to 'compositeScore' or '0.9'",
      "verify": "grep -E '(FAIL|compositeScore|0\\.9)' convex/__tests__/.red-evidence/s3-t1-normalize-scores.red.txt"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "After restoring the real handler, pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts exits 0 with all tests passing",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts"
    }
  ]
}
-->
</details>
