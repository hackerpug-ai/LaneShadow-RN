# US-065: Elevation Profile Tool — Evidence Bundle

## Task
Implement `getElevation` agent tool that computes elevation profiles from route polylines.

## Base SHA
df6e033883acfda026e3a9c855cbcaa4b29cbfd9

## Commit SHA
f18458be90f662ee0b6eb09d9e926bdef1207eb8

## Files Created/Modified
- `convex/actions/agent/tools/getElevation.ts` (NEW)
- `convex/actions/agent/tools/__tests__/getElevation.test.ts` (NEW)
- `convex/actions/agent/lib/piTools.ts` (MODIFIED — added getElevation schema)

## TDD Summary

| AC | Phase | Test Name | Evidence |
|----|-------|-----------|----------|
| AC-1 | RED→GREEN | mountain route: returns positive gain/loss and maxGradePct above 5% | RED: import error; GREEN: passed |
| AC-2 | RED→GREEN | flat route: returns totalGainFt below 200 and maxGradePct below 3% | Passed in GREEN |
| AC-3 | RED→GREEN | sampling: polyline with 150 points is sampled to at most 100 before API call | Passed in GREEN |
| AC-4 | RED→GREEN | api failure: returns unavailable status without throwing | Passed in GREEN |

## Final Test Output
```
 ✓ convex/actions/agent/tools/__tests__/getElevation.test.ts (7 tests) 3ms
 Test Files  1 passed (1)
 Tests  7 passed (7)
```

## Full Suite
```
 Test Files  81 passed (81)
 Tests  933 passed (933)
```

## Quality Gates
- typecheck: PASS
- lint: PASS (warnings only, pre-existing)
- tests: PASS (933/933)
