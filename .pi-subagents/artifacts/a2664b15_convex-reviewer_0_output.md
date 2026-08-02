I now have all the evidence needed. Here is the complete adversarial review:

---

## REDHAT-FIX REMEDIATION VERIFICATION REPORT

### Per-Fix Verdict Table

| FIX | Verdict | Evidence file:line | Residual Exploit |
|-----|---------|---------------------|------------------|
| **FIX-01** | **NOT-RESOLVED** | `convex/curatedGeometryReconstruct.ts:42-55` | **CRITICAL BYPASS**: Public action `reconstructForRouteWithFixedGeometry` uses only `requireIdentity` (NOT `assertTestSubjectOrThrow`). Any authenticated user can call `api.curatedGeometryReconstruct.reconstructForRouteWithFixedGeometry({ routeId, routedMiles: 41 })` directly, bypassing the `runSampleWaterfall` test-subject gate entirely. Same for `reconstructForRouteWithFixedAnchors:59-71` and `reconstructForRouteWithMixedAnchors:74-87`. The `lever2FixedGeometry` arg is also still present on `runSampleWaterfall` (line 442-449 of waterfallOrchestrator.ts) — gated at runtime but not removed from the public arg surface. |
| **FIX-02** | **PARTIAL** | `convex/actions/rideWorthinessClassifier.ts:340-385` | classifyCatalog uses pagination via `listEligibleRouteIdsForClassification` ✓. BUT: No `classifier_runs` table exists in schema.ts — no durable checkpoint with cursor for resume after interruption. No `scheduler.runAfter` continuation. The pagination loop runs inside a single action invocation — if it times out on a large catalog, ALL progress is lost. No `classifiedCount`/`failedCount`/`totalRoutes` checkpoint row. |
| **FIX-03** | **RESOLVED** | `convex/couchVerdict.ts:64-149` | `recordCouchVerdict` uses `requireOperator` ✓. Loads frozen manifest, validates membership, append-only insert ✓. `manifestHash` bound to verdict ✓. `couchGateStatus` checks manifest frozen+hash+catalog match ✓. |
| **FIX-04** | **RESOLVED** | `convex/couchVerdict.ts:85-130` | Missing/extra/duplicate routeIds rejected with `VERDICT_MISSING_ROUTES`/`VERDICT_EXTRA_ROUTES`/`VERDICT_DUPLICATE_ROUTES` ✓. `couchGateStatus` binds to current frozen manifest, rejects stale passes ✓. |
| **FIX-05** | **RESOLVED** | `convex/reviewQueue.ts:247-293,237-247` | `requireOperator` ✓. `evaluateApprovalCandidate` computes `inRegionAnchorCount` from stored anchors ✓. Calls `determineGateVerdict({ inRegionAnchorCount })` ✓. Gate-failing candidates stay `geometryStatus='review'`, `riderReady=false` ✓. Provenance preserved from stored data (not hardcoded `scraped_promoted`) ✓. |
| **FIX-06** | **PARTIAL** | `convex/guards.ts:103-147` | `requireOperator` + `requireFounder` exist, backed by `users.role` field ✓. `recordCouchVerdict`, `retireDisposition`, `prepareRetryDisposition`, `seedReviewQueueEntry` all use `requireOperator` ✓. BUT: `couchGateStatus` uses `requireIdentity` only (couchVerdict.ts:205) — **NOT** `requireOperator` per spec. `runAllWaterfall` uses `requireIdentity` only (couchVerdict.ts:334) — **NOT** `requireOperator` per spec. |
| **FIX-07** | **RESOLVED** | `convex/curatedGeometryGate.ts:98-128` | `determineGateVerdict` accepts `inRegionAnchorCount` and uses it for canonical gate ✓. All lever call sites pass `inRegionAnchorCount`: `evaluateRoutedAnchors:571-580`, `reconstructForRouteWithFixedGeometry:777`, `reconstructForRouteWithFixedAnchors:819`, `reconstructForRouteWithMixedAnchors:881-882` ✓. Anchor check precedes quarantine ✓. |
| **FIX-08** | **PARTIAL** | `convex/reviewQueue.ts:139`, `convex/couchSampleAssembler.ts:338`, `convex/waterfallOrchestrator.ts:253` | `seedReviewQueueEntry` → `requireOperator` ✓. `seedCouchFixtures` → `internalMutation` with `seedCouchFixturesPublic` founder-gated ✓. `teardownCouchFixtures` → `internalMutation` with `teardownCouchFixturesPublic` founder-gated ✓. `clearCouchVerdicts` → `internalMutation` with `clearCouchVerdictsPublic` founder-gated ✓. Waterfall seeds → `requireOperator` ✓. BUT: **NEW FINDING** `seedLever1Fixtures` (`curatedGeometryReconstruct.ts:1109`) and `seedLever3Fixtures` (`:1132`) and `teardownLeverTestRoutes` (`:1175`) are PUBLIC mutations using only `requireIdentity`. These can be called by any authenticated user to manufacture/erase test evidence. |
| **FIX-09** | **PARTIAL** | `convex/waterfallOrchestrator.ts:638-643, 695-720` | L3 exception writes only `retirement_eligible` (not also `review_candidate`) ✓. Cost charged on L2 failure ✓. BUT: No `route_terminal_state` table exists in schema.ts — missing the spec-required "durable single-source-of-truth store keyed by routeId with unique-by-routeId index." Terminal states are tracked via `curation_artifacts` (append-only log), not upserted. No `cost_blocked` pause state — when cost circuit-breaker hits (`:554-560`), routes are silently dropped with no terminal state at all. |
| **FIX-10** | **RESOLVED** | `convex/couchSampleAssembler.ts:555-611` | Server-derived `manifestHash` via SHA-256 over sorted routeIds ✓. Route existence check against `curated_routes` ✓. Gate-pass check (`verdict === 'pass'`) ✓. Duplicate/extra detection ✓. Frozen manifest immutability ✓. |
| **FIX-11** | **PARTIAL** | `convex/actions/rideWorthinessClassifier.ts:169-212` | `classifyAndPersistOne` checks freeway status and records geometry attempt evidence ✓. BUT: No `geometry_attempt` artifactType in schema (only `review_candidate`, `disposition`, `waterfall_result`) — uses `waterfall_result` instead ⚠️. No `evidenceComplete` field on `rideWorthiness` ⚠️. No `rescueFirstHonored` per-run coverage total persisted ⚠️. No per-run coverage counter in `classifyCatalog` return ⚠️. |

---

### NEW FINDINGS (not in original 11 REDHAT-FIX tasks)

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| **N1** | **CRITICAL** | `convex/curatedGeometryReconstruct.ts:42-55` | **DIRECT FIX-01 BYPASS**: Public action `reconstructForRouteWithFixedGeometry` guarded only by `requireIdentity`. Any authenticated user can call `api.curatedGeometryReconstruct.reconstructForRouteWithFixedGeometry({ routeId, routedMiles: 41 })` and inject deterministic geometry with `ai_reconstructed` provenance — completely bypassing the `assertTestSubjectOrThrow` gate in `runSampleWaterfall`. Same for `reconstructForRouteWithFixedAnchors:59` and `reconstructForRouteWithMixedAnchors:74`. |
| **N2** | **HIGH** | `convex/curatedGeometryReconstruct.ts:1109-1175` | **MISSED FIXTURE SEAMS**: `seedLever1Fixtures`, `seedLever3Fixtures`, and `teardownLeverTestRoutes` are PUBLIC mutations using only `requireIdentity`. These were missed by FIX-08. Any authenticated user can manufacture (insert curated_routes + curated_route_geometry rows with gate-passing verification) or erase test evidence. |
| **N3** | **MEDIUM** | `convex/guards.ts:157-166` | **TEST_SUBJECT_PREFIX `dev-` RISK**: A real Clerk user whose subject starts with `dev-` (possible in Clerk development instances) would pass `assertTestSubjectOrThrow` and be able to inject `lever2FixedGeometry` through `runSampleWaterfall`. `test:` prefix also carries residual risk if real Clerk subjects ever use that prefix. |
| **N4** | **MEDIUM** | `convex/waterfallOrchestrator.ts:554-560` | **SILENT COST-CIRCUIT-BREAKER DROP**: When `maxCost` is exhausted before Lever 2, the batch stops with `batchStopReason = 'cost_exceeded'` but the unprocessed route has NO terminal state at all — not in the `routes` array, not stored as `cost_blocked`. Subsequent runs won't know it was left mid-waterfall. |

---

### OVERALL STATEMENT

**Are the 11 REDHAT-FIX items genuinely resolved at HEAD? NO.**

The implementation makes substantial progress — FIX-03, FIX-04, FIX-05, FIX-07, and FIX-10 are GENUINELY RESOLVED with well-structured code. However, the effort is critically undermined by:

1. **FIX-01 is NOT-RESOLVED** — the public `reconstructForRouteWithFixedGeometry` action at `convex/curatedGeometryReconstruct.ts:42` provides a DIRECT bypass of the test-subject gate with only `requireIdentity`. The `lever2FixedGeometry` injection seam is fully exploitable by any authenticated user through this public surface. This is the single most critical finding — it nullifies the trust pipeline's primary defense.

2. **FIX-06, FIX-08, FIX-02, FIX-09, FIX-11 are PARTIAL** — each has meaningful code but incomplete coverage. The most impactful gaps are: `couchGateStatus`/`runAllWaterfall` not operator-gated (FIX-06), missing public fixture seams in curatedGeometryReconstruct.ts (FIX-08), no durable checkpointing for classifyCatalog (FIX-02), no `route_terminal_state` table or `cost_blocked` pause (FIX-09), and no `geometry_attempt` artifactType or `evidenceComplete` marker (FIX-11).

The concrete exploit path that still works:
```
Authenticated user → api.curatedGeometryReconstruct.reconstructForRouteWithFixedGeometry({ routeId, routedMiles: 41, pointCount: 50, anchorCount: 2 })
→ internalAction stores geometry with ai_reconstructed provenance + gate-passing verification
→ couch sample can be assembled from manufactured gate-passing routes
→ recordCouchVerdict requires operator but the manufactured evidence is already in the DB
```

---