---
service: convex
feature: UC-GEN-01
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-GEN-01 core: batch generates a grounded one-paragraph "why" for plottable routes

The operator runs the enrichment backfill over a sample of plottable routes
(`geometryStatus === 'generated'`, at least one dimension score) against the real dev
deployment. For each sampled route, real z.ai GLM-5.2 (via the repo's `enrichment` model
tier) produces exactly one paragraph — lead sentence ≤100 chars, hard cap 320 chars, no
lists or headers — whose every claim traces to a supplied input fact (a dimension score, a
geometry-derived attribute, or a source snippet). The row records the full grounding-facts
snapshot, including the always-absent-in-v1 optional `visual` block, plus `promptVersion`
and `model` (e.g. "zai:glm-5.2"), and lands as `status: 'generated'`. The batch is
resumable via `continueCursor`.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2):**
- `npx convex run actions/curatedEnrichment:backfill '{"sample": 5}'` → 5 rows exist in
  `curated_route_enrichments` with non-empty single-paragraph `whyText` ≤320 chars, lead
  sentence ≤100.
- Each row's `groundingFacts.structured` is populated; `groundingFacts.visual` is absent.
- Spot-check one paragraph against its own stored snapshot: no claim references a fact
  outside it.
- Re-run with the returned `cursor` → the batch resumes; already-enriched routes are not
  reprocessed.
