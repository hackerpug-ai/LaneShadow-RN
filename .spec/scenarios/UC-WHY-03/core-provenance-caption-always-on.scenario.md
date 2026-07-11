---
service: mobile-app
feature: UC-WHY-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-WHY-03 core: every enriched view carries the provenance caption; staleness never reaches the rider

Seeded rows on the real dev deployment cover the three served shapes: a fresh `qa_passed`
row, a `stale` row with a prior `qa.verdict: 'pass'`, and an attribute-only
(`thinGrounding: true`) row. Each detail screen shows the small always-on caption
"Generated from route & terrain data" alongside the paragraph. The stale route serves its
last passed text with zero staleness UI — no badge, no timestamp, no "may be out of date"
marker — and the attribute-only route carries no wording implying source-verified
narrative detail it does not have. Staleness is operator-facing only in v1.

**Verify (e2e, real device Maestro + live Convex, seeded rows):**
- All three routes → `curated-detail-enrichment-provenance` visible with the exact caption
  copy "Generated from route & terrain data".
- The stale route renders its paragraph; no stale marker of any kind exists in the view.
- The attribute-only route's section is structurally identical to the sourced one — same
  caption, no extra qualifier or badge.
