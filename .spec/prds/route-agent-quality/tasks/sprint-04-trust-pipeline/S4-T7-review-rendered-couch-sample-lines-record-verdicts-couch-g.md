# S4-T7 — Review rendered couch-sample lines + record verdicts (couch gate); disposition REVIEW-queue items (UC-VER-05)

| Field | Value |
|-------|-------|
| TASK_ID | S4-T7 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`Founder-Operator` · reviewer=`convex-reviewer` |
| ESTIMATE | 45 min |
| EFFORT | XS |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `skipped` |
| RED_GREEN_REQUIRED | no |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | S4-T6 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/<FILE>.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Founder-reviewed couch verdict recorded; 3 REVIEW items dispositioned; full batch unblocked if pass

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Founder reviews ~25 rendered routes as map PNGs
- Founder records per-route verdict (true/off/wrong)
- Founder records overall pass/fail
- Founder dispositions 3 REVIEW-queue items (approve/retry/retire)
- Single 'wrong' forces overall fail

**NEVER**
- NEVER pass couch gate with 'wrong' routes
- NEVER skip REVIEW-queue disposition
- NEVER record overall verdict without per-route verdicts
- NEVER review more than ~25 routes in couch sample

**STRICTLY**
- STRICTLY 'true' = geometry looks correct
- STRICTLY 'off' = geometry fails but reason understood
- STRICTLY 'wrong' = fabricated-but-passing (forces fail)
- STRICTLY approve = persist best geometry
- STRICTLY retry = re-run specified lever
- STRICTLY retire = mark retiredAt

## DONE WHEN

- AC-1 [Founder reviews ~25 rendered couch-sample routes as map PNGs with metadata] [PRIMARY]: Each route is visually inspected against metadata (provenance + lengths)
- AC-2 [Founder records per-route verdict (true/off/wrong) + overall pass/fail]: Per-route verdicts + overall verdict are persisted to couch_verdict table
- AC-3 [Single 'wrong' verdict forces overall fail (fabricated-but-passing geometry detected)]: Overall verdict must be 'fail' (single wrong forces fail)
- AC-4 [Founder dispositions 3 REVIEW-queue items (approve/retry/retire)]: Approve persists geometry, retry re-runs lever, retire sets retiredAt
- AC-5 [Couch verdict = pass unblocks full batch --all (waterfall proceeds)]: couchGateStatus check passes and batch processes all remaining routes
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Founder reviews rendered couch-sample PNGs, records per-route verdicts (true/off/wrong), records overall pass/fail, and dispositions 3 REVIEW-queue items

**Success state:** Founder-reviewed couch verdict recorded; 3 REVIEW items dispositioned; full batch unblocked if pass

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Founder reviews ~25 rendered couch-sample routes as map PNGs with metadata

**Requirement:** GIVEN Rendered couch-sample PNGs exported by S4-T6 WHEN Founder opens rendered sample and reviews each route THEN Each route is visually inspected against metadata (provenance + lengths)

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Founder-Operator (human)
- FLOW_REF: UC-VER-05
- VERIFY: `Human inspection - no automated test`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: founder does not review all routes; review is blind without metadata
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `founder-review-couch`
    - ACTION (user): Open rendered couch-sample directory; Review each PNG + metadata
    - MUST_OBSERVE: ~25 PNG files reviewed, metadataReviewedCount == 25
    - MUST_NOT_OBSERVE: routes skipped

### AC-2 — Founder records per-route verdict (true/off/wrong) + overall pass/fail

**Requirement:** GIVEN Founder has reviewed all couch-sample routes WHEN Founder calls recordCouchVerdict with verdicts THEN Per-route verdicts + overall verdict are persisted to couch_verdict table

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Founder-Operator (human)
- FLOW_REF: UC-VER-05
- VERIFY: `Human action - no automated test`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: verdicts not recorded; overall verdict missing
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `founder-record-verdicts`
    - ACTION (user): Call recordCouchVerdict({overallVerdict: 'pass', routeVerdicts: [...]})
    - MUST_OBSERVE: couch_verdict row count == 1 (persisted), overallVerdict == 'pass'
    - MUST_NOT_OBSERVE: verdict not persisted

### AC-3 — Single 'wrong' verdict forces overall fail (fabricated-but-passing geometry detected)

**Requirement:** GIVEN Founder detects a route with fabricated-but-passing geometry WHEN Founder records per-route verdict 'wrong' THEN Overall verdict must be 'fail' (single wrong forces fail)

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Founder-Operator (human)
- FLOW_REF: UC-VER-05
- VERIFY: `Human action - no automated test`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: wrong verdict does not force fail; fabricated geometry passes
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `founder-wrong-forces-fail`
    - ACTION (user): Record verdict 'wrong' for one route; Record overall verdict 'pass'; Verify rejected - wrong forces fail
    - MUST_OBSERVE: recordCouchVerdict rejects 'pass' with wrong
    - MUST_NOT_OBSERVE: overall pass accepted with wrong

### AC-4 — Founder dispositions 3 REVIEW-queue items (approve/retry/retire)

**Requirement:** GIVEN REVIEW queue with 3 items awaiting disposition WHEN Founder reviews each REVIEW item and calls disposition mutations THEN Approve persists geometry, retry re-runs lever, retire sets retiredAt

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Founder-Operator (human)
- FLOW_REF: UC-VER-04
- VERIFY: `Human action - no automated test`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: dispositions not recorded; approve doesn't persist; retire doesn't set retiredAt
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `founder-dispositions`
    - ACTION (user): Call approveDisposition(routeId); Call retryDisposition(routeId, lever=2); Call retireDisposition(routeId)
    - MUST_OBSERVE: approvedRoute.verification.verdict == 'pass', retryCount == 1 (Lever 2 re-ran), retiredRoute.retiredAt contains '2026-'
    - MUST_NOT_OBSERVE: no disposition recorded

### AC-5 — Couch verdict = pass unblocks full batch --all (waterfall proceeds)

**Requirement:** GIVEN Founder recorded couch verdict = pass WHEN Waterfall --all is invoked after couch pass THEN couchGateStatus check passes and batch processes all remaining routes

- TEST_TIER: `e2e`  ·  VERIFICATION_SERVICE: Founder-Operator (human)
- FLOW_REF: UC-VER-05
- VERIFY: `Human action - no automated test`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: --all still blocked after pass; couchGateStatus doesn't check verdict
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `founder-unblocks-batch`
    - ACTION (user): Record overallVerdict='pass'; Invoke waterfall --all; Verify batch proceeds
    - MUST_OBSERVE: waterfall.processedCount > 0, waterfall exitCode == 0 (no block error)
    - MUST_NOT_OBSERVE: waterfall blocked

## SCOPE (file-level write permissions)

**writeAllowed:**

**writeProhibited:**
- No code changes - human testing gate only

## READING LIST

- `convex/actions/couchVerdict.ts` (recordCouchVerdict) — Verdict recording mutation
- `convex/actions/reviewQueue.ts` (dispositions) — Approve/retry/retire mutations

## CODE PATTERN

- Pattern: Human testing gate
- Pattern source: `Founder-Operator review`
- Anti-pattern: Automated verdict, skipped review

## VERIFICATION GATES


## AGENT ASSIGNMENT

- Agent: `Founder-Operator` — Human testing gate task - founder reviews rendered couch-sample and records verdicts; no implementation code
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: S4-T6
- Blocks: —

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S4-T7",
  "tdd_mode": "skipped",
  "verification_policy": {
    "requires_tests": false,
    "requires_red_evidence": false,
    "requires_seeded_evidence": false
  },
  "fixtures": {},
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN rendered couch-sample PNGs exported by S4-T6 WHEN founder opens rendered sample and reviews each route THEN each route is visually inspected against metadata (provenance + lengths)",
      "verify": "Human inspection - no automated test",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Founder-Operator (human)",
        "negative_control": {
          "would_fail_if": [
            "founder does not review all routes",
            "review is blind without metadata"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "founder-review-couch",
            "action": {
              "actor": "user",
              "steps": [
                "Open rendered couch-sample directory",
                "Review each PNG + metadata"
              ]
            },
            "end_state": {
              "must_observe": [
                "~25 PNG files reviewed",
                "metadataReviewedCount == 25"
              ],
              "must_not_observe": [
                "routes skipped"
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
      "description": "GIVEN founder has reviewed all couch-sample routes WHEN founder calls recordCouchVerdict with verdicts THEN per-route verdicts + overall verdict are persisted to couch_verdict table",
      "verify": "Human action - no automated test",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Founder-Operator (human)",
        "negative_control": {
          "would_fail_if": [
            "verdicts not recorded",
            "overall verdict missing"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "founder-record-verdicts",
            "action": {
              "actor": "user",
              "steps": [
                "Call recordCouchVerdict({overallVerdict: 'pass', routeVerdicts: [...]})"
              ]
            },
            "end_state": {
              "must_observe": [
                "couch_verdict row count == 1 (persisted)",
                "overallVerdict == 'pass'"
              ],
              "must_not_observe": [
                "verdict not persisted"
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
      "description": "GIVEN founder detects a route with fabricated-but-passing geometry WHEN founder records per-route verdict 'wrong' THEN overall verdict must be 'fail' (single wrong forces fail)",
      "verify": "Human action - no automated test",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Founder-Operator (human)",
        "negative_control": {
          "would_fail_if": [
            "wrong verdict does not force fail",
            "fabricated geometry passes"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "founder-wrong-forces-fail",
            "action": {
              "actor": "user",
              "steps": [
                "Record verdict 'wrong' for one route",
                "Record overall verdict 'pass'",
                "Verify rejected - wrong forces fail"
              ]
            },
            "end_state": {
              "must_observe": [
                "recordCouchVerdict rejects 'pass' with wrong"
              ],
              "must_not_observe": [
                "overall pass accepted with wrong"
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
      "description": "GIVEN REVIEW queue with 3 items awaiting disposition WHEN founder reviews each REVIEW item and calls disposition mutations THEN approve persists geometry, retry re-runs lever, retire sets retiredAt",
      "verify": "Human action - no automated test",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Founder-Operator (human)",
        "negative_control": {
          "would_fail_if": [
            "dispositions not recorded",
            "approve doesn't persist",
            "retire doesn't set retiredAt"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "founder-dispositions",
            "action": {
              "actor": "user",
              "steps": [
                "Call approveDisposition(routeId)",
                "Call retryDisposition(routeId, lever=2)",
                "Call retireDisposition(routeId)"
              ]
            },
            "end_state": {
              "must_observe": [
                "approvedRoute.verification.verdict == 'pass'",
                "retryCount == 1 (Lever 2 re-ran)",
                "retiredRoute.retiredAt contains '2026-'"
              ],
              "must_not_observe": [
                "no disposition recorded"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN founder recorded couch verdict = pass WHEN waterfall --all is invoked after couch pass THEN couchGateStatus check passes and batch processes all remaining routes",
      "verify": "Human action - no automated test",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "e2e",
        "verification_service": "Founder-Operator (human)",
        "negative_control": {
          "would_fail_if": [
            "--all still blocked after pass",
            "couchGateStatus doesn't check verdict"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "founder-unblocks-batch",
            "action": {
              "actor": "user",
              "steps": [
                "Record overallVerdict='pass'",
                "Invoke waterfall --all",
                "Verify batch proceeds"
              ]
            },
            "end_state": {
              "must_observe": [
                "waterfall.processedCount > 0",
                "waterfall exitCode == 0 (no block error)"
              ],
              "must_not_observe": [
                "waterfall blocked"
              ]
            }
          }
        ]
      }
    }
  ]
}
-->
</details>
