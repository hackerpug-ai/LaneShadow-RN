---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Data Schema

## Current state (verified in-repo, 2026-07-10)

`curated_route_enrichments` exists with **0 documents** and a leftover **web-scraper "rich
tier" validator** (`shared/models/curated-route-enrichments.ts`): required
`fullDescription`, `history`, `roadClassification`, `surfaceMaterial`,
`totalElevationGainM`, `nearestCities`, `ridershipLevel`, `seasonalNotes`,
`safetyWarnings`, `photos[]`, `sources[]`, `recommendedStarts[]`, `fuelStops[]`, extraction
metadata. Index: `by_routeId` only. **This shape is NOT what R1 asks for** — it predates
this PRD and is field-incompatible with grounded generation.

## Proposed final shape (repurpose — data-safe at 0 docs)

```ts
curatedRouteEnrichmentValidator = v.object({
  routeId: v.string(),                       // business key — matches curated_routes.routeId (side-table convention)
  // ---- generated content (v1 renders whyText only) ----
  headline: v.optional(v.string()),          // schema seam — generation deferred to v1.1
  whyText: v.string(),                       // THE "why" — single paragraph, ≤320 chars
  characterTags: v.optional(v.array(v.string())), // schema seam — deferred to v1.1
  // ---- grounding snapshot (input contract; VISION-READY seam) ----
  groundingFacts: v.object({
    schemaVersion: v.number(),
    structured: v.object({
      lengthMiles: v.optional(v.number()), primaryArchetype: v.string(), state: v.string(),
      compositeScore: v.number(), curvatureScore: v.optional(v.number()),
      scenicScore: v.optional(v.number()), technicalScore: v.optional(v.number()),
      trafficScore: v.optional(v.number()), remotenessScore: v.optional(v.number()),
      season: v.optional(v.string()), secondaryTags: v.optional(v.array(v.string())),
      sourceSummary: v.optional(v.string()),
      thinGrounding: v.boolean(),            // true ⇒ no source prose (~32%)
    }),
    geometryDerived: v.optional(v.object({   // derived free from the stored polyline
      curvatureScore: v.number(), curvatureRating: v.string(), kmCornering: v.number(),
      segmentCount: v.number(), spanMiles: v.number(),
    })),
    poi: v.optional(v.array(v.object({ name: v.string(), kind: v.string(), source: v.string() }))), // deferred build
    visual: v.optional(v.object({            // DEFERRED vision seam — ALWAYS absent in v1
      provider: v.string(), capturedAt: v.number(),
      observations: v.array(v.object({ text: v.string(), confidence: v.number() })),
    })),
  }),
  // ---- provenance / lifecycle ----
  promptVersion: v.number(),
  model: v.string(),                          // e.g. "zai:glm-5.2"
  status: v.union(v.literal('generated'), v.literal('qa_passed'),
                  v.literal('qa_failed'), v.literal('stale')),
  qa: v.optional(v.object({
    verdict: v.union(v.literal('pass'), v.literal('fail')),
    issues: v.array(v.string()),              // lint codes + unsupported-claim strings
    checkedAt: v.number(), qaModel: v.optional(v.string()),
  })),
  couchVerdict: v.optional(v.object({          // R2 human couch test
    verdict: v.union(v.literal('true'), v.literal('off'), v.literal('wrong')),
    notes: v.optional(v.string()), reviewedAt: v.number(),
  })),
  inputsContentHash: v.string(),              // SHA-256 of canonical(structured+geometryDerived+poi)+promptVersion+model
  generatedAt: v.number(),
})
```

**Indexes:** `by_routeId` (primary — upserts + detail side-lookup) + **`by_status`** (QA
sweeps, couch sampling, coverage report).

**Route-doc field:** `curated_routes.enrichmentStatus?: 'generated' | 'qa_passed' |
'qa_failed' | 'stale' | 'abstained' | 'failed'` — additive optional union mirroring
`geometryStatus`. Resumability paginates `curated_routes` `by_composite_score` filtered to
`enrichmentStatus` absent ∧ `geometryStatus === 'generated'` (identical to
`listForGeometryBackfill`). `abstained`/`failed` live here (no content row exists for them)
so the coverage report counts honestly.

**Key discipline:** string `routeId` (NOT `v.id('curated_routes')`) — matches the
`curated_route_geometry` side-table convention and survives re-key/re-import.

**Staleness semantics:** `stale` does not unpublish. A `stale` row whose `qa.verdict` is
`pass` keeps serving its `whyText` until regeneration replaces it (UC-WHY-03 / UC-LIFE-01).

## Migration blast radius (same-change realignment)

| Consumer | Impact |
|---|---|
| `convex/db/curation.ts` `fetchEnrichments` + `CuratedRouteEnrichmentDoc` | References OLD scraper fields — retire or rewrite to the new shape in the same commit |
| `convex/curationMetrics.ts` + `dashboardMetrics` | Use `enrichments.length` only — unaffected; `totalEnrichments` becomes meaningful |
| `checkMissingEnrichments` | Reads `curated_routes.enrichmentVersion`, not this table — unaffected |

Validator replacement is data-safe (Convex re-validates existing docs on push; 0 docs exist).
