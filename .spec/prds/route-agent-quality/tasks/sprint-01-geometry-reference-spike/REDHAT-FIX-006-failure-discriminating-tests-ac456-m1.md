# REDHAT-FIX-006 — Replace S1-T2 soft assertions with failure-discriminating tests for AC-4/5/6; fixes M1

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-006 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 90 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-01 |
| PRD_REFS | UC-VER-01, T-REC-016, S1-T2 AC-4/5/6, Finding M1 |
| DEPENDS_ON | S1-T2 |
| BLOCKS | — |
| AUTHORITY | [.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md](../../../../reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md) |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'degenerate|quarantine|null claimed|failedCondition'`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

AC-4/5/6 integration tests fail hard when verification is missing or failedCondition is wrong — no vacuous-pass soft ifs.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST remove soft if (verifyResult.ok) wrappers around body expects for AC-4/5/6 (lines ~196, 318, 340, 372, 395, 408, 421)
- MUST hard-expect verifyResult.ok === true when path requires a verification row, then assert fields
- MUST assert failedCondition == "degenerate" for degenerate cases (and ratio/anchors for AC-6 named cases)

**NEVER**
- NEVER leave a path where a failed CLI read still greens the test
- NEVER weaken production gate thresholds to make tests pass
- NEVER mock Convex CLI responses for these integration tests

**STRICTLY**
- STRICTLY: if soft-if reintroduced, a non-ok fixture MUST fail the suite
- STRICTLY: keep real npx convex run + --identity

## DONE WHEN

- [ ] AC-1: Degenerate paths hard-assert verification
- [ ] AC-2: Quarantine path hard-asserts ratio-skip
- [ ] AC-3: failedCondition names hard-asserted
- [ ] AC-4: Soft-if reintroduction would fail suite
- [ ] Only SCOPE.writeAllowed files modified (`git diff --name-only`)
- [ ] Do **not** mark Sprint 01 Done from this task alone

## SPECIFICATION

**Objective:** Make S1-T2 AC-4/5/6 integration tests failure-discriminating so gate/persist regressions cannot vacuous-pass.

**Success state:** All AC-4/5/6 expects run after hard expect(verifyResult.ok).toBe(true); failedCondition named for degenerate/ratio/anchors; suite fails on non-ok verification reads.

**Agent rationale:** Owns geometryGatePersist.integration.test.ts soft-assert theatre on S1-T2 AC-4/5/6.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `degenerate_rows` (seed_method: `public_api`): test:degenerate-2pt and test:degenerate-10pt-50mi via fixed-geometry reconstruct
- `quarantined_length_row` (seed_method: `public_api`): test:quarantined-null-length claimedMiles null non-degenerate 22.0-mi line
- `named_failure_rows` (seed_method: `public_api`): test:ratio-161, test:single-anchor, test:degenerate-2pt
- `non_ok_verification_read` (seed_method: `public_api`): verifyResult ok:false must fail hard expects

## ACCEPTANCE CRITERIA

### AC-1 [PRIMARY]

**Requirement:** GIVEN Seeded degenerate rows reconstructed via reconstructForRouteWithFixedGeometry on live Convex WHEN AC-4 tests read getVerificationForRoute THEN tests hard-require ok verification and assert degenerate true, geometryStatus review, failedCondition degenerate

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment
- VERIFY: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'degenerate'`
- FLOW_REF: `UC-VER-01`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: soft if vacuous-pass; failedCondition degenerate not asserted; mocked verification
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `degenerate_rows`
    - ACTION: AC-4 tests read getVerificationForRoute
    - MUST_OBSERVE: expect(verifyResult.ok).toBe(true) without soft if; verification.degenerate == true; geometryStatus == review; failedCondition == degenerate
    - MUST_NOT_OBSERVE: if (verifyResult.ok) wrapping body expects; geometryStatus generated for 2-point line

### AC-2

**Requirement:** GIVEN Seeded quarantined null-length row with non-degenerate routed line WHEN AC-5 test reads verification after fixed-geometry reconstruct THEN hard expects: ratio null, claimedMiles null, verdict pass, routedMiles 22.0, geometryStatus generated

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment
- VERIFY: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'null claimed'`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: soft if skips quarantine expects
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `quarantined_length_row`
    - ACTION: AC-5 test reads verification after fixed-geometry reconstruct
    - MUST_OBSERVE: verifyResult.ok == true hard; ratio == null; claimedMiles == null; verdict == pass; routedMiles == 22.0; geometryStatus == generated
    - MUST_NOT_OBSERVE: soft if (verifyResult.ok) wrapping quarantine expects

### AC-3

**Requirement:** GIVEN Named failure rows ratio-161, single-anchor, degenerate-2pt reconstructed WHEN AC-6 tests read failedCondition THEN each hard-expects verifyResult.ok and exact failedCondition string

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment
- VERIFY: `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'failedCondition'`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: soft if leaves failedCondition unasserted
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `named_failure_rows`
    - ACTION: AC-6 tests read failedCondition
    - MUST_OBSERVE: failedCondition == ratio for test:ratio-161; failedCondition == anchors for test:single-anchor; failedCondition == degenerate for test:degenerate-2pt; hard expect ok true each case
    - MUST_NOT_OBSERVE: soft if around failedCondition expects; failedCondition absent on review rows

### AC-4

**Requirement:** GIVEN Hard-expect pattern in place for AC-4/5/6 WHEN verification read returns non-ok THEN test fails at expect(verifyResult.ok).toBe(true); zero soft if wrappers remain

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: repo source + geometryGatePersist suite
- VERIFY: `rg -n 'if \(verifyResult\.ok\)' convex/__tests__/geometryGatePersist.integration.test.ts; test $? -ne 0`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: soft if still present in AC-4/5/6
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `non_ok_verification_read`
    - ACTION: verification read returns non-ok
    - MUST_OBSERVE: zero soft if (verifyResult.ok) in AC-4/5/6 bodies; expect(verifyResult.ok).toBe(true) before field asserts
    - MUST_NOT_OBSERVE: if (verifyResult.ok) wrapping body expects

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Degenerate 2-point verification asserts failedCondition equals degenerate with hard ok expect | AC-1 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t '2-point'` |
| TC-2 | Degenerate 10pt/50mi verification asserts degenerate true and review status with hard ok expect | AC-1 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t '10 points'` |
| TC-3 | Quarantined null claimed length asserts ratio null and routedMiles 22.0 with hard ok expect | AC-2 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'null claimed'` |
| TC-4 | failedCondition reporting asserts ratio, anchors, and degenerate named values with hard ok expects | AC-3 | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'failedCondition'` |
| TC-5 | geometryGatePersist.integration.test.ts contains zero if (verifyResult.ok) soft wrappers in AC-4/5/6 bodies | AC-4 | `rg -n 'if \(verifyResult\.ok\)' convex/__tests__/geometryGatePersist.integration.test.ts; test $? -ne 0` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/__tests__/geometryGatePersist.integration.test.ts (MODIFY)

**writeProhibited:**
- convex/curatedGeometryGate.ts — ask first if hard tests expose real product bug
- convex/curatedGeometryReconstruct.ts — REDHAT-FIX-005
- react-native/**
- gate-plan.json — REDHAT-FIX-003
- Any file not explicitly listed above

## READING LIST

- `convex/__tests__/geometryGatePersist.integration.test.ts` (196-425) — soft if AC-4/5/6
- `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (62-65,157-174) — AUTHORITY M1
- `S1-T2-deterministic-gate-reconstruct-persist-query.md` (142-197) — original AC-4/5/6 GWT

## DESIGN

- pattern: expect(verifyResult.ok).toBe(true); const data = JSON.parse(verifyResult.stdout); expect(data.failedCondition).toBe('degenerate')
- pattern_source: `geometryGatePersist AC-3 anchors hard-expect style already in-file`
- anti_pattern: if (verifyResult.ok) { expect(...) } // vacuous-pass when ok is false
- references: `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md`, `./SPRINT.md`

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| AC-4/5/6 suites | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'degenerate|quarantine|null claimed|failedCondition'` | Exit 0; hard asserts execute |
| Soft-if absent | `rg -n 'if \(verifyResult\.ok\)' convex/__tests__/geometryGatePersist.integration.test.ts; test $? -ne 0` | No matches |
| Full suite | `pnpm test convex/__tests__/geometryGatePersist.integration.test.ts` | Exit 0 |
| Typecheck | `pnpm type-check` | Exit 0 |
| Lint | `pnpm lint` | Exit 0 |
| Scope | `git diff --name-only` | ⊆ write_allowed |

## CODING STANDARDS

- `brain/docs/TESTING-HIERARCHY.md`
- `brain/docs/RED-FIRST-TEST-GATE.md`
- `brain/docs/CODING-STANDARDS.md`

## DEPENDENCIES

- Depends on: S1-T2
- Blocks: —

## NOTES

- Source authority: red-hat review `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (2026-07-12T07:30:55Z).
- Fixes M1 category-4 test theatre. Parallel with RN fixes. proposed_by=convex-planner.
- Do not implement product code beyond write_allowed. Do not call the sprint done.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-006",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "degenerate_rows": {
      "description": "test:degenerate-2pt and test:degenerate-10pt-50mi via fixed-geometry reconstruct",
      "seed_method": "public_api",
      "records": [
        "2pt",
        "10pt/50mi"
      ]
    },
    "quarantined_length_row": {
      "description": "test:quarantined-null-length claimedMiles null non-degenerate 22.0-mi line",
      "seed_method": "public_api",
      "records": [
        "null claimed"
      ]
    },
    "named_failure_rows": {
      "description": "test:ratio-161, test:single-anchor, test:degenerate-2pt",
      "seed_method": "public_api",
      "records": [
        "ratio",
        "anchors",
        "degenerate"
      ]
    },
    "non_ok_verification_read": {
      "description": "verifyResult ok:false must fail hard expects",
      "seed_method": "public_api",
      "records": [
        "non-ok CLI"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN Seeded degenerate rows reconstructed via reconstructForRouteWithFixedGeometry on live Convex WHEN AC-4 tests read getVerificationForRoute THEN tests hard-require ok verification and assert degenerate true, geometryStatus review, failedCondition degenerate",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'degenerate'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "soft if vacuous-pass",
            "failedCondition degenerate not asserted",
            "mocked verification"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "degenerate_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "AC-4 tests read getVerificationForRoute"
              ]
            },
            "end_state": {
              "must_observe": [
                "expect(verifyResult.ok).toBe(true) without soft if",
                "verification.degenerate == true",
                "geometryStatus == review",
                "failedCondition == degenerate"
              ],
              "must_not_observe": [
                "if (verifyResult.ok) wrapping body expects",
                "geometryStatus generated for 2-point line"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN Seeded quarantined null-length row with non-degenerate routed line WHEN AC-5 test reads verification after fixed-geometry reconstruct THEN hard expects: ratio null, claimedMiles null, verdict pass, routedMiles 22.0, geometryStatus generated",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'null claimed'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "soft if skips quarantine expects"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "quarantined_length_row",
            "action": {
              "actor": "api_client",
              "steps": [
                "AC-5 test reads verification after fixed-geometry reconstruct"
              ]
            },
            "end_state": {
              "must_observe": [
                "verifyResult.ok == true hard",
                "ratio == null",
                "claimedMiles == null",
                "verdict == pass",
                "routedMiles == 22.0",
                "geometryStatus == generated"
              ],
              "must_not_observe": [
                "soft if (verifyResult.ok) wrapping quarantine expects"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN Named failure rows ratio-161, single-anchor, degenerate-2pt reconstructed WHEN AC-6 tests read failedCondition THEN each hard-expects verifyResult.ok and exact failedCondition string",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'failedCondition'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "soft if leaves failedCondition unasserted"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "named_failure_rows",
            "action": {
              "actor": "api_client",
              "steps": [
                "AC-6 tests read failedCondition"
              ]
            },
            "end_state": {
              "must_observe": [
                "failedCondition == ratio for test:ratio-161",
                "failedCondition == anchors for test:single-anchor",
                "failedCondition == degenerate for test:degenerate-2pt",
                "hard expect ok true each case"
              ],
              "must_not_observe": [
                "soft if around failedCondition expects",
                "failedCondition absent on review rows"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN Hard-expect pattern in place for AC-4/5/6 WHEN verification read returns non-ok THEN test fails at expect(verifyResult.ok).toBe(true); zero soft if wrappers remain",
      "verify": "rg -n 'if \\(verifyResult\\.ok\\)' convex/__tests__/geometryGatePersist.integration.test.ts; test $? -ne 0",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "repo source + geometryGatePersist suite",
        "negative_control": {
          "would_fail_if": [
            "soft if still present in AC-4/5/6"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "non_ok_verification_read",
            "action": {
              "actor": "api_client",
              "steps": [
                "verification read returns non-ok"
              ]
            },
            "end_state": {
              "must_observe": [
                "zero soft if (verifyResult.ok) in AC-4/5/6 bodies",
                "expect(verifyResult.ok).toBe(true) before field asserts"
              ],
              "must_not_observe": [
                "if (verifyResult.ok) wrapping body expects"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Degenerate 2-point verification asserts failedCondition equals degenerate with hard ok expect",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t '2-point'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Degenerate 10pt/50mi verification asserts degenerate true and review status with hard ok expect",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t '10 points'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Quarantined null claimed length asserts ratio null and routedMiles 22.0 with hard ok expect",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'null claimed'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "failedCondition reporting asserts ratio, anchors, and degenerate named values with hard ok expects",
      "verify": "pnpm test convex/__tests__/geometryGatePersist.integration.test.ts -t 'failedCondition'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "geometryGatePersist.integration.test.ts contains zero if (verifyResult.ok) soft wrappers in AC-4/5/6 bodies",
      "verify": "rg -n 'if \\(verifyResult\\.ok\\)' convex/__tests__/geometryGatePersist.integration.test.ts; test $? -ne 0",
      "maps_to_ac": "AC-4"
    }
  ]
}
-->
