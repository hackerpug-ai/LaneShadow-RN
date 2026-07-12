# REDHAT-FIX-007 — Execute and archive the absent-route Maestro branch as part of the gate evidence; fixes M2

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-007 |
| SPRINT | [Sprint 01 — Geometry reference-flow spike](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`react-native-ui-implementer` · reviewer=`react-native-ui-reviewer` |
| ESTIMATE | 60 min |
| EFFORT | S |
| PRIORITY | P1 |
| STATUS | Backlog |
| PROPOSED_BY | `react-native-ui-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-03 |
| PRD_REFS | T-REC-016, UC-REC-02, CAP-GEO-03 |
| DEPENDS_ON | S1-T3 |
| BLOCKS | — |
| AUTHORITY | [.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md](../../../../reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md) |

RUNTIME_COMMANDS:
- test: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Gate package contains a real AC-4 Maestro run for nonexistent-route-slug with log+screenshot; dual-branch YAML is dual-executed.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST actually run maestro with RECOVERED_ROUTE_ID=nonexistent-route-slug on booted iOS sim against live dev
- MUST archive AC-4 log + screenshot into sprint gate evidence chain used by S1-T4
- MUST update gate-plan/results so AC-4 is recorded as executed — not only happy path
- MUST prove fallback: curated-route-detail-fallback + Route not found; real-line oracle NOT visible; no crash

**NEVER**
- NEVER claim AC-4 Done from YAML branch existence alone
- NEVER treat worktree-only maestro-ac4-absent.log outside gate package as sufficient
- NEVER fabricate a road line for an absent routeId
- NEVER edit convex/**

**STRICTLY**
- STRICTLY test_tier=e2e for AC-4 run; PRIMARY proof is archived Maestro log + screenshot
- STRICTLY keep RECOVERED_ROUTE_ID=nonexistent-route-slug literal
- STRICTLY can run parallel with 001 if YAML branch already works

## DONE WHEN

- [ ] AC-1: Absent-route Maestro branch exits 0 with honest fallback
- [ ] AC-2: AC-4 artifacts archived in gate package
- [ ] AC-3: gate-plan/results document AC-4 dual execution
- [ ] AC-4: Happy path evidence remains distinct from AC-4
- [ ] Only SCOPE.writeAllowed files modified (`git diff --name-only`)
- [ ] Do **not** mark Sprint 01 Done from this task alone

## SPECIFICATION

**Objective:** Close M2: execute the absent-route Maestro branch and archive it in the sprint gate evidence chain.

**Success state:** Gate package contains maestro AC-4 log + absent-route screenshot for RECOVERED_ROUTE_ID=nonexistent-route-slug with exit 0; gate-results documents AC-4 execution.

**Agent rationale:** M2 dual-branch YAML without dual execution in sprint gate package; owns Maestro flows and gate RN evidence.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `absent_route` (seed_method: `recorded_external`): RECOVERED_ROUTE_ID with no curated_routes row
- `cold_app` (seed_method: `recorded_external`): stopApp + clearState cold boot
- `gate_package_root` (seed_method: `recorded_external`): S1-T4 evidence chain root

## ACCEPTANCE CRITERIA

### AC-1 [PRIMARY]

**Requirement:** GIVEN iOS sim booted, Metro + EXPO_PUBLIC_E2E=1, live Convex dev, rec-016 YAML present WHEN maestro test ... -e RECOVERED_ROUTE_ID=nonexistent-route-slug THEN flow exits 0; curated-route-detail-fallback + Route not found; real-line oracle and crash surfaces absent

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Maestro (iOS simulator) against live Convex dev
- VERIFY: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug`
- FLOW_REF: `T-REC-016 / S1-T3 AC-4`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: screen crashes on absent routeId; fabricated real-line; happy-path slug used
- EVIDENCE: `screenshot` (required_capture: true)
- CASE 1 — start_ref `absent_route`
    - ACTION: maestro test ... -e RECOVERED_ROUTE_ID=nonexistent-route-slug
    - MUST_OBSERVE: curated-route-detail-fallback visible; text Route not found; Maestro exit 0; screenshot 02-absent-route-fallback captured
    - MUST_NOT_OBSERVE: real-line/painted oracle visible; Render Error; ConvexError; fabricated copper road line

### AC-2

**Requirement:** GIVEN successful AC-4 Maestro run WHEN evidence is archived for sprint gate package THEN log + screenshot live under S1-T4 evidence chain path

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: filesystem gate package
- VERIFY: `test -s /tmp/laneshadow-gate-sprint-01-geometry-reference-spike/maestro-ac4-absent.log`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: evidence only outside gate package; empty log
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `gate_package_root`
    - ACTION: evidence is archived for sprint gate package
    - MUST_OBSERVE: non-empty maestro-ac4-absent.log in package; absent-route screenshot in package
    - MUST_NOT_OBSERVE: empty log file; evidence only in prose without files

### AC-3

**Requirement:** GIVEN gate-plan/results currently record happy-path steps 6–7 only for Maestro WHEN REDHAT-FIX-007 completes THEN artifacts document AC-4 (absent slug) executed separately from happy path

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: gate package JSON + evidence index
- VERIFY: `rg -n 'nonexistent-route-slug|maestro-ac4' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: gate-results only happy-path Maestro with no AC-4 entry
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `gate_package_root`
    - ACTION: REDHAT-FIX-007 completes
    - MUST_OBSERVE: explicit AC-4 / nonexistent-route-slug execution record; log path pointing at archived AC-4 artifact
    - MUST_NOT_OBSERVE: AC-4 claimed only by YAML comments

### AC-4

**Requirement:** GIVEN both happy-path and absent-route Maestro runs exist WHEN gate package is inspected THEN happy-path and AC-4 log/screenshot are separate artifacts

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: gate package file listing after dual Maestro runs
- VERIFY: `ls -la /tmp/laneshadow-gate-sprint-01-geometry-reference-spike/`

SCENARIO:
- NEGATIVE_CONTROL — would fail if: single happy-path log reused as AC-4; AC-4 screenshot shows Twist of Tepusquet Loop
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `absent_route`
    - ACTION: gate package is inspected
    - MUST_OBSERVE: distinct AC-4 log filename from step6/step7 happy-path logs; AC-4 screenshot shows Route not found fallback UI
    - MUST_NOT_OBSERVE: AC-4 screenshot showing Twist of Tepusquet Loop map; identical log reused for happy and absent

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Maestro with RECOVERED_ROUTE_ID=nonexistent-route-slug exits 0 and shows curated-route-detail-fallback | AC-1 | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug` |
| TC-2 | AC-4 Maestro log exists as non-empty file in sprint gate package root | AC-2 | `test -s /tmp/laneshadow-gate-sprint-01-geometry-reference-spike/maestro-ac4-absent.log` |
| TC-3 | gate-results or evidence index records AC-4 execution with nonexistent-route-slug and log path | AC-3 | `rg -n 'nonexistent-route-slug|maestro-ac4' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/` |
| TC-4 | AC-4 screenshot does not show Twist of Tepusquet Loop recovered map; shows Route not found fallback | AC-4 | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/gate-results.json (MODIFY)
- gate-plan.json (MODIFY if needed)
- .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/evidence/** (NEW)
- .maestro/rec-016-cold-boot-recovered-route-plots.yaml (MODIFY only if AC-4 branch broken)

**writeProhibited:**
- convex/**
- Founder-Operator observation complete claim (REDHAT-FIX-004)
- steps 1–5 CLI reconstruct chain rewrite (REDHAT-FIX-003)
- Any file not explicitly listed above

## READING LIST

- `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (67-70,183-188) — AUTHORITY M2
- `.maestro/rec-016-cold-boot-recovered-route-plots.yaml` (1-10,143-164) — AC-4 branch
- `gate-results.json` (1-78) — happy-path only
- `S1-T3-maestro-cold-boot-plot-verification-flow.md` (122-144) — original AC-4 VERIFY

## DESIGN

- pattern: Same YAML, second execution with -e RECOVERED_ROUTE_ID=nonexistent-route-slug; archive stdout + screenshots into gate package; document in gate-results.
- pattern_source: `.maestro/rec-016-cold-boot-recovered-route-plots.yaml:143-164`
- anti_pattern: Dual-branch YAML without dual execution; worktree-only log not in gate package; STATUS claims Maestro AC-4 without artifact.
- references: `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md`, `./SPRINT.md`

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| PRIMARY e2e AC-4 absent route | `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug` | Exit 0; fallback visible |
| Evidence archived | `test -s /tmp/laneshadow-gate-sprint-01-geometry-reference-spike/maestro-ac4-absent.log` | Non-empty AC-4 log |
| Package documents AC-4 | `rg -n 'nonexistent-route-slug|maestro-ac4' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/` | Documented reference |
| Scope | `git diff --name-only` | ⊆ write_allowed |

## CODING STANDARDS

- `Agents.md`
- `brain/docs/TESTING-HIERARCHY.md`
- `brain/docs/WHEN-PRINTING-HUMAN-TESTING-STEPS.md`

## DEPENDENCIES

- Depends on: S1-T3
- Blocks: —

## NOTES

- Source authority: red-hat review `.spec/reviews/red-hat-sprint-01-2026-07-12T07-30-55Z.md` (2026-07-12T07:30:55Z).
- Fixes M2. Parallel with 001/002. proposed_by=react-native-ui-planner.
- Do not implement product code beyond write_allowed. Do not call the sprint done.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-007",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "absent_route": {
      "description": "RECOVERED_ROUTE_ID with no curated_routes row",
      "seed_method": "recorded_external",
      "records": [
        "nonexistent-route-slug"
      ]
    },
    "cold_app": {
      "description": "stopApp + clearState cold boot",
      "seed_method": "recorded_external",
      "records": [
        "e2e auth"
      ]
    },
    "gate_package_root": {
      "description": "S1-T4 evidence chain root",
      "seed_method": "recorded_external",
      "records": [
        "/tmp/laneshadow-gate-sprint-01-geometry-reference-spike/",
        "sprint evidence/"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN iOS sim booted, Metro + EXPO_PUBLIC_E2E=1, live Convex dev, rec-016 YAML present WHEN maestro test ... -e RECOVERED_ROUTE_ID=nonexistent-route-slug THEN flow exits 0; curated-route-detail-fallback + Route not found; real-line oracle and crash surfaces absent",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Maestro (iOS simulator) against live Convex dev",
        "negative_control": {
          "would_fail_if": [
            "screen crashes on absent routeId",
            "fabricated real-line",
            "happy-path slug used"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "absent_route",
            "action": {
              "actor": "cli_user",
              "steps": [
                "maestro test ... -e RECOVERED_ROUTE_ID=nonexistent-route-slug"
              ]
            },
            "end_state": {
              "must_observe": [
                "curated-route-detail-fallback visible",
                "text Route not found",
                "Maestro exit 0",
                "screenshot 02-absent-route-fallback captured"
              ],
              "must_not_observe": [
                "real-line/painted oracle visible",
                "Render Error",
                "ConvexError",
                "fabricated copper road line"
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
      "description": "GIVEN successful AC-4 Maestro run WHEN evidence is archived for sprint gate package THEN log + screenshot live under S1-T4 evidence chain path",
      "verify": "test -s /tmp/laneshadow-gate-sprint-01-geometry-reference-spike/maestro-ac4-absent.log",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "filesystem gate package",
        "negative_control": {
          "would_fail_if": [
            "evidence only outside gate package",
            "empty log"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "gate_package_root",
            "action": {
              "actor": "api_client",
              "steps": [
                "evidence is archived for sprint gate package"
              ]
            },
            "end_state": {
              "must_observe": [
                "non-empty maestro-ac4-absent.log in package",
                "absent-route screenshot in package"
              ],
              "must_not_observe": [
                "empty log file",
                "evidence only in prose without files"
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
      "description": "GIVEN gate-plan/results currently record happy-path steps 6\u20137 only for Maestro WHEN REDHAT-FIX-007 completes THEN artifacts document AC-4 (absent slug) executed separately from happy path",
      "verify": "rg -n 'nonexistent-route-slug|maestro-ac4' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "gate package JSON + evidence index",
        "negative_control": {
          "would_fail_if": [
            "gate-results only happy-path Maestro with no AC-4 entry"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "gate_package_root",
            "action": {
              "actor": "api_client",
              "steps": [
                "REDHAT-FIX-007 completes"
              ]
            },
            "end_state": {
              "must_observe": [
                "explicit AC-4 / nonexistent-route-slug execution record",
                "log path pointing at archived AC-4 artifact"
              ],
              "must_not_observe": [
                "AC-4 claimed only by YAML comments"
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
      "description": "GIVEN both happy-path and absent-route Maestro runs exist WHEN gate package is inspected THEN happy-path and AC-4 log/screenshot are separate artifacts",
      "verify": "ls -la /tmp/laneshadow-gate-sprint-01-geometry-reference-spike/",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "gate package file listing after dual Maestro runs",
        "negative_control": {
          "would_fail_if": [
            "single happy-path log reused as AC-4",
            "AC-4 screenshot shows Twist of Tepusquet Loop"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "absent_route",
            "action": {
              "actor": "cli_user",
              "steps": [
                "gate package is inspected"
              ]
            },
            "end_state": {
              "must_observe": [
                "distinct AC-4 log filename from step6/step7 happy-path logs",
                "AC-4 screenshot shows Route not found fallback UI"
              ],
              "must_not_observe": [
                "AC-4 screenshot showing Twist of Tepusquet Loop map",
                "identical log reused for happy and absent"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Maestro with RECOVERED_ROUTE_ID=nonexistent-route-slug exits 0 and shows curated-route-detail-fallback",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "AC-4 Maestro log exists as non-empty file in sprint gate package root",
      "verify": "test -s /tmp/laneshadow-gate-sprint-01-geometry-reference-spike/maestro-ac4-absent.log",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "gate-results or evidence index records AC-4 execution with nonexistent-route-slug and log path",
      "verify": "rg -n 'nonexistent-route-slug|maestro-ac4' .spec/prds/route-agent-quality/tasks/sprint-01-geometry-reference-spike/",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "AC-4 screenshot does not show Twist of Tepusquet Loop recovered map; shows Route not found fallback",
      "verify": "maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID=nonexistent-route-slug",
      "maps_to_ac": "AC-4"
    }
  ]
}
-->
