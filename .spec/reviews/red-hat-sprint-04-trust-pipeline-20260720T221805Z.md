# Red-Hat Review Report — Sprint 04 Trust Pipeline

**Report date:** 2026-07-20T22:18:05Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Reviewed commit:** `9a1b9596c402f8f1050034288a32c802e8652b3a`  
**Review mode:** Fresh read-only implementation, test, gate-artifact, and git-history review.

## Executive Summary

**Not accepted for closeout.** REDHAT-FIX-13 through FIX-15 materially fix the earlier provider-cost authorization, active-manifest rotation, and fresh-manifest drift problems; their focused Convex-dev tests pass at the reviewed HEAD. They do not prove the Founder-Operator/live-provider gate.

REDHAT-FIX-12 was not implemented as contracted. The current JSON is an honest manually written blocked sentinel, but no machine-derived writer, stale-bundle validator, or FIX-12 integration test exists; the retained forged scripts still contain the removed seam and bare `s4-human-gate` identity. Therefore a future hand edit can again create an internally inconsistent completion claim. Separately, `couchGateStatus` treats a legacy frozen manifest with no persisted `routeHashes` as drift-free, allowing a pre-FIX-15 PASS to unlock `--all` without live revalidation.

**Disposition:** `needs-revision`. Sprint 05 remains blocked.

## Completion Audit / Evidence Checklist

| Requirement | Current evidence | Result |
|---|---|---|
| Review post-remediation HEAD | `git rev-parse HEAD` returned `9a1b9596…`; commits `74b9c8c0`, `21bea33c`, `6975faae`, and `9a1b9596` inspected | PASS |
| Recheck all prior CRITICAL/HIGH findings | Per-finding table below, with current source and runtime evidence | PASS |
| Inspect FIX-12..15 actual implementation and tests | Source, schemas, task contracts, tracked evidence, and focused tests inspected | PASS |
| Do not accept sentinel/self-report/tests/evidence bundle as founder/live-provider proof | Gate held BLOCKED; no pass inference was made from any of those proxies | PASS |
| Founder visual review over real ~25-route rendered sample | `gate-results.json:43-80` records steps 3–5 and 7 as blocked; no founder record or real sample exists | FAIL / external-human blocker |
| Fresh live-provider gate at reviewed HEAD | One earlier real-provider route receipt exists, but no post-`9a1b9596` founder/live-provider gate execution | FAIL |
| Fresh severity report at requested path | This file | PASS |

### Commands actually run

- `npx vitest run convex/__tests__/REDHAT-FIX-13-provider-auth.integration.test.ts convex/__tests__/REDHAT-FIX-14-active-manifest.integration.test.ts convex/__tests__/REDHAT-FIX-15-drift-revalidation.integration.test.ts` → **3 files / 16 tests passed** against the configured Convex dev deployment.
- `npx tsc --noEmit -p convex/tsconfig.json` → **exit 0** (only npm’s `node-linker` configuration warning).
- Existence checks for `tools/gate/deriveGoalState.ts` and `convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts` → **both absent**.

The passing tests are evidence for the three specific code paths. They are not evidence of a founder visual review, a real 25-route catalog, a valid post-HEAD provider run, or an independently derived human-gate result.

## Human Testing Gate Pre-check

| Gate condition | Result | Evidence |
|---|---|---|
| Current gate claims a pass | PASS (it does **not** claim pass) | `gate-results.json:7-14` has `verdict: "blocked"`; `sprint-goal-state.json:4,12` has `met:false`, `overall:"BLOCKED"`. |
| Founder/live-provider gate completed | FAIL | Steps 3–5 and 7 are blocked in `gate-results.json:43-80`; SPRINT requires a real ~25-route rendered review and three real REVIEW dispositions (`SPRINT.md:70-95`). |
| One real provider call exists | LIMITED | `.gate-evidence/.../step1-real-provider-waterfall.json` reports one route, $0.07, ending `queued`; it is not the required sample/founder flow. |
| Gate proof is machine-derived and anti-forgery | FAIL | No `tools/gate/deriveGoalState.ts`, no FIX-12 integration test, and no rebuilt step 3/4/5 scripts are tracked. |
| Old forged bundle cannot be mistaken for valid | FAIL as a durable control | The old bundle remains tracked and retains bare `s4-human-gate` plus `lever2FixedGeometry` in step 1, 2, and 7 (`.gate-evidence/2026-07-19T22:59:46Z/scripts/step1.sh:4-6`, `step2.sh:4-5`, `step7.sh:4-10`). |

The active state is correctly blocked today, but that is a manual data assertion, not the FIX-12 required fail-closed derivation. In particular, its string field still says `"GATE-GOAL: ACHIEVED"` while `met:false` and `gate.overall:"BLOCKED"` (`sprint-goal-state.json:3-13`), exactly the contradictory representation the specified writer was meant to eliminate.

## Findings

### CRITICAL

- [ ] **CRITICAL — REDHAT-FIX-12’s anti-forgery gate harness is absent; the blocked sentinel is hand-authored and can again be made internally inconsistent.**
  - **Evidence:** FIX-12 requires `tools/gate/deriveGoalState.ts` as the only writer plus `convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts` (`REDHAT-FIX-12...md:30-47,160-168`). Neither path exists at HEAD. Commit `74b9c8c0` changes only `sprint-goal-state.json`; `git show --name-only 74b9c8c0` confirms that scope. The state file itself combines `goal:"GATE-GOAL: ACHIEVED"` with `met:false` / `overall:"BLOCKED"` (`sprint-goal-state.json:3-13`) and has no generator provenance.
  - **Impact:** The stale forged bundle has been honestly withdrawn, but the system has no enforceable mechanism preventing a subsequent manual `met:true`/PASS state or requiring commit, seam, operator, and human-review validation. The core founder/live-provider unlock remains non-authoritative.
  - **Required remediation:** Implement the FIX-12 writer and behavioral tests. It must derive all completion fields from current step evidence; reject HEAD mismatch, removed seam arguments, and bare/non-operator closeout identity; write `GATE-GOAL: BLOCKED` and nonzero exit for any blocked/failed step; preserve human review as unresolved absent an authentic S4-T7 verdict. Rebuild and test steps 3/4/5/7 under a seeded operator, with a bare-identity negative control.

### HIGH

- [ ] **HIGH — Legacy frozen manifests without `routeHashes` bypass the new drift check.**
  - **Evidence:** `routeHashes` is optional for migration compatibility (`convex/schema.ts:373-383`). `couchGateStatus` substitutes an empty array when it is missing (`convex/couchVerdict.ts:227-247`), so it performs zero current-geometry comparisons and can proceed to accept a bound pass (`:249-281`). Pre-FIX-15 frozen manifests necessarily lack this new field.
  - **Impact:** An already-active historical manifest with an earlier bound PASS can unlock `runAllWaterfall` without the promised live geometry revalidation. The focused FIX-15 test covers only a newly frozen test-fixture manifest that has hashes (`REDHAT-FIX-15-drift-revalidation.integration.test.ts:115-126`), not the migration/legacy fail-closed case.
  - **Required remediation:** When the active frozen manifest has no complete hash baseline (including missing/duplicate route IDs), return `allowed:false` with a re-freeze/re-review requirement. Add a behavioral test that seeds or migrates a legacy frozen PASS and proves `--all` is blocked until a new freeze/activation/verdict sequence exists.

### MEDIUM

- [ ] **MEDIUM — The gate’s claimed catalog-drift protection only fingerprints `curated_route_geometry`, not current route catalog state.**
  - **Evidence:** `computeRouteGeometryHash` only uses the geometry value, verification verdict, and provenance (`convex/couchSampleAssembler.ts:151-158`); `couchGateStatus` only recomputes that geometry hash (`convex/couchVerdict.ts:231-238`). It does not check the current sampled route’s `geometryStatus`, retirement/quarantine state, or other catalog eligibility.
  - **Impact:** A sampled route may remain PASS-eligible after a non-geometry catalog change that should invalidate its review, despite the code/comments and FIX-15 contract describing catalog/geometry drift.
  - **Required remediation:** Either narrow the documented guarantee to geometry-only drift or include the catalog eligibility fields in the frozen/live fingerprint and add an integration test for a route-state mutation.

### LOW

- [ ] **LOW — Operator authorization test coverage proves the negative guards but does not exercise all four provider operations past authorization.**
  - **Evidence:** FIX-13 AC-7 invokes only `runSampleWaterfall` with an empty route list (`REDHAT-FIX-13-provider-auth.integration.test.ts:123-142`). The test does not establish that a valid operator reaches each of `runAllWaterfall`, `classifyRoute`, and `classifyCatalog`, as the FIX-13 task’s AC-3 specifies.
  - **Impact:** The source guards are correctly present (`waterfallOrchestrator.ts:806-818`, `couchVerdict.ts:549-559`, `rideWorthinessClassifier.ts:309-319,527-536`), and this is not evidence of a current authorization bypass; it is an incomplete positive-path regression net.
  - **Required remediation:** Add bounded valid-operator calls for the remaining three operations, asserting they are not forbidden and do not cause unwanted provider work.

## Recheck of Prior CRITICAL / HIGH Findings

| Prior finding | Status at `9a1b9596` | Current evidence |
|---|---|---|
| Stale/forged human gate was used as completion proof | **PARTIALLY FIXED; still CRITICAL** | The active data is now truthfully blocked (`gate-results.json:7-14`), but FIX-12’s required generator/validator/test are missing and stale scripts are retained unvalidated. See Critical finding. |
| Any authenticated user could invoke paid provider operations / manufacture classifier failures | **FIXED (focused runtime-tested)** | `requireOperatorAction` is invoked before production waterfall/classifier work (`waterfallOrchestrator.ts:813-818`, `couchVerdict.ts:554-559`, `rideWorthinessClassifier.ts:313-319,533-536`); `failRouteIds` is excluded from production validators and exposed only by test-subject entries (`:327-336,544-554`). FIX-13’s 7 tests passed. |
| Any authenticated user could rotate latest frozen couch manifest and DoS unlock | **FIXED (focused runtime-tested)** | Freeze/assemble require operator (`couchSampleAssembler.ts:616-621,743-784`); activation is operator-only (`couchVerdict.ts:292-326`); gate reads latest explicit activation, not latest freeze (`:192-225`). FIX-14’s 5 tests passed. |
| Couch PASS survived a sampled geometry change | **FIXED for new hashed manifests; HIGH residual for legacy manifests** | Fresh freeze persists hashes (`couchSampleAssembler.ts:701-735`); current hash mismatch blocks (`couchVerdict.ts:227-247`); FIX-15’s 4 tests passed. Optional/missing hashes bypass the loop, as reported above. |
| Forgeable couch pass / arbitrary sample and verdict membership | **FIXED (not re-opened)** | Exact membership, duplicate checks, frozen manifest binding, and operator recording remain in `couchVerdict.ts:51-150`. No contrary path found. |
| REVIEW approval could create rider-ready without canonical remeasurement | **FIXED (not re-opened)** | Canonical approval gate remains in `convex/reviewQueue.ts:323-443`; no contrary path found in reviewed diff. |
| Public fixed-geometry Lever-2 bypass | **FIXED (not re-opened)** | Production waterfall validator excludes seam (`waterfallOrchestrator.ts:806-818`); seam action is test-subject gated (`:827-841`). The old gate scripts still document the forbidden input, which FIX-12 must actively reject. |

## Test-Quality Notes

- The 16 focused tests are meaningful live Convex-dev checks for the code-level guards, explicit activation behavior, and new-manifest geometry drift.
- They use seeded fixture data and generated/recorded verdicts. They cannot establish the S4-T7 founder judgment, actual map inspection, a real 25-route sample, real provider evidence at `9a1b9596`, or three real review dispositions.
- The prior receipt shows a real provider route attempt but only one route and a `queued` terminal state. It does not satisfy steps 3–7 of the sprint gate.

## Recommendations

1. Implement and independently test REDHAT-FIX-12 before treating any sentinel as authoritative.
2. Fail closed for legacy/missing couch hash baselines, then add an explicit migration/re-freeze procedure.
3. Decide whether catalog-state changes must invalidate a couch review; implement the matching fingerprint and test if so.
4. Load and recover a real stratified ~25-route catalog, then have a Founder-Operator inspect the rendered maps, record route-level and overall evidence, and disposition three real REVIEW records.
5. Re-run the full human testing gate and a new red-hat review only after that evidence exists.

## Metadata

- **Severity result:** 1 CRITICAL, 1 HIGH, 1 MEDIUM, 1 LOW.
- **Confidence:** High for CRITICAL/HIGH because both are direct source/spec contradictions; Medium for catalog-drift scope because the implementation may intentionally be geometry-only despite broader wording.
- **Specialist note:** configured specialist dispatch was attempted but unavailable because its runtime model `local-router/implementer` was not installed; this report does not claim panel consensus.
