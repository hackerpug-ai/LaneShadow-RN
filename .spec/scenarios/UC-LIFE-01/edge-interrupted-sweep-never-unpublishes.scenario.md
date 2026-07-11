---
service: convex
feature: UC-LIFE-01
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-LIFE-01 edge: an interrupted staleness sweep resumes clean and never unpublishes anything

A catalog-wide staleness sweep is killed partway through (process exit mid-pagination),
then re-run to completion. The combined result must equal one uninterrupted sweep: every
genuinely drifted row flagged exactly once, no row flip-flopping between states, no
already-stale row reprocessed into a different state — and, the honesty invariant,
`getCuratedRouteDetail` keeps serving every previously-passed text throughout both runs.
Staleness detection is bookkeeping; under no failure mode may it subtract from the served
catalog.

**Verify (integration, real dev deployment):**
- Kill the sweep mid-run, then re-run → the final stale set equals the expected drifted
  set: no extras, none missing, none double-flagged.
- A detail query polled during and after both runs returns the same `why` for a
  stale-flagged route the entire time.
- No row transitions to any state other than `stale` as a result of the sweep.
