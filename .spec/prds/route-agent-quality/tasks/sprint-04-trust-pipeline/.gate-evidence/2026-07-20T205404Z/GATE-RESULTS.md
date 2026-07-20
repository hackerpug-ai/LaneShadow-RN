# GATE-RESULTS — sprint-04-trust-pipeline (re-audit)

**Verdict:** 🟠 BLOCKED — not achieved (honest re-audit after the fresh red-hat report)
**Run ID:** 2026-07-20T205404Z
**Replaces:** the forged `2026-07-19T22:59:46Z` closeout (its Step 1 note admitted it used the `lever2FixedGeometry` seam, not real providers; the scripts referenced `lever2FixedGeometry` under the `s4-human-gate` production identity — the exact forge the red-hat report flagged).
**Evidence:** `.gate-evidence/2026-07-20T205404Z/`

> This document does NOT claim a pass. It records what is honestly verified on
> real providers and what is genuinely blocked. The prior "✅ VERIFIED PASS /
> 8/8" was forged and is withdrawn.

## Why the prior closeout was forged
- `step1.sh` / `step2.sh` passed `lever2FixedGeometry` to the public
  `runSampleWaterfall` under subject `s4-human-gate` (a production closeout
  identity) on `test:` fixtures — manufacturing a deterministic "recovered"
  result without calling real Google/LLM providers.
- `step7.sh` passed `lever2FixedGeometry` to `retryDisposition` likewise.
- After FIX-01, the seam is **removed from every public production entry**
  (rejected at the Convex validator) and survives only on test-prefix-gated
  `runSampleWaterfallWithSeams` / `retryDispositionWithSeams`. The old scripts
  now error (`ArgumentValidationError: extra field`) — by design.

## Steps (honest status)

| # | Status | Step | Evidence |
|---|--------|------|----------|
| 1 | ✅ HONEST | Run the lever waterfall as a `--sample` batch on real Google + LLM APIs | `step1-real-provider-waterfall.json`: production `runSampleWaterfall` (no seam) on real route `motorcycleroads:twist-of-tepusquet-loop` ran all 3 levers on real providers, **cost $0.07**, batch completed. |
| 2 | ✅ HONEST | Confirm each processed route ends in exactly one terminal state | same run: the route ended in exactly one terminal state (`queued`); `perStateCounts` sums to 1. |
| 3 | ⛔ BLOCKED | Open the ~25-route couch sample rendered as map PNGs | The dev deployment has **no real ~25-route catalog** (only fixtures + 1 real seeded route). `assembleCouchSample` needs real catalog routes. No ingestion/loader is in the codebase. |
| 4 | ⛔ HUMAN | Record true/off/wrong for each sampled route | Founder-Operator judgment (S4-T7, 45 min). Irreducibly human — a machine verdict would be a forgery. |
| 5 | ⛔ HUMAN | Record an overall pass or fail verdict | Founder-Operator judgment. |
| 6 | ✅ CODE-VERIFIED | Confirm a single `wrong` verdict forces the gate red | `S4T6-couch-*` suite: `STRICTLY: single 'wrong' forces overall fail (rejects pass)` passes. |
| 7 | ⛔ HUMAN | Disposition three REVIEW-queue items (approve/retry/retire) | Corrected `step7.sh` (no seam, real Lever-2) is runnable; the disposition *decisions* are Founder-Operator judgment. |
| 8 | ✅ CODE-VERIFIED | Confirm the driver refuses `--all` until the couch verdict passes | `S4T6-couch-*` suite + `couchGateStatus` active-manifest binding (FIX-04) pass. |

## Code remediation completed this cycle (all verified, 314/314 tests pass)
- **FIX-01** — `lever2FixedGeometry`/`simulateRateLimitFailures`/`skipSleep` removed from public `runSampleWaterfall`; `lever2FixedGeometry` removed from public `retryDisposition`. Seams survive only on test-prefix-gated `*WithSeams` actions. 11-AC integration test proves both layers (validator + gate).
- **FIX-02** — durable `classifier_runs` checkpoint/resume (cursor + counts persisted per page).
- **FIX-04** — couch unlock bound to the latest frozen (active) manifest; hardcoded manifest id removed.
- **FIX-05** — REVIEW approval decodes the real polyline and re-measures pointCount/routedMiles/ratio/anchors.
- **FIX-09** — cost-limited routes get a durable `cost_blocked` terminal state.
- **FIX-11** — freeway rescue-first attempt is a required `evidenceComplete` prerequisite.

## Blockers to GATE-GOAL: ACHIEVED (not autonomously resolvable)
1. **Real catalog data** — load a real ~25-route stratified sample into the deployment. There is no ingestion pipeline in the codebase and no accessible production deployment to copy from. This is external/Sprint-03-scope infrastructure.
2. **Human founder couch review** (steps 4-5) — S4-T7 is explicitly Founder-Operator-owned. The per-route `true/off/wrong` verdicts are irreducibly human; recording them by machine would re-create the exact forgery this cycle removed.
3. **API key hygiene** — live provider keys are configured and exercised (step 1 cost $0.07); rotate any keys that were exposed in plaintext logs.

GATE-GOAL: ACHIEVED requires both blockers cleared. All autonomous code work for the six red-hat contracts is complete and verified.
