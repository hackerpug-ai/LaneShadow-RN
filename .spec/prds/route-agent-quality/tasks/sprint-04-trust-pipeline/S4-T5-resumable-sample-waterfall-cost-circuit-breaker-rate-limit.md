# S4-T5 — Resumable --sample waterfall + cost circuit-breaker + rate-limit/backoff + REVIEW queue with dispositions (REC-04 sample, T-REC-019, VER-04) (UC-REC-04, UC-VER-04)

| Field | Value |
|-------|-------|
| TASK_ID | S4-T5 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 210 min |
| EFFORT | L |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | — (no boundary chain segment; consumes/provides the gate) |
| DEPENDS_ON | S4-T1, S4-T2, S4-T3 |
| BLOCKS | S4-T6 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/<FILE>.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Waterfall processes routes lever-by-lever; cost circuit-breaker enforces budget; rate-limit/backoff handles API errors; REVIEW queue receives failures; resume skips PASSed routes

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST process levers in order (1→2→3) until one produces gate-passing geometry
- MUST skip already-PASSed routes on resume
- MUST enforce --max-cost circuit-breaker
- MUST end every route in exactly one terminal state (recovered/queued/retirement-eligible)

**NEVER**
- NEVER continue to next lever after finding passing geometry
- NEVER exceed --max-cost budget
- NEVER leave routes in unprocessed limbo state
- NEVER allow infinite retry without backoff
- NEVER persist geometry without gate verification

**STRICTLY**
- STRICTLY provenance is recorded on every recovered route
- STRICTLY cost envelope is ~$0.07 per reconstructed route
- STRICTLY rate-limit + exponential backoff on API errors
- STRICTLY REVIEW queue stores best candidate geometry
- STRICTLY terminal states are mutually exclusive

## DONE WHEN

- AC-1 [Waterfall processes routes in lever order (1→2→3) until one produces gate-passing geometry] [PRIMARY]: First lever with passing geometry stops cascade, provenance is recorded
- AC-2 [Waterfall is resumable - skips already-PASSed routes on restart]: Routes already PASSed are skipped, remaining routes are processed
- AC-3 [Cost circuit-breaker enforces --max-cost and stops batch when exceeded]: Batch stops gracefully with cost-exceeded message
- AC-4 [Rate-limit + exponential backoff handles Google API errors]: Request retries with exponential backoff up to max attempts
- AC-5 [REVIEW queue receives routes that fail gate after repair budget with best candidate geometry]: Route is queued for REVIEW with failedCondition + best candidate geometry
- AC-6 [REVIEW queue supports dispositions: approve (persist), retry (send back to lever), retire (mark retired)]: Approve persists geometry, retry re-runs lever, retire sets retiredAt
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Implement resumable --sample waterfall that runs levers in order, enforces cost circuit-breaker, handles rate-limit/backoff, and routes failures to REVIEW queue with dispositions

**Success state:** Waterfall processes routes lever-by-lever; cost circuit-breaker enforces budget; rate-limit/backoff handles API errors; REVIEW queue receives failures; resume skips PASSed routes

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `waterfall-lever1-pass` (seed_method: `public_api`): Route with Lever-1-passing in-row polyline
    - routeId: 'test:lever1-pass', routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', lengthMiles: 41, compositeScore: 0.85
- `waterfall-lever2-pass` (seed_method: `public_api`): Route needing Lever 2 reconstruction with description
    - routeId: 'test:lever2-pass', summary: 'Highway 101 in Santa Maria...', lengthMiles: 41, compositeScore: 0.85
- `review-queue-candidate` (seed_method: `public_api`): Route that fails all levers + repair
    - routeId: 'test:review-candidate', name: 'Review Candidate', lengthMiles: 10, compositeScore: 0.85

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Waterfall processes routes in lever order (1→2→3) until one produces gate-passing geometry

**Requirement:** GIVEN A batch of routes needing geometry recovery WHEN Waterfall runs the levers in order for each route THEN First lever with passing geometry stops cascade, provenance is recorded

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real waterfall orchestration)
- FLOW_REF: UC-REC-04
- VERIFY: `pnpm test convex/__tests__/S4T5-waterfall-lever-order.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: levers run out of order; waterfall continues after passing geometry; provenance is not recorded
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `waterfall-lever1-pass`
    - ACTION (api_client): Seed route with Lever-1-passing polyline; Run waterfall; Verify Lever 1 ran, Lever 2/3 did not; Verify provenance='scraped_promoted'
    - MUST_OBSERVE: verification.provenance == 'scraped_promoted', Lever 2/3 not called
    - MUST_NOT_OBSERVE: Lever 2/3 called, provenance == null
- CASE 2 — start_ref `waterfall-lever2-pass`
    - ACTION (api_client): Seed route needing Lever 2 reconstruction; Run waterfall; Verify Lever 1 ran (failed), Lever 2 ran (passed); Verify Lever 3 not called
    - MUST_OBSERVE: verification.provenance == 'ai_reconstructed', Lever 1 failed, Lever 2 passed, Lever 3 not called
    - MUST_NOT_OBSERVE: Lever 3 called

### AC-2 — Waterfall is resumable - skips already-PASSed routes on restart

**Requirement:** GIVEN A batch interrupted after processing 100 routes WHEN Waterfall restarts with --sample flag THEN Routes already PASSed are skipped, remaining routes are processed

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real resumable waterfall)
- FLOW_REF: UC-REC-04
- VERIFY: `pnpm test convex/__tests__/S4T5-waterfall-resume.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: already-PASSed routes are reprocessed; resume doesn't skip PASSed; progress is not persisted
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `waterfall-resume-skip-passed`
    - ACTION (api_client): Run waterfall to completion (100 routes PASS); Restart waterfall; Verify 100 routes skipped, 0 reprocessed
    - MUST_OBSERVE: skipped count == 100, reprocessed count == 0
    - MUST_NOT_OBSERVE: reprocessed count > 0

### AC-3 — Cost circuit-breaker enforces --max-cost and stops batch when exceeded

**Requirement:** GIVEN A batch with --max-cost=$10 and ~150 reconstructable routes WHEN Waterfall processes routes and accumulated cost exceeds $10 THEN Batch stops gracefully with cost-exceeded message

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real cost tracking)
- FLOW_REF: T-REC-019
- VERIFY: `pnpm test convex/__tests__/S4T5-cost-circuit-breaker.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: batch continues past max-cost; cost tracking is inaccurate; stop is not graceful
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `cost-circuit-breaker-stop`
    - ACTION (api_client): Run waterfall with --max-cost=$0.50 (7 routes); Verify batch stops after 7th route ($0.49); Verify cost-exceeded message
    - MUST_OBSERVE: batchStopReason == 'cost_exceeded', total cost <= $0.50, processed count <= 7
    - MUST_NOT_OBSERVE: batch ran to completion

### AC-4 — Rate-limit + exponential backoff handles Google API errors

**Requirement:** GIVEN Google API returns 429 rate-limit errors WHEN Waterfall encounters rate-limit during lever execution THEN Request retries with exponential backoff up to max attempts

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real Google API with backoff)
- FLOW_REF: T-REC-019
- VERIFY: `pnpm test convex/__tests__/S4T5-rate-limit-backoff.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: backoff is not exponential; max retries are not enforced; errors propagate immediately
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `rate-limit-exponential-backoff`
    - ACTION (api_client): Mock Google API 429 responses; Run waterfall; Verify exponential backoff: 1s, 2s, 4s, 8s; Verify max retries enforced
    - MUST_OBSERVE: backoffDelays == [1,2,4,8] seconds (exponential), max retries == 5
    - MUST_NOT_OBSERVE: no backoff, infinite retries

### AC-5 — REVIEW queue receives routes that fail gate after repair budget with best candidate geometry

**Requirement:** GIVEN A route that fails gate after all lever attempts + repair round WHEN Waterfall exhausts attempt budget for the route THEN Route is queued for REVIEW with failedCondition + best candidate geometry

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real REVIEW queue)
- FLOW_REF: UC-VER-04
- VERIFY: `pnpm test convex/__tests__/S4T5-review-queue.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: failed routes are not queued; best geometry is not recorded; failure reason is missing
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `review-queue-entry`
    - ACTION (api_client): Seed route that fails all levers + repair; Run waterfall; Query REVIEW queue for routeId
    - MUST_OBSERVE: reviewQueue.length == 1, reviewQueue[0].failedCondition != null, reviewQueue[0].bestCandidateGeometry != null
    - MUST_NOT_OBSERVE: no REVIEW entry, empty bestCandidateGeometry

### AC-6 — REVIEW queue supports dispositions: approve (persist), retry (send back to lever), retire (mark retired)

**Requirement:** GIVEN 3 routes in REVIEW queue (approve, retry, retire) WHEN Founder applies dispositions via REVIEW mutations THEN Approve persists geometry, retry re-runs lever, retire sets retiredAt

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real REVIEW disposition mutations)
- FLOW_REF: UC-VER-04
- VERIFY: `pnpm test convex/__tests__/S4T5-review-dispositions.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: disposition is not recorded; approve doesn't persist geometry; retry doesn't re-run lever; retire doesn't set retiredAt
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `review-disposition-approve`
    - ACTION (api_client): Queue route for REVIEW with best geometry; Call approveDisposition(routeId); Verify geometry persisted, REVIEW removed
    - MUST_OBSERVE: curated_route_geometry.verdict == 'pass', reviewQueue.length == 0 (entry removed after approve)
    - MUST_NOT_OBSERVE: REVIEW entry remains, geometry not persisted
- CASE 2 — start_ref `review-disposition-retry`
    - ACTION (api_client): Queue route for REVIEW; Call retryDisposition(routeId, lever=2); Verify Lever 2 re-runs
    - MUST_OBSERVE: retryCount == 1 (Lever 2 re-ran), reviewQueue[0].attemptedAt != null (retry produced a new verdict)
    - MUST_NOT_OBSERVE: no retry occurred
- CASE 3 — start_ref `review-disposition-retire`
    - ACTION (api_client): Queue route for REVIEW; Call retireDisposition(routeId); Verify retiredAt set, riderReady=false
    - MUST_OBSERVE: retiredAt is an ISO timestamp containing '2026-', riderReady == false
    - MUST_NOT_OBSERVE: retiredAt == null

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Waterfall processes levers in order | AC-1 | `pnpm test convex/__tests__/S4T5-waterfall-lever-order.integration.test.ts --grep 'TC-1'` |
| TC-2 | Waterfall is resumable | AC-2 | `pnpm test convex/__tests__/S4T5-waterfall-resume.integration.test.ts --grep 'TC-2'` |
| TC-3 | Cost circuit-breaker enforces max-cost | AC-3 | `pnpm test convex/__tests__/S4T5-cost-circuit-breaker.integration.test.ts --grep 'TC-3'` |
| TC-4 | Rate-limit uses exponential backoff | AC-4 | `pnpm test convex/__tests__/S4T5-rate-limit-backoff.integration.test.ts --grep 'TC-4'` |
| TC-5 | REVIEW queue receives failed routes | AC-5 | `pnpm test convex/__tests__/S4T5-review-queue.integration.test.ts --grep 'TC-5'` |
| TC-6 | REVIEW dispositions work correctly | AC-6 | `pnpm test convex/__tests__/S4T5-review-dispositions.integration.test.ts --grep 'TC-6'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/actions/waterfallOrchestrator.ts (NEW) - waterfall orchestration
- convex/actions/reviewQueue.ts (NEW) - REVIEW queue + dispositions
- convex/schema.ts (MODIFY) - curation_artifacts table
- convex/__tests__/S4T5-*.integration.test.ts (NEW)

**writeProhibited:**
- Skipping levers in order - must be 1→2→3
- Exceeding --max-cost - circuit-breaker is enforced
- Leaving routes in limbo - terminal states only
- Bypassing REVIEW queue - failures must queue

## READING LIST

- `convex/actions/waterfallOrchestrator.ts` (orchestrator lever cascade) — Waterfall orchestration pattern
- `convex/curatedGeometryReconstruct.ts` (326-421) — Reconstruct pipeline
- `convex/actions/agent/providers/routingProvider.ts` (rate-limit handling) — Backoff pattern
- `convex/schema.ts` (curation_artifacts) — REVIEW queue schema

## CODE PATTERN

- Pattern: Resumable waterfall with cost control + REVIEW
- Pattern source: `convex/actions/waterfallOrchestrator.ts`
- Anti-pattern: Unordered levers, infinite retry, no cost tracking

## VERIFICATION GATES

- test: `pnpm test convex/__tests__/S4T5-*.integration.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation - orchestrates resumable lever waterfall with cost controls and REVIEW queue
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: S4-T1, S4-T2, S4-T3
- Blocks: S4-T6

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S4-T5",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "waterfall-lever1-pass": {
      "description": "Route with Lever-1-passing in-row polyline",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:lever1-pass', routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', lengthMiles: 41, compositeScore: 0.85"
      ]
    },
    "waterfall-lever2-pass": {
      "description": "Route needing Lever 2 reconstruction with description",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:lever2-pass', summary: 'Highway 101 in Santa Maria...', lengthMiles: 41, compositeScore: 0.85"
      ]
    },
    "review-queue-candidate": {
      "description": "Route that fails all levers + repair",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:review-candidate', name: 'Review Candidate', lengthMiles: 10, compositeScore: 0.85"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a batch of routes needing geometry recovery WHEN waterfall runs the levers in order for each route THEN first lever with passing geometry stops cascade, provenance is recorded",
      "verify": "pnpm test convex/__tests__/S4T5-waterfall-lever-order.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real waterfall orchestration)",
        "negative_control": {
          "would_fail_if": [
            "levers run out of order",
            "waterfall continues after passing geometry",
            "provenance is not recorded"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "waterfall-lever1-pass",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with Lever-1-passing polyline",
                "Run waterfall",
                "Verify Lever 1 ran, Lever 2/3 did not",
                "Verify provenance='scraped_promoted'"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.provenance == 'scraped_promoted'",
                "Lever 2/3 not called"
              ],
              "must_not_observe": [
                "Lever 2/3 called",
                "provenance == null"
              ]
            }
          },
          {
            "start_ref": "waterfall-lever2-pass",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route needing Lever 2 reconstruction",
                "Run waterfall",
                "Verify Lever 1 ran (failed), Lever 2 ran (passed)",
                "Verify Lever 3 not called"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.provenance == 'ai_reconstructed'",
                "Lever 1 failed, Lever 2 passed",
                "Lever 3 not called"
              ],
              "must_not_observe": [
                "Lever 3 called"
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
      "description": "GIVEN a batch interrupted after processing 100 routes WHEN waterfall restarts with --sample flag THEN routes already PASSed are skipped, remaining routes are processed",
      "verify": "pnpm test convex/__tests__/S4T5-waterfall-resume.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real resumable waterfall)",
        "negative_control": {
          "would_fail_if": [
            "already-PASSed routes are reprocessed",
            "resume doesn't skip PASSed",
            "progress is not persisted"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "waterfall-resume-skip-passed",
            "action": {
              "actor": "api_client",
              "steps": [
                "Run waterfall to completion (100 routes PASS)",
                "Restart waterfall",
                "Verify 100 routes skipped, 0 reprocessed"
              ]
            },
            "end_state": {
              "must_observe": [
                "skipped count == 100",
                "reprocessed count == 0"
              ],
              "must_not_observe": [
                "reprocessed count > 0"
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
      "description": "GIVEN a batch with --max-cost=$10 and ~150 reconstructable routes WHEN waterfall processes routes and accumulated cost exceeds $10 THEN batch stops gracefully with cost-exceeded message",
      "verify": "pnpm test convex/__tests__/S4T5-cost-circuit-breaker.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real cost tracking)",
        "negative_control": {
          "would_fail_if": [
            "batch continues past max-cost",
            "cost tracking is inaccurate",
            "stop is not graceful"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "cost-circuit-breaker-stop",
            "action": {
              "actor": "api_client",
              "steps": [
                "Run waterfall with --max-cost=$0.50 (7 routes)",
                "Verify batch stops after 7th route ($0.49)",
                "Verify cost-exceeded message"
              ]
            },
            "end_state": {
              "must_observe": [
                "batchStopReason == 'cost_exceeded'",
                "total cost <= $0.50",
                "processed count <= 7"
              ],
              "must_not_observe": [
                "batch ran to completion"
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
      "description": "GIVEN Google API returns 429 rate-limit errors WHEN waterfall encounters rate-limit during lever execution THEN request retries with exponential backoff up to max attempts",
      "verify": "pnpm test convex/__tests__/S4T5-rate-limit-backoff.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real Google API with backoff)",
        "negative_control": {
          "would_fail_if": [
            "backoff is not exponential",
            "max retries are not enforced",
            "errors propagate immediately"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "rate-limit-exponential-backoff",
            "action": {
              "actor": "api_client",
              "steps": [
                "Mock Google API 429 responses",
                "Run waterfall",
                "Verify exponential backoff: 1s, 2s, 4s, 8s",
                "Verify max retries enforced"
              ]
            },
            "end_state": {
              "must_observe": [
                "backoffDelays == [1,2,4,8] seconds (exponential)",
                "max retries == 5"
              ],
              "must_not_observe": [
                "no backoff",
                "infinite retries"
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
      "description": "GIVEN a route that fails gate after all lever attempts + repair round WHEN waterfall exhausts attempt budget for the route THEN route is queued for REVIEW with failedCondition + best candidate geometry",
      "verify": "pnpm test convex/__tests__/S4T5-review-queue.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real REVIEW queue)",
        "negative_control": {
          "would_fail_if": [
            "failed routes are not queued",
            "best geometry is not recorded",
            "failure reason is missing"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "review-queue-entry",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route that fails all levers + repair",
                "Run waterfall",
                "Query REVIEW queue for routeId"
              ]
            },
            "end_state": {
              "must_observe": [
                "reviewQueue.length == 1",
                "reviewQueue[0].failedCondition != null",
                "reviewQueue[0].bestCandidateGeometry != null"
              ],
              "must_not_observe": [
                "no REVIEW entry",
                "empty bestCandidateGeometry"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN 3 routes in REVIEW queue (approve, retry, retire) WHEN founder applies dispositions via REVIEW mutations THEN approve persists geometry, retry re-runs lever, retire sets retiredAt",
      "verify": "pnpm test convex/__tests__/S4T5-review-dispositions.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real REVIEW disposition mutations)",
        "negative_control": {
          "would_fail_if": [
            "disposition is not recorded",
            "approve doesn't persist geometry",
            "retry doesn't re-run lever",
            "retire doesn't set retiredAt"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "review-disposition-approve",
            "action": {
              "actor": "api_client",
              "steps": [
                "Queue route for REVIEW with best geometry",
                "Call approveDisposition(routeId)",
                "Verify geometry persisted, REVIEW removed"
              ]
            },
            "end_state": {
              "must_observe": [
                "curated_route_geometry.verdict == 'pass'",
                "reviewQueue.length == 0 (entry removed after approve)"
              ],
              "must_not_observe": [
                "REVIEW entry remains",
                "geometry not persisted"
              ]
            }
          },
          {
            "start_ref": "review-disposition-retry",
            "action": {
              "actor": "api_client",
              "steps": [
                "Queue route for REVIEW",
                "Call retryDisposition(routeId, lever=2)",
                "Verify Lever 2 re-runs"
              ]
            },
            "end_state": {
              "must_observe": [
                "retryCount == 1 (Lever 2 re-ran)",
                "reviewQueue[0].attemptedAt != null (retry produced a new verdict)"
              ],
              "must_not_observe": [
                "no retry occurred"
              ]
            }
          },
          {
            "start_ref": "review-disposition-retire",
            "action": {
              "actor": "api_client",
              "steps": [
                "Queue route for REVIEW",
                "Call retireDisposition(routeId)",
                "Verify retiredAt set, riderReady=false"
              ]
            },
            "end_state": {
              "must_observe": [
                "retiredAt is an ISO timestamp containing '2026-'",
                "riderReady == false"
              ],
              "must_not_observe": [
                "retiredAt == null"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Waterfall processes levers in order",
      "verify": "pnpm test convex/__tests__/S4T5-waterfall-lever-order.integration.test.ts --grep 'TC-1'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Waterfall is resumable",
      "verify": "pnpm test convex/__tests__/S4T5-waterfall-resume.integration.test.ts --grep 'TC-2'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Cost circuit-breaker enforces max-cost",
      "verify": "pnpm test convex/__tests__/S4T5-cost-circuit-breaker.integration.test.ts --grep 'TC-3'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Rate-limit uses exponential backoff",
      "verify": "pnpm test convex/__tests__/S4T5-rate-limit-backoff.integration.test.ts --grep 'TC-4'",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "REVIEW queue receives failed routes",
      "verify": "pnpm test convex/__tests__/S4T5-review-queue.integration.test.ts --grep 'TC-5'",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "REVIEW dispositions work correctly",
      "verify": "pnpm test convex/__tests__/S4T5-review-dispositions.integration.test.ts --grep 'TC-6'",
      "maps_to_ac": "AC-6"
    }
  ]
}
-->
</details>
