---
service: convex
feature: UC-GEN-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-GEN-03 core: a mid-batch failure records its reason, corrupts nothing, and the batch rolls on

Clean failure handling is this UC's happy path. A three-route batch runs on the real dev
deployment where the middle route is rigged to fail: a synthetic route whose stored
polyline is corrupt, so fact extraction throws before any model call. The failing route
lands `enrichmentStatus: 'failed'` with a retrievable reason and gets no enrichment row at
all — honest absence, never a partial or placeholder `whyText`. The two healthy routes
still complete real GLM-5.2 generation, and the operator can pull the failed-route list
with reasons after the run.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2):**
- `backfill` over [healthy, corrupt, healthy] → `perRoute[]` marks the corrupt route
  failed with a reason string; the other two land `generated` rows.
- `curated_route_enrichments` has no row for the failed route.
- The failed list with reasons is retrievable after the run (perRoute output / coverage
  report failed bucket).
- Cleanup removes the synthetic route.
