---
service: convex
feature: UC-QUAL-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-QUAL-03 core: the couch sample is composed to recipe and the R2 gate computes green

The operator pulls the R2 couch sample: at least ten QA-passed enrichments biased toward
personally-known roads, spanning sources, including at least two thin-grounding routes.
They record a verdict per row — nine read true, one reads off, zero contain a fabricated
specific. The system computes the gate against the defined condition (≥9/10 true AND zero
fabrications) and records R2 green. Re-recording any single verdict as a fabrication
('wrong') recomputes the gate red regardless of the true count, and while red the
operator's block keeps the rider-facing "why" wave from shipping.

**Verify (integration, live Convex dev + operator CLI):**
- `npx convex run` sampleForReview `{"count": 10}` → `.tmp/ENR/couch-sample.json` holds
  ≥10 `qa_passed` rows, ≥2 with `thinGrounding: true`, more than one source represented.
- Record 9×true + 1×off via `recordCouchVerdict` → the computed gate is green and
  recorded.
- Re-record one row as 'wrong' → the gate recomputes red; the ship-block state is
  queryable while red.
