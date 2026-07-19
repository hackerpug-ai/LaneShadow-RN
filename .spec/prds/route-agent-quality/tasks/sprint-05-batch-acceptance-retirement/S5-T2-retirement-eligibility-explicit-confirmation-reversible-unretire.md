# S5-T2 — Fail-closed retirement with explicit Founder confirmation and reversible un-retire

> Status: Backlog
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

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version":"1",
  "task_id":"S5-T2",
  "tdd_mode":"red_first",
  "verification_policy":{"requires_tests":true,"requires_red_evidence":true,"requires_seeded_evidence":true},
  "fixtures":{
    "s5t2-all-levers-failed-vs-pass":{"seed_method":"public_api","purpose":"compare complete failure evidence with a Lever-2 PASS"},
    "s5t2-founder-confirmation-required":{"seed_method":"public_api","purpose":"exercise explicit founder confirmation"},
    "s5t2-retired-route-surface":{"seed_method":"public_api","purpose":"exercise suggestion exclusion and detail reachability"},
    "s5t2-retire-unretire-preserves-record":{"seed_method":"public_api","purpose":"exercise reversibility"}
  },
  "requirements":[
    {"id":"AC-1","kind":"acceptance","statement":"Eligibility requires all three lever failures","test_tier":"integration","scenario":{"start_ref":"s5t2-all-levers-failed-vs-pass","must_observe":["only all-failed route eligible"],"must_not_observe":["passed or marginal route eligible"],"negative_control":"remove one terminal artifact"}},
    {"id":"AC-2","kind":"acceptance","statement":"Founder reasons and confirmation precede retirement","test_tier":"integration","scenario":{"start_ref":"s5t2-founder-confirmation-required","must_observe":["failure reasons","invalid calls do not patch","valid call audit"],"must_not_observe":["auto-retirement"],"negative_control":"batch completion without confirmation"}},
    {"id":"AC-3","kind":"acceptance","statement":"Retired row is excluded but preserved","test_tier":"integration","scenario":{"start_ref":"s5t2-retired-route-surface","must_observe":["retired","riderReady false","detail preserved"],"must_not_observe":["suggestion result","delete"],"negative_control":"all suggestion modes"}},
    {"id":"AC-4","kind":"acceptance","statement":"Un-retire preserves history and recomputes","test_tier":"integration","scenario":{"start_ref":"s5t2-retire-unretire-preserves-record","must_observe":["same route id","history","recompute"],"must_not_observe":["automatic ready"],"negative_control":"no qualifying geometry"}},
    {"id":"TC-1","kind":"test","statement":"Eligibility","maps_to":["AC-1"]},{"id":"TC-2","kind":"test","statement":"Confirmation","maps_to":["AC-2"]},{"id":"TC-3","kind":"test","statement":"Surface exclusion","maps_to":["AC-3"]},{"id":"TC-4","kind":"test","statement":"Reversibility","maps_to":["AC-4"]}
  ]
}
-->
