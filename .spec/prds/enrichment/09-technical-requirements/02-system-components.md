---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# System Components

| Component | Role | New / Modified |
|---|---|---|
| `curated_route_enrichments` table (`shared/models/curated-route-enrichments.ts` + `convex/schema.ts`) | Stores one grounded "why" per route + grounding snapshot + QA verdict + staleness hash | **Modified** — validator repurposed (0 docs, data-safe) |
| `curated_routes.enrichmentStatus` (optional union on the route doc) | O(1) resumability/skip flag mirroring `geometryStatus`; carries `abstained`/`failed` for coverage truth | **Modified** — additive optional field |
| `convex/curatedEnrichment.ts` | Data-access: `listForEnrichmentBackfill`, `getRouteForEnrichment`, `getEnrichmentForRoutes`, `upsertEnrichment`, `patchEnrichmentStatus`, `clearEnrichment` | **New** |
| `convex/actions/curatedEnrichment.ts` (`'use node'`) | Generation: `generateForRoute`, `backfill(sample,cursor,batchSize)`; builds grounding facts, calls pi-ai (zai GLM-5.2), persists | **New** |
| `convex/curatedEnrichmentFacts.ts` | Pure grounding-fact extraction: polyline decode → `calculateCurvatureScore`, span, normalization, thin-grounding flag, canonical `inputsContentHash` | **New** (pure, unit-justified) |
| `convex/curatedEnrichmentQa.ts` (`'use node'`) | QA gate: deterministic lint + LLM grounding verifier; `qa`, `resetFailed`, `sampleForReview`, `recordCouchVerdict` | **New** |
| `convex/curatedEnrichmentLint.ts` | Pure lint rules: length/format, banned claims, score-consistency | **New** (pure, unit-justified) |
| `scripts/backfill-curated-enrichment.ts` | Resumable CLI driver (`--top/--sample/--all/--cursor`) via `npx convex run` | **New** |
| `getCuratedRouteDetail` (`convex/curatedRoutes.ts`) | Public read path — optional `enrichment` sub-object via `by_routeId` side-lookup; serves `qa_passed` (and stale-with-prior-pass) only | **Modified** — additive optional return fields |
| `components/ui/enrichment-section.tsx` (`EnrichmentSection`) | Pure presentational "Why ride it" block (states: enriched / absent) mirroring `ScoreDimensionBarSection` | **New** |
| `app/(app)/curated-route/[id].tsx` | Detail screen — renders `EnrichmentSection` between Summary and Scores; combined-absence rule | **Modified** — JS-only (Metro-served) |
| `convex/actions/agent/lib/models.ts` + `convex/lib/env.ts` | Add `enrichment` tier (`zai`/`glm-5.2`) + `Z_AI_API_KEY` export + stale comment fix | **Modified** — one tuple + one export |
| `convex/db/curation.ts` (`fetchEnrichments`, `CuratedRouteEnrichmentDoc`) | Legacy scraper-schema consumers | **Modified** — retire/realign in the same change (migration blast radius) |
