# REDHAT-FIX-03 — Scrub test:/seed: rows from listRetirementCandidates export

> Status: ✅ Completed
> Commit: d0527f274adeea55e0aea80c7369f1438f8ac46b
> Reviewer: convex-reviewer+product-manager
> Completed: 2026-07-25T03:39:23Z
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | REDHAT-FIX-03 |
| SPRINT | [Sprint 05 — Batch acceptance + retirement](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 60 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-04 |
| DEPENDS_ON | — |
| BLOCKS | REDHAT-FIX-05 |

RUNTIME_COMMANDS:
- integration: `npx vitest run convex/__tests__/REDHATFIX03-*.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex scripts`
- build: `pnpm convex:dev --once`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Unscoped listRetirementCandidates returns zero routeIds starting with test: or seed: even when such rows dominate the review/unresolved indexes; prefix-scoped harness still works.

## BACKGROUND

Red-hat review 2026-07-25T02:13:34Z (NEEDS_REVISION BLOCK). Closes F3. Parallel-safe with FIX-01 and FIX-06.

**Objective:** Apply the top-50 GATE-FIX seed scrub to listRetirementCandidates so the acceptance packet retirement review is not 94% test fixtures.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** filter unscoped listRetirementCandidates with the same isTestSeedRoute (or extended) predicate used by top-50 founder surface
- **MUST** treat seed: prefix as fixture contamination in addition to test:
- **MUST** oversample then filter so limit is filled with real candidates when possible
- **NEVER** return test:s4t5-passed-* (or other test:/seed:) rows on the unscoped founder export
- **NEVER** break prefix-scoped test isolation used by S5-T2 integration tests
- **STRICTLY** scrub is post-index filter on the founder (unscoped) path only; do not delete production routes

## SPECIFICATION

**Objective:** Apply the top-50 GATE-FIX seed scrub to listRetirementCandidates so the acceptance packet retirement review is not 94% test fixtures.

**Success state:** Unscoped listRetirementCandidates returns zero routeIds starting with test: or seed: even when such rows dominate the review/unresolved indexes; prefix-scoped harness still works.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `redhatfix03-mixed-retirement-pool` (seed_method: `public_api`): Mix of real-looking motorcycleroads:* candidates and dense test:s4t5-passed-* / seed: rows in review/unresolved/failed
  - routeId test:s4t5-passed-001..047 geometryStatus review, all-lever failed evidence
  - routeId seed:fake-retire-01
  - routeId motorcycleroads:real-retire-a eligible
  - routeId motorcycleroads:real-retire-b eligible
- `redhatfix03-prefix-harness` (seed_method: `public_api`): Prefix-scoped export for test isolation must still return test: rows when routeIdPrefix=test:
  - routeIdPrefix test:s5t2- or test:redhatfix03-

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Unscoped export purges test: and seed: routeIds

**Requirement:** GIVEN DB contains eligible retirement candidates with test: and seed: prefixes mixed with real routeIds WHEN listRetirementCandidates is called without routeIdPrefix THEN returned candidates contain zero routeIds starting with test: or seed:

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX03-retirement-seed-scrub.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: test:s4t5-passed rows returned unscoped; seed: rows returned unscoped; stub empty list that skips scrub proof with candidates.length == 0; mock filter that only drops one prefix and leaves test: rows
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix03-mixed-retirement-pool`
  - ACTION (founder): Seed mixed pool with 47 test: and 1 seed: and 2 real candidates; Call listRetirementCandidates({limit:50}) unscoped; Count prefixes in response.candidates
  - MUST_OBSERVE: `candidates with prefix 'test:' count == 0`
  - MUST_OBSERVE: `candidates with prefix 'seed:' count == 0`
  - MUST_OBSERVE: `contaminationCount == 0`
  - MUST_OBSERVE: `realEligibleCount >= 1`
  - MUST_OBSERVE: `candidates.length >= 1`
  - MUST_NOT_OBSERVE: `candidates with prefix 'test:' count > 0`
  - MUST_NOT_OBSERVE: `candidates with prefix 'seed:' count > 0`
  - MUST_NOT_OBSERVE: `routeId == 'test:s4t5-passed-001'`
  - MUST_NOT_OBSERVE: `candidates.length == 0 when real eligible rows exist`
  - MUST_NOT_OBSERVE: `empty scrub that drops real rows only`

### AC-2 — Prefix-scoped harness retains test: rows for isolation

**Requirement:** GIVEN S5-T2 style tests pass routeIdPrefix starting with test: WHEN listRetirementCandidates is called with that prefix THEN test: rows under the prefix are still returned for harness isolation

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX03-prefix-isolation.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: prefix path also scrubbed empty removing harness rows; hardcoded unscoped scrub applied when routeIdPrefix present; stub listRetirementCandidates returns empty for test: prefix; mock that deletes test routes instead of isolating
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix03-prefix-harness`
  - ACTION (api_client): Seed test:redhatfix03-all-failed eligible row; Call listRetirementCandidates({routeIdPrefix:'test:redhatfix03-'})
  - MUST_OBSERVE: `candidates includes routeId == 'test:redhatfix03-all-failed'`
  - MUST_OBSERVE: `candidates.length >= 1`
  - MUST_NOT_OBSERVE: `candidates.length == 0`
  - MUST_NOT_OBSERVE: `routeId == 'test:redhatfix03-all-failed' missing`
  - MUST_NOT_OBSERVE: `empty prefix harness export`

### AC-3 — Reuse shared isTestSeedRoute (extended for seed:)

**Requirement:** GIVEN convex/lib/top50Eligibility.ts exports isTestSeedRoute WHEN listRetirementCandidates filters unscoped results THEN it uses the shared helper (extended to cover seed: prefix), not a divergent ad-hoc filter

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX03-shared-predicate.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: duplicate divergent filter that misses seed: prefix; hardcoded only test:s4t5 without seed:; stub isTestSeedRoute always false; mock predicate that leaves seed: as production
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix03-mixed-retirement-pool`
  - ACTION (api_client): Assert isTestSeedRoute('seed:x') is true after extension; Assert unscoped export excludes seed: and test: using that predicate
  - MUST_OBSERVE: `isTestSeedRoute('test:s4t5-passed-001') == true`
  - MUST_OBSERVE: `isTestSeedRoute('seed:fake') == true`
  - MUST_OBSERVE: `isTestSeedRoute('motorcycleroads:cherohala') == false`
  - MUST_NOT_OBSERVE: `isTestSeedRoute('seed:fake') == false`
  - MUST_NOT_OBSERVE: `isTestSeedRoute('test:s4t5-passed-001') == false`
  - MUST_NOT_OBSERVE: `empty predicate always returning false`

### AC-4 — Oversample fills limit after scrub

**Requirement:** GIVEN dense test: fixtures outrank real candidates in the status scan WHEN unscoped listRetirementCandidates(limit=N) runs THEN implementation oversamples then filters so real candidates still fill up to N when available (mirror top50 oversample pattern)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX03-oversample.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: take(N) before filter leaves only test rows then empties list; empty export when real candidates exist deeper; static limit without oversample; stub that returns candidates.length == 0 despite real eligible rows
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix03-mixed-retirement-pool`
  - ACTION (founder): Seed many test: rows first in scan order plus fewer real eligible rows; Call listRetirementCandidates({limit:10}) unscoped
  - MUST_OBSERVE: `nonFixtureCandidateCount >= 1`
  - MUST_OBSERVE: `candidates with prefix 'test:' count == 0`
  - MUST_OBSERVE: `candidates.length >= 1`
  - MUST_OBSERVE: `candidates.length <= 10`
  - MUST_NOT_OBSERVE: `candidates.length == 0`
  - MUST_NOT_OBSERVE: `candidates with prefix 'test:' count > 0`
  - MUST_NOT_OBSERVE: `empty first-page-only scan`

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Unscoped listRetirementCandidates returns zero candidates with routeId prefix test: or seed: | AC-1 | `npx vitest run convex/__tests__/REDHATFIX03-retirement-seed-scrub.integration.test.ts -t 'TC-1'` |
| TC-2 | Prefix-scoped listRetirementCandidates still returns matching test: harness rows | AC-2 | `npx vitest run convex/__tests__/REDHATFIX03-prefix-isolation.integration.test.ts -t 'TC-2'` |
| TC-3 | isTestSeedRoute treats seed: prefix as fixture contamination | AC-3 | `npx vitest run convex/__tests__/REDHATFIX03-shared-predicate.integration.test.ts -t 'TC-3'` |
| TC-4 | Unscoped export still surfaces real eligible candidates after oversample-and-filter | AC-4 | `npx vitest run convex/__tests__/REDHATFIX03-oversample.integration.test.ts -t 'TC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometry.ts (MODIFY listRetirementCandidates)
- convex/lib/top50Eligibility.ts (MODIFY extend seed: marker)
- convex/__tests__/REDHATFIX03-*.integration.test.ts (NEW)
- convex/__tests__/top50Review.seed-exclusion.unit.test.ts (MODIFY extend seed: cases)

**writeProhibited:**
- react-native/**
- Deleting test routes from DB as a substitute for export scrub
- Weakening S5-T2 prefix isolation

## READING LIST

- `convex/curatedGeometry.ts` (2744-2833) — listRetirementCandidates — no seed scrub today
- `convex/top50Review.ts` (149-187) — founder eligibility scrub pattern to mirror
- `convex/lib/top50Eligibility.ts` (1-29) — isTestSeedRoute shared predicate
- `convex/__tests__/top50Review.seed-exclusion.unit.test.ts` — existing predicate tests to extend for seed:
- `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-logs/step-7.log` — 47/50 test:s4t5-passed-* contamination evidence
- `.spec/reviews/red-hat-sprint-05-batch-acceptance-retirement-20260725T021334Z.md` (46-48) — F3

## CODE PATTERN

**Pattern:** Oversample index read → filter !isTestSeedRoute → take limit (unscoped only)
**Source:** convex/top50Review.ts founder path
**Anti-pattern:** Leaving retirement export unscoped while top-50 is scrubbed

**Interaction notes:**
- Independent of FIX-01; required before FIX-05 human gate re-run

## DESIGN

**References:**
- top50 GATE-FIX
- red-hat F3
- S5-T2 surface

## VERIFICATION GATES

- **All Tests Pass**: `npx vitest run convex/__tests__/REDHATFIX03-` → Exit 0
- **Existing retirement tests**: `npx vitest run convex/__tests__/S5T2-` → Exit 0
- **Typecheck**: `pnpm type-check` → Exit 0
- **Lint**: `pnpm exec biome check convex scripts` → Exit 0
- **Convex build**: `pnpm convex:dev --once` → Exit 0

## CAPABILITY CHAIN

- touches: CAP-GEO-04
- provides: founder_clean_retirement_candidate_export
- consumes: isTestSeedRoute / top50 GATE-FIX scrub pattern
- boundary_contracts:
  - Unscoped listRetirementCandidates never returns test: or seed: routeIds
  - Prefix-scoped harness path may still include test: rows for isolation (mirror top50 routeIdPrefix behavior)

## AGENT ASSIGNMENT

- Implementer: `convex-implementer` — Reuse isTestSeedRoute from convex/lib/top50Eligibility.ts on the listRetirementCandidates founder surface; Convex query-only change plus tests.
- Reviewer: `convex-reviewer`

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/RED-FIRST-TEST-GATE.md
- brain/docs/kanban/SCENARIO-CONTRACT-V1.md

## DEPENDENCIES

- depends_on: —
- blocks: REDHAT-FIX-05

## NOTES

Closes F3. Parallel-safe with FIX-01 and FIX-06.

<!-- REQUIREMENT-CONTRACT v1
-->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-03",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "redhatfix03-mixed-retirement-pool": {
      "description": "Mix of real-looking motorcycleroads:* candidates and dense test:s4t5-passed-* / seed: rows in review/unresolved/failed",
      "seed_method": "public_api",
      "records": [
        "routeId test:s4t5-passed-001..047 geometryStatus review, all-lever failed evidence",
        "routeId seed:fake-retire-01",
        "routeId motorcycleroads:real-retire-a eligible",
        "routeId motorcycleroads:real-retire-b eligible"
      ]
    },
    "redhatfix03-prefix-harness": {
      "description": "Prefix-scoped export for test isolation must still return test: rows when routeIdPrefix=test:",
      "seed_method": "public_api",
      "records": [
        "routeIdPrefix test:s5t2- or test:redhatfix03-"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN mixed test:/seed:/real retirement candidates WHEN unscoped listRetirementCandidates runs THEN zero test:/seed: rows are returned",
      "verify": "npx vitest run convex/__tests__/REDHATFIX03-retirement-seed-scrub.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "test:s4t5-passed rows returned unscoped",
            "seed: rows returned unscoped",
            "stub empty list that skips scrub proof with candidates.length == 0",
            "mock filter that only drops one prefix and leaves test: rows"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix03-mixed-retirement-pool",
            "action": {
              "actor": "founder",
              "steps": [
                "Seed mixed pool with 47 test: and 1 seed: and 2 real candidates",
                "Call listRetirementCandidates({limit:50}) unscoped",
                "Count prefixes in response.candidates"
              ]
            },
            "end_state": {
              "must_observe": [
                "candidates with prefix 'test:' count == 0",
                "candidates with prefix 'seed:' count == 0",
                "contaminationCount == 0",
                "realEligibleCount >= 1",
                "candidates.length >= 1"
              ],
              "must_not_observe": [
                "candidates with prefix 'test:' count > 0",
                "candidates with prefix 'seed:' count > 0",
                "routeId == 'test:s4t5-passed-001'",
                "candidates.length == 0 when real eligible rows exist",
                "empty scrub that drops real rows only"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Unscoped listRetirementCandidates returns zero candidates with routeId prefix test: or seed:",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHATFIX03-retirement-seed-scrub.integration.test.ts -t 'TC-1'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN routeIdPrefix test: WHEN listRetirementCandidates runs THEN harness test rows remain visible",
      "verify": "npx vitest run convex/__tests__/REDHATFIX03-prefix-isolation.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "prefix path also scrubbed empty removing harness rows",
            "hardcoded unscoped scrub applied when routeIdPrefix present",
            "stub listRetirementCandidates returns empty for test: prefix",
            "mock that deletes test routes instead of isolating"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix03-prefix-harness",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed test:redhatfix03-all-failed eligible row",
                "Call listRetirementCandidates({routeIdPrefix:'test:redhatfix03-'})"
              ]
            },
            "end_state": {
              "must_observe": [
                "candidates includes routeId == 'test:redhatfix03-all-failed'",
                "candidates.length >= 1"
              ],
              "must_not_observe": [
                "candidates.length == 0",
                "routeId == 'test:redhatfix03-all-failed' missing",
                "empty prefix harness export"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Prefix-scoped listRetirementCandidates still returns matching test: harness rows",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHATFIX03-prefix-isolation.integration.test.ts -t 'TC-2'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN shared isTestSeedRoute WHEN extended for seed: THEN retirement export uses it consistently",
      "verify": "npx vitest run convex/__tests__/REDHATFIX03-shared-predicate.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "duplicate divergent filter that misses seed: prefix",
            "hardcoded only test:s4t5 without seed:",
            "stub isTestSeedRoute always false",
            "mock predicate that leaves seed: as production"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix03-mixed-retirement-pool",
            "action": {
              "actor": "api_client",
              "steps": [
                "Assert isTestSeedRoute('seed:x') is true after extension",
                "Assert unscoped export excludes seed: and test: using that predicate"
              ]
            },
            "end_state": {
              "must_observe": [
                "isTestSeedRoute('test:s4t5-passed-001') == true",
                "isTestSeedRoute('seed:fake') == true",
                "isTestSeedRoute('motorcycleroads:cherohala') == false"
              ],
              "must_not_observe": [
                "isTestSeedRoute('seed:fake') == false",
                "isTestSeedRoute('test:s4t5-passed-001') == false",
                "empty predicate always returning false"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "isTestSeedRoute treats seed: prefix as fixture contamination",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHATFIX03-shared-predicate.integration.test.ts -t 'TC-3'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN dense fixtures WHEN unscoped export runs THEN oversample-and-filter still returns real candidates",
      "verify": "npx vitest run convex/__tests__/REDHATFIX03-oversample.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "take(N) before filter leaves only test rows then empties list",
            "empty export when real candidates exist deeper",
            "static limit without oversample",
            "stub that returns candidates.length == 0 despite real eligible rows"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix03-mixed-retirement-pool",
            "action": {
              "actor": "founder",
              "steps": [
                "Seed many test: rows first in scan order plus fewer real eligible rows",
                "Call listRetirementCandidates({limit:10}) unscoped"
              ]
            },
            "end_state": {
              "must_observe": [
                "nonFixtureCandidateCount >= 1",
                "candidates with prefix 'test:' count == 0",
                "candidates.length >= 1",
                "candidates.length <= 10"
              ],
              "must_not_observe": [
                "candidates.length == 0",
                "candidates with prefix 'test:' count > 0",
                "empty first-page-only scan"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Unscoped export still surfaces real eligible candidates after oversample-and-filter",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHATFIX03-oversample.integration.test.ts -t 'TC-4'"
    }
  ]
}
-->
