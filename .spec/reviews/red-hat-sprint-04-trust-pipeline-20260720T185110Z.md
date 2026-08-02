# Red-Hat Review Report — Sprint 04 Trust Pipeline

**Report Date:** 2026-07-20T18:51:10Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Reviewed commit:** `21da6d7155d41779fbe6129222ce8800273ee819`  
**Review mode:** Fresh read-only adversarial source/spec/evidence review. No task, source, or evidence file was modified.

## Executive Summary

**Not accepted for closeout.** The original gate claim is stale: its eight-step evidence predates every REDHAT remediation commit, while the sprint still says `GATE-GOAL: ACHIEVED`. More importantly, several remediations remain specification-incomplete in current source: the public waterfall still accepts injected Lever-2 geometry, REVIEW approval trusts stored verification rather than decoding and measuring the candidate, whole-catalog classification has no durable checkpoint/resume state, and cost-limited routes can exit with no durable terminal state.

The targeted REDHAT marker suite passes (27/27), but every integration test command named by the REDHAT-FIX task contracts is absent. Those marker tests do not establish the required runtime behavior or fresh human/live-provider gate evidence.

## Review Checklist

| Required surface | Evidence inspected | Result |
|---|---|---|
| Fresh severity report | This file | PASS |
| Target sprint and task contracts | `SPRINT.md`; S4-T1…T7; `REDHAT-FIX-01`…`11` | PASS — inspected |
| Convex project rules | `convex/_generated/ai/guidelines.md` | PASS — read before Convex review |
| Human-gate entry points and oracles | Eight `.gate-evidence/.../scripts/step*.sh`, `gate-results.json`, `gate-verification.json` | FAIL — evidence is stale and scripts no longer prove/rerun the current contract |
| Freshness versus implementation | gate evidence timestamp 2026-07-19; reviewed Convex HEAD 2026-07-20T12:39:28-06:00 | FAIL |
| REDHAT test evidence | `pnpm exec vitest run` for seven current REDHAT marker files | PASS narrowly — 7 files, 27 tests; inadequate for required integration contracts |
| Task-declared integration tests | all `convex/__tests__/REDHATFIX*.integration.test.ts` references in FIX tasks | FAIL — 23 referenced files are absent |
| Specialist-agent panel | Attempted Convex/code/security dispatch | INCOMPLETE — configured subagent model/API credentials were unavailable; findings below are parent-verifiable source findings only |

## Human-Testing Gate Pre-check

| Check | Result | Evidence |
|---|---|---|
| Scripts and named public function surfaces exist | PASS, narrow | `step1.sh`…`step8.sh` exist; cited public mutations/actions still export. |
| Current scripts are runnable **as documented** | **FAIL** | `step1.sh:4-6`, `step3.sh:7-8`, and `step7.sh:7` use identity `s4-human-gate` but do not create an operator role. Current seed operations call `requireOperator` (`convex/waterfallOrchestrator.ts:249-253`, `convex/reviewQueue.ts:119-131`); a role-less identity resolves to `rider` and is rejected (`convex/guards.ts:108-152`). |
| Gate evidence freshness | **FAIL** | `gate-results.json` and `gate-verification.json` are from 2026-07-19, before the 2026-07-20 remediation commits touching the reviewed code. |
| Current gate proves no injected Lever-2 geometry | **FAIL** | Existing `step1.sh:6` and `step2.sh:5` pass `lever2FixedGeometry`; current public API still accepts and uses it (`convex/waterfallOrchestrator.ts:451-465,602-618`). |
| Founder/live-provider proof | **FAIL / unattested** | The retained evidence is the legacy synthetic script set and no post-remediation founder review/export or real-provider closeout artifact exists. |

## HIGH Confidence Findings

- [ ] **CRITICAL — The sprint claims completion using stale, now-invalid gate evidence.**
  - **Evidence:** `sprint-goal-state.json` reports `GATE-GOAL: ACHIEVED`; retained gate artifacts are dated 2026-07-19; current reviewed Convex commit is `21da6d71` dated 2026-07-20T12:39:28-06:00. The scripts do not bootstrap an operator but their fixture mutations now require one.
  - **Impact:** The claimed 8/8 gate cannot attest the remediated code and may not rerun under its documented command/identity.
  - **Fix:** Replace the old gate bundle with a fresh run against current code, authenticated operator/founder setup, real recovered catalog routes, no injected geometry, and independently recomputed evidence.

- [ ] **CRITICAL — Public `runSampleWaterfall` still exposes the injected `lever2FixedGeometry` seam that FIX-01 explicitly requires removed.**
  - **Evidence:** `REDHAT-FIX-01-rerun-closeout-live-provider-no-fixed-geometry.md:65,88,127-141` requires the public surface to reject the override and the legacy synthetic path to fail closed. `convex/waterfallOrchestrator.ts:451-465` validates the public argument, and `:602-618` routes it to `reconstructForRouteWithFixedGeometry`.
  - **Impact:** Any authenticated caller can bypass the real LLM/geocode/route reconstruction and manufacture an apparently recovered Lever-2 result.
  - **Fix:** Remove the argument from every public action (including `reviewQueue.retryDisposition:546-591`), keep it only in test-only/internal infrastructure, and add the missing FIX-01 negative integration test.

- [ ] **CRITICAL — REVIEW approval does not decode/re-measure the candidate geometry despite FIX-05’s core contract.**
  - **Evidence:** FIX-05 requires decoding the actual polyline and re-measuring it (`REDHAT-FIX-05...md:30,77-102`). `approveDisposition` reads `geom.verification` fields (`convex/reviewQueue.ts:318-352`) then calls the gate with stored `pointCount`, `routedMiles`, `ratio`, and anchors (`:343-352`); it never decodes `geometry` or measures the polyline.
  - **Impact:** A stale or attacker-influenced stored verification record can promote a geometry whose actual points/length fail the gate.
  - **Fix:** Decode the selected candidate server-side, derive point count/length/ratio and anchors from the real candidate/provider result, then persist exactly that canonical verdict.

- [ ] **HIGH — FIX-02 has no durable classifier run/checkpoint/resume implementation.**
  - **Evidence:** FIX-02 requires a `classifier_runs` row, cursor, runId, and resumable progress (`REDHAT-FIX-02...md:30-41,65-74,94-107`). No `classifier_runs`, `runId`, or checkpoint field exists in `convex/schema.ts`, `convex/actions/rideWorthinessClassifier.ts`, or `convex/curatedGeometry.ts`. `classifyCatalog` starts cursor at null each invocation and loops in one action (`rideWorthinessClassifier.ts:353-389`).
  - **Impact:** An interrupted catalog run has no durable progress, resumes from the start, and can repeat provider work/cost; it cannot prove complete coverage.
  - **Fix:** Persist run state and cursor, process bounded pages through scheduled continuation, and make completion counters derive from the persisted run.

- [ ] **HIGH — Cost-limit break leaves the currently touched route without a durable terminal/paused state.**
  - **Evidence:** FIX-09 requires a cost-limited route be durably paused and resumed (`REDHAT-FIX-09...md:111-120`). After Lever 1, `runSampleWaterfall` breaks on the pre-L2 cost check (`convex/waterfallOrchestrator.ts:534-575`) before creating a terminal artifact; artifacts are written only on later completed paths (`:780-789`).
  - **Impact:** The exactly-one-terminal-state invariant is false for that route, and a restart cannot distinguish an untouched route from an interrupted/cost-blocked one.
  - **Fix:** Persist one `cost_blocked`/paused artifact and resumable checkpoint before breaking; include it in terminal-state accounting.

- [ ] **HIGH — Freeway “rescue-first attempt” is only an optional audit note, not enforced evidence.**
  - **Evidence:** FIX-11 requires failed attempt recording to prevent evidence-complete classification (`REDHAT-FIX-11...md:54,126-151`). The classifier writes `freeway_rescue_first_pending` or `completed` best-effort (`convex/actions/rideWorthinessClassifier.ts:173-218`) and explicitly catches/ignores recording errors; it still calls the LLM and persists classification (`:220-258`). There is no `evidenceComplete` field or coverage record.
  - **Impact:** A freeway can be classified as complete without a verified geometry attempt or durable coverage evidence.
  - **Fix:** Model a real geometry-attempt artifact/state, make persistence of that artifact a prerequisite for evidence-complete classification, and persist/reconcile per-run coverage totals.

## MEDIUM Confidence Findings

- [ ] **HIGH severity / medium confidence — Couch pass selection is not bound to a single current active manifest.**
  - **Evidence:** FIX-03 says unlock must be for the current active manifest (`REDHAT-FIX-03...md:66-68,132-141`). `couchGateStatus` selects up to ten `pass` rows then sorts only that subset (`convex/couchVerdict.ts:184-200`) and validates the selected row’s own frozen manifest (`:202-253`). No active-manifest pointer exists, and `catalogVersion` is a constant `s4-trust-pipeline-v1` (`:219`).
  - **Impact:** A historical pass can remain eligible after later sample creation or route changes that do not change the hardcoded version.
  - **Fix:** Persist an explicit active manifest/version and query the latest verdict for it with an ordered index; invalidate the active approval on any relevant geometry/catalog change.

- [ ] **MEDIUM — Provider-cost actions are callable by any authenticated identity.**
  - **Evidence:** `runSampleWaterfall` and `runAllWaterfall` use `requireIdentity`, not operator authorization (`convex/waterfallOrchestrator.ts:474-475`; `convex/couchVerdict.ts:467-483`), and both accept caller-selected route IDs/cost limits.
  - **Impact:** A normal signed-in user can initiate external-provider work and incur cost after a valid couch pass exists.
  - **Fix:** Restrict operational batches to an operator/server job, enforce server-owned route selection, batch-size limits, and durable budget/rate controls.

## Verification Results

```text
pnpm exec vitest run convex/__tests__/REDHAT-FIX-02-catalog-enumeration.test.ts \
  convex/__tests__/REDHAT-FIX-02-catalog-pagination.test.ts \
  convex/__tests__/REDHAT-FIX-05-approval-gate.test.ts \
  convex/__tests__/REDHAT-FIX-08-fixture-gating.test.ts \
  convex/__tests__/REDHAT-FIX-09-terminal-cost.test.ts \
  convex/__tests__/REDHAT-FIX-11-freeway-geometry.test.ts \
  convex/__tests__/REDHAT-FIX-P0-test-infra.test.ts

Test Files  7 passed
Tests       27 passed
```

This is **not** a closure signal: the test files are narrow marker/source checks. The 23 REDHAT integration-test paths declared in the remediation task contracts are absent, including all four FIX-01 tests and the required checkpoint/approval/freeway runtime cases.

## Recommendations

1. Re-open the sprint’s completion state and do not unblock Sprint 05 from the current gate artifacts.
2. Remove public fixed-geometry seams and repair REVIEW approval to measure real geometry.
3. Implement persistent, resumable classifier and waterfall state instead of in-action-only loops/breaks.
4. Rebuild the gate around a current operator/founder workflow and immutable real-catalog evidence, then rerun it after all fixes.
5. Add and run every task-declared integration test before producing a new closeout artifact.

## Metadata

- **Confidence framework:** HIGH = direct, current source/spec/evidence contradiction; MEDIUM = direct behavior with active-manifest/operational-policy interpretation.
- **Agent coverage:** Specialist dispatch was attempted but unavailable because local subagent model/provider configuration was not usable. This report distinguishes that limitation rather than presenting a nonexistent panel consensus.
- **Next steps:** Remediate findings, add missing runtime tests, rerun the human gate, then request a new red-hat review.
