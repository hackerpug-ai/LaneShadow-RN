---
service: convex
feature: UC-GEN-03
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-GEN-03 edge: a failure on the last route of a page cannot corrupt pagination

The batch is staged so the FINAL route of a pagination page fails (a corrupt synthetic
route positioned at the page edge by composite-score ordering). The returned
`continueCursor` and `isDone` must still be correct: resuming from the cursor processes the
next page exactly once, the failed route is not retried into a duplicate row, and no
healthy route on either side of the page boundary is skipped or double-generated. Failure
at the seam between pages is where resumable batches quietly lose or repeat work.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2):**
- Run page 1 (failure at its tail) → resume with `continueCursor` → the union of
  `perRoute[]` across both runs covers every route exactly once.
- Per routeId the table holds exactly 0 rows (failed) or 1 row (generated) — never 2.
- `isDone` is false after page 1 and true after the final page.
- Cleanup removes the synthetic route.
