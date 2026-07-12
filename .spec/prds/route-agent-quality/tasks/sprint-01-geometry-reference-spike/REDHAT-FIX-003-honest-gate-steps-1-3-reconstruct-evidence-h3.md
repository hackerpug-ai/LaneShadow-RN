# REDHAT-FIX-003 — Rework Human Testing Gate steps 1–3 to execute a real reconstruct→gate→persist chain with distinct evidence; fixes H3

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-003 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-01, CAP-GEO-03 |
| PRD_REFS | T-REC-016, UC-REC-02, UC-VER-01, Finding H3 |
| DEPENDS_ON | S1-T2 |
| BLOCKS | REDHAT-FIX-004 |
| AUTHORITY | [.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md](../../../../reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md) |

RUNTIME_COMMANDS:
- test: `npx convex run curatedGeometryReconstruct:reconstructForRoute '{"routeId":"motorcycleroads:twist-of-tepusquet-loop"}' && rg -n 'reconstructForRoute' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-plan.json`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Human Testing Gate steps 1–3 actually run reconstruct→gate→persist on the PoC with distinct evidence, ending re-read theatre of residual verification.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST make gate step 1 invoke reconstructForRoute (or documented authenticated/internal equivalent after REDHAT-FIX-005), NEVER only getVerificationForRoute
- MUST produce DISTINCT cmd_sha and distinct log artifacts for steps 1, 2, and 3 proving reconstruct → verification/ratio band → persist+riderReady
- MUST update gate-plan.json literal_cmd so automated human-tests cannot re-read-theatre residual verification

**NEVER**
- NEVER treat a successful getVerificationForRoute of pre-existing verification as proof that reconstruct just ran
- NEVER leave steps 1–3 sharing the same literal command hash or the same log contents
- NEVER burn real Anthropic/Google quota in a unit test; real reconstruct is CLI/e2e at the human-gate surface

**STRICTLY**
- STRICTLY: negative control — a package that only re-reads getVerificationForRoute MUST FAIL the honesty check
- STRICTLY: PoC routeId remains motorcycleroads:twist-of-tepusquet-loop; coordinate CLI identity with REDHAT-FIX-005

## DONE WHEN

- [ ] AC-1: Gate step 1 runs reconstructForRoute
- [ ] AC-2: Steps 1–3 have distinct evidence
- [ ] AC-3: Post-reconstruct verification proves live chain
- [ ] AC-4: Re-read-only package fails honesty check
- [ ] Only SCOPE.writeAllowed files modified (`git diff --name-only`)
- [ ] Do **not** mark Sprint 01 Done from this task alone

## SPECIFICATION

**Objective:** Restore Human Testing Gate steps 1–3 so they exercise a live CAP-GEO-01 reconstruct→gate→persist chain with non-fungible evidence artifacts.

**Success state:** gate-plan step1 literal_cmd is reconstructForRoute for the PoC; steps 2–3 assert verification/riderReady with distinct logs/cmd_sha; honesty check rejects re-read-only packages.

**Agent rationale:** Owns Convex reconstruct CLI entry points, verification reads, and gate-plan package evidence for CAP-GEO-01.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `poc_route` (seed_method: `public_api`): Twist of Tepusquet Loop on Convex dev (routeId=motorcycleroads:twist-of-tepusquet-loop)
- `re_read_theatre_package` (seed_method: `file_fixture`): H3 failure: steps 1–3 only getVerificationForRoute, shared cmd_sha
- `honest_gate_package` (seed_method: `file_fixture`): step1 reconstructForRoute; step2 verification ratio; step3 persist/riderReady

## ACCEPTANCE CRITERIA

### AC-1 [PRIMARY]

**Requirement:** GIVEN Human Testing Gate package and PoC on Convex dev WHEN gate step 1 is executed as documented in gate-plan.json THEN step1 invokes reconstructForRoute (not only getVerificationForRoute) and logs geometryStatus/provenance from a live reconstruct

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev + real Anthropic + Google + gate-plan package
- VERIFY: `npx convex run curatedGeometryReconstruct:reconstructForRoute '{"routeId":"motorcycleroads:twist-of-tepusquet-loop"}' && rg -n 'reconstructForRoute' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-plan.json`
- FLOW_REF: `UC-REC-02`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: step1 only getVerificationForRoute; reconstruct stubbed hardcoded pass; gate-plan placeholder without reconstructForRoute
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `poc_route`
    - ACTION: gate step 1 is executed as documented in gate-plan.json
    - MUST_OBSERVE: step1 command includes curatedGeometryReconstruct:reconstructForRoute; stdout includes geometryStatus from action; routeId motorcycleroads:twist-of-tepusquet-loop in reconstruct invocation
    - MUST_NOT_OBSERVE: step1 only getVerificationForRoute; step1 is residual verification re-read only

### AC-2

**Requirement:** GIVEN Honest gate package with reconstruct on step1 and verification on 2–3 WHEN steps 1, 2, and 3 are executed and evidence hashes/logs collected THEN each step has a distinct cmd_sha and distinct log/command class

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: gate-plan package + honesty checker
- VERIFY: `pnpm test convex/__tests__/gateSteps1to3Honesty.integration.test.ts -t 'distinct'`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: shared cmd_sha; honesty checker only asserts exit 0
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `honest_gate_package`
    - ACTION: steps 1, 2, and 3 are executed and evidence hashes/logs collected
    - MUST_OBSERVE: cmd_sha(step1) != cmd_sha(step2); step1 command class == reconstructForRoute
    - MUST_NOT_OBSERVE: cmd_sha shared across 1–3; all three steps getVerificationForRoute only

### AC-3

**Requirement:** GIVEN PoC after step1 reconstructForRoute completes on real APIs WHEN step2 runs getVerificationForRoute and step3 asserts persist/riderReady THEN verification shows ratio in [0.6,1.6] on PASS, provenance ai_reconstructed, riderReady true on PASS

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment
- VERIFY: `npx convex run curatedGeometryReconstruct:getVerificationForRoute '{"routeId":"motorcycleroads:twist-of-tepusquet-loop"}'`
- FLOW_REF: `UC-VER-01`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: verification never re-read after reconstruct; ratio band omitted
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `poc_route`
    - ACTION: step2 runs getVerificationForRoute and step3 asserts persist/riderReady
    - MUST_OBSERVE: verification.ratio in [0.6,1.6] on PASS; provenance == ai_reconstructed on PASS; riderReady == true on PASS; geometryStatus == generated on PASS
    - MUST_NOT_OBSERVE: empty verification after successful reconstruct; step2/3 claim pass without reading verification fields

### AC-4

**Requirement:** GIVEN synthetic gate package matching H3 (steps 1–3 only getVerificationForRoute, shared cmd_sha) WHEN gate honesty checker evaluates that package THEN honesty check FAILS citing re-read theatre

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: file_fixture honesty checker
- VERIFY: `pnpm test convex/__tests__/gateSteps1to3Honesty.integration.test.ts -t 're-read'`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: honesty checker always pass; re-read package accepted on exit 0
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `re_read_theatre_package`
    - ACTION: gate honesty checker evaluates that package
    - MUST_OBSERVE: honesty verdict == fail; failure reason mentions missing reconstructForRoute or shared cmd_sha
    - MUST_NOT_OBSERVE: honesty verdict == pass

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | gate-plan.json step1 literal_cmd contains curatedGeometryReconstruct:reconstructForRoute | AC-1 | `rg -n 'reconstructForRoute' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-plan.json` |
| TC-2 | Live reconstructForRoute for PoC exits 0 and prints geometryStatus on Convex dev | AC-1 | `npx convex run curatedGeometryReconstruct:reconstructForRoute '{"routeId":"motorcycleroads:twist-of-tepusquet-loop"}'` |
| TC-3 | cmd_sha for gate steps 1 and 2 differ under the honest package | AC-2 | `pnpm test convex/__tests__/gateSteps1to3Honesty.integration.test.ts -t 'distinct'` |
| TC-4 | getVerificationForRoute after reconstruct returns ratio within [0.6,1.6] on PoC PASS path | AC-3 | `npx convex run curatedGeometryReconstruct:getVerificationForRoute '{"routeId":"motorcycleroads:twist-of-tepusquet-loop"}'` |
| TC-5 | Honesty checker returns fail when steps 1–3 only invoke getVerificationForRoute | AC-4 | `pnpm test convex/__tests__/gateSteps1to3Honesty.integration.test.ts -t 're-read'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-plan.json (MODIFY)
- .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/S1-T4-founder-observe-recovered-line-plot.md (MODIFY steps 1–3 only if needed)
- .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/SPRINT.md (MODIFY Test Steps 1–3 only if needed)
- convex/__tests__/gateSteps1to3Honesty.integration.test.ts (NEW)
- scripts/gate-steps-1-3-honesty.mjs (NEW optional)

**writeProhibited:**
- convex/actions/curatedGeometryReconstruct.ts — engine owned by S1-T2
- react-native/**
- convex/curatedGeometryReconstruct.ts auth changes owned by REDHAT-FIX-005 (coordinate only)
- Any file not explicitly listed above

## READING LIST

- `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (38-47,203-213) — AUTHORITY H3
- `.spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-plan.json` (all) — placeholder literal_cmds
- `convex/curatedGeometryReconstruct.ts` (11-84) — public reconstruct + verification
- `S1-T4-founder-observe-recovered-line-plot.md` (40-50) — documented steps 1–3

## DESIGN

- pattern: Step1: reconstructForRoute; Step2: getVerificationForRoute ratio band; Step3: provenance+riderReady — three distinct command classes and logs.
- pattern_source: `S1-T4 steps 1–3 + red-hat H3`
- anti_pattern: Running getVerificationForRoute three times and calling that reconstruct→gate→persist.
- references: `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md`, `./SPRINT.md`

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| AC-1 reconstruct + gate-plan | `npx convex run curatedGeometryReconstruct:reconstructForRoute '{"routeId":"motorcycleroads:twist-of-tepusquet-loop"}' && rg -n 'reconstructForRoute' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-plan.json` | Exit 0; gate-plan contains reconstructForRoute |
| Honesty tests | `pnpm test convex/__tests__/gateSteps1to3Honesty.integration.test.ts` | Exit 0; re-read theatre fail |
| Verification read | `npx convex run curatedGeometryReconstruct:getVerificationForRoute '{"routeId":"motorcycleroads:twist-of-tepusquet-loop"}'` | ratio/provenance/riderReady present |
| Typecheck | `pnpm type-check` | Exit 0 |
| Lint | `pnpm lint` | Exit 0 |
| Convex build | `pnpm convex:dev --once` | Exit 0 if convex helper changes |
| Scope | `git diff --name-only` | ⊆ write_allowed |

## CODING STANDARDS

- `brain/docs/CONVEX-RULES.md`
- `brain/docs/WHEN-PRINTING-HUMAN-TESTING-STEPS.md`
- `brain/docs/TESTING-HIERARCHY.md`
- `convex/_generated/ai/guidelines.md`

## DEPENDENCIES

- Depends on: S1-T2
- Blocks: REDHAT-FIX-004

## NOTES

- Source authority: red-hat review `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (2026-07-12T07:30:55Z).
- Fixes H3. Coordinate with REDHAT-FIX-005 for --identity. Does not alone pass gate-results. proposed_by=convex-planner.
- Do not implement product code beyond write_allowed. Do not call the sprint done.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-003",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "poc_route": {
      "description": "Twist of Tepusquet Loop on Convex dev (routeId=motorcycleroads:twist-of-tepusquet-loop)",
      "seed_method": "public_api",
      "records": [
        "may already hold residual verification \u2014 MUST re-run reconstruct"
      ]
    },
    "re_read_theatre_package": {
      "description": "H3 failure: steps 1\u20133 only getVerificationForRoute, shared cmd_sha",
      "seed_method": "file_fixture",
      "records": [
        "synthetic package"
      ]
    },
    "honest_gate_package": {
      "description": "step1 reconstructForRoute; step2 verification ratio; step3 persist/riderReady",
      "seed_method": "file_fixture",
      "records": [
        "distinct commands"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN Human Testing Gate package and PoC on Convex dev WHEN gate step 1 is executed as documented in gate-plan.json THEN step1 invokes reconstructForRoute (not only getVerificationForRoute) and logs geometryStatus/provenance from a live reconstruct",
      "verify": "npx convex run curatedGeometryReconstruct:reconstructForRoute '{\"routeId\":\"motorcycleroads:twist-of-tepusquet-loop\"}' && rg -n 'reconstructForRoute' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-plan.json",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev + real Anthropic + Google + gate-plan package",
        "negative_control": {
          "would_fail_if": [
            "step1 only getVerificationForRoute",
            "reconstruct stubbed hardcoded pass",
            "gate-plan placeholder without reconstructForRoute"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "poc_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "gate step 1 is executed as documented in gate-plan.json"
              ]
            },
            "end_state": {
              "must_observe": [
                "step1 command includes curatedGeometryReconstruct:reconstructForRoute",
                "stdout includes geometryStatus from action",
                "routeId motorcycleroads:twist-of-tepusquet-loop in reconstruct invocation"
              ],
              "must_not_observe": [
                "step1 only getVerificationForRoute",
                "step1 is residual verification re-read only"
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
      "description": "GIVEN Honest gate package with reconstruct on step1 and verification on 2\u20133 WHEN steps 1, 2, and 3 are executed and evidence hashes/logs collected THEN each step has a distinct cmd_sha and distinct log/command class",
      "verify": "pnpm test convex/__tests__/gateSteps1to3Honesty.integration.test.ts -t 'distinct'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "gate-plan package + honesty checker",
        "negative_control": {
          "would_fail_if": [
            "shared cmd_sha",
            "honesty checker only asserts exit 0"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "honest_gate_package",
            "action": {
              "actor": "api_client",
              "steps": [
                "steps 1, 2, and 3 are executed and evidence hashes/logs collected"
              ]
            },
            "end_state": {
              "must_observe": [
                "cmd_sha(step1) != cmd_sha(step2)",
                "step1 command class == reconstructForRoute"
              ],
              "must_not_observe": [
                "cmd_sha shared across 1\u20133",
                "all three steps getVerificationForRoute only"
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
      "description": "GIVEN PoC after step1 reconstructForRoute completes on real APIs WHEN step2 runs getVerificationForRoute and step3 asserts persist/riderReady THEN verification shows ratio in [0.6,1.6] on PASS, provenance ai_reconstructed, riderReady true on PASS",
      "verify": "npx convex run curatedGeometryReconstruct:getVerificationForRoute '{\"routeId\":\"motorcycleroads:twist-of-tepusquet-loop\"}'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "verification never re-read after reconstruct",
            "ratio band omitted"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "poc_route",
            "action": {
              "actor": "api_client",
              "steps": [
                "step2 runs getVerificationForRoute and step3 asserts persist/riderReady"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.ratio in [0.6,1.6] on PASS",
                "provenance == ai_reconstructed on PASS",
                "riderReady == true on PASS",
                "geometryStatus == generated on PASS"
              ],
              "must_not_observe": [
                "empty verification after successful reconstruct",
                "step2/3 claim pass without reading verification fields"
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
      "description": "GIVEN synthetic gate package matching H3 (steps 1\u20133 only getVerificationForRoute, shared cmd_sha) WHEN gate honesty checker evaluates that package THEN honesty check FAILS citing re-read theatre",
      "verify": "pnpm test convex/__tests__/gateSteps1to3Honesty.integration.test.ts -t 're-read'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "file_fixture honesty checker",
        "negative_control": {
          "would_fail_if": [
            "honesty checker always pass",
            "re-read package accepted on exit 0"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "re_read_theatre_package",
            "action": {
              "actor": "api_client",
              "steps": [
                "gate honesty checker evaluates that package"
              ]
            },
            "end_state": {
              "must_observe": [
                "honesty verdict == fail",
                "failure reason mentions missing reconstructForRoute or shared cmd_sha"
              ],
              "must_not_observe": [
                "honesty verdict == pass"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "gate-plan.json step1 literal_cmd contains curatedGeometryReconstruct:reconstructForRoute",
      "verify": "rg -n 'reconstructForRoute' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-plan.json",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Live reconstructForRoute for PoC exits 0 and prints geometryStatus on Convex dev",
      "verify": "npx convex run curatedGeometryReconstruct:reconstructForRoute '{\"routeId\":\"motorcycleroads:twist-of-tepusquet-loop\"}'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "cmd_sha for gate steps 1 and 2 differ under the honest package",
      "verify": "pnpm test convex/__tests__/gateSteps1to3Honesty.integration.test.ts -t 'distinct'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "getVerificationForRoute after reconstruct returns ratio within [0.6,1.6] on PoC PASS path",
      "verify": "npx convex run curatedGeometryReconstruct:getVerificationForRoute '{\"routeId\":\"motorcycleroads:twist-of-tepusquet-loop\"}'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Honesty checker returns fail when steps 1\u20133 only invoke getVerificationForRoute",
      "verify": "pnpm test convex/__tests__/gateSteps1to3Honesty.integration.test.ts -t 're-read'",
      "maps_to_ac": "AC-4"
    }
  ]
}
-->
