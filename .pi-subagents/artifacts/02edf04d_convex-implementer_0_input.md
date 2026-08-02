# Task for convex-implementer

You are completing the remaining code fixes for Sprint 04 trust-pipeline remediation (REDHAT-FIX-02 completion, FIX-08 waterfall/review portion, FIX-09, FIX-11) PLUS a test-infrastructure reliability fix. Earlier waves (FIX-03/04/05/06/07/10) are DONE and verified — do NOT redo them. Read the authoritative review first.

**Working directory:** /Users/inference1/Projects/LaneShadow-RN
**Backend root:** convex/
**Stack:** Convex ^1.41.0, TypeScript, Vitest. Commands: `pnpm type-check`, `pnpm exec vitest run <files>` (S4 integration tests are SLOW — ~7-10 min for the full S4 set; budget your time).

**MANDATORY FIRST STEPS:**
1. Read `convex/_generated/ai/guidelines.md` fully.
2. Read `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260720T160338Z.md` (FIX-02/08/09/11 entries + the MEDIUM "waterfall terminal states unsafe" + "couch sample contents mutable" findings).
3. Read these before editing: `convex/actions/rideWorthinessClassifier.ts` (classifyCatalog, ~:240-315 — a prior wave made it fetch ONE batch via `listEligibleRouteIdsForClassification`; you must complete it), `convex/curatedGeometry.ts` (`listEligibleRouteIdsForClassification` query), `convex/waterfallOrchestrator.ts` (teardownWaterfallFixtures ~:400-440 which THROWS "Too many bytes read"; runSampleWaterfall lever loop ~:518-785), `convex/reviewQueue.ts` (`seedReviewQueueEntry`, `listGeometryReviewQueue` ~:23-90).

## Scope — implement these (RED→GREEN TDD, ONE COMMIT PER FIX). Prioritize in this order; commit each independently so partial progress is preserved.

### P0 — TEST-INFRA RELIABILITY (unblocks a trustworthy green suite)
Two pre-existing problems cause ~3 S4T5/S4T2 "review-queue" tests to fail intermittently/deterministically:
- **(a)** `teardownWaterfallFixtures` (waterfallOrchestrator.ts ~:400-440) throws `Too many bytes read in a single function execution (limit: 16777216 bytes)` because it loads full docs while sweeping. Make it LEAN: delete by `routeId` via indexed lookups WITHOUT loading full unrelated docs; page/bound the sweep; avoid `.collect()`/`.take(300)` of full rows across 4 statuses in one mutation. It must reliably remove `test:`/fixture-prefixed routes without exceeding the 16MB limit.
- **(b)** `listGeometryReviewQueue` (reviewQueue.ts ~:23-90) filters `curated_routes` by `geometryStatus==='review'` then `.take(limit*3)`, then filters by `routeIdPrefix` AFTER the take. When stale review rows accumulate, the target route (newest, at index end) falls outside the take window and is missed. FIX: when `routeIdPrefix` is provided, resolve candidate routes BY routeId prefix directly (use the `by_routeId` index + a bounded scan, or look up the specific known routeIds) so the query cannot miss the intended entry due to pagination ordering. Keep the no-prefix behavior (bounded listing) intact.
- **Test:** add/extend a test proving teardown removes a large fixture set without throwing, and that listGeometryReviewQueue returns the target routeId even when many stale review rows exist. (If existing S4T5-review-queue tests now pass reliably after this, that's the evidence.)

### FIX-09 (HIGH→CRITICAL-adjacent) — waterfall terminal-state, retry, and provider-cost accounting must be DURABLE and FAIL-CLOSED
Per the review: "A Lever 3 exception can create `retirement_eligible` while separately queueing REVIEW; failed/retried LLM calls are not necessarily charged before completion" (waterfallOrchestrator.ts ~:518-526,586-607,695-718,759-785). Also (MEDIUM): "Circuit-breaker can leave partially touched routes without a durable terminal state. Lever 1 runs before the later L2 cost check."
- Ensure EVERY processed route ends in EXACTLY ONE durable terminal state (`recovered` | `queued` | `retirement_eligible`), persisted atomically. A Lever-3 exception must NOT both set `retirement_eligible` AND queue REVIEW — pick one terminal state and record the exception in the artifact.
- Charge/reserve each billable LLM attempt BEFORE the route completes (cost accounting must be fail-closed: a retried/failed LLM call is accounted, not silently dropped). Check/reserve cost before starting a route likely to need L2, or persist an explicit `cost_blocked`/paused state.
- **Test (RED first):** a route whose Lever 3 throws ends in exactly ONE terminal state (not two); a failed/retried LLM call's cost is reflected in the total.

### FIX-11 (HIGH) — freeway/rescue-first geometry attempt must be recorded + enforced with persisted coverage
Per the review: S4-T4's classifier "describes geometry as independent and only classifies/persists; it neither initiates nor verifies the required geometry attempt for a freeway row" (rideWorthinessClassifier.ts ~:249-279).
- FIX: explicitly enqueue or verify the independent geometry attempt for a freeway row BEFORE/AROUND classification, and persist an auditable attempt artifact (e.g. a `geometry_attempt` curation_artifact with freeway flag + outcome). The classifier must not complete a freeway route without evidence the rescue-first geometry attempt happened.
- **Test (RED first):** classifying a freeway row either records a geometry-attempt artifact or refuses to complete without one (coverage evidence persisted).

### FIX-02 COMPLETION (HIGH) — classifyCatalog must enumerate the WHOLE catalog with durable checkpoint + completion condition
A prior wave made `classifyCatalog` fetch ONE batch (first page only) via `listEligibleRouteIdsForClassification`. The review requires whole-catalog coverage with checkpointing and a completion condition that fails while eligible routes remain unclassified.
- COMPLETE IT: when `routeIds` is omitted, iterate ALL pages (`.continueCursor`) in the action across bounded batches (cap per-action work for Convex limits; if the catalog is too large for one action, persist a durable checkpoint — a new `classification_checkpoint` table or field — and return a resumable cursor + `remainingEligible` count). Add a completion/coverage condition: the result reports `totalEligible`, `classified`, `remainingEligible`, and the run is only "complete" when remainingEligible===0.
- **Test (RED first):** `classifyCatalog` with NO routeIds over a seeded catalog larger than one batch classifies ALL eligible routes (not just the first batch) and reports correct coverage/remaining.

### FIX-08 (waterfall/review portion) — public fixture/cleanup seams cannot manufacture/erase production trust evidence
Per the review: authenticated callers can seed review/waterfall fixtures and erase couch verdicts (waterfallOrchestrator.ts:249-372 seedWaterfallFixtures/teardown; reviewQueue.ts:96-224 seedReviewQueueEntry). (The couch fixtures were already gated in a prior wave.)
- Make `seedWaterfallFixtures`, `teardownWaterfallFixtures`, `seedReviewQueueEntry` (and any pure-fixture mutations) `internalMutation` (so they're not callable via `npx convex run` by authenticated production clients), keeping them callable from tests via `ctx.runMutation(internal...)`. If a test currently calls them as public mutations, update the test to use the internal path. If you must keep a public entry for CLI ergonomics, gate it behind `requireFounder` AND a test/dev-env signal (consistent with the couch-fixture pattern already in place).
- **Test (RED first):** an authenticated non-founder client cannot seed/erase waterfall/review fixtures via the public API (rejected or internal-only).

## Hard constraints
- **TDD per fix:** failing test FIRST, confirm it fails for the right reason, then GREEN. ONE commit per fix.
- **MUST run the FULL S4 integration suite** (`pnpm exec vitest run convex/__tests__/S4T1- convex/__tests__/S4T2- convex/__tests__/S4T3- convex/__tests__/S4T4- convex/__tests__/S4T5- convex/__tests__/S4T6- convex/__tests__/S4T7-`) before reporting and FIX real regressions you cause. Target: the previously-flaky S4T5/S4T2 review-queue tests should now PASS reliably after your P0 test-infra fix. Report exact pass/fail and which (if any) failures remain + why.
- **Commit messages:** `fix(sprint-04): lean teardown + robust review-queue query (test-infra)`, `fix(S4-T5): durable waterfall terminal state + fail-closed cost (REDHAT-FIX-09)`, `fix(S4-T4): freeway rescue-first geometry attempt + coverage (REDHAT-FIX-11)`, `fix(S4-T4): classifyCatalog whole-catalog pagination + checkpoint (REDHAT-FIX-02)`, `fix(S4-T5): gate waterfall/review fixture seams to internal (REDHAT-FIX-08)`.
- **Do NOT touch** `.spec/.../sprint-04-trust-pipeline/.gate-evidence/` or regenerate gate-results JSON. The human founder gate + live-provider run are OUT OF SCOPE.
- **Do NOT mark the sprint goal** `met`/`complete` in any state file.
- `pnpm type-check` must pass before each commit. You are the SOLE writer of these files this turn.
- If you run low on budget, COMMIT what's green+type-checked and report exactly what remains (file:line) so I can dispatch a finisher.

## Stop condition & report
Stop when all five items are implemented, tested, full-suite-checked (regressions fixed), type-checked clean, committed.
Report:
1. Per fix: commit hash, test file(s), RED→GREEN evidence, key files.
2. `pnpm type-check` result.
3. FULL S4 suite pass/fail — explicitly state whether the previously-flaky S4T5/S4T2 review-queue tests now pass reliably.
4. Schema changes (if any for FIX-02 checkpoint) — confirm migration-safe (optional fields).
5. Anything NOT completed + why (file:line).
6. Confirm gate-evidence untouched + sprint goal not marked.

## Acceptance Contract
Acceptance level: reviewed
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope
- criterion-2: Return evidence sufficient for an independent acceptance review

Required evidence: changed-files, tests-added, commands-run, validation-output, residual-risks, no-staged-files

Review gate: required by reviewer.

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    },
    {
      "id": "criterion-2",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```