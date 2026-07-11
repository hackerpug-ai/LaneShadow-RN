---
service: convex
feature: UC-HYG-01
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-HYG-01 edge: a crash halfway through the pass never produces a double division

The operator starts the score-normalization pass and the process dies (or the action is
interrupted) after roughly half of the ~103 out-of-scale rows have been rewritten. The
operator simply runs the same command again. Rows that were already divided in the first run
carry the `scoreScaleNormalizedAt` stamp, so the second run skips them — a route that entered
at 90 ends at 0.9, never at 0.009. Rows the crash left untouched (still > 1, no stamp) are
picked up and divided exactly once. After the second run the changed-count of both runs sums
to the original out-of-scale population, and no score in the table is below the plausible
floor a double division would produce (no composite score in (0, 0.01) exists among editorial
rows).
