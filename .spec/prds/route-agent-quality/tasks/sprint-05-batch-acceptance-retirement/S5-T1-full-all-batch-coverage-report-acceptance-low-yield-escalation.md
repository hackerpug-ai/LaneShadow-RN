# S5-T1 — Full `--all` batch, realized-yield coverage report, acceptance, and escalation

> Status: Backlog
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | S5-T1 |
| SPRINT | [Sprint 05 — Batch acceptance + retirement](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | `convex-implementer` |
| ESTIMATE | 120 min |
| EFFORT | L |
| PRIORITY | P0 |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | touches `CAP-GEO-04`, consumes `CAP-GEO-05`, provides accepted batch evidence |
| DEPENDS_ON | S4-T5, S4-T6, S4-T7 |
| BLOCKS | S5-T2, S5-T3, S5-T4 |

RUNTIME_COMMANDS:
- integration: `pnpm test convex/__tests__/S5T1-*.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex scripts`
- build: `pnpm convex:dev --once`
- operator: `pnpm tsx scripts/backfill-curated-geometry.ts --all`

## BACKGROUND

Sprint 04 creates the couch-sample PASS that unlocks the full waterfall, but it does not decide whether the resulting catalog is good enough. This task makes the full run observable and governable: the real driver must refuse an unapproved couch gate, preserve cursor/cost state, expose per-lever and terminal-state counts, compare realized output with the PRD's explicitly non-binding expected-yield assumptions, and persist a founder acceptance or escalation artifact. Retirement remains locked until that decision exists.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** require `couchGateStatus === 'pass'` before any `--all` work can persist.
- **MUST** report realized counts and rates by lever, provenance, terminal state, rider-ready status, cost, and continuation cursor from the real deployment.
- **MUST** treat the PRD yield table as an estimate: it is comparison context, never a committed catalog target.
- **NEVER** mark the batch accepted, complete, or retirement-unlocked when a far-below-estimate lever has not been escalated to the Founder-Operator.
- **NEVER** use fixture rows, guessed counts, or a static report as proof of the real full-batch result.

## SPECIFICATION

**Objective:** Extend the operator full-batch path and Convex reporting surface so the Founder-Operator can accept or reject the realized post-batch rider-ready count against the expected-yield assumptions, with an auditable low-yield escalation and a hard retirement lock.

**Success state:** A real `--all` run after couch PASS produces a durable report containing per-lever realized yields, terminal states, rider-ready count, cost/cursor telemetry, and the expected-yield comparison. A founder acceptance/rejection/escalation is persisted; only an explicit accept or an explicitly resolved escalation can unlock S5-T2 retirement.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR)

### AC-1 [PRIMARY] — `--all` is couch-gated and produces a real coverage report

**Requirement:** GIVEN the Sprint 04 couch gate is either `unrecorded`, `fail`, or `pass` WHEN the operator invokes the full-batch driver THEN the first two states refuse before route mutation and the pass state runs against the real deployment and persists a `coverageReport` with per-lever PASS rates, terminal-state counts, provenance counts, rider-ready count, cost, and cursor.

- TEST_TIER: `integration` + `human-gate`  ·  VERIFICATION_SERVICE: real Convex dev deployment
- FLOW_REF: UC-REC-04 / T-REC-017 / T-REC-019
- VERIFY: `pnpm test convex/__tests__/S5T1-all-batch-gate-report.integration.test.ts`

SCENARIO:
- `start_ref`: `s5t1-real-batch-gate-fixture` (seeded through the existing public test-support entrypoint; fixture only proves refusal/report shape, while the acceptance artifact uses an un-seeded dev catalog)
- `ACTION`: Record couch status as `unrecorded`, invoke the real driver with `--all`, query the route and acceptance state; record a failed couch status and repeat; then record PASS and run one bounded real batch invocation with a continuation cursor.
- `MUST_OBSERVE`: refusal occurs before any route status changes for unrecorded/failed; PASS run returns `coverageReport`, `totalCostUSD`, `continueCursor`, per-lever counts/rates, terminal-state counts, provenance counts, and riderReady count.
- `MUST_NOT_OBSERVE`: a route changes to `generated`, `review`, `retired`, or rider-ready while couch status is not PASS; report with only a hard-coded total or no cursor/cost.
- `NEGATIVE_CONTROL`: a deliberate non-PASS couch status must fail the driver gate; a report omitting one terminal state or a per-lever rate must fail the integration assertion.
- `EVIDENCE`: `db_query` + `stdout` + persisted `coverageReport` artifact; required captures include pre/post route state and the exact cursor/cost fields.

### AC-2 — Full-batch report compares realized yields without inventing a target

**Requirement:** GIVEN a completed or resumable full batch WHEN the operator requests the coverage report THEN it computes observed candidates, PASS counts/rates, rider-ready count, and terminal states per lever and compares them with the PRD table (`lever 1: unproven`, `lever 2: ~67%`, `lever 3: ~40–55%`) while labeling those values as assumptions.

- TEST_TIER: `integration`  · VERIFY: `pnpm test convex/__tests__/S5T1-coverage-report-yields.integration.test.ts`

SCENARIO:
- `start_ref`: `s5t1-mixed-provenance-batch`
- `ACTION`: Seed a mixed test-support pool with one PASS and one non-PASS outcome for each provenance, run the actual report query/action, and inspect the serialized report.
- `MUST_OBSERVE`: each lever has candidate count, PASS count, realized rate, provenance, terminal-state totals, and a comparison field whose source is the PRD assumption table; rider-ready count equals the persisted gated rows, not raw generated rows.
- `MUST_NOT_OBSERVE`: a committed numeric target presented as a pass/fail threshold, rider-ready count inferred from `geometryStatus` alone, or a missing non-applicable/`unproven` label for Lever 1.
- `NEGATIVE_CONTROL`: inject a generated but `not_a_ride` row and a generated duplicate/shadow; the report must not count either as rider-ready.
- `EVIDENCE`: `db_query` and JSON report capture with route IDs, provenance, status, riderReady, and assumption labels.

### AC-3 — Low-yield lever blocks silent completion and records escalation

**Requirement:** GIVEN a realized per-lever rate is materially below its assumption (including reconstruct below the PRD's example 40% escalation line) WHEN acceptance is requested THEN the system records `escalation_required`, names the lever and observed evidence, and keeps the batch unaccepted and retirement-locked until the Founder-Operator explicitly resolves it.

- TEST_TIER: `integration`  · VERIFY: `pnpm test convex/__tests__/S5T1-low-yield-escalation.integration.test.ts`

SCENARIO:
- `start_ref`: `s5t1-low-yield-reconstruct`
- `ACTION`: Seed a report with a real run result below the reconstruct escalation threshold; call the acceptance mutation with `decision='accept'`; query acceptance and retirement-lock state; then call the explicit founder resolution path and query again.
- `MUST_OBSERVE`: first call stores the observed rates and returns `escalation_required`; `acceptedAt` and `retirementUnlockedAt` remain null; only the explicit resolution records the decision, rationale, and resolved timestamp.
- `MUST_NOT_OBSERVE`: an automatic acceptance, a missing lever-specific escalation, or retirement becoming available before resolution.
- `NEGATIVE_CONTROL`: mutate only the total rider-ready count while leaving the low reconstruct rate unresolved; the lock must remain active.
- `EVIDENCE`: `db_query` of the acceptance artifact and lock query, including the observed denominator/numerator and Founder resolution.

### AC-4 — Resume and cost governance remain visible in acceptance evidence

**Requirement:** GIVEN the full run stops at a circuit-breaker or provider failure WHEN the operator resumes with the returned cursor THEN already-PASSed routes are not reprocessed, actual cost never exceeds the configured cap, and the eventual report reconciles all page totals without falsely accepting an incomplete run.

- TEST_TIER: `integration`  · VERIFY: `pnpm test convex/__tests__/S5T1-resume-cost-reconciliation.integration.test.ts`

SCENARIO:
- `start_ref`: `s5t1-cost-stop-resume`
- `ACTION`: Run the real waterfall with a small `--max-cost` against the test-support pool, capture `continueCursor` and original verification timestamps, resume from that cursor, and request the coverage report.
- `MUST_OBSERVE`: `batchStopReason='cost_exceeded'` or provider-halt is explicit, cursor is retained, generated rows keep their original verification timestamp, cost totals reconcile across pages, and acceptance remains pending until the run is complete.
- `MUST_NOT_OBSERVE`: re-spend on already-PASSed routes, a missing cursor, cost telemetry reset to zero, or acceptance of a partial report.
- `NEGATIVE_CONTROL`: attempt acceptance while `isDone=false`; it must be rejected with an incomplete-run reason.
- `EVIDENCE`: `stdout`, `db_query`, and report JSON containing page/cursor/cost reconciliation.

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | Couch gate blocks full batch until PASS and PASS produces the complete report contract | AC-1 | `pnpm test convex/__tests__/S5T1-all-batch-gate-report.integration.test.ts` |
| TC-2 | Realized per-lever yields compare to assumptions and rider-ready count is gate-derived | AC-2 | `pnpm test convex/__tests__/S5T1-coverage-report-yields.integration.test.ts` |
| TC-3 | Low yield creates escalation and keeps acceptance/retirement locked | AC-3 | `pnpm test convex/__tests__/S5T1-low-yield-escalation.integration.test.ts` |
| TC-4 | Cursor, cost, resume, and incomplete-run semantics reconcile | AC-4 | `pnpm test convex/__tests__/S5T1-resume-cost-reconciliation.integration.test.ts` |

## READING LIST

- `convex/waterfallOrchestrator.ts` — existing resumable waterfall, cost cap, terminal-state and cursor contract.
- `convex/curatedGeometry.ts` — `coverageReport`, rider-ready recompute, provenance/status fields.
- `scripts/backfill-curated-geometry.ts` — current operator driver and `--all`/cursor behavior to extend rather than duplicate.
- `convex/couchVerdict.ts` and `convex/couchSampleAssembler.ts` — Sprint 04 gate status and fixture boundaries.
- `convex/schema.ts` — `curated_routes`, `curated_route_geometry`, and `curation_artifacts` fields/indexes.
- `.spec/prds/route-agent-quality/05-uc-rec.md` — realized-yield and no-target contract.
- `.spec/prds/route-agent-quality/11-e2e-testing-criteria.md` — T-REC-017 and T-REC-019.
- `convex/_generated/ai/guidelines.md` — required Convex API rules.

## GUARDRAILS

**WRITE-ALLOWED:**
- `convex/curatedGeometry.ts` (coverage/acceptance query and mutations)
- `convex/waterfallOrchestrator.ts` (only full-batch gate/report integration)
- `convex/schema.ts` (additive acceptance artifact fields/indexes only)
- `scripts/backfill-curated-geometry.ts` or `scripts/reconstruct-curated-geometry.ts` (canonical driver; do not maintain two divergent drivers)
- `scripts/geometry-coverage-report.ts`
- `convex/__tests__/S5T1-*.integration.test.ts`

**WRITE-PROHIBITED:**
- Any other sprint's `.spec` files or task files.
- Direct catalog edits, table dumps, fixture-only acceptance, or removal of the Sprint 04 couch gate.
- Changes to RN surfaces or the unrelated agent rebuild.

## CODE PATTERN

- **Pattern:** cursor-resumable operator pipeline with durable report and explicit decision state.
- **Pattern source:** `convex/waterfallOrchestrator.ts`, `convex/curatedGeometry.ts`, `scripts/backfill-curated-geometry.ts`.
- **Anti-pattern:** a static expected count, acceptance derived from generated rows, or a driver that runs `--all` without checking couch status.

## VERIFICATION GATES

- `pnpm test convex/__tests__/S5T1-*.integration.test.ts` → all S5-T1 integration scenarios pass against the real Convex dev deployment.
- `pnpm type-check` → exit 0.
- `pnpm exec biome check convex scripts` → exit 0.
- `pnpm convex:dev --once` → exit 0.
- `git diff --name-only` → only S5-T1 write-allowed paths changed.

## AGENT INSTRUCTIONS

Run RED against the current Convex dev deployment before implementation for every behavioral AC. Use the sanctioned model/fetch seam only for probabilistic inputs; keep the batch, report, status transitions, cursor, cost, and acceptance state real. GREEN each AC with a seeded public entrypoint, then run one cost-capped real-API smoke/acceptance capture. REFACTOR without weakening the couch, low-yield, or incomplete-run locks.

## AGENT ASSIGNMENT

- **Agent:** `convex-implementer` — owns Convex pipeline/report/driver changes.
- **Rationale:** this task changes internal Convex functions and the operator command, with no UI surface.
- **Reviewer:** `convex-reviewer` — verify transaction boundaries, status/index semantics, and no target/lock bypass.

## EVIDENCE GATES

- RED evidence exists for AC-1 through AC-4 before GREEN.
- Primary AC evidence is integration-tier against the real dev deployment.
- Final acceptance packet includes raw report JSON, stdout, cursor/cost fields, and the un-seeded real-batch capture.
- `validate_scenario` must report zero CRITICAL findings for every behavioral AC.

## DEPENDENCIES

- Depends on: S4-T5, S4-T6, S4-T7.
- Blocks: S5-T2, S5-T3, S5-T4.

## CODING STANDARDS

- `convex/_generated/ai/guidelines.md`
- `RULES.md`
- `AGENTS.md`
- `.spec/prds/route-agent-quality/10-technical-requirements/01-architecture-posture.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S5-T1",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "s5t1-real-batch-gate-fixture": {"seed_method":"public_api","purpose":"exercise couch gate refusal/report shape"},
    "s5t1-mixed-provenance-batch": {"seed_method":"public_api","purpose":"exercise per-lever yield and rider-ready counting"},
    "s5t1-low-yield-reconstruct": {"seed_method":"public_api","purpose":"exercise low-yield escalation and lock"},
    "s5t1-cost-stop-resume": {"seed_method":"public_api","purpose":"exercise cursor/cost reconciliation"}
  },
  "requirements": [
    {"id":"AC-1","kind":"acceptance","statement":"Couch-gated full batch emits a complete real coverage report","test_tier":"integration","scenario":{"start_ref":"s5t1-real-batch-gate-fixture","must_observe":["non-PASS refuses before mutation","PASS emits per-lever/status/provenance/riderReady/cost/cursor report"],"must_not_observe":["mutation before couch PASS"],"negative_control":"non-PASS couch status"}},
    {"id":"AC-2","kind":"acceptance","statement":"Realized yields compare to labeled assumptions","test_tier":"integration","scenario":{"start_ref":"s5t1-mixed-provenance-batch","must_observe":["observed per-lever rates","rider-ready derived from gate"],"must_not_observe":["hard-coded target acceptance"],"negative_control":"generated non-ready row"}},
    {"id":"AC-3","kind":"acceptance","statement":"Far-below yield escalates and locks acceptance/retirement","test_tier":"integration","scenario":{"start_ref":"s5t1-low-yield-reconstruct","must_observe":["escalation_required","explicit resolution required"],"must_not_observe":["automatic acceptance","retirement unlock"],"negative_control":"change total only"}},
    {"id":"AC-4","kind":"acceptance","statement":"Resume and cost evidence reconcile without accepting incomplete work","test_tier":"integration","scenario":{"start_ref":"s5t1-cost-stop-resume","must_observe":["cursor","cost reconciliation","pending while incomplete"],"must_not_observe":["reprocessing PASS rows","accept partial report"],"negative_control":"accept isDone=false"}},
    {"id":"TC-1","kind":"test","statement":"Couch gate and report contract","maps_to":["AC-1"]},{"id":"TC-2","kind":"test","statement":"Yield comparison","maps_to":["AC-2"]},{"id":"TC-3","kind":"test","statement":"Escalation lock","maps_to":["AC-3"]},{"id":"TC-4","kind":"test","statement":"Resume/cost reconciliation","maps_to":["AC-4"]}
  ]
}
-->
