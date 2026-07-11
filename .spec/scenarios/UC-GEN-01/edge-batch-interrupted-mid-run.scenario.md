---
service: convex
feature: UC-GEN-01
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-GEN-01 edge: operator kills the CLI driver mid-batch and resumes without double-spend

The operator starts `scripts/backfill-curated-enrichment.ts --top=20` and kills the process
(Ctrl-C) after roughly half the routes have written rows. Re-running the driver picks up
where the run died: routes that already hold a row whose `inputsContentHash` matches are
skipped with zero model spend, no route ends up with two rows under `by_routeId`, and the
final row count converges to what a never-interrupted run would produce. No route is left
in a half-written state by the kill.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2):**
- Kill the driver mid-run → re-run the same command → total row count converges to 20 with
  `by_routeId` unique across the table.
- Rows written before the kill keep their original `generatedAt` (proof they were skipped,
  not regenerated and re-billed).
- Every row present after the second run validates against the enrichment schema (no
  partial writes survived the interrupt).
