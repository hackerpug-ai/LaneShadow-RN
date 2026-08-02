# Red-Hat Review Report — Sprint 04 Trust Pipeline

**Report Date:** 2026-07-20T16:03:38Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Reviewed commit:** `6dfb8a33990aa8dddf93d41fa50564358b72d0df`  
**Reviewed by:** Convex-domain delegate, general code/stub delegate, security delegate  
**Scope:** Read-only adversarial review of S4-T1 through S4-T7, their Convex implementation, and the claimed human-testing gate. No implementation or task files were edited.

## Executive Summary

**Not accepted.** All three independent reviewers found that the claimed couch-gate PASS can be manufactured by any authenticated user and is neither bound to a real immutable reviewed sample nor to a founder/operator role. The current gate scripts are runnable and their logged regex oracles resolve, but they seed fixtures, inject fixed geometry, and mechanically submit all-`true` verdicts; therefore they do **not** prove the required founder visual review or a live-provider recovery run.

Additional blocking implementation gaps remain: the canonical geometry gate omits the required in-region anchor test for new geometry, `classifyCatalog` silently performs zero work without caller-provided IDs, and REVIEW approval writes a synthetic gate pass and sets `riderReady` without re-running the canonical gate.

## Gate Pre-check

| Check | Result | Evidence |
|---|---|---|
| Documented step entry points resolve | PASS | All eight referenced `.gate-evidence/2026-07-19T22:59:46Z/scripts/step*.sh` files exist. |
| Recorded evidence is non-empty and verifier recorded pass | PASS, narrow | `gate-results.json` records 8/8 executed/pass; all eight logs are non-empty; `gate-verification.json` says `verified: true`. |
| Gate actually proves its human/live-provider claims | **FAIL** | `scripts/step1.sh:4-11` uses synthetic identity plus `lever2FixedGeometry`; `scripts/step4.sh:6-20` programmatically records 25 `true` verdicts; `scripts/step8.sh:12-27` clears then recreates the pass. |
| S4-T7 founder-review requirement | **FAIL / unattested** | The gate has no UI driver, founder identity/role proof, map-inspection record, per-route notes, or immutable reviewed export manifest. |

The deterministic gate artifact proves only that the current scripts exercised their test seams. It cannot be treated as the required human-test evidence and must not unlock Sprint 05.

## HIGH Confidence Findings (3 reviewers agree)

- [ ] **CRITICAL — Couch PASS is forgeable and can unlock `--all`.** `recordCouchVerdict` accepts an arbitrary nonempty verdict array for any `sampleId`, does not load or validate a stored sample, and replaces prior verdicts (`convex/couchVerdict.ts:51-101`). `couchGateStatus` allows the latest passing record without current-sample, membership, count, export, geometry-version, or reviewer-role binding (`:128-153`).
  - **Agents:** Convex-domain, code/stub, security
  - **Fix:** Require a server-derived immutable manifest/export hash; exact unique membership and all decisions; a canonical founder/operator role; append-only audited verdicts; only unlock from the active approved manifest.

- [ ] **CRITICAL — REVIEW approval forges a passing verification and rider-ready status without canonical re-evaluation.** `approveDisposition` defaults or copies measurements, stamps `verdict: 'pass'`, `provenance: 'scraped_promoted'`, and directly sets `riderReady: true`; it never decodes, measures, or calls the canonical gate (`convex/reviewQueue.ts:235-315`).
  - **Agents:** Convex-domain, code/stub, security
  - **Fix:** Canonically re-measure and gate the exact candidate server-side, keep failing candidates in REVIEW, recompute rider-ready, and preserve actual provenance. If manual override is permitted, make it founder-only, explicitly override-labelled, and auditable.

- [ ] **HIGH — Trust-changing APIs are authenticated but not founder/operator authorized.** `requireIdentity` is an existence check, returning a subject with no role/ownership decision (`convex/guards.ts:15-28`). REVIEW, couch verdict, fixtures, waterfall, and classifier entry points rely on it (for example `convex/reviewQueue.ts:236,317`; `convex/couchVerdict.ts:51,157,323`; `convex/waterfallOrchestrator.ts:442`; `convex/actions/rideWorthinessClassifier.ts:238`).
  - **Agents:** Convex-domain, code/stub, security
  - **Fix:** Add server-owned role/capability enforcement based on canonical user/org data and use the stable authenticated identity; restrict operational mutations/actions to operators.

- [ ] **HIGH — Public fixture/cleanup seams can alter production state and manufacture gate evidence.** Authenticated callers can seed review/waterfall/couch fixtures and erase couch verdicts (examples: `convex/reviewQueue.ts:96-224`; `convex/couchSampleAssembler.ts:356-423`; `convex/waterfallOrchestrator.ts:249-372`; `convex/couchVerdict.ts:157-169`).
  - **Agents:** Convex-domain, security (code/stub corroborates via gate scripts)
  - **Fix:** Move fixtures to internal/test-only deployment code or enforce test environment plus operator capability and server-issued run scoping.

- [ ] **HIGH — Current human gate is test theatre, not the specified founder review or real-provider batch.** Step 1 seeds test routes and injects `lever2FixedGeometry`; step 3 creates a fixture couch sample; step 4 submits every sample route as `true`; step 8 clears and restores a pass (`.gate-evidence/2026-07-19T22:59:46Z/scripts/step1.sh:4-11`, `step3.sh:7-37`, `step4.sh:6-20`, `step8.sh:12-27`).
  - **Agents:** Convex-domain, code/stub, security
  - **Fix:** Run a fresh authenticated founder session against recovered catalog routes, retain the reviewed render/export and immutable hashes, record route-by-route decisions/notes, and preserve real provider attempt receipts.

- [ ] **HIGH — `classifyCatalog` is a silent no-op without caller IDs; no whole-catalog coverage exists.** It computes `routeIds ?? []` and returns `{ classified: 0, failed: 0 }` when omitted (`convex/actions/rideWorthinessClassifier.ts:255-281`), rather than enumerating, checkpointing, or evidencing catalog completion.
  - **Agents:** Convex-domain, code/stub, security
  - **Fix:** Add bounded indexed pagination, durable checkpoint/completion data, coverage totals, and server-controlled full-catalog dispatch.

- [ ] **HIGH — The canonical new-geometry gate does not enforce “two anchors within 150mi”.** `determineGateVerdict` checks only `anchorCount` (`convex/curatedGeometryGate.ts:98-127`); the distance filter exists only in `reevaluateExistingGeometry` (`:138-152`). New geometry from the levers can therefore pass with off-region anchors.
  - **Agents:** Convex-domain, code/stub
  - **Fix:** Pass measured anchors or in-region count to the canonical verdict and apply it to every lever and persisted-geometry sweep.

## MEDIUM Confidence Findings (2 reviewers agree)

- [ ] **HIGH — Waterfall terminal states and cost accounting are unsafe.** A Lever 3 exception can create `retirement_eligible` while separately queueing REVIEW; failed/retried LLM calls are not necessarily charged before completion (`convex/waterfallOrchestrator.ts:586-607,695-718,759-785`).
  - **Agents:** Convex-domain, code/stub
  - **Fix:** Persist exactly one durable route terminal state, reserve/reconcile each billable attempt, and represent circuit-breaker pauses explicitly for resumption.

- [ ] **HIGH — Couch sample contents are caller-controlled and mutable.** `storeCouchSample` validates only size/provenance presence, not route existence, uniqueness, gate pass, metadata consistency, or immutable export (`convex/couchSampleAssembler.ts:523-580`; `convex/schema.ts:326-348`).
  - **Agents:** Convex-domain, security
  - **Fix:** Assemble solely from canonical records, validate exact unique membership and allocation, bind geometry/export hashes, then freeze the manifest.

- [ ] **HIGH — S4-T4’s freeway/rescue-first contract is unproven.** The classifier describes geometry as independent and only classifies/persists (`convex/actions/rideWorthinessClassifier.ts:249-279`); it neither initiates nor verifies the required geometry attempt for a freeway row.
  - **Agents:** Convex-domain, code/stub
  - **Fix:** Explicitly enqueue or verify the independent geometry attempt and persist an auditable attempt artifact.

## LOW Confidence Findings (one reviewer)

- [ ] **MEDIUM — Public waterfall/classifier actions permit provider-cost abuse.** Authenticated callers may choose arbitrary route IDs and requested cost with no apparent per-caller quota or server maximum (`convex/waterfallOrchestrator.ts:442-466`; `convex/actions/rideWorthinessClassifier.ts:238-281`).
  - **Agent:** Security
  - **Fix:** Operator-only durable jobs, bounded batch sizes, server-owned cost/retry limits, and budget/rate controls.

- [ ] **MEDIUM — Circuit-breaker can leave partially touched routes without a durable terminal state.** Lever 1 runs before the later L2 cost check (`convex/waterfallOrchestrator.ts:518-526,580-605`).
  - **Agent:** Convex-domain
  - **Fix:** Check/reserve cost before starting a route likely to need L2, or persist `cost_blocked`/paused state and checkpoint it.

## AC Verdict Summary

| Task | Verdict | Blocking reason |
|---|---|---|
| S4-T1 | PARTIAL | AC-2 fails: canonical new-geometry gate does not measure in-region anchors. |
| S4-T2 | PARTIAL | Lever 1/3 rely on the region-incomplete canonical gate. |
| S4-T3 | PARTIAL | Lever 2 ultimately relies on the same canonical gate gap. |
| S4-T4 | FAIL | All-catalog enumeration/checkpoint/coverage absent; rescue-first freeway evidence absent. |
| S4-T5 | PARTIAL/FAIL | REVIEW approval bypasses gate; terminal-state and provider-cost semantics are unsafe. |
| S4-T6 | FAIL | Verdict and unlock are not bound to authentic immutable sample/reviewer evidence. |
| S4-T7 | FAIL | No founder visual review of an authentic sample is attested. |

## Agent Contradictions & Debates

| Topic | Assessment |
|---|---|
| Existing gate scripts and verifier say PASS | The scripts, logs, and regex verifier are real and non-empty, but their scope is insufficient: they validate synthetic test seams, not the S4-T7 founder/live-provider claims. No contradiction with the reported gate PASS; it is a claim-to-oracle mismatch. |
| Authentication is present | All reviewers confirmed an auth config and `requireIdentity` guard. This does not satisfy the operator-authorization requirement because no server-side role/ownership check exists. |
| Normal levers call a shared gate | True, but the shared gate itself lacks the in-region measurement for new geometry, so call-site sharing does not satisfy the full requirement. |

## Recommendations by Category

1. **Block unlock immediately:** Treat the current couch PASS as invalid for Sprint 05; disable or role-gate `--all`, verdict clearing, fixture seams, and manual approvals until remediation.
2. **Restore trust integrity:** Implement server-derived immutable couch manifests, exact membership/version/hash validation, authenticated founder/operator authorization, and append-only audit records.
3. **Repair canonical data correctness:** Put the 150mi-anchor check in the common new-geometry gate and re-evaluate all affected existing/recovered geometry.
4. **Make batch claims observable:** Implement paginated checkpointed catalog classification, explicit geometry-attempt tracking, one terminal state per route, and durable cost/retry accounting.
5. **Re-run human verification:** Execute an actual founder visual review against an immutable export of recovered catalog routes using live provider receipts; retain route-level decisions and notes as gate evidence.

## Review Completion Audit

| Required deliverable | Evidence | Result |
|---|---|---|
| Fresh severity report for the specified sprint directory | This file, generated 2026-07-20T16:03:38Z | PASS |
| All named task specs considered | S4-T1 through S4-T7 AC headings enumerated; task-level verdict table above | PASS |
| Human Testing Gate considered | `SPRINT.md`, `gate-plan.json`, `gate-results.json`, `gate-verification.json`, scripts and logs inspected | PASS |
| Actual implementation, not proxy gate status alone, considered | `couchVerdict.ts`, `reviewQueue.ts`, `curatedGeometryGate.ts`, classifier, waterfall, sampler, guards inspected by three independent reviewers and spot-checked during consolidation | PASS |
| Findings assigned severity and confidence | HIGH/MEDIUM/LOW confidence sections above, with Critical/High/Medium severity | PASS |

## Metadata

- **Confidence framework:** HIGH = three reviewers agree or deterministically verified; MEDIUM = two reviewers agree; LOW = one reviewer.
- **Agent availability note:** Project-named reviewer runtimes were unavailable (`local-router/implementer` missing); the review was instead completed by three independent fresh-context delegates on the current runnable model.
- **Disposition:** `needs-revision`; no implementation remediation was attempted in this review.
