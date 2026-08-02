# Red-Hat Review Report

**Report Date:** 2026-07-21T15:38:04Z  
**Target:** Sprint 04 — Trust pipeline  
**Reviewed commit:** `e405e8ad7619f38cb9b0d3dd77574919f5f23d63`  
**Scope:** Trust/couch-gate control plane in `convex/` and `tools/gate/`, with explicit coverage of committed REDHAT-FIX-13/14/15/16.

## Severity Verdict — NEEDS REVISION / NOT CLOSEABLE

The focused authorization, explicit activation, live-geometry drift, and missing-baseline controls are substantially implemented and pass when their integration suites run in isolation. However, the gate still has two closure-breaking authority bugs: a later recorded `fail` does not revoke an earlier `pass`, and the goal-state writer accepts a caller-selected subset of steps rather than the canonical eight-step gate. The real Founder-Operator gate also remains correctly blocked.

## AC Verdict Table (focused scope)

| Area | Verdict | Evidence |
|---|---|---|
| FIX-13 provider-cost authorization | PASS with coverage gap | All four public paid entry points call `requireOperatorAction`: `convex/waterfallOrchestrator.ts:806-818`, `convex/couchVerdict.ts:574-597`, `convex/actions/rideWorthinessClassifier.ts:309-318,527-535`; public classifiers omit `failRouteIds`, while test-only variants require a test subject (`:327-335,544-553`). Isolated suite: 7/7 passed. |
| FIX-14 operator-owned activation | PASS | Freeze requires `requireOperator` (`convex/couchSampleAssembler.ts:603-629`) and activation requires it (`convex/couchVerdict.ts:317-351`); status resolves the latest explicit activation (`:192-211`), not latest freeze. Isolated suite: 5/5 passed. |
| FIX-15 live geometry drift revokes pass | PASS | Freeze persists `routeHashes` (`convex/couchSampleAssembler.ts:707-730`); status recomputes current geometry and blocks mismatch (`convex/couchVerdict.ts:253-272`). Isolated suite: 4/4 passed. |
| FIX-16 missing/incomplete route-hash baseline | PARTIAL | Missing/empty/duplicate `routeHashes` fail closed (`convex/couchVerdict.ts:227-251`) and re-freeze does not auto-activate (`convex/couchSampleAssembler.ts:761-850`). But the baseline predicate does not reject duplicate sampled routes, and re-freeze does not revalidate source route quality; see MEDIUM-2. Isolated suite: 4/4 passed. |
| Gate closeout / S4-T7 | BLOCKED (correct current state) | `sprint-goal-state.json` says `met:false`, `gate.overall:"BLOCKED"`, and `human_test.verdict:"pending"`; `gate-results.json` reports steps 3/4/5/7 unexecuted human work. This is not a completed human gate. |

## CRITICAL Findings

- [ ] **CRITICAL-1 — A later `fail` verdict does not revoke an earlier `pass`.**  
  `recordCouchVerdict` is append-only and permits an overall `fail` (`convex/couchVerdict.ts:52-149`), but `couchGateStatus` filters the complete history to *only* PASS rows before selecting the newest (`convex/couchVerdict.ts:274-287`). Thus `pass@t1` followed by `fail@t2` still unlocks from `pass@t1`. This contradicts the status comment/`getCouchVerdict` contract that the latest verdict is authoritative and defeats a founder's later red decision.  
  **Fix:** select the latest verdict for the active manifest binding first, then allow only if that row is `pass`; add an integration test `pass → fail → couchGateStatus.allowed === false` and `runAllWaterfall → COUCH_GATE_BLOCKED`.

- [ ] **CRITICAL-2 — `deriveGoalState` has no canonical gate-step completeness check.**  
  The CLI reads arbitrary caller-selected `file.steps` (`tools/gate/deriveGoalState.ts:380-383,422-427`), passes those supplied steps straight through (`:290-334`), and calls the gate complete when merely `opts.steps.length > 0` and none of those supplied entries is blocked (`:316,333-334`). `verifyEvidenceManifest` accepts arbitrary `evidence_steps` and has no required `1..8` set or binding to `gate-plan.json` (`tools/gate/verifyEvidenceManifest.ts:64-74,150-215`). A fresh HEAD-bound one-step bundle can therefore satisfy the mechanical step predicate while omitting human steps 3/4/5/7. Existing AC-9 only proves that a supplied PASS cannot exceed its chosen manifest; it does not prove all canonical steps are present (`convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts:524-575`).  
  **Fix:** make the gate plan/expected step set a fixed, committed input; reject duplicate, missing, extra, or reordered step IDs; resolve both the step-results and evidence bundle from the canonical HEAD-bound paths rather than CLI choices; add an all-PASS-but-only-step-1 negative test.

## HIGH Findings

- [ ] **HIGH-1 — “Exact manifest binding” is fail-open for absent binding fields, and `couchGateStatus` omits `catalogVersion`.**  
  `couchGateStatus` accepts a PASS when either side lacks `manifestHash`/`catalogVersion` (`convex/couchVerdict.ts:280-286`), rather than requiring equality. It also returns no `catalogVersion` on its allowed path (`:299-306`). Consequently `evaluateFounderAttestation` receives `catalogVersion:null` and treats missing row bindings as acceptable (`tools/gate/resolveFounderVerdict.ts:114-150`). This contradicts the stated “exact sampleId/manifestHash/catalogVersion” durable-attestation contract and lets legacy/unbound PASS records qualify if the sample ID is active.  
  **Fix:** require non-empty active and verdict hashes/version values and strict equality; return catalogVersion from every status shape; add live (not only pure-helper) negatives for missing manifestHash and missing catalogVersion.

- [ ] **HIGH-2 — The canonical `gate-plan.json` still points to the withdrawn forged 2026-07-19 scripts.**  
  Its step 1 literal command targets `.../2026-07-19T22:59:46Z/scripts/step1.sh`, which uses both bare `s4-human-gate` and `lever2FixedGeometry`. The honest current run is instead `2026-07-21T152805Z` and is intentionally BLOCKED. A human following the documented plan reaches a forbidden, stale seam path; the new goal writer does not bind itself to either plan.  
  **Fix:** replace or retire the old plan entries, point every step at the current canonical control surface, and make the writer reject bundles/scripts not referenced by the HEAD-bound plan.

## MEDIUM Findings

- [ ] **MEDIUM-1 — The focused integration files are not safe under normal Vitest file parallelism.**  
  A combined default run of FIX-13/14/15/16 produced 3 failures: FIX-15 lost its activation and FIX-16 observed no active manifest, because suites call global clear/seed/teardown operations on the same Convex deployment (`REDHAT-FIX-15...:70-87`, `REDHAT-FIX-16...:78-94`). The same combined run had **17/20 pass, 3 fail**; all five files pass only when serialized with `--no-file-parallelism`. This makes the gate’s verification nondeterministic in ordinary parallel CI.  
  **Fix:** isolate each suite/deployment/namespace, or configure these integration tests as an explicit serial project; verify the ordinary CI command without a special reviewer-only flag.

- [ ] **MEDIUM-2 — Legacy re-freeze re-establishes a trusted manifest without rechecking the source sample’s core invariants.**  
  `refreezeCouchManifest` checks only size and geometry existence (`convex/couchSampleAssembler.ts:779-812`). It does not reject duplicate source route IDs, missing provenance strata, nonexistent `curated_routes`, or geometry whose verification verdict is not `pass`, all checks performed by `storeCouchSample` (`:632-706`). Additionally, FIX-16’s baseline predicate does not require `sampledRouteIds` itself to be unique or `frozenHashes.length === sampledRouteIds.length` (`convex/couchVerdict.ts:234-242`). A malformed legacy sample can be re-frozen, activated, and newly passed without meeting normal couch-sample admission requirements.  
  **Fix:** reuse a shared invariant validator for freeze and re-freeze, and test duplicate sampled route IDs plus non-passing geometry.

## LOW Findings

- [ ] **LOW-1 — `couchGateStatus` uses unbounded `.collect()` on an append-only verdict table.**  
  `couch_verdicts` is explicitly append-only, but status reads all rows for a sample then sorts in memory (`convex/couchVerdict.ts:274-287`). This violates the project Convex guidance to keep collections bounded and can turn a heavily reviewed sample into a transaction/read-limit availability problem.  
  **Fix:** add an index suitable for newest-by-sample lookup and fetch a bounded/latest row.

## Gate Pre-check

- **Executability:** all eight legacy script paths referenced by `gate-plan.json` exist.
- **Provability:** the plan is not trustworthy: its step 1 path contains the retired deterministic geometry seam and bare closeout identity described above.
- **Completion evidence:** the sprint does **not** claim completion. Current evidence is honestly blocked: `gate-results.json` reports 4/8 steps executed, and `gate-verification.json` recomputes `blocked`. No passing human gate exists to accept.

## Verification Evidence

| Command | Result |
|---|---|
| `npx vitest run ...FIX-13...` (isolated) | PASS, 7/7 |
| `npx vitest run ...FIX-14...` (isolated) | PASS, 5/5 |
| `npx vitest run ...FIX-15...` (isolated) | PASS, 4/4 |
| `npx vitest run ...FIX-16...` (isolated) | PASS, 4/4 |
| `npx vitest run ...REDHATFIX12...` (isolated) | PASS, 13/13 |
| Combined default FIX-13/14/15/16 run | FAIL, 3 failures from shared deployment state |
| `npx tsc --noEmit -p convex/tsconfig.json` | PASS |
| `pnpm exec biome check convex/... tools/gate` | PASS |

## Recommendations

1. Block closeout on CRITICAL-1 and CRITICAL-2; add regression tests that fail on the pre-fix implementations.
2. Make manifest/couch-verdict identity binding strictly non-optional for any active unlock.
3. Rebind the canonical gate plan and writer to the same immutable plan/evidence source.
4. Make integration verification deterministic before using it as gate evidence.
5. Preserve the current honest `BLOCKED` state until the real 25-route Founder-Operator visual review and all three review-queue dispositions are completed.

## Metadata

- **Review mode:** independent source review, targeted live Convex integration verification, gate-artifact audit.
- **Specialist dispatch:** unavailable in this environment (no configured subagent provider); findings are source- and command-backed.
- **Confidence framework:** direct code path + reproduced command result = HIGH; static invariant gap without a production reproduction = MEDIUM.
