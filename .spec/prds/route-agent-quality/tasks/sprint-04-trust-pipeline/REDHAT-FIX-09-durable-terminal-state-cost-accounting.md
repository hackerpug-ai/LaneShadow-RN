# REDHAT-FIX-09 — Make waterfall terminal-state, retry, and provider-cost accounting durable and fail-closed across Lever 3 exceptions and cost limits (UC-REC-04)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-09 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-06 |
| DEPENDS_ON | — |
| BLOCKS | REDHAT-FIX-01 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX09-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Every route processed by `runSampleWaterfall` ends with exactly one authoritative terminal state (`recovered | queued | retirement_eligible | cost_blocked`); a Lever 2 attempt that reaches the provider and throws still records its cost; a cost-limited route is durably paused and reprocessed on resume.

## ⚠️ RE-VERIFICATION: STILL UNRESOLVED (fresh red-hat review, 2026-07-20T18:51:10Z; re-checked against HEAD `b2499228`)

This task's OUTCOME above (a `cost_blocked` durable terminal state) has **not** shipped. After Lever 1 runs, the pre-Lever-2 cost circuit-breaker at `convex/waterfallOrchestrator.ts:577-583` sets `batchStopReason` and executes a bare `break` — no `recordTerminalArtifact`/`insertCurationArtifact` call is made for the touched route. Terminal artifacts are written only on later completed paths. No `cost_blocked` literal exists in the `curation_artifacts.terminalState` union (`convex/schema.ts:306-308`) and `perStateCounts` has no `cost_blocked` counter, so a route the batch touched then cost-broke on ends with ZERO durable terminal state — a restart cannot distinguish it from a never-touched route. No `REDHATFIX09-*.integration.test.ts` files exist.

**Additional required AC (regression proof against current source):**

### AC-R1 [Regression] — A route touched then cost-broken before Lever 2 gets a durable `cost_blocked` artifact and is reprocessed on resume

**Requirement:** GIVEN a batch of cost-burn routes and a `maxCost` that forces the pre-L2 break after Lever 1 has run on a later route WHEN `runSampleWaterfall` breaks THEN that route has exactly one durable `curation_artifacts` row with `terminalState == 'cost_blocked'` (not zero); WHEN a subsequent run has no `maxCost` THEN the paused route is reprocessed to a normal terminal state, never skipped as already-recovered.

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real `runSampleWaterfall` + `curation_artifacts` store)
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX09-cost-blocked-state.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the pre-L2 cost check does a bare `break` writing no artifact (unchanged `waterfallOrchestrator.ts:577-583`) so the touched route's `curation_artifacts` count is 0; `perStateCounts` has no `cost_blocked` key; a resume run skips the paused route as already-recovered
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — seed cost-burn routes; run `runSampleWaterfall` with `maxCost` tripping the breaker after Lever 1 on a later route; query `curation_artifacts` for that route; then re-run with no `maxCost` and re-query its terminal state
  - MUST_OBSERVE: `curation_artifacts` rows with `terminalState == 'cost_blocked'` for the touched route count >= 1; `report.perStateCounts.cost_blocked >= 1`; `report.batchStopReason == 'cost_exceeded'`; after resume the route reaches a normal terminal state (`recovered`/`queued`/`retirement_eligible`)
  - MUST_NOT_OBSERVE: `curation_artifacts` count for the touched route == 0; the route still only `cost_blocked` after the no-`maxCost` resume run

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST persist exactly ONE authoritative terminal state per route in a durable single-source-of-truth store (a route_terminal_state table keyed by routeId with a unique-by-routeId index, upserted), so a route can never simultaneously hold 'retirement_eligible' and 'review_candidate' as its authoritative state — curation_artifacts remains an append-only audit log but is NOT the source of truth for terminal state
- MUST reserve/reconcile billable provider cost around the ACTUAL Lever 2 provider call, not only around success — a Lever 2 attempt that reaches the provider and then throws (waterfallOrchestrator.ts:638 catch) MUST still record its cost, which today only increments at :606-607 after success
- MUST represent a circuit-breaker pause explicitly and durably: when maxCost forces a break before Lever 2 (:554-560), the un-processed route MUST get a durable 'cost_blocked'/paused terminal state so a resume run reprocesses it rather than silently dropping it

**NEVER**
- NEVER write two conflicting authoritative terminal states for one route (the :701-719 catch that records both a retirement_eligible terminal artifact AND a review_candidate artifact must resolve to a single authoritative state)
- NEVER let a billable provider attempt complete without its cost reflected in totalCostUsd
- NEVER leave a route touched by the batch (Lever 1 ran) without a durable terminal or paused state when the batch stops on cost

**STRICTLY**
- STRICTLY fail-closed: an exception on any lever resolves to a single explicit durable terminal state, never an ambiguous or absent one
- STRICTLY keep the Lever 3 review-candidate geometry as evidence WITHOUT it becoming a second authoritative terminal state

## DONE WHEN

- AC-1 [A Lever 3 exception yields exactly one authoritative terminal state per route] [PRIMARY]: A route where L3 throws has exactly 1 route_terminal_state row, terminalState='retirement_eligible'
- AC-2 [A billable Lever 2 provider attempt that throws still records its cost]: A billable-then-throw L2 attempt yields totalCostUsd >= costPerReconstruct
- AC-3 [A cost-limited route is durably paused and reprocessed on resume]: A route left unprocessed by a cost break is durably 'cost_blocked' and reprocessed on resume
- AC-4 [Across a full mixed batch every route has exactly one authoritative terminal state]: Every route in a mixed batch has exactly 1 route_terminal_state row
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Replace the dueling append-only artifact model with a durable single-authoritative-terminal-state-per-route store, reconcile provider cost around the actual Lever 2 call (charge on attempt, not only success), and make circuit-breaker pauses explicit and resumable.

**Success state:** Every route processed by runSampleWaterfall ends with exactly one authoritative terminal state (recovered | queued | retirement_eligible | cost_blocked); a Lever 2 attempt that reaches the provider and throws still records its cost; a cost-limited route is durably paused and reprocessed on resume; a Lever 3 exception yields one authoritative state, not a retirement_eligible + review_candidate pair.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `lever3-exception-route` (seed_method: `public_api`): A route seeded so Lever 1 and Lever 2 fail and Lever 3 (rerouteForRoute) throws
    - routeId `test:redhat09-l3-throws`
- `lever2-billable-then-throws` (seed_method: `recorded_external`): A route whose Lever 2 reconstruct reaches the Google Routes provider (billable) and then the downstream throws, recorded once
    - cassette `convex/__tests__/fixtures/REDHATFIX09-l2-billable-throw.cassette.json`
- `cost-limit-paused-batch` (seed_method: `public_api`): Several unresolved cost-burn routes seeded so a maxCost budget forces a circuit-breaker break before Lever 2 on a later route
    - routeIds `test:redhat09-cost-000`..`-003`
- `mixed-terminal-batch` (seed_method: `public_api`): A batch of routes covering recovered, queued (REVIEW), and retirement_eligible outcomes
    - routeIds `test:lever1-pass`, `test:review-candidate`, `test:redhat09-l3-throws`

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — A Lever 3 exception yields exactly one authoritative terminal state per route

**Requirement:** GIVEN a route that fails Lever 1 and Lever 2 (with a best-candidate geometry captured) and throws in Lever 3 WHEN runSampleWaterfall processes the route and hits the Lever 3 catch THEN the durable route_terminal_state store has exactly one authoritative row for the route (terminalState is a single value, e.g. 'retirement_eligible'), never a coexisting 'review_candidate' authoritative state

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real runSampleWaterfall + route_terminal_state store)
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX09-waterfall-terminal.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the code writes both a retirement_eligible terminal artifact and a review_candidate artifact as authoritative state (unchanged dueling-artifact bug); the terminal store is a stub returning a fixed single value regardless of input
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `lever3-exception-route`
  - ACTION: Seed lever3-exception-route; call runSampleWaterfall({routeIds:['test:redhat09-l3-throws']}); query the durable route_terminal_state store
  - MUST_OBSERVE: route_terminal_state count for the routeId == 1; terminalState == 'retirement_eligible'
  - MUST_NOT_OBSERVE: route_terminal_state count for the routeId == 2 (dueling states); no terminal_state row is present

### AC-2 — A billable Lever 2 provider attempt that throws still records its cost

**Requirement:** GIVEN a route whose Lever 2 reconstruct reaches the Google Routes provider (billable) and then throws, replayed from a recorded cassette WHEN runSampleWaterfall processes the route and the Lever 2 call throws after the provider exchange THEN the reported totalCostUsd (and the route's durable cost) includes the attempted call's cost

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Google Routes API v2 recorded-and-replayed + Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: cost only increments after a successful l2Wrapped (unchanged success-only accounting) so a thrown attempt records a cost of 0 (empty); the provider call is mocked so no real billable exchange is replayed
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `lever2-billable-then-throws`
  - ACTION: Seed lever2-billable-then-throws with its recorded cassette; call runSampleWaterfall replaying the cassette so L2 is attempted then throws; read the returned WaterfallReport.totalCostUsd
  - MUST_OBSERVE: totalCostUsd >= 0.05
  - MUST_NOT_OBSERVE: totalCostUsd == 0 after a billable attempt threw

### AC-3 — A cost-limited route is durably paused and reprocessed on resume

**Requirement:** GIVEN a batch of unresolved cost-burn routes and a maxCost that forces a circuit-breaker break before Lever 2 on a later route WHEN runSampleWaterfall stops on cost, then a resume run is invoked without the cost limit THEN the un-processed route carries a durable 'cost_blocked'/paused terminal state after the first run, and the resume run reprocesses it to a normal terminal state

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real runSampleWaterfall resume)
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the cost-limited route has no durable state after the break (the loop just breaks, leaving the row absent); the paused route is treated as already-recovered and skipped on resume
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `cost-limit-paused-batch`
  - ACTION: Seed cost-limit-paused-batch; call runSampleWaterfall with maxCost exhausted before the last route's Lever 2; query route_terminal_state for the un-processed route; call runSampleWaterfall again with no maxCost; re-query its terminal state
  - MUST_OBSERVE: terminalState after run 1 == 'cost_blocked'; batchStopReason == 'cost_exceeded'
  - MUST_NOT_OBSERVE: route_terminal_state row for the un-processed route is absent after run 1; the paused route's terminalState == 'recovered' before resume

### AC-4 — Across a full mixed batch every route has exactly one authoritative terminal state (invariant)

**Requirement:** GIVEN a batch producing recovered, queued (REVIEW), and retirement_eligible outcomes WHEN runSampleWaterfall processes the batch THEN for every routeId, the durable route_terminal_state store holds exactly one authoritative row — no route holds two conflicting authoritative terminal states

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real runSampleWaterfall)
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX09-waterfall-terminal.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: any route yields two authoritative terminal rows (unchanged dueling-state bug); the terminal store upsert is keyed by something other than routeId so duplicates accrue
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `mixed-terminal-batch`
  - ACTION: Seed mixed-terminal-batch; call runSampleWaterfall over the 3 routeIds; for each routeId count authoritative rows in route_terminal_state
  - MUST_OBSERVE: route_terminal_state count per routeId == 1 for all 3 routeIds
  - MUST_NOT_OBSERVE: any routeId with route_terminal_state count >= 2; any routeId with route_terminal_state count == 0

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | A Lever 3 exception produces exactly one authoritative route_terminal_state row with terminalState='retirement_eligible' | AC-1 | `npx vitest run convex/__tests__/REDHATFIX09-waterfall-terminal.integration.test.ts -t 'TC-1'` |
| TC-2 | A billable Lever 2 attempt that throws yields totalCostUsd >= costPerReconstruct | AC-2 | `npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts -t 'TC-2'` |
| TC-3 | A cost-limited un-processed route has terminalState='cost_blocked' after the break | AC-3 | `npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts -t 'TC-3'` |
| TC-4 | A resume run reprocesses a cost_blocked route to a normal terminal state | AC-3 | `npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts -t 'TC-4'` |
| TC-5 | Across a mixed batch each routeId has exactly one authoritative route_terminal_state row | AC-4 | `npx vitest run convex/__tests__/REDHATFIX09-waterfall-terminal.integration.test.ts -t 'TC-5'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/waterfallOrchestrator.ts (MODIFY — single terminal state, cost reconciliation, explicit pause)
- convex/schema.ts (MODIFY — ADD route_terminal_state table, additive only, unique-by-routeId index)
- convex/__tests__/REDHATFIX09-waterfall-terminal.integration.test.ts (NEW)
- convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts (NEW)
- convex/__tests__/fixtures/REDHATFIX09-l2-billable-throw.cassette.json (NEW — recorded once from Google Routes API v2)

**writeProhibited:**
- Deleting the curation_artifacts append-only audit log (it stays as audit, just not authoritative)
- Any RN/Expo file
- Hand-authoring or editing the AC-2 cassette (re-record by deleting the file and re-running against the live provider)
- Charging cost twice for a single provider attempt
- Removing existing curated_route_geometry side-table rows

## READING LIST

- `convex/waterfallOrchestrator.ts` (485-560) — Lever 1 runs unconditionally; cost check before L2 (:554-560) breaks the loop leaving the route with no durable terminal state
- `convex/waterfallOrchestrator.ts` (586-641) — cost increments at :606-607 ONLY after successful l2Wrapped; the :638 catch records no cost even after a billable provider attempt
- `convex/waterfallOrchestrator.ts` (695-720) — the Lever 3 catch writes BOTH recordTerminalArtifact(retirement_eligible) AND recordReviewArtifact(review_candidate) for the same route — the dueling-state bug
- `convex/waterfallOrchestrator.ts` (759-825) — recordTerminalArtifact/recordReviewArtifact write to curation_artifacts (append-only log), not a single-row-per-route terminal state
- `convex/schema.ts` (299-320) — curation_artifacts table shape — add a NEW additive route_terminal_state table with a unique-by-routeId index as the authoritative store
- `convex/actions/curatedGeometryReconstruct.ts` (78-83,551-585) — routeWithInvocationCount is the sole billable provider boundary — cost must reserve around it; cassette recording for AC-2
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/S4-T5-resumable-sample-waterfall-cost-circuit-breaker-rate-limit.md` — the waterfall resume/cost/rate-limit pattern this task hardens

## CODE PATTERN

- Pattern: Durable single-authoritative-state-per-route via an upserted route_terminal_state table (unique by routeId); cost reserved around routeWithInvocationCount and reconciled on both success and throw; explicit 'cost_blocked' paused state checkpointed for resume
- Pattern source: `convex/curatedGeometryGate.ts:138-169` (single-source pattern) + `convex/waterfallOrchestrator.ts:788-825` (artifact insert to convert into upsert)
- Anti-pattern: Dueling append-only artifacts as terminal state; charging cost only on success; breaking the loop on cost with no durable route state

## VERIFICATION GATES

- test (terminal-state): `npx vitest run convex/__tests__/REDHATFIX09-waterfall-terminal.integration.test.ts` → Exit 0
- test (cost/resume): `npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-09-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; durable terminal state + cost reconciliation
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment + a recorded live-provider cassette
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value

## DEPENDENCIES

- Depends on: —
- Blocks: REDHAT-FIX-01

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1
-->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-09",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "lever3-exception-route": { "description": "A route where Lever 1/2 fail and Lever 3 throws.", "seed_method": "public_api", "records": ["routeId 'test:redhat09-l3-throws'"] },
    "lever2-billable-then-throws": { "description": "A route whose Lever 2 reaches the provider then throws, recorded once.", "seed_method": "recorded_external", "records": ["cassette convex/__tests__/fixtures/REDHATFIX09-l2-billable-throw.cassette.json"] },
    "cost-limit-paused-batch": { "description": "Several unresolved cost-burn routes forcing a maxCost circuit-breaker break.", "seed_method": "public_api", "records": ["routeIds 'test:redhat09-cost-000'..'-003'"] },
    "mixed-terminal-batch": { "description": "A batch of routes covering recovered, queued, and retirement_eligible outcomes.", "seed_method": "public_api", "records": ["routeIds 'test:lever1-pass','test:review-candidate','test:redhat09-l3-throws'"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "A Lever 3 exception yields exactly one authoritative terminal state per route", "verify": "npx vitest run convex/__tests__/REDHATFIX09-waterfall-terminal.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real runSampleWaterfall + route_terminal_state store)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the code writes both a retirement_eligible terminal artifact and a review_candidate artifact as authoritative state (unchanged dueling-artifact bug)", "the terminal store is a stub returning a fixed single value regardless of input"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "lever3-exception-route", "action": { "actor": "api_client", "steps": ["Seed lever3-exception-route", "Call runSampleWaterfall({routeIds:['test:redhat09-l3-throws']})", "Query the durable route_terminal_state store"] },
          "end_state": { "must_observe": ["route_terminal_state count for the routeId == 1", "terminalState == 'retirement_eligible'"], "must_not_observe": ["route_terminal_state count for the routeId == 2 (dueling states)", "no terminal_state row is present"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "A billable Lever 2 provider attempt that throws still records its cost", "verify": "npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Google Routes API v2 recorded-and-replayed + Convex dev deployment", "topology": "single-node",
        "negative_control": { "would_fail_if": ["cost only increments after a successful l2Wrapped (unchanged success-only accounting) so a thrown attempt records a cost of 0 (empty)", "the provider call is mocked so no real billable exchange is replayed"] },
        "evidence": { "artifact_type": "api_response", "required_capture": true },
        "cases": [ { "start_ref": "lever2-billable-then-throws", "action": { "actor": "api_client", "steps": ["Seed lever2-billable-then-throws with its recorded cassette", "Call runSampleWaterfall replaying the cassette so L2 is attempted then throws", "Read the returned WaterfallReport.totalCostUsd"] },
          "end_state": { "must_observe": ["totalCostUsd >= 0.05"], "must_not_observe": ["totalCostUsd == 0 after a billable attempt threw"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "A cost-limited route is durably paused and reprocessed on resume", "verify": "npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real runSampleWaterfall resume)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the cost-limited route has no durable state after the break (the loop just breaks, leaving the row absent)", "the paused route is treated as already-recovered and skipped on resume"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "cost-limit-paused-batch", "action": { "actor": "api_client", "steps": ["Seed cost-limit-paused-batch", "Call runSampleWaterfall with maxCost exhausted before the last route's Lever 2", "Query route_terminal_state for the un-processed route", "Call runSampleWaterfall again with no maxCost", "Re-query its terminal state"] },
          "end_state": { "must_observe": ["terminalState after run 1 == 'cost_blocked'", "batchStopReason == 'cost_exceeded'"], "must_not_observe": ["route_terminal_state row for the un-processed route is absent after run 1", "the paused route's terminalState == 'recovered' before resume"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Across a full mixed batch every route has exactly one authoritative terminal state", "verify": "npx vitest run convex/__tests__/REDHATFIX09-waterfall-terminal.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real runSampleWaterfall)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["any route yields two authoritative terminal rows (unchanged dueling-state bug)", "the terminal store upsert is keyed by something other than routeId so duplicates accrue"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "mixed-terminal-batch", "action": { "actor": "api_client", "steps": ["Seed mixed-terminal-batch", "Call runSampleWaterfall over the 3 routeIds", "For each routeId count authoritative rows in route_terminal_state"] },
          "end_state": { "must_observe": ["route_terminal_state count per routeId == 1 for all 3 routeIds"], "must_not_observe": ["any routeId with route_terminal_state count >= 2", "any routeId with route_terminal_state count == 0"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "A Lever 3 exception produces exactly one authoritative route_terminal_state row with terminalState='retirement_eligible'", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX09-waterfall-terminal.integration.test.ts -t 'TC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "A billable Lever 2 attempt that throws yields totalCostUsd >= costPerReconstruct", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts -t 'TC-2'" },
    { "id": "TC-3", "type": "test_criterion", "description": "A cost-limited un-processed route has terminalState='cost_blocked' after the break", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts -t 'TC-3'" },
    { "id": "TC-4", "type": "test_criterion", "description": "A resume run reprocesses a cost_blocked route to a normal terminal state", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX09-waterfall-cost.integration.test.ts -t 'TC-4'" },
    { "id": "TC-5", "type": "test_criterion", "description": "Across a mixed batch each routeId has exactly one authoritative route_terminal_state row", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX09-waterfall-terminal.integration.test.ts -t 'TC-5'" },
    { "id": "AC-R1", "type": "acceptance_criterion", "primary": false, "description": "A route touched then cost-broken before Lever 2 gets a durable cost_blocked artifact and is reprocessed on resume (regression proof added 2026-07-20 fresh review)", "verify": "npx vitest run convex/__tests__/REDHATFIX09-cost-blocked-state.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real runSampleWaterfall + curation_artifacts store)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the pre-L2 cost check does a bare break writing no artifact (unchanged waterfallOrchestrator.ts:577-583)", "perStateCounts has no cost_blocked key", "a resume run skips the paused route as already-recovered"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "cost-break-touched-batch", "action": { "actor": "api_client", "steps": ["Seed cost-burn routes", "Run runSampleWaterfall with maxCost tripping the breaker after Lever 1 on a later route", "Query curation_artifacts for that route", "Re-run with no maxCost and re-query its terminal state"] },
          "end_state": { "must_observe": ["curation_artifacts rows with terminalState == 'cost_blocked' for the touched route count >= 1", "report.perStateCounts.cost_blocked >= 1", "report.batchStopReason == 'cost_exceeded'", "after resume the route reaches a normal terminal state"], "must_not_observe": ["curation_artifacts count for the touched route == 0", "the route still only cost_blocked after the no-maxCost resume run"] } } ] } },
    { "id": "TC-R1", "type": "test_criterion", "description": "A cost-broken touched route has >=1 curation_artifacts row with terminalState cost_blocked and is reprocessed on resume", "maps_to_ac": "AC-R1", "verify": "npx vitest run convex/__tests__/REDHATFIX09-cost-blocked-state.integration.test.ts -t 'TC-R1'" }
  ]
}
-->

</details>
