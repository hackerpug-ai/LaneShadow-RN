---
stability: PRODUCT_CONTEXT
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Route Enrichment — "Why This Road Is Good"

## Product description

A batch, text-first content-generation pipeline that writes one grounded paragraph per
curated route — *why this road is worth riding* — plus the quality machinery that makes it
trustworthy and the rendering that puts it in front of riders. Generation composes each
paragraph exclusively from that route's real attributes (geometry-derived curvature, length,
elevation where available, the five dimension scores, archetype, region, and scraped source
snippets). A two-layer QA gate (deterministic lint + LLM grounding verifier) blocks any
claim that cannot be traced to a supplied input fact, and the founder's couch test (R2) is
the human ship gate. The paragraph renders inside the existing curated-route detail screen —
no new screens, no new navigation.

## Problem statement

The MVP's weakest step is "see *why* it's good." Today's route detail is a name, five score
bars, a map line, and basic conditions — `curated_route_enrichments` has **0 documents**.
Riders revere Butler Maps precisely because Butler explains *why* a road matters; rider-forum
research (O1, `prds/mvp/11-post-mvp-opportunities.md`) ranks this the single highest-evidence
post-MVP opportunity. Without the "why," discovery output feels like a database row, the
founder won't dogfood it (FOUNDER-BAR), and the app loses to a paper map. The bar is
unforgiving: **one fabricated claim destroys the trust the entire product depends on** —
Returning Rider Rachel abandons apps that oversell.

## Solution summary

1. **Generate** (GEN): after the Trust wave's catalog drop, a resumable batch pipeline —
   a structural clone of the proven geometry backfill — generates one paragraph per
   plottable route via the repo's existing pi-ai model indirection, on a dedicated
   **`enrichment` tier resolving to z.ai GLM-5.2**. Thin-grounding routes (~32% lack source
   prose) generate honestly from attributes alone or abstain; failures never fabricate.
2. **Gate** (QUAL): deterministic lint (length, banned claims, score-consistency) then a
   cross-provider LLM grounding verifier (every claim ↔ input fact) — fail-closed to honest
   absence. The founder's R2 couch test (~10 personally-known roads; 9-of-10 must read true;
   any fabrication is an automatic fail) is the human ship gate.
3. **Render** (WHY): a "Why ride it" section in the existing detail screen, with honest
   absence ("No write-up yet"), a provenance caption, and rider-invisible staleness.
4. **Keep honest over time** (LIFE): input content-hashing flags stale enrichment when a
   route's data changes; scoped regeneration and an operator coverage report make R1 a
   measured fact, not a hope.

**Vision-ready seam (locked):** the grounding-facts snapshot carries an optional visual
block that a future Street View vision pass can fill — no schema migration, no pipeline
rewrite. v1 builds no vision.
