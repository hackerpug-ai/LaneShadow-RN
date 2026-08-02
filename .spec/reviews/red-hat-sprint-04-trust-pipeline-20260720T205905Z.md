# Red-Hat Review Report — Sprint 04 Trust Pipeline

**Report date:** 2026-07-20T20:59:05Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Reviewed commit:** `eddcbe50d58e91bf443f17bf57c277e3c8b8ac46`  
**Mode:** Fresh, read-only source/spec/evidence review after REDHAT remediation. No source, task, or gate artifact was modified.

## Executive Summary

**Not accepted for closeout.** The implementation fixes most of the earlier code-level Critical/High findings, including the public fixed-geometry bypass, operator checks on couch/review mutations, canonical remeasurement on approval, durable classifier checkpoints, durable cost-blocking, and the in-region anchor gate.

However, the sprint still claims `GATE-GOAL: ACHIEVED` using a pre-remediation synthetic gate bundle that no longer invokes the public API correctly and does not evidence a founder review or live-provider run. Two additional trust-boundary gaps remain: any authenticated user can invoke provider-costing operations, and any authenticated user can rotate the active frozen couch manifest, invalidating a prior approval without operator authorization. A couch pass is also not revalidated against live route/geometry state after that frozen snapshot is created.

## Completion Audit / Evidence Checklist

| Required deliverable | Evidence | Result |
|---|---|---|
| Review post-remediation HEAD through `eddcbe50` | `git rev-parse HEAD` = `eddcbe50d58e91bf443f17bf57c277e3c8b8ac46`; no tracked Convex source differs from that commit (only generated `convex/_generated/api.d.ts` is dirty) | PASS |
| Inspect target sprint and all task contracts | `SPRINT.md`, S4-T1 through S4-T7 (41 AC headings total), REDHAT-FIX-01 through `-11` | PASS |
| Re-check every prior Critical/High finding | Recheck table below, with current source/evidence | PASS |
| Validate actual behavior, not only static evidence | `pnpm exec vitest run convex/__tests__/S4T*.integration.test.ts`: **37 files, 240 tests passed**, including real-provider S4-T4 classifier cases | PASS, scoped |
| Run remediation regression tests | `pnpm exec vitest run convex/__tests__/REDHAT-FIX-*.test.ts convex/__tests__/REDHAT-FIX-*.integration.test.ts`: **10 files, 47 tests passed** | PASS, limited by test quality noted below |
| Validate current human-testing gate evidence | `gate-results.json`, `gate-verification.json`, `sprint-goal-state.json`, and all eight retained scripts | **FAIL** — evidence predates remediation and scripts target removed/now-authorized surfaces |
| Write fresh severity report | This report | PASS |

The integration run is meaningful runtime evidence for the S4 implementation, but does **not** substitute for the required founder visual review, a fresh `--sample` live-provider run, or a current independently verified gate bundle.

## Human-Testing Gate Pre-check

| Check | Result | Evidence |
|---|---|---|
| Gate claims completion | FAIL | `sprint-goal-state.json` has `met: true` / `GATE-GOAL: ACHIEVED`, but its `written_at_commit` is `4240ea01`, before every REDHAT remediation commit. |
| Evidence freshness | FAIL | `gate-results.json` (2026-07-19 17:01:41), `gate-verification.json` (2026-07-19 17:02:07), and goal state (2026-07-19 17:02:46) predate `eddcbe50` (2026-07-20T14:47:48-06:00). |
| Scripts runnable as documented against current code | FAIL | `step1.sh:6` and `step2.sh:5` pass removed public `lever2FixedGeometry` to `runSampleWaterfall`; `step7.sh:10` does the same to `retryDisposition`. Current public validators at `convex/waterfallOrchestrator.ts:801-811` and `convex/reviewQueue.ts:644-653` reject those extra fields. |
| Scripts meet current authorization | FAIL | Scripts use `s4-human-gate` (`step1.sh:4`, `step3.sh:4`, `step4.sh:6`, `step7.sh:4`) without establishing the now-required operator role. `recordCouchVerdict` requires an operator at `convex/couchVerdict.ts:57-58`; REVIEW dispositions require one at `convex/reviewQueue.ts:325-326`. |
| Founder visual review / real-provider evidence | FAIL | The retained scripts seed/test identities and mechanically submit verdicts. There is no post-remediation founder identity/role proof, rendered immutable export, route-by-route review record/notes, or live-provider receipt bundle. |

**Deterministic gate finding:** the claimed 8/8 PASS cannot attest `eddcbe50` and must not unlock Sprint 05.

## High-Confidence Findings

- [ ] **CRITICAL — Sprint completion rests on stale, non-runnable, synthetic gate evidence.**
  - **Evidence:** Retained gate artifacts are from July 19; all remediation commits including `eddcbe50` are July 20. The retained scripts pass `lever2FixedGeometry` to public actions that no longer accept it (`.gate-evidence/.../step1.sh:6`, `step2.sh:5`, `step7.sh:10`; `convex/waterfallOrchestrator.ts:801-811`; `convex/reviewQueue.ts:644-653`). The script identity is not proven to be a current founder/operator.
  - **Impact:** The active goal state falsely claims human-gate completion; it proves neither the remediated source nor the required human/live-provider workflow.
  - **Fix:** Replace the full gate bundle after all fixes: use a real operator/founder session, real recovered routes and provider receipts, no test seams, an immutable rendered manifest/export, route-level verdicts/notes, and independently recomputed gate evidence.

- [ ] **HIGH — Provider-costing classifier and waterfall operations are still public to every authenticated user.**
  - **Evidence:** `runSampleWaterfall` invokes live recovery after only `requireIdentity` (`convex/waterfallOrchestrator.ts:801-811`); `runAllWaterfall` does likewise (`convex/couchVerdict.ts:448-456`); `classifyRoute` and whole-catalog `classifyCatalog` both use only `requireIdentity` (`convex/actions/rideWorthinessClassifier.ts:309-316`, `354-365`). These accept caller-selected route IDs and, for the waterfall, caller-supplied cost limit.
  - **Impact:** Any signed-in rider can trigger paid Google/LLM work, consume budget, or induce catalog-wide classification work. The `failRouteIds` simulation argument is also still public on classifier entries, permitting a caller to manufacture failed/no-evidence processing outcomes.
  - **Fix:** Make production batch/classifier operations internal or require `requireOperator`; move simulation controls to test-only entries gated by `assertTestSubjectOrThrow`; apply server-owned batch, budget, and rate limits.

- [ ] **HIGH — An ordinary authenticated user can rotate the active frozen couch manifest and invalidate a valid unlock.**
  - **Evidence:** `storeCouchSample` uses `requireIdentity`, not an operator/founder guard (`convex/couchSampleAssembler.ts:548-551`), then freezes the supplied valid-route manifest (`:580-676`). `couchGateStatus` treats the latest frozen sample as the sole active manifest (`convex/couchVerdict.ts:184-210`).
  - **Impact:** A normal user cannot forge a PASS because `recordCouchVerdict` requires an operator, but can create a later frozen manifest and make the previously approved manifest ineligible: a trust-gate denial-of-service and unauthorized control-plane change.
  - **Fix:** Require founder/operator authorization for assemble/store/freeze (or make freeze internal after a server-owned job); persist an explicit active-manifest transition with audit actor/reason rather than deriving it from latest creation time.

- [ ] **HIGH — A current couch PASS is a snapshot-only assertion; live catalog/geometry drift does not revoke it.**
  - **Evidence:** The manifest’s `catalogVersion` is the constant `'s4-trust-pipeline-v1'` (`convex/couchSampleAssembler.ts:596`), while `couchGateStatus` compares a verdict only to the frozen manifest’s stored hash/version (`convex/couchVerdict.ts:203-220`). It never rechecks the frozen routes’ current geometry hashes or records a changing catalog version.
  - **Impact:** A PASS can remain an unlock after a sampled route’s geometry/catalog state changes, contrary to the stated current-manifest/current-catalog gate contract.
  - **Fix:** Maintain a server-owned catalog/geometry revision (or recompute the frozen sample’s route hashes during gate status), invalidate active approval on drift, and test a post-approval geometry mutation that must block `--all`.

## Recheck of Prior Critical / High Findings

| Prior finding | Post-`eddcbe50` status | Current evidence |
|---|---|---|
| Forgeable couch PASS / arbitrary sample and verdict membership | **FIXED (runtime-tested)** | `recordCouchVerdict` requires operator, frozen manifest, exact set equality, no duplicates, and append-only records (`convex/couchVerdict.ts:51-154`). S4-T6 FIX-03/04 integration tests passed. Residual active-manifest control/drift issues are reported above. |
| REVIEW approval forged pass/rider-ready without re-evaluation | **FIXED (runtime-tested)** | `approveDisposition` requires operator, decodes/measures candidate, applies canonical gate, and returns queued/riderReady false on failure (`convex/reviewQueue.ts:323-443`). REDHAT FIX-05 tests passed. |
| Trust-changing REVIEW/couch operations lack role authorization | **PARTIALLY FIXED** | Operator resolution is server-owned (`convex/guards.ts:103-155`); couch verdict and REVIEW mutations use it. Public provider operations remain identity-only (new/persisting HIGH above). |
| Public fixture/cleanup seams manufacture or erase evidence | **FIXED for named seams (source + regression tested)** | Named fixture mutations use `requireOperator`; public couch clearing is founder-only (`convex/couchVerdict.ts:255-275`). REDHAT FIX-08 tests passed. |
| Human gate is test theatre rather than founder/live-provider review | **STILL FAILS — CRITICAL** | No fresh evidence exists; retained scripts use test data and now-invalid seam calls. See gate pre-check. |
| `classifyCatalog` is a silent no-op/no whole-catalog coverage | **FIXED in source; pagination/resume runtime behavior only partially tested** | No-ID path creates/resumes `classifier_runs`, paginates with cursor, checkpoints every page, and completes stored run state (`convex/actions/rideWorthinessClassifier.ts:354-465`; `convex/schema.ts:333-347`). The existing REDHAT pagination tests are source-inspection tests; the S4-T4 real-provider integration run verifies classification but not interruption/resume over multiple pages. |
| Canonical new-geometry gate omits in-region anchors | **FIXED (runtime-tested)** | Gate uses `inRegionAnchorCount` (`convex/curatedGeometryGate.ts:98-127`); reconstruction/review call sites compute and pass it. S4-T1 anchor-region integration suite passed. |
| Waterfall terminal state / failed LLM cost accounting unsafe | **FIXED in source; terminal/cost behavior runtime-tested at S4 scope** | Cost limit writes durable `cost_blocked` (`convex/waterfallOrchestrator.ts:568-593`); L2 catch charges cost (`:669-676`); L3 exception records only retirement state (`:744-765`). S4-T5 circuit-breaker/resume tests passed. |
| Couch sample was caller-controlled/mutable/noncanonical | **FIXED for membership/geometry immutability; authorization residual remains** | Routes are verified against canonical route+passing geometry, hashed, and frozen (`convex/couchSampleAssembler.ts:548-676`). S4-T6 immutable-manifest integration passed. Any-authenticated freeze remains HIGH above. |
| Freeway rescue-first contract unproven | **FIXED as evidence-complete semantics; limited runtime proof** | Freeway without a geometry attempt is persisted with `evidenceComplete:false`; an attempted route can be complete (`convex/actions/rideWorthinessClassifier.ts:184-249`; `convex/curatedGeometry.ts:589-608`). S4-T4 freeway integration passed. The REDHAT test for the exact prerequisite is unit/source-level, not an interrupted-live-run proof. |
| Public fixed-geometry Lever-2 bypass | **FIXED (runtime-tested)** | Production validators omit seam args; dedicated seam actions require test subject (`convex/waterfallOrchestrator.ts:798-850`; `convex/reviewQueue.ts:641-676`). The 11-case production-identity regression test passed against Convex dev. |

## Task / AC Verdict Summary

| Task | Verdict | Basis |
|---|---|---|
| S4-T1 deterministic gate + repair | PASS | 94 S4-T1 integration assertions passed, including ratio, anchor region, degenerate, quarantine, sweep, repair. |
| S4-T2 Lever 1 / Lever 3 | PASS | 35 S4-T2 integration assertions passed. |
| S4-T3 Lever 2 | PASS | 27 S4-T3 integration assertions passed. |
| S4-T4 classifier | PARTIAL | S4-T4 integrations passed, and checkpoint source is present; public cost/control boundary and no multi-page interruption/resume runtime proof remain. |
| S4-T5 waterfall / REVIEW | PARTIAL | Integration suites passed and previous terminal/cost/approval findings are fixed; public provider-cost authorization remains. |
| S4-T6 couch sample / batch gate | PARTIAL | Manifest/verdict integrity tests passed; any-user freeze and no live-drift invalidation remain. |
| S4-T7 founder couch review | FAIL | Required fresh Founder-Operator review evidence against post-remediation code is absent; retained scripts are invalid for current contract. |

## Test Quality Notes

- The full S4 integration run is positive evidence: **240 assertions across 37 suites passed**, including calls to the configured Convex dev deployment and S4-T4 real z.ai classification.
- The REDHAT run is positive but not uniformly behavioral: FIX-02 pagination, FIX-08 fixture gate, FIX-09 terminal/cost, and FIX-11 freeway tests inspect source text rather than execute those failure modes. They cannot independently prove the production behavior they describe.
- No test output or artifact establishes a post-remediation human visual review, immutable map export review, or live-provider closeout. This is why the stale human-gate finding remains blocking despite green automated suites.

## Recommendations

1. Mark the current sprint gate state unverified; do not permit Sprint 05 unlock from its July 19 evidence.
2. Restrict all paid/provider-mutating classifier and waterfall actions to operators/internal jobs and move test controls to test-only endpoints.
3. Make couch manifest freeze/activation operator-authorized and invalidate approval on current geometry/catalog drift.
4. Add behavioral integration tests for multipage interrupted classifier resume, terminal/cost failure paths, current-manifest drift invalidation, and non-operator provider-operation rejection.
5. Run and independently verify a new eight-step Founder-Operator gate against `eddcbe50` or later; then request another red-hat review.

## Metadata

- **Severity/confidence:** Findings above are direct current source/evidence contradictions and are **HIGH confidence**. The gate finding is **CRITICAL** because it invalidates the claimed sprint completion/unlock.
- **Specialist-panel note:** Convex, security, and code-reviewer subagent dispatch was attempted, but their configured runtime model (`local-router/implementer`) was unavailable. This report therefore does not claim nonexistent multi-agent consensus.
- **Disposition:** `needs-revision`.
