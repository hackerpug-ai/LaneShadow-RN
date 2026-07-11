---
service: convex
feature: UC-LIFE-03
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-LIFE-03 edge: reporting while the pipeline is writing stays consistent and crash-free

The coverage report is queried repeatedly WHILE a real backfill batch is actively writing
rows on the same deployment. The report is an instrument the operator reads mid-flight; it
cannot require a quiet catalog. Every call must return a coherent snapshot: no error, no
negative or NaN figure, bucket sums that still equal the eligible count, and state counts
that move consistently with the batch's progress — the generated bucket grows as rows
land, and ship-ready never moves spuriously before QA has run.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2 batch in flight):**
- Poll the report 5 times during the batch → every response satisfies the partition
  invariant (buckets sum to eligible count).
- The generated count is non-decreasing across the polls; ship-ready is unchanged until
  QA runs.
- The final report matches an after-the-fact recount of the table exactly.
