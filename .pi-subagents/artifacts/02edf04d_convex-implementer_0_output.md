Subagent exceeded turn budget after 96 assistant turns (soft limit 50 + grace 10).

Partial output before turn-budget abort:
All checks pass. Here is the final acceptance report.

---

## Implementation Complete: Sprint 04 Trust-Pipeline Remediation (FIX-P0, FIX-02, FIX-08, FIX-09, FIX-11)

**Base SHA**: `dd007566c668383a402c239e74c534281edf2ce6`
**Head SHA**: `97cf98a7`

### Files Modified (8 files, +619/-40)

| File | Change |
|------|--------|
| `convex/waterfallOrchestrator.ts` | P0(a) lean teardown, FIX-09 terminal/cost, FIX-08 operator gating |
| `convex/reviewQueue.ts` | P0(b) direct lookup, FIX-08 operator gating |
| `convex/actions/rideWorthinessClassifier.ts` | FIX-11 freeway geometry, FIX-02 pagination |
| `convex/__tests__/REDHAT-FIX-P0-test-infra.test.ts` | NEW — 4 tests |
| `convex/__tests__/REDHAT-FIX-09-terminal-cost.test.ts` | NEW — 4 tests |
| `convex/__tests__/REDHAT-FIX-11-freeway-geometry.test.ts` | NEW — 3 tests |
| `convex/__tests__/REDHAT-FIX-02-catalog-pagination.test.ts` | NEW — 4 tests |
| `convex/__tests__/REDHAT-FIX-08-fixture-gating.test.ts` | NEW — 4 tests |

### TDD Summary

| Fix | Commit | Test File | Tests | RED Evidence |
|-----|--------|-----------|-------|-------------|
| P0 | `04140e6b` | `REDHAT-FIX-P0-test-infra.test.ts` | 4/4 ✅ | 3/4 FAIL (teardown .take(300), missing routeIds, wrong .take order) |
| FIX-09 | `980505fd` | `REDHAT-FIX-09-terminal-cost.test.ts` | 4/4 ✅ | 3/4 FAIL (dual-state, missing cost charging) |
| FIX-11 | `dd8ac815` | `REDHAT-FIX-11-freeway-geometry.test.ts` | 3/3 ✅ | 2/3 FAIL (no freeway check, no geometry_attempt) |
| FIX-02 | `00355277` | `REDHAT-FIX-02-catalog-pagination.test.ts` | 4/4 ✅ | 2/4 FAIL (no continueCursor, no while loop) |
| FIX-08 | `97cf98a7` | `REDHAT-FIX-08-fixture-gating.test.ts` | 4/4 ✅ | 4/4 FAIL (all fixtures used requireIdentity) |

### Test Results

| Suite | Result |
|-------|--------|
| All REDHAT-FIX-* tests (7 files) | **27/27 passed** |
| Existing unit tests (curatedGeometryGate, guards, hygiene, etc.) | **84/84 passed** |
| **Total** | **111/111 passed** |
| `pnpm type-check` | **PASS** |
| Schema changes | **NONE** (migration-safe, no schema touched) |
| `.spec/` gate-evidence files | **UNTOUCHED** |
| Sprint goal marker | **NOT marked** |

### Integration Test Note

The S4 integration tests (`S4T1-` through `S4T7-`) require a live Convex dev deployment (`npx convex run`) and were **not executed** in this environment. The P0 test-infra fix directly addresses the two root causes of S4T5/S4T2 review-queue flakiness:
- **(a)** `teardownWaterfallFixtures` now uses `MAX_PER_STATUS=50` (was 300) and paginated artifact deletion — preventing "Too many bytes read" (16MB limit)
- **(b)** `listGeometryReviewQueue` now does a direct `by_routeId` lookup when `routeIdPrefix` is a concrete routeId — preventing the target route from being missed due to stale entries pushing it outside the `.take()` window

These fixes should resolve the flaky tests when run against a live deployment.

### Residual Risks

- **S4 integration tests not run**: The `npx convex run` tests require a live Convex dev deployment. The FIX-08 operator gating will require test identities to have `role: 'operator'` or `role: 'founder'` in the users table of the dev deployment for fixture seeding/teardown mutations to succeed. Tests calling `seedWaterfallFixtures`, `teardownWaterfallFixtures`, `seedReviewQueueEntry`, `seedPassedSampleRoutes`, or `seedCostBurnRoutes` will need operator-role users.
- **FIX-02 checkpoint durability**: The whole-catalog pagination iterates all pages in a single action. For catalogs exceeding the 900-second action timeout, a future enhancement may split across multiple action invocations with a `classification_checkpoint` table. Current batching (50 per page) is adequate for typical catalogs.
- **FIX-08 integration test compatibility**: Integration tests using `npx convex run` with synthetic identities will need those identities to have operator role in the dev DB, or a public CLI wrapper with dev-env signal may be needed.