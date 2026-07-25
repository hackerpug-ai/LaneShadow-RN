# S5-T2 — Fail-closed retirement with explicit Founder confirmation and reversible un-retire

> Status: ✅ Completed
> Commit: 338c785c677dca66bd0edabcee95ce9b7df2ed5f
> Reviewer: convex-reviewer+product-manager
> Completed: 2026-07-25T03:39:21Z
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | S5-T2 |
| SPRINT | [Sprint 05 — Batch acceptance + retirement](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | `convex-implementer` |
| ESTIMATE | 120 min |
| EFFORT | L |
| PRIORITY | P0 |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | touches `CAP-GEO-04`; consumes accepted batch + waterfall terminal evidence; provides reversible retirement evidence |
| DEPENDS_ON | S5-T1, S4-T5 |
| BLOCKS | S5-T4, S10-T1 |

RUNTIME_COMMANDS:
- integration: `pnpm test convex/__tests__/S5T2-*.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex`
- build: `pnpm convex:dev --once`

## BACKGROUND

The residual catalog is not a discard pile. A route can be retired only after the waterfall has recorded failure for Levers 1, 2, and 3, and the classifier does not provide a rescue path. A marginal route must remain available for review. Founder review must precede every commit, and un-retire must clear only the exclusion state while preserving the route and audit trail.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** derive eligibility from durable all-lever terminal evidence, not from a missing geometry row or a single failed attempt.
- **MUST** require an explicit Founder confirmation and non-empty reason for every retirement mutation.
- **MUST** preserve the route document, geometry candidate, failure evidence, retirement reason, and disposition audit row.
- **NEVER** auto-retire from a batch, classifier verdict, `marginal`, or low yield.
- **NEVER** allow an eligible route to be rider-ready or a retired route to appear in discovery; un-retire must recompute the flag.

## SPECIFICATION

**Objective:** Implement the retirement-candidate query and operator mutations so only all-lever-failed routes can be explicitly retired, each decision is auditable, and un-retire restores a preserved route safely.

**Success state:** A route that passed any lever or is only `marginal` is not eligible. An all-lever-failed route appears with every failure reason, requires founder confirmation, becomes `retired` with `retiredAt` and `retirementReason`, is excluded from rider-ready queries, and can be un-retired without deletion or loss of evidence.

## ACCEPTANCE CRITERIA

### AC-1 [PRIMARY] — Eligibility requires all three lever failures

**Requirement:** GIVEN one route with terminal failures for Levers 1–3 and one route with a gate-PASS from Lever 2 WHEN the candidate query runs THEN only the all-failed route is retirement-eligible and the winning route is absent.

- TEST_TIER: `integration`  · VERIFY: `pnpm test convex/__tests__/S5T2-retirement-eligibility.integration.test.ts`
- FLOW_REF: UC-REC-05 / T-REC-013

SCENARIO:
- `start_ref`: `s5t2-all-levers-failed-vs-pass`
- `ACTION`: Seed both routes via the test-support public entrypoint, record the three distinct lever outcomes and terminal artifacts for the first, record a Lever-2 PASS for the second, then query the real candidate function.
- `MUST_OBSERVE`: first route has candidate `eligible=true` with failure evidence for levers 1/2/3; second has no candidate and remains generated/rider-ready.
- `MUST_NOT_OBSERVE`: eligibility inferred from `geometryStatus='review'` alone, or a passing/marginal route in the candidate list.
- `NEGATIVE_CONTROL`: remove one lever's terminal artifact; the first route must become ineligible.
- `EVIDENCE`: `db_query` of route, geometry, waterfall artifacts, classifier, and candidate response.

### AC-2 — Founder review exposes reasons and retirement is explicit

**Requirement:** GIVEN eligible candidates WHEN the founder lists them and attempts retirement THEN every row includes per-lever failure reasons, classifier evidence, and best candidate information, and only a request carrying explicit confirmation plus a reason commits.

- TEST_TIER: `integration` + `human-gate`  · VERIFY: `pnpm test convex/__tests__/S5T2-retirement-confirmation.integration.test.ts`
- FLOW_REF: UC-REC-05 / T-REC-014

SCENARIO:
- `start_ref`: `s5t2-founder-confirmation-required`
- `ACTION`: Query candidates; call the retirement mutation with missing confirmation and with empty reason; call it with `confirmed=true` and a concrete reason; query the route and disposition artifact.
- `MUST_OBSERVE`: candidate list contains all failure reasons; invalid calls fail without patching; valid call records founder confirmation, reason, `retiredAt`, and an auditable disposition.
- `MUST_NOT_OBSERVE`: auto-retirement during batch/report, mutation success without explicit confirmation, or missing reason.
- `NEGATIVE_CONTROL`: invoke the batch completion path without a confirmation; no route receives `retiredAt`.
- `EVIDENCE`: command stderr/stdout plus `db_query` before/after and disposition artifact.

### AC-3 — Retirement excludes the row while preserving saved-route reachability

**Requirement:** GIVEN an explicitly retired route WHEN rider-ready discovery and saved-route detail queries run THEN the route is absent from suggestions but its preserved record and detail remain queryable.

- TEST_TIER: `integration`  · VERIFY: `pnpm test convex/__tests__/S5T2-retirement-surface.integration.test.ts`
- FLOW_REF: CAP-GEO-04 / T-REC-015

SCENARIO:
- `start_ref`: `s5t2-retired-route-surface`
- `ACTION`: Retire a confirmed eligible route, call `recomputeRiderReady`, query `listCuratedRoutes`/discovery and `getCuratedRouteDetail` for the route ID.
- `MUST_OBSERVE`: `geometryStatus='retired'`, `riderReady=false`, route absent from every suggestion query, detail returns preserved identity/retirement reason.
- `MUST_NOT_OBSERVE`: hard deletion, rider-ready result, or an unlabelled route disappearance.
- `NEGATIVE_CONTROL`: assert the route ID is absent from the top/bbox/nearest suggestion paths.
- `EVIDENCE`: `db_query` and public query responses with route ID and status.

### AC-4 — Un-retire is reversible and preserves history

**Requirement:** GIVEN a retired route WHEN the operator invokes un-retire THEN the row and prior failure/retirement evidence remain, `retiredAt` and exclusion status are cleared, rider-ready is recomputed from current evidence, and the route does not become ready without a qualifying geometry/classifier state.

- TEST_TIER: `integration`  · VERIFY: `pnpm test convex/__tests__/S5T2-unretire-reversible.integration.test.ts`
- FLOW_REF: UC-REC-05 / T-REC-015

SCENARIO:
- `start_ref`: `s5t2-retire-unretire-preserves-record`
- `ACTION`: Retire a confirmed candidate, capture document and artifact IDs, un-retire, then query route, geometry, artifacts, and rider-ready discovery.
- `MUST_OBSERVE`: same route document and candidate geometry remain; retired state is cleared; an un-retire disposition is appended; recompute returns false unless all rider-ready conditions now hold.
- `MUST_NOT_OBSERVE`: new route replacing the old one, deleted reason/evidence, or automatic `riderReady=true` from un-retire alone.
- `NEGATIVE_CONTROL`: use a route with no gate-PASS geometry; un-retire must not surface it.
- `EVIDENCE`: `db_query` with stable `_id`, artifact history, and gated query response.

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | Candidate eligibility is all-lever-failed and excludes a passed route | AC-1 | `pnpm test convex/__tests__/S5T2-retirement-eligibility.integration.test.ts` |
| TC-2 | Founder confirmation and reason are required and auditable | AC-2 | `pnpm test convex/__tests__/S5T2-retirement-confirmation.integration.test.ts` |
| TC-3 | Retired rows are excluded from suggestions but remain detail-reachable | AC-3 | `pnpm test convex/__tests__/S5T2-retirement-surface.integration.test.ts` |
| TC-4 | Un-retire preserves records and recomputes the flag | AC-4 | `pnpm test convex/__tests__/S5T2-unretire-reversible.integration.test.ts` |

## READING LIST

- `convex/reviewQueue.ts` — current review dispositions and the missing explicit-confirmation/eligibility boundary.
- `convex/curatedGeometry.ts` — status, `retireRoute`/`unretireRoute` contract, and rider-ready predicate.
- `convex/curatedRoutes.ts` — gated browse and saved detail behavior.
- `convex/waterfallOrchestrator.ts` — terminal artifact and per-lever evidence shape.
- `convex/schema.ts` — route status, `retiredAt`, reason, and curation artifact indexes.
- `.spec/prds/route-agent-quality/10-technical-requirements/03-data-schema.md` and `09-capability-chains.md`.
- `.spec/prds/route-agent-quality/11-e2e-testing-criteria.md` — T-REC-013..015.
- `convex/_generated/ai/guidelines.md`.

## GUARDRAILS

**WRITE-ALLOWED:**
- `convex/curatedGeometry.ts` or the existing operator review module (`convex/reviewQueue.ts`) — eligibility, explicit-confirmation, retire/unretire and audit changes.
- `convex/curatedRoutes.ts` — only required detail/query exclusion fixes.
- `convex/schema.ts` — additive validators/indexes only.
- `convex/__tests__/S5T2-*.integration.test.ts`.

**WRITE-PROHIBITED:**
- Any other sprint's task/spec files, RN surfaces, or agent code.
- Hard deletion, auto-retirement, classifier-only retirement, or bypassing `recomputeRiderReady`.
- Reusing a couch verdict as a retirement confirmation.

## CODE PATTERN

- **Pattern:** status-field queue + append-only disposition audit + deterministic predicate.
- **Pattern source:** `convex/reviewQueue.ts`, `convex/curatedGeometry.ts`, `convex/curatedRoutes.ts`.
- **Anti-pattern:** treating `review` or absent geometry as proof of all-lever failure, or patching `retiredAt` without an audit record.

## VERIFICATION GATES

- `pnpm test convex/__tests__/S5T2-*.integration.test.ts` → all scenarios pass on real Convex dev.
- `pnpm type-check` → exit 0.
- `pnpm exec biome check convex` → exit 0.
- `pnpm convex:dev --once` → exit 0.
- `git diff --name-only` → only S5-T2 allow-listed paths changed.

## AGENT INSTRUCTIONS

RED each integration scenario against the real deployment. Keep candidate eligibility and confirmation as independent checks. Use real query/mutation boundaries and public test-support seed methods; do not mock the database. GREEN, then capture a real operator review with one confirmed retirement and one rejected auto-retirement attempt. Verify the exact route document survives un-retire.

## AGENT ASSIGNMENT

- **Agent:** `convex-implementer` — owns Convex status and operator mutations.
- **Rationale:** this is a backend state-machine and audit-trail change.
- **Reviewer:** `convex-reviewer` — challenge all-lever evidence, authorization, deletion, and rider-ready exclusion.

## EVIDENCE GATES

- RED evidence for AC-1..4.
- Integration evidence includes stable route `_id`, terminal artifacts, disposition history, and pre/post public query results.
- `validate_scenario` zero CRITICAL for every behavioral scenario.
- Founder evidence separately records review of candidate reasons and explicit confirmation.

## DEPENDENCIES

- Depends on: S5-T1 and S4-T5.
- Blocks: S5-T4 and S10-T1.

## CODING STANDARDS

- `convex/_generated/ai/guidelines.md`
- `RULES.md`
- `AGENTS.md`
- `.spec/prds/route-agent-quality/10-technical-requirements/09-capability-chains.md`

<!-- REQUIREMENT-CONTRACT v1
-->
<!--
{
  "version": "1",
  "task_id": "S5-T2",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "s5t2-all-levers-failed-vs-pass": {
      "description": "One route with terminal failures for Levers 1/2/3 and one route with Lever-2 gate-PASS",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:s5t2-all-failed', lever1.verdict: 'fail', lever2.verdict: 'fail', lever3.verdict: 'fail', terminal artifacts present for levers 1/2/3",
        "routeId: 'test:s5t2-lever2-pass', lever2.verdict: 'pass', verification.verdict: 'pass', riderReady: true"
      ]
    },
    "s5t2-founder-confirmation-required": {
      "description": "Eligible all-lever-failed candidate awaiting founder confirmation with per-lever failure reasons",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:s5t2-confirm', eligible: true, leverFailures: {1:'ratio', 2:'anchors', 3:'degenerate'}, classifierVerdict: 'no_rescue', confirmed: false, retirementReason: ''"
      ]
    },
    "s5t2-retired-route-surface": {
      "description": "Explicitly retired eligible route with preserved document and retirement reason",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:s5t2-retired-surface', geometryStatus: 'retired', retiredAt: ISO timestamp, retirementReason: 'all levers failed after founder review', riderReady: false"
      ]
    },
    "s5t2-retire-unretire-preserves-record": {
      "description": "Retired route with stable _id, terminal failure artifacts, and no gate-PASS geometry for post-unretire recompute",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:s5t2-unretire', _id stable, geometryStatus: 'retired', retiredAt set, retirementReason: 'founder confirmed', lever failure artifacts retained, verification.verdict: 'review'"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN one route with terminal failures for Levers 1-3 and one route with a gate-PASS from Lever 2 WHEN the candidate query runs THEN only the all-failed route is retirement-eligible (eligible==true) and the winning route is absent from candidates",
      "verify": "pnpm test convex/__tests__/S5T2-retirement-eligibility.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real retirement candidate query)",
        "negative_control": {
          "would_fail_if": [
            "eligibility is stubbed always true for any route",
            "terminal artifacts are mocked empty yet eligible==true",
            "remove one lever terminal artifact and route remains eligible (disconnect from all-lever evidence)",
            "static hard-coded candidate list independent of db_query"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t2-all-levers-failed-vs-pass",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed both routes via test-support public entrypoint",
                "Record three distinct lever outcomes and terminal artifacts for first route",
                "Record Lever-2 PASS for second route",
                "Query real retirement candidate function"
              ]
            },
            "end_state": {
              "must_observe": [
                "routeId=='test:s5t2-all-failed' has eligible==true with failure evidence for levers 1/2/3",
                "routeId=='test:s5t2-lever2-pass' has candidateAbsent==true and verification.verdict=='pass'",
                "eligibleCandidateCount==1 for the all-failed route"
              ],
              "must_not_observe": [
                "eligible==true for passed or marginal route",
                "eligibility inferred from geometryStatus=='review' alone with empty lever artifacts",
                "candidate list includes routeId=='test:s5t2-lever2-pass'",
                "(0) candidates when all-failed route is seeded"
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
      "description": "GIVEN eligible candidates WHEN the founder lists them and attempts retirement THEN every row includes per-lever failure reasons, classifier evidence, and best candidate information, and only a request carrying confirmed==true plus a non-empty reason commits",
      "verify": "pnpm test convex/__tests__/S5T2-retirement-confirmation.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real retire mutation + disposition audit)",
        "negative_control": {
          "would_fail_if": [
            "retire mutation is stubbed to succeed without confirmed==true",
            "batch completion path auto-sets retiredAt (static auto-retirement)",
            "empty reason is accepted and patches route",
            "disposition audit is mocked/absent after valid retire"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t2-founder-confirmation-required",
            "action": {
              "actor": "api_client",
              "steps": [
                "Query retirement candidates",
                "Call retirement mutation with missing confirmation",
                "Call retirement mutation with empty reason",
                "Call with confirmed=true and concrete reason",
                "Query route and disposition artifact"
              ]
            },
            "end_state": {
              "must_observe": [
                "candidate.leverFailureReasons count == 3 (levers 1/2/3)",
                "invalid calls fail without patching (retiredAt==null)",
                "call with confirmed==true records retirementReason length >= 1",
                "call with confirmed==true sets retiredAt to non-null ISO timestamp and dispositionAuditCount >= 1"
              ],
              "must_not_observe": [
                "retiredAt non-null after call with confirmed==false or empty reason",
                "auto-retirement during batch/report (retiredCount increases with no confirmation)",
                "mutation success with retirementReason empty",
                "(0) disposition audit rows after valid confirmed retirement"
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
      "description": "GIVEN an explicitly retired route WHEN rider-ready discovery and saved-route detail queries run THEN the route is absent from suggestions but its preserved record and detail remain queryable with geometryStatus=='retired' and riderReady==false",
      "verify": "pnpm test convex/__tests__/S5T2-retirement-surface.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real listCuratedRoutes + getCuratedRouteDetail)",
        "negative_control": {
          "would_fail_if": [
            "hard delete removes the route document (stub delete path)",
            "discovery queries ignore retired status and still return the row",
            "detail query returns empty after retire",
            "recomputeRiderReady is mocked and leaves riderReady==true"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t2-retired-route-surface",
            "action": {
              "actor": "api_client",
              "steps": [
                "Retire a confirmed eligible route",
                "Call recomputeRiderReady",
                "Query listCuratedRoutes/discovery and getCuratedRouteDetail for the route ID"
              ]
            },
            "end_state": {
              "must_observe": [
                "geometryStatus=='retired'",
                "riderReady==false",
                "suggestionHitCount==0 for the retired routeId across top/bbox/nearest",
                "getCuratedRouteDetail returns routeId length >= 1 and retirementReason length >= 1"
              ],
              "must_not_observe": [
                "route document deleted (detail returns empty or none)",
                "riderReady==true after retirement",
                "suggestionHitCount > 0 for the retired routeId",
                "geometryStatus not equal to 'retired' after confirmed retirement"
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
      "description": "GIVEN a retired route WHEN the operator invokes un-retire THEN the row and prior failure/retirement evidence remain, retiredAt and exclusion status are cleared, rider-ready is recomputed from current evidence, and the route does not become ready without a qualifying geometry/classifier state",
      "verify": "pnpm test convex/__tests__/S5T2-unretire-reversible.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real unretire + recomputeRiderReady)",
        "negative_control": {
          "would_fail_if": [
            "un-retire hard-deletes evidence or creates a new route _id (stub replace)",
            "un-retire is mocked to set riderReady==true regardless of geometry",
            "history artifacts are empty after un-retire",
            "route with no gate-PASS geometry surfaces in discovery after un-retire"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "s5t2-retire-unretire-preserves-record",
            "action": {
              "actor": "api_client",
              "steps": [
                "Retire a confirmed candidate and capture document and artifact IDs",
                "Invoke un-retire",
                "Query route, geometry, artifacts, and rider-ready discovery"
              ]
            },
            "end_state": {
              "must_observe": [
                "route._id is unchanged after un-retire (sameId==true) and geometry candidate retained",
                "retiredAt==null and geometryStatus != 'retired'",
                "un-retire disposition appended (dispositionCount >= 2)",
                "recomputeRiderReady returns riderReady==false when verification.verdict != 'pass'"
              ],
              "must_not_observe": [
                "new route _id replacing the old one (sameId==false)",
                "deleted retirementReason or empty lever failure evidence",
                "riderReady==true from un-retire alone with no gate-PASS geometry",
                "discoveryHitCount > 0 when verification.verdict != 'pass'"
              ]
            }
          }
        ]
      }
    },
    {"id": "TC-1", "kind": "test", "statement": "Eligibility", "maps_to": ["AC-1"]},
    {"id": "TC-2", "kind": "test", "statement": "Confirmation", "maps_to": ["AC-2"]},
    {"id": "TC-3", "kind": "test", "statement": "Surface exclusion", "maps_to": ["AC-3"]},
    {"id": "TC-4", "kind": "test", "statement": "Reversibility", "maps_to": ["AC-4"]}
  ]
}
-->
