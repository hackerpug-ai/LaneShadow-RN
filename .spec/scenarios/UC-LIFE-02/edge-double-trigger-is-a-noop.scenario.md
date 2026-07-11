---
service: convex
feature: UC-LIFE-02
priority: P2
type: boundary
tier: holdout
scope: task-local
---

# UC-LIFE-02 edge: running the same scoped regeneration twice back-to-back spends nothing the second time

Immediately after a scoped regeneration completes (all targets QA-passed), the operator
runs the identical command again. Every route now hash-matches its stored QA-passed
enrichment, so the second run must be a pure no-op: zero model tokens spent, zero rows
rewritten (`generatedAt` unchanged on every row), skip counts equal to the first run's
processed counts, and a clean exit with an honest nothing-to-do summary rather than an
error. Idempotency is the property that makes regeneration safe to script and safe to
re-trigger on a hunch.

**Verify (pipeline acceptance, real dev deployment):**
- The second run's perRoute output: all targets skipped; generated and failed counts are
  zero.
- Row-level `generatedAt` timestamps are identical before and after the second run.
- The same idempotency holds at single-route scope: `generateForRoute` on a current route
  skips with no spend.
