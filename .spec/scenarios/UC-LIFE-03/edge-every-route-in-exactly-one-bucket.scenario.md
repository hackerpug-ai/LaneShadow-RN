---
service: convex
feature: UC-LIFE-03
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-LIFE-03 edge: the report is a partition — split-brain states cannot double-count or vanish

Enrichment state deliberately lives in two places: `abstained`/`failed` on the route doc
(no content row exists for them) while QA states live on enrichment rows. A mixed corpus is
staged exercising every state at once, including the awkward composites — a thin-grounding
row that is also `stale`, an `abstained` route, a `failed` route with no row. The report
must place every eligible route in exactly one lifecycle bucket: nothing counted twice
because it exists in both tables, nothing falling through because it exists in neither,
and the thin-grounded figure reported without stealing routes from their lifecycle
buckets.

**Verify (integration, real dev deployment):**
- The sum of mutually-exclusive lifecycle buckets equals the eligible-route count, with
  the staged corpus's expected per-bucket numbers.
- The stale+thin route contributes once to lifecycle counts; the thin-grounded figure
  includes it without inflating the sum.
- Removing one staged route shrinks exactly one bucket by exactly one.
