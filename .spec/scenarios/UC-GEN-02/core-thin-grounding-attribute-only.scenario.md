---
service: convex
feature: UC-GEN-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-GEN-02 core: thin-grounding routes generate honestly from attributes or abstain on record

About 32% of the catalog carries no source prose. The backfill is run over a handful of
these thin-grounding routes on the real dev deployment: GLM-5.2 composes each "why" from
scores, geometry, length, archetype, and region alone, and the row is marked
`thinGrounding: true` so QA and rendering treat it honestly. Interpretations stay tied to
their underlying scores ("tight, technical corners" only on a high curvature score) — never
invented switchback counts, named businesses, or viewpoints. A route whose facts are too
thin to say anything true and road-specific lands `abstained` on the route doc (no content
row), retrievable by the coverage report — a recorded state, not a silent skip.

**Verify (pipeline acceptance, real dev deployment + real GLM-5.2):**
- Backfill 5 routes that have no `sourceSummary` → each row carries
  `groundingFacts.structured.thinGrounding: true`.
- Sweep the generated paragraphs: no named business, landmark, event, or viewpoint appears
  (none exist in the inputs to ground one).
- A seeded near-empty route (composite score + archetype only) → `enrichmentStatus:
  'abstained'`, zero rows in `curated_route_enrichments`, and the coverage report counts
  it in the abstained bucket.
