# REDHAT-FIX-06 — retiredAt null, pagination, OCC on unretireRoute

> Status: Backlog
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | REDHAT-FIX-06 |
| SPRINT | [Sprint 05 — Batch acceptance + retirement](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 90 min |
| EFFORT | M |
| PRIORITY | P1 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-04 |
| DEPENDS_ON | — |
| BLOCKS | — |

RUNTIME_COMMANDS:
- integration: `npx vitest run convex/__tests__/REDHATFIX06-*.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex scripts`
- build: `pnpm convex:dev --once`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

No retiredAt:undefined patches remain in listed files; listRetirementCandidates paginates safely; unretireRoute fails closed on concurrent conflict; integration tests prove all three.

## BACKGROUND

Red-hat review 2026-07-25T02:13:34Z (NEEDS_REVISION BLOCK). Closes F12, F13, F14. Parallel with FIX-03; if both edit listRetirementCandidates, implement scrub first (FIX-03) then pagination (this task) or combine carefully without losing either contract.

**Objective:** Harden retirement mutators and export against Convex value rules, read limits, and concurrent unretire races.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** replace retiredAt: undefined with retiredAt: null at all Convex patch/insert sites listed (curatedGeometry, top50Review, reviewQueue, couchSampleAssembler, curatedGeometryReconstruct, waterfallOrchestrator, couchVerdict, curatedGeometryTestSupport)
- **MUST** add pagination (cursor/continueCursor or page args) and/or tighter indexing so listRetirementCandidates stays under the 16MB read limit
- **MUST** add OCC guard on unretireRoute (e.g. expectedRetiredAt or expectedUpdatedAt / document version) so concurrent retire/unretire cannot silent last-write-win
- **NEVER** leave retiredAt: undefined in production patch paths
- **NEVER** scan unbounded 800×4 status × per-row artifacts without pagination on large catalogs
- **NEVER** unretire without detecting concurrent retire that changed state since read
- **STRICTLY** follow Convex guidelines: undefined is not a valid Convex value in documents/patches

## SPECIFICATION

**Objective:** Harden retirement mutators and export against Convex value rules, read limits, and concurrent unretire races.

**Success state:** No retiredAt:undefined patches remain in listed files; listRetirementCandidates paginates safely; unretireRoute fails closed on concurrent conflict; integration tests prove all three.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `redhatfix06-retired-route` (seed_method: `public_api`): Eligible route that has been retired with retiredAt set and retirementReason preserved
  - routeId test:redhatfix06-retired geometryStatus retired retiredAt timestamp retirementReason all_levers_failed
- `redhatfix06-large-candidate-scan` (seed_method: `public_api`): Many review/unresolved rows to exercise pagination without exceeding read budget
  - N>>200 review/unresolved rows under prefix test:redhatfix06-page-
- `redhatfix06-concurrent-retire` (seed_method: `public_api`): Two conflicting operations: retire then stale unretire with old expected token
  - route eligible → retire → unretire with stale expectedRetiredAt

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — retiredAt cleared with null not undefined

**Requirement:** GIVEN unretireRoute and all other sites that previously patched retiredAt: undefined WHEN unretire or seed/clear paths run THEN documents store retiredAt: null (or field cleared via null-compatible schema), never undefined in patch objects; unretire returns retiredAt null

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX06-retiredAt-null.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: retiredAt: undefined patch idiom remains; hardcoded unretire that only returns null without patching; stub unretire leaving retiredAt timestamp unchanged; empty patch omitting retiredAt null clear
- EVIDENCE: `db_query` (required_capture: True)
- CASE 1 — start_ref `redhatfix06-retired-route`
  - ACTION (operator): Call unretireRoute({routeId}); Re-read curated_routes row; Grep codebase for retiredAt: undefined remaining
  - MUST_OBSERVE: `stored.retiredAt == null`
  - MUST_OBSERVE: `api.retiredAt == null`
  - MUST_OBSERVE: `retiredAt: undefined patch sites count == 0`
  - MUST_NOT_OBSERVE: `stored.retiredAt != null`
  - MUST_NOT_OBSERVE: `retiredAt: undefined patch sites count > 0`
  - MUST_NOT_OBSERVE: `empty unretire with no patch`
  - MUST_NOT_OBSERVE: `retiredAt still equals pre-unretire timestamp`

### AC-2 — listRetirementCandidates pagination stays under read limit

**Requirement:** GIVEN a large pool of retirement-scannable rows WHEN listRetirementCandidates is called with pagination args THEN it returns a page with continueCursor (or equivalent) and does not require a single unbounded multi-status 800-row×artifact join that approaches 16MB

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX06-retirement-pagination.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: unbounded take 800x4 without cursor still present; static single page claiming all rows; stub pagination with continueCursor always null and isDone false; empty pagination contract
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix06-large-candidate-scan`
  - ACTION (api_client): Seed large prefix pool; Call listRetirementCandidates with limit and optional cursor; If continueCursor present, fetch next page
  - MUST_OBSERVE: `page.length <= 50`
  - MUST_OBSERVE: `page.length >= 1`
  - MUST_OBSERVE: `continueCursor != null || isDone == true`
  - MUST_OBSERVE: `readLimitError count == 0`
  - MUST_NOT_OBSERVE: `page.length == 0 when pool size > 0`
  - MUST_NOT_OBSERVE: `page.length > limit`
  - MUST_NOT_OBSERVE: `continueCursor == null && isDone == false with remaining rows`
  - MUST_NOT_OBSERVE: `empty unbounded scan`

### AC-3 — unretireRoute OCC guard against concurrent retire/unretire

**Requirement:** GIVEN a retired route and an OCC token captured at read time WHEN a concurrent retire or state change invalidates the token and unretire is called with the stale token THEN unretire fails with a concurrency conflict error and does not apply a stale clear

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX06-unretire-occ.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: last-writer-wins silent success without OCC; stub unretire ignoring stale expected token; hardcoded OCC always succeeds; empty token argument still applies patch
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix06-concurrent-retire`
  - ACTION (operator): Retire route; capture expectedRetiredAt or OCC token from getRetirementEvidence; Simulate concurrent change (re-retire reason change or intermediate unretire/retire); Call unretireRoute with stale expected token
  - MUST_OBSERVE: `error.code == 'CONCURRENCY_CONFLICT' || error.code == 'OCC_MISMATCH'`
  - MUST_OBSERVE: `staleUnretire.applied == false`
  - MUST_OBSERVE: `route.retiredAt == expectedRetiredAt`
  - MUST_NOT_OBSERVE: `staleUnretire.applied == true`
  - MUST_NOT_OBSERVE: `error.code == null silent success`
  - MUST_NOT_OBSERVE: `empty OCC check`

### AC-4 — Happy-path unretire with valid OCC token still works

**Requirement:** GIVEN a retired route and a fresh OCC token matching current retiredAt WHEN unretireRoute is called with the valid token THEN unretire succeeds, retiredAt null, retirementReason history retained, riderReady recomputed

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX06-unretire-happy.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: OCC always rejects valid token stub; hardcoded riderReady == true on unretire; mock that deletes route instead of preserving history; empty retirementReason wiped
- EVIDENCE: `db_query` (required_capture: True)
- CASE 1 — start_ref `redhatfix06-retired-route`
  - ACTION (operator): Read evidence + token; unretireRoute with valid token; Query route and dispositions
  - MUST_OBSERVE: `retiredAt == null`
  - MUST_OBSERVE: `retirementReason.length >= 1`
  - MUST_OBSERVE: `disposition == 'unretire'`
  - MUST_OBSERVE: `riderReady == false`
  - MUST_NOT_OBSERVE: `retiredAt != null`
  - MUST_NOT_OBSERVE: `retirementReason.length == 0`
  - MUST_NOT_OBSERVE: `riderReady == true without qualifying evidence`
  - MUST_NOT_OBSERVE: `route deleted / empty doc`

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | After unretireRoute the stored retiredAt value is null and source has no retiredAt undefined patches in production paths | AC-1 | `npx vitest run convex/__tests__/REDHATFIX06-retiredAt-null.integration.test.ts -t 'TC-1'` |
| TC-2 | listRetirementCandidates returns a bounded page and continueCursor when more candidates exist | AC-2 | `npx vitest run convex/__tests__/REDHATFIX06-retirement-pagination.integration.test.ts -t 'TC-2'` |
| TC-3 | unretireRoute with a stale OCC token fails with a concurrency conflict and does not apply the patch | AC-3 | `npx vitest run convex/__tests__/REDHATFIX06-unretire-occ.integration.test.ts -t 'TC-3'` |
| TC-4 | unretireRoute with a valid OCC token clears retirement and preserves retirementReason history | AC-4 | `npx vitest run convex/__tests__/REDHATFIX06-unretire-happy.integration.test.ts -t 'TC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometry.ts (MODIFY unretireRoute, listRetirementCandidates, retiredAt null)
- convex/schema.ts (MODIFY additive pagination/OCC fields if required)
- convex/top50Review.ts (MODIFY retiredAt null)
- convex/reviewQueue.ts (MODIFY retiredAt null)
- convex/couchSampleAssembler.ts (MODIFY retiredAt null)
- convex/curatedGeometryReconstruct.ts (MODIFY retiredAt null)
- convex/waterfallOrchestrator.ts (MODIFY retiredAt null)
- convex/couchVerdict.ts (MODIFY retiredAt null)
- convex/curatedGeometryTestSupport.ts (MODIFY retiredAt null)
- convex/__tests__/REDHATFIX06-*.integration.test.ts (NEW)
- convex/__tests__/S5T2-unretire-reversible.integration.test.ts (MODIFY only if OCC args require test update)

**writeProhibited:**
- react-native/**
- Hard-deleting retired routes
- Removing confirmation gates on retireRoute

## READING LIST

- `convex/curatedGeometry.ts` (2992-3048) — unretireRoute retiredAt: undefined at :3022
- `convex/curatedGeometry.ts` (1669) — additional retiredAt: undefined site
- `convex/curatedGeometry.ts` (2744-2833) — listRetirementCandidates read amplification
- `convex/schema.ts` (197) — by_geometry_status index; consider additive pagination indexes if needed
- `convex/top50Review.ts` (500) — retiredAt: undefined site
- `convex/reviewQueue.ts` (177,459,588) — retiredAt: undefined sites
- `convex/couchSampleAssembler.ts` (321) — retiredAt: undefined
- `convex/curatedGeometryReconstruct.ts` (1060) — retiredAt: undefined
- `convex/waterfallOrchestrator.ts` (198) — retiredAt: undefined
- `convex/couchVerdict.ts` (513) — retiredAt: undefined
- `convex/curatedGeometryTestSupport.ts` (431) — retiredAt: undefined
- `convex/_generated/ai/guidelines.md` — undefined is not a valid Convex value
- `.spec/reviews/red-hat-sprint-05-batch-acceptance-retirement-20260725T021334Z.md` (85-92) — F12 F13 F14

## CODE PATTERN

**Pattern:** null-clear for optional number fields; cursor pagination; expectedRetiredAt OCC check before patch
**Source:** Convex patch + document re-read
**Anti-pattern:** retiredAt: undefined; unbounded multi-index scans; last-writer-wins unretire

**Interaction notes:**
- Can run parallel with FIX-03; coordinate listRetirementCandidates changes if both touch the same function (scrub + pagination) — land scrub then pagination or do both carefully in sequence

## DESIGN

**References:**
- S5-T2 unretire
- Convex guidelines on undefined
- red-hat F12-F14

## VERIFICATION GATES

- **All Tests Pass**: `npx vitest run convex/__tests__/REDHATFIX06-` → Exit 0
- **S5T2 unretire regression**: `npx vitest run convex/__tests__/S5T2-unretire-reversible.integration.test.ts` → Exit 0
- **Typecheck**: `pnpm type-check` → Exit 0
- **Lint**: `pnpm exec biome check convex scripts` → Exit 0
- **Convex build**: `pnpm convex:dev --once` → Exit 0
- **No undefined retiredAt patches**: `rg -n "retiredAt:\s*undefined" convex --glob '*.ts'` → Zero matches (or only comments)

## CAPABILITY CHAIN

- touches: CAP-GEO-04
- provides: retiredAt_null_clear_idiom, paginated_listRetirementCandidates, unretireRoute_OCC_guard
- consumes: retireRoute / unretireRoute surface, curated_routes indexes
- boundary_contracts:
  - Patches never write retiredAt: undefined — use null
  - listRetirementCandidates supports cursor pagination and bounded reads under Convex 16MB limit
  - unretireRoute rejects stale concurrent mutations via expected version/token or document _id OCC check

## AGENT ASSIGNMENT

- Implementer: `convex-implementer` — Convex patch semantics, query pagination, and OCC-style concurrency on unretireRoute are backend-only.
- Reviewer: `convex-reviewer`

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/RED-FIRST-TEST-GATE.md
- brain/docs/kanban/SCENARIO-CONTRACT-V1.md

## DEPENDENCIES

- depends_on: —
- blocks: —

## NOTES

Closes F12, F13, F14. Parallel with FIX-03; if both edit listRetirementCandidates, implement scrub first (FIX-03) then pagination (this task) or combine carefully without losing either contract.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-06",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "redhatfix06-retired-route": {
      "description": "Eligible route that has been retired with retiredAt set and retirementReason preserved",
      "seed_method": "public_api",
      "records": [
        "routeId test:redhatfix06-retired geometryStatus retired retiredAt timestamp retirementReason all_levers_failed"
      ]
    },
    "redhatfix06-large-candidate-scan": {
      "description": "Many review/unresolved rows to exercise pagination without exceeding read budget",
      "seed_method": "public_api",
      "records": [
        "N>>200 review/unresolved rows under prefix test:redhatfix06-page-"
      ]
    },
    "redhatfix06-concurrent-retire": {
      "description": "Two conflicting operations: retire then stale unretire with old expected token",
      "seed_method": "public_api",
      "records": [
        "route eligible \u2192 retire \u2192 unretire with stale expectedRetiredAt"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN unretire and related clear paths WHEN patching THEN retiredAt is null not undefined across all listed call sites",
      "verify": "npx vitest run convex/__tests__/REDHATFIX06-retiredAt-null.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "retiredAt: undefined patch idiom remains",
            "hardcoded unretire that only returns null without patching",
            "stub unretire leaving retiredAt timestamp unchanged",
            "empty patch omitting retiredAt null clear"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix06-retired-route",
            "action": {
              "actor": "operator",
              "steps": [
                "Call unretireRoute({routeId})",
                "Re-read curated_routes row",
                "Grep codebase for retiredAt: undefined remaining"
              ]
            },
            "end_state": {
              "must_observe": [
                "stored.retiredAt == null",
                "api.retiredAt == null",
                "retiredAt: undefined patch sites count == 0"
              ],
              "must_not_observe": [
                "stored.retiredAt != null",
                "retiredAt: undefined patch sites count > 0",
                "empty unretire with no patch",
                "retiredAt still equals pre-unretire timestamp"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "After unretireRoute the stored retiredAt value is null and source has no retiredAt undefined patches in production paths",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHATFIX06-retiredAt-null.integration.test.ts -t 'TC-1'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN large candidate sets WHEN listRetirementCandidates is paged THEN reads stay bounded under the 16MB limit",
      "verify": "npx vitest run convex/__tests__/REDHATFIX06-retirement-pagination.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "unbounded take 800x4 without cursor still present",
            "static single page claiming all rows",
            "stub pagination with continueCursor always null and isDone false",
            "empty pagination contract"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix06-large-candidate-scan",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed large prefix pool",
                "Call listRetirementCandidates with limit and optional cursor",
                "If continueCursor present, fetch next page"
              ]
            },
            "end_state": {
              "must_observe": [
                "page.length <= 50",
                "page.length >= 1",
                "continueCursor != null || isDone == true",
                "readLimitError count == 0"
              ],
              "must_not_observe": [
                "page.length == 0 when pool size > 0",
                "page.length > limit",
                "continueCursor == null && isDone == false with remaining rows",
                "empty unbounded scan"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "listRetirementCandidates returns a bounded page and continueCursor when more candidates exist",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHATFIX06-retirement-pagination.integration.test.ts -t 'TC-2'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN concurrent retire/unretire WHEN unretire uses a stale OCC token THEN it fails closed",
      "verify": "npx vitest run convex/__tests__/REDHATFIX06-unretire-occ.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "last-writer-wins silent success without OCC",
            "stub unretire ignoring stale expected token",
            "hardcoded OCC always succeeds",
            "empty token argument still applies patch"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix06-concurrent-retire",
            "action": {
              "actor": "operator",
              "steps": [
                "Retire route; capture expectedRetiredAt or OCC token from getRetirementEvidence",
                "Simulate concurrent change (re-retire reason change or intermediate unretire/retire)",
                "Call unretireRoute with stale expected token"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'CONCURRENCY_CONFLICT' || error.code == 'OCC_MISMATCH'",
                "staleUnretire.applied == false",
                "route.retiredAt == expectedRetiredAt"
              ],
              "must_not_observe": [
                "staleUnretire.applied == true",
                "error.code == null silent success",
                "empty OCC check"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "unretireRoute with a stale OCC token fails with a concurrency conflict and does not apply the patch",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHATFIX06-unretire-occ.integration.test.ts -t 'TC-3'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN valid OCC token WHEN unretireRoute runs THEN retirement clears and history is preserved",
      "verify": "npx vitest run convex/__tests__/REDHATFIX06-unretire-happy.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "OCC always rejects valid token stub",
            "hardcoded riderReady == true on unretire",
            "mock that deletes route instead of preserving history",
            "empty retirementReason wiped"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix06-retired-route",
            "action": {
              "actor": "operator",
              "steps": [
                "Read evidence + token",
                "unretireRoute with valid token",
                "Query route and dispositions"
              ]
            },
            "end_state": {
              "must_observe": [
                "retiredAt == null",
                "retirementReason.length >= 1",
                "disposition == 'unretire'",
                "riderReady == false"
              ],
              "must_not_observe": [
                "retiredAt != null",
                "retirementReason.length == 0",
                "riderReady == true without qualifying evidence",
                "route deleted / empty doc"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "unretireRoute with a valid OCC token clears retirement and preserves retirementReason history",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHATFIX06-unretire-happy.integration.test.ts -t 'TC-4'"
    }
  ]
}
-->
