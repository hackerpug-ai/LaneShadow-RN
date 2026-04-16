---
stability: CONSTITUTION
last_validated: 2026-04-16
prd_version: 1.0.1
---

# Technical Requirements

> **Path Convention (2026-04-16):** This initiative runs in parallel with the native-rewrite restructure PRD, which moves `convex/` → `server/convex/`. All `convex/` paths in this document resolve to `server/convex/` after that restructure merges. Pipeline Python code (`scripts/curation/pipeline/`) is unaffected — it stays at its current location.

## Mobile UI Scope Note (2026-04-16)

Epic 11 (Mobile UI — New Field Display) has been deferred to the [native-rewrite PRD](../../native-rewrite/07-native-app-backlog.md). The client is transitioning from React Native to native Kotlin/Swift. The pipeline still produces all data fields listed below (surface, qualityTier, bestMonths, description, rating, sourceCount, mentionFrequency, weatherSuitability) — only the React Native consumption layer is deferred. The Convex schema and API contract are unchanged.

## System Components

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| USDoTScenicBywaysSource | `pipeline/sources/scenic_byways.py` | Ingest 799-route US Scenic Byways GIS layer from Koordinates (GeoJSON/Shapefile) |
| CurvatureDiscovery | `pipeline/sources/curvature_discovery.py` | Consume adamfranco/curvature output to discover high-curvature unnamed roads from OSM |
| RiderMagSource | `pipeline/sources/rider_mag.py` | Extract Rider Magazine 50 Best Roads as editorial ground truth |
| RedditSource | `pipeline/sources/reddit.py` | Fetch motorcycle route mentions from Reddit via public API |
| ADVRiderSource | `pipeline/sources/advrider.py` | Fetch ADVRider regional forum posts via RSS feeds |
| Deduplicator | `pipeline/dedup/deduplicator.py` | Semantic dedup: post embedding → Convex vectorSearch → LLM rerank → auto-merge / arbitration / new route |
| GeospatialIndex | `server/convex/geospatialIndex.ts` | `@convex-dev/geospatial` handles mobile map viewport queries (nearest-neighbor, rectangular range); `server/convex/semanticSearch.ts` (NEW file, Epic 3 INF-006) handles vector search via `ctx.vectorSearch()` on the `by_embedding` index |
| PostExtractionClient | `pipeline/nlp/extraction_client.py` | Single LLM call per post (Claude Haiku 4.5) returning a structured `PostExtraction` (mentions, sentiment, aspects, attributes, warnings) — replaces the prior GLM two-stage pipeline |
| MentionAggregator | `pipeline/nlp/aggregator.py` | Aggregate mentions per route with authority-weighted sentiment (reads from `route_posts_raw` via `route_matches`) |
| ExtractionCache | `pipeline/nlp/cache.py` | Cache PostExtraction artifacts by `(post_id, extraction_schema_version)` to avoid redundant LLM calls |
| GroundTruthBuilder | `pipeline/extraction/ground_truth_builder.py` | Build ground truth dataset from editorial sources |
| ExtractionValidator | `pipeline/extraction/validator.py` | Measure Haiku extraction accuracy against ground truth |
| QualityFloor | `pipeline/quality/floor.py` | Enforce minimum data quality before catalog entry |
| CoverageAnalyzer | `pipeline/quality/coverage.py` | Compute post-pipeline coverage metrics |
| DataQualityReport | `pipeline/quality/report.py` | Generate comprehensive quality report (JSON + markdown) |
| PipelineOrchestrator | `pipeline/orchestrator.py` | Single entry point sequencing all pipeline stages |
| HPMSSource | `pipeline/enrichment/hpms_client.py` | Download HPMS GeoJSON; spatial join AADT + IRI to route centroids (measured traffic + pavement quality) |
| WeatherClient | `pipeline/enrichment/weather_client.py` | Query NWS Climate Normals for route centroid; compute weatherSuitability + bestMonths from monthly precip/temp/wind averages |

### Modified Components

| Component | Path | Changes |
|-----------|------|---------|
| Route dataclass | `pipeline/models.py` | Add: location (GeoJSON Point), description, rating, designation, source_url, source_refs, highway_number, elevation_gain_m, surface, aadt, aadt_median, aadt_max, pavement_iri, mention_frequency, candidate_identifiers, search_text, embedding, match_confidence, llm_reconciliation_log |
| EnrichedRoute dataclass | `pipeline/models.py` | Add: mention_frequency_score, designation_score, elevation_drama_score, road_quality_score, low_traffic_score, weather_suitability, best_months, source_count, quality_tier |
| Composite scoring | `pipeline/scoring/composite.py` | Realign WEIGHTS to research formula; replace placeholder _compute_traffic_score with HPMS AADT lookup; replace condition proxy with HPMS IRI lookup; wire OSM curvature (already implemented) |
| Archetype classifier | `pipeline/classification/archetype.py` | Activate adventure/mountain/desert rules using enrichment data (surface, elevation) |
| Archetype classifier | `pipeline/classification/archetype.py` | Activate adventure/mountain/desert rules using enrichment data |
| Extraction schema | `pipeline/extraction/schema.py` | Bump EXTRACTION_SCHEMA_VERSION=2; add `PostExtraction` Pydantic v2 BaseModel (road_name_mentions, highway_refs, state_refs, landmark_refs, sentiment, aspect_scores, attributes, warnings, extraction_confidence, extraction_model, extraction_cost); add `CACHE_POLICY` + `DEFAULT_EXTRACTION_MODEL` constants; preserve v1 `RouteAttributes` for backward compat |
| Extraction client | `pipeline/extraction/client.py` | Route single-call LLM extractions through the PostExtraction contract; add token tracking |
| Calibration gate | `pipeline/extraction/calibration.py` | Integrate GroundTruthBuilder; add per-archetype calibration; output to DataQualityReport |
| OSM client | `pipeline/enrichment/osm_client.py` | Add name-based OSM way lookup; integrate curvature algorithm; extract surface/smoothness tags for surface_type field |
| Convex push | `pipeline/sync/convex_push.py` | Add new score fields, source_refs, quality_tier, location (GeoJSON), searchEmbedding, candidateIdentifiers, searchText, matchConfidence, llmReconciliationLog to serialization; reduce batch size to 10 due to embedding payload size |
| GeospatialIndex | `server/convex/geospatialIndex.ts` | `@convex-dev/geospatial` handles mobile map viewport queries; `server/convex/semanticSearch.ts` (NEW file, Epic 3 INF-006) handles vector search via `ctx.vectorSearch()` on the `by_embedding` index |
| Convex schema | `server/convex/schema.ts` | Add new optional fields (searchEmbedding, candidateIdentifiers, searchText, matchConfidence, llmReconciliationLog + enrichment outputs + scoring outputs); register `vectorIndex('by_embedding', { dimensions: 1536, filterFields: ['state'] })`; add `route_posts_raw` and `route_matches` tables (replaces the previously-planned `route_mentions` table) |
| Base scraper | `pipeline/sources/base_scraper.py` | No structural changes — new sources extend BaseScraper as-is |

## Data Entities

### Route (extended)

```
route_id: str
name: str
state: str
source: str
centroid_lat: float
centroid_lng: float
length_miles: Optional[float]
bounds_ne_lat/lng, bounds_sw_lat/lng: Optional[float]
location: Optional[dict]            # NEW — GeoJSON Point for Convex GeospatialIndex
description: Optional[str]           # NEW
rating: Optional[float]              # NEW
designation: Optional[str]           # NEW
source_url: Optional[str]            # NEW
source_refs: list[str]               # NEW — dedup provenance
highway_number: Optional[str]        # NEW
elevation_gain_m: Optional[float]    # NEW
surface: Optional[str]               # NEW — paved|gravel|dirt|mixed
aadt: Optional[int]                  # NEW — annual avg daily traffic (HPMS)
aadt_median: Optional[float]         # NEW — median AADT across sampled segments
aadt_max: Optional[float]            # NEW — highest AADT segment (congestion hotspot)
pavement_iri: Optional[float]        # NEW — pavement roughness from HPMS IRI
mention_frequency: Optional[float]   # NEW — NLP-derived
candidate_identifiers: list[str]      # NEW — nicknames, aliases, landmarks — used for search_text generation
search_text: Optional[str]            # NEW — concatenated text used to generate embedding
embedding: Optional[list[float]]      # NEW — 1536-dim from OpenAI text-embedding-3-small
match_confidence: Optional[float]     # NEW — 0.0-1.0 from most recent LLM match decision
llm_reconciliation_log: list[dict]    # NEW — list of LLM reconciliation decision records
```

### EnrichedRoute (extended)

```
(all Route fields)
composite_score: float
curvature_score: float
scenic_score: float
technical_score: float
traffic_score: float
remoteness_score: float
mention_frequency_score: float       # NEW
designation_score: float             # NEW
elevation_drama_score: float         # NEW
road_quality_score: float            # NEW
low_traffic_score: float             # NEW
weather_suitability: Optional[float] # NEW — 0.0-1.0 composite from climate data
best_months: Optional[list[str]]     # NEW — ["May", "Jun", "Sep", "Oct"]
primary_archetype: str
secondary_tags: list[str]
one_liner: str
summary: str
badges: list[str]
season: str                          # Recomputed from best_months instead of defaulting to "year_round"
source_count: int                    # NEW
quality_tier: str                    # NEW — premium|standard|minimal
content_version: int
```

### PostExtraction (new — Pydantic v2 BaseModel, Epic 3 INF-005)

Canonical structured output from a single LLM extraction call over a community post. Produced once per raw post and stored in Convex `route_posts_raw.payload`. Downstream matching, enrichment, and reconciliation read from this shape.

```
road_name_mentions: list[str]        # ["Tail of the Dragon", "The Dragon", "Deals Gap"]
highway_refs: list[str]              # ["US-129", "I-40", "SR-28"]
state_refs: list[str]                # ["TN", "Tennessee"]
landmark_refs: list[str]             # ["Chattanooga", "Great Smoky Mountains"]
sentiment: Literal["positive", "neutral", "negative"]
aspect_scores: dict[str, float]      # curvature, scenery, traffic, surface_quality, elevation_drama (0.0-1.0)
attributes: dict[str, bool]          # has_gas, has_food, wet_weather_ok, beginner_friendly, requires_adv_bike, closed_in_winter
warnings: list[str]                  # construction, closures, hazards
extraction_confidence: float         # 0.0-1.0, model-reported
extraction_model: str                # e.g. "claude-haiku-4-5-20251001"
extraction_cost: float               # USD
extracted_at: datetime               # UTC
extraction_schema_version: int       # = EXTRACTION_SCHEMA_VERSION (2)
```

Pydantic `model_config = {"extra": "forbid"}` strictly rejects unknown LLM output fields as a mild prompt-injection defense.

### LLMExtractionArtifact (new — module-level dataclass, Epic 3 INF-002)

Python-side record of a single LLM extraction run, used as the canonical shape for push to Convex `route_posts_raw`.

```
artifact_id: str                     # uuid4
post_id: str                         # upstream post identifier
post_url: str
source: str                          # "reddit" | "advrider" | "rider_magazine" | ...
raw_text: str                        # the full post text sent to the LLM
extraction_schema_version: int       # mirrors EXTRACTION_SCHEMA_VERSION
extraction_model: str                # "claude-haiku-4-5-20251001"
extraction_cost: float               # USD
extracted_at: str                    # ISO timestamp
payload: dict                        # serialized PostExtraction.model_dump()
extraction_confidence: Optional[float]
```

### RouteMatch (new — module-level dataclass, Epic 3 INF-002)

Audit record for a (post → route) match decision made via vector search + LLM rerank. Pushed to Convex `route_matches`.

```
match_id: str                        # uuid4
post_id: str
route_id: str
match_confidence: float              # 0.0-1.0 from LLM rerank
match_reasoning: str                 # LLM's stated reason for the match
cosine_similarity: float             # 0.0-1.0 from vector search
rerank_model: str                    # "claude-haiku-4-5-20251001"
rerank_cost: float                   # USD
matched_at: str                      # ISO timestamp
is_arbitrated: bool                  # True if mid-confidence required LLM arbitration
arbitration_notes: Optional[str]
```

### QualityRejection (new)

```
route_id: str
source: str
reason: str
missing_fields: list[str]
rejected_at: str
```

## Convex Schema

### curated_routes Table

```typescript
import { defineTable, v } from "convex/schema";

export default defineTable({
  // Existing fields
  name: v.string(),
  state: v.string(),
  source: v.string(),
  centroidLat: v.number(),
  centroidLng: v.number(),
  lengthMiles: v.optional(v.number()),
  boundsNeLat: v.optional(v.number()),
  boundsNeLng: v.optional(v.number()),
  boundsSwLat: v.optional(v.number()),
  boundsSwLng: v.optional(v.number()),
  
  // NEW geospatial field for Convex GeospatialIndex
  location: v.optional(v.object({
    type: v.literal("Point"),
    coordinates: v.array(v.number()),  // [lng, lat] per GeoJSON
  })),
  
  // NEW semantic matching fields (Epic 3 INF-003; all v.optional)
  searchEmbedding: v.optional(v.array(v.number())),   // 1536 floats from text-embedding-3-small
  searchText: v.optional(v.string()),                 // text used to generate embedding
  candidateIdentifiers: v.optional(v.array(v.string())),
  matchConfidence: v.optional(v.number()),            // 0.0-1.0 from most recent LLM match decision
  llmReconciliationLog: v.optional(
    v.array(
      v.object({
        runId: v.string(),
        reconciledAt: v.number(),
        conflictsResolved: v.number(),
        notes: v.string(),
      }),
    ),
  ),

  // NEW enrichment fields (all v.optional for client compatibility)
  description: v.optional(v.string()),
  rating: v.optional(v.number()),
  designation: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  sourceRefs: v.optional(v.array(v.string())),
  highwayNumber: v.optional(v.string()),
  elevationGainM: v.optional(v.number()),
  surface: v.optional(v.string()),
  aadt: v.optional(v.number()),
  aadtMedian: v.optional(v.number()),
  aadtMax: v.optional(v.number()),
  pavementIri: v.optional(v.number()),
  mentionFrequency: v.optional(v.number()),
  
  // NEW scoring fields
  mentionFrequencyScore: v.optional(v.number()),
  designationScore: v.optional(v.number()),
  elevationDramaScore: v.optional(v.number()),
  roadQualityScore: v.optional(v.number()),
  lowTrafficScore: v.optional(v.number()),
  weatherSuitability: v.optional(v.number()),
  bestMonths: v.optional(v.array(v.string())),
  sourceCount: v.optional(v.number()),
  qualityTier: v.optional(v.string()),
})
  .index("by_state", ["state"])
  .index("by_source", ["source"])
  .index("by_quality_tier", ["qualityTier"])
  // NEW vector index for semantic matching (Epic 3 INF-003)
  .vectorIndex("by_embedding", {
    vectorField: "searchEmbedding",
    dimensions: 1536,
    filterFields: ["state"],
  });
```

### vectorIndex on curated_routes (NEW — Epic 3 INF-003)

The `curated_routes` table registers a native Convex vector index for semantic matching (already shown inline in the table definition above). Vector dimensions are locked to 1536 to match OpenAI `text-embedding-3-small`. The `filterFields: ["state"]` option enables state-scoped retrieval during vector search.

```typescript
curated_routes: defineTable(curatedRouteValidator)
  // ... existing indexes unchanged
  .vectorIndex("by_embedding", {
    vectorField: "searchEmbedding",
    dimensions: 1536,
    filterFields: ["state"],
  })
```

Queried via `ctx.vectorSearch("curated_routes", "by_embedding", { vector, limit, filter })` from a Convex action. Wrapper queries live in `server/convex/semanticSearch.ts` (Epic 3 INF-006).

### route_posts_raw Table (NEW — Epic 3 INF-003)

Raw LLM extraction artifacts per community post. One row per extracted post. The `payload` nested object preserves the full `PostExtraction` shape so a downstream process can re-run matching against a different model without losing the extraction.

```typescript
route_posts_raw: defineTable({
  postId: v.string(),                        // upstream post identifier
  source: v.string(),                        // reddit|advrider|rider_magazine|...
  postUrl: v.string(),
  postAuthor: v.optional(v.string()),
  postScore: v.optional(v.number()),         // upvotes / engagement
  postedAt: v.optional(v.number()),          // unix ms
  rawText: v.string(),                       // full post text
  extractionSchemaVersion: v.number(),       // mirrors EXTRACTION_SCHEMA_VERSION
  extractionModel: v.string(),
  extractionCost: v.number(),
  extractedAt: v.number(),                   // unix ms
  extractionConfidence: v.optional(v.number()),
  payload: v.object({
    roadNameMentions: v.array(v.string()),
    highwayRefs: v.array(v.string()),
    stateRefs: v.array(v.string()),
    landmarkRefs: v.optional(v.array(v.string())),
    sentiment: v.string(),                   // positive|neutral|negative
    aspectScores: v.optional(v.record(v.number())),
    attributes: v.optional(v.record(v.boolean())),
    warnings: v.optional(v.array(v.string())),
  }),
})
  .index("by_postId", ["postId"])
  .index("by_source_and_extracted_at", ["source", "extractedAt"])
  .index("by_extraction_schema_version", ["extractionSchemaVersion"]);
```

### route_matches Table (NEW — Epic 3 INF-003)

Audit log of (post → route) match decisions. One row per decision; a single post can yield zero, one, or many match rows (e.g., mid-confidence arbitrated cases, or re-runs with a newer rerank model).

```typescript
route_matches: defineTable({
  matchId: v.string(),                       // uuid4
  postId: v.string(),                        // FK-ish to route_posts_raw.postId
  routeId: v.id("curated_routes"),
  matchConfidence: v.number(),               // 0.0-1.0 from LLM rerank
  cosineSimilarity: v.number(),              // 0.0-1.0 from vector search
  matchReasoning: v.string(),                // LLM's stated reason
  rerankModel: v.string(),
  rerankCost: v.number(),
  matchedAt: v.number(),                     // unix ms
  isArbitrated: v.boolean(),                 // true if mid-confidence required LLM arbitration
  arbitrationNotes: v.optional(v.string()),
})
  .index("by_postId", ["postId"])
  .index("by_routeId", ["routeId"])
  .index("by_routeId_and_confidence", ["routeId", "matchConfidence"]);
```

The previously-planned `route_mentions` table is replaced by `route_posts_raw` (raw LLM extraction artifacts) + `route_matches` (audit log of match decisions). This separation preserves the extraction artifact even if matching fails or is re-run with a different model.

### GeospatialIndex (mobile viewport queries only)

Note: After the Epic 3 semantic matching pivot, `@convex-dev/geospatial` is no longer the dedup primitive. It remains as the mobile map viewport primitive — "what routes are near me / inside this map rectangle" — and is distinct from `server/convex/semanticSearch.ts` (Epic 3 INF-006), which handles vector search on the `by_embedding` index.

```typescript
// server/convex/geospatialIndex.ts
import { GeospatialIndex } from "@convex-dev/geospatial";
import { components } from "./_generated/api";

export const geospatial = new GeospatialIndex(components.curated_routes, {
  // Geospatial field on curated_routes documents
  geospatialField: "location",  // { type: "Point", coordinates: [lng, lat] }
  // Optional: filter by state before geospatial query
  fullTextSearchField: "state",
});

// Usage — mobile viewport queries (nearestRoutes / bounding box):
const nearby = await geospatial.nearest({
  point: { lat: targetLat, lng: targetLng },
  maxDistance: 5000,  // 5km in meters
  filter: (q) => q.eq("state", targetState),
  limit: 100,
});

// Rectangular range query:
const inBounds = await geospatial.query({
  region: {
    type: "Rectangle",
    southwest: { lat: swLat, lng: swLng },
    northeast: { lat: neLat, lng: neLng },
  },
  filter: (q) => q.eq("surface", "paved"),
  limit: 500,
});
```

### semanticSearch wrapper (NEW — Epic 3 INF-006)

The canonical vector-search access point. Lives in `server/convex/semanticSearch.ts` and exposes typed query/action wrappers around `ctx.vectorSearch('curated_routes', 'by_embedding', ...)`.

```typescript
// server/convex/semanticSearch.ts (Epic 3 INF-006)
import { action } from "./_generated/server";
import { v } from "convex/values";

export const findCandidateRoutesByEmbedding = action({
  args: {
    embedding: v.array(v.number()),  // 1536-dim query vector
    limit: v.optional(v.number()),
    stateFilter: v.optional(v.string()),
  },
  handler: async (ctx, { embedding, limit = 10, stateFilter }) => {
    const results = await ctx.vectorSearch("curated_routes", "by_embedding", {
      vector: embedding,
      limit,
      filter: stateFilter
        ? (q) => q.eq("state", stateFilter)
        : undefined,
    });
    return results;  // [{ _id, _score }, ...] sorted by cosine similarity
  },
});
```

## Client Compatibility Guidance

### React Native (Mobile App)

All new Convex fields are `v.optional()`, which means they return `undefined` for existing documents. Mobile clients must handle undefined values safely:

```typescript
// ❌ WRONG — will crash on undefined
<Text>{route.description}</Text>

// ✅ CORRECT — safe access with default
<Text>{route.description ?? "No description"}</Text>

// ❌ WRONG — will crash on undefined
<Text>Rating: {route.rating} / 5</Text>

// ✅ CORRECT — conditional render
{route.rating !== undefined && (
  <Text>Rating: {route.rating} / 5</Text>
)}
```

### TypeScript Types

Mobile TypeScript types must mark all new fields as optional:

```typescript
interface Route {
  // Existing fields (unchanged)
  name: string;
  state: string;
  // ...
  
  // New fields (all optional)
  location?: {  // GeoJSON Point for Convex GeospatialIndex (mobile viewport)
    type: "Point";
    coordinates: [number, number];  // [lng, lat]
  };
  description?: string;
  rating?: number;
  designation?: string;
  sourceUrl?: string;
  sourceRefs?: string[];
  highwayNumber?: string;
  elevationGainM?: number;
  surface?: string;
  aadt?: number;
  aadtMedian?: number;
  aadtMax?: number;
  pavementIri?: number;
  mentionFrequency?: number;
  mentionFrequencyScore?: number;
  designationScore?: number;
  elevationDramaScore?: number;
  roadQualityScore?: number;
  lowTrafficScore?: number;
  weatherSuitability?: number;
  bestMonths?: string[];
  sourceCount?: number;
  qualityTier?: "premium" | "standard" | "minimal";

  // NEW semantic matching fields (Epic 3 INF-003)
  // Typically elided on mobile read paths — the 1536-float embedding is
  // a large payload and mobile clients never need it. Convex pipeline code,
  // backend actions, and admin tools consume these.
  searchEmbedding?: number[];          // 1536-dim text-embedding-3-small
  searchText?: string;
  candidateIdentifiers?: string[];
  matchConfidence?: number;            // 0.0-1.0
  llmReconciliationLog?: Array<{
    runId: string;
    reconciledAt: number;
    conflictsResolved: number;
    notes: string;
  }>;
}
```

### Deployment Strategy

If older app versions are in the wild, consider a feature flag:

```typescript
// Convex query
export const getRoute = query({
  args: { id: v.id("curated_routes") },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.id);
    if (!route) return null;
    
    // Return null for new fields if feature disabled
    return {
      ...route,
      // Only expose new fields if rollout enabled
      ...(isEnrichmentRolloutEnabled ? {} : {
        description: undefined,
        rating: undefined,
        // ... other new fields
      })
    };
  }
});
```

## Architecture Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| AD-001 | Semantic matching via Convex native vectorIndex + LLM reranking | Route catalog is embedded once via OpenAI `text-embedding-3-small` (1536-dim, `search_text` built from name + state + highway + candidate_identifiers). Community posts run through a single LLM extraction call returning a `PostExtraction`, whose identifiers are embedded and searched against the route index via `ctx.vectorSearch('curated_routes', 'by_embedding', ...)`. Top-K candidates are reranked by Claude Haiku 4.5 for the confident match, with reasoning stored in `route_matches.matchReasoning`. Cosine similarity > 0.92 auto-merges, 0.75-0.92 queues LLM arbitration, < 0.75 creates a new route. Replaces the previously-planned rapidfuzz three-stage cascade; see Epic 3 EPIC.md Architectural Decision section for rationale (nicknames, contextual refs, ambiguous names, regional shorthand all handled by semantics + LLM world knowledge where string matching fails). |
| AD-002 | Single-call LLM extraction returning a structured `PostExtraction` | One LLM call per post (`scripts/curation/pipeline/extraction/schema.py`, Epic 3 INF-005) returns road_name_mentions, highway_refs, state_refs, landmark_refs, sentiment, aspect_scores, attributes, warnings, and extraction_confidence in one round trip. Claude Haiku 4.5 via Anthropic tool-use with the PostExtraction Pydantic schema. Replaces the two-stage GLM pipeline — the single call is cheap enough (~$0.002 per post) that per-stage keyword filtering is no longer a cost lever. Estimated $200 for 100k posts. Pydantic `model_config={'extra': 'forbid'}` provides a mild prompt-injection defense by rejecting unknown LLM output fields. |
| AD-003 | Realign weights to research formula | community_rating 0.05→0.15 (3x). mention_frequency 0→0.10. Calibration gate validates before deployment. |
| AD-004 | Quality floor as phased rollout (soft → hard) with tiered marking | Phase 1-2: mark as quality_tier: "minimal", include in catalog, track engagement. Phase 3: hard reject routes with 0 engagement. Allows data-driven threshold tuning. |
| AD-005 | Convex Native vectorIndex as the dedup primitive | Cosine-similarity vector search via `ctx.vectorSearch('curated_routes', 'by_embedding', { vector, limit, filter })` against the 1536-dim `by_embedding` index. Single-DB architecture — no external vector DB (Pinecone/Weaviate/pgvector) dependency. `@convex-dev/geospatial` (still used for mobile viewport queries in AD-010) is no longer the dedup primitive; semantic search subsumes the old "nearest route at this coordinate" heuristic. |
| AD-006 | Pipeline orchestrator as single Python entry point | Replaces ad-hoc script execution. Enables cross-stage error handling, checkpointing, resumability. |
| AD-007 | Incremental source addition: Scenic Byways → Reddit → ADVRider | Lowest-risk first. Each validated with quality floor + dedup before adding next. |
| AD-008 | Consume adamfranco/curvature as pre-computed data | Multi-hour batch on 11GB PBF. Run once, cache output. Pipeline consumes lookup table from the canonical artifact path `data/curvature/adamfranco-us-curvature.jsonl`, with `--artifact` / `CURVATURE_ARTIFACT_PATH` as explicit overrides. If no artifact exists at any of those locations, the consumer must fail loudly instead of guessing. |
| AD-009 | Convex nullable columns with client compatibility handling | New fields added as v.optional() to existing curated_routes table. New `route_posts_raw` table for raw LLM extraction artifacts and `route_matches` audit table for match decisions (replaces the previously-planned `route_mentions` table). Requires deployment coordination with mobile app to handle undefined values safely. |
| AD-010 | Convex Native Geospatial adoption | Use @convex-dev/geospatial (Beta) for mobile map viewport queries: nearest-neighbor with maxDistance (5km), rectangular range queries, point-in-polygon. Replaces PostGIS external service. Single-DB architecture simplifies deployment and reduces cost. Note: The primary matching primitive is now `server/convex/semanticSearch.ts` (Epic 3 INF-006) using the native `ctx.vectorSearch()` API on the `by_embedding` vectorIndex. `@convex-dev/geospatial` handles viewport-style queries (nearestRoutes for "what's near me", bounding box for map panning) — not semantic matching. |
| AD-011 | Measured data integration (HPMS + NWS Climate) | Replace placeholder scoring with objective telemetry: HPMS AADT → trafficScore, HPMS IRI → roadQualityScore, NWS Climate Normals → weatherSuitability + bestMonths. Single national download, spatial join to route centroids. ~3.5 days extra effort. |
| AD-012 | Tiered archetype thresholds for coverage gaps | Common archetypes (twisties, mountain, coastal, scenic_byway): 50 routes. Niche archetypes (adventure, desert): 20 routes. Reflects realistic availability by category. |

## Architecture Diagram

```
                                    SOURCES
    ┌─────────────┬──────────────┬──────────────┬─────────────┐
    │ Scenic      │ Curvature    │ Rider Mag    │ motorcycle- │
    │ Byways GIS  │ Discovery    │ 50 Best      │ roads       │
    └──────┬──────┴──────┬───────┴──────┬───────┴──────┬──────┘
           │             │              │              │
           │             │              │              ▼
           │             │              │       ┌─────────────┐
           │             │              │       │ bestbiking- │
           │             │              │       │ roads (BBR) │
           │             │              │       └──────┬──────┘
           │             │              │              │
           └──────┬──────┴──────┬───────┴──────────────┘
                  │             │
    ┌─────────────┴─────────────┴──────────────┐
    │         MEASURED DATA (Static)          │
    │  HPMS (AADT + IRI)  NWS Climate Normals │
    └────────────────────┬──────────────────────┘
                         │
                  ┌──────┴──────┐
                  ▼             ▼
           ┌─────────────────────────┐
           │     DEDUPLICATOR        │
           │  embed → vectorSearch   │
           │  → LLM rerank → merge/  │
           │  arbitrate / new route  │
           └───────────┬─────────────┘
                       │
                       ▼
           ┌─────────────────────────┐
           │     QUALITY FLOOR       │
           │  desc OR rating OR      │
           │  designation OR curv    │
           └───────────┬─────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
    ┌──────────────┐   ┌──────────────────┐
    │ CALIBRATION  │   │ COMMUNITY NLP    │
    │ GATE         │   │                  │
    │ (ground      │   │ ADVRider RSS     │
    │  truth 80%)  │   │ Reddit API       │
    └──────┬───────┘   │     ↓            │
           │           │ Single-call LLM  │
           ▼           │ PostExtraction   │
    ┌──────────────┐   │ (Claude Haiku    │
    │ HAIKU        │   │  4.5, Anthropic  │
    │ EXTRACTION   │   │  tool-use)       │
    │ (temp=0,     │   │     ↓            │
    │  Instructor) │   │ route_posts_raw  │
    └──────┬───────┘   │     ↓            │
           │           │ embed identifiers│
           │           │     ↓            │
           │           │ vectorSearch +   │
           │           │ LLM rerank       │
           │           │     ↓            │
           │           │ route_matches    │
           │           └────────┬─────────┘
           │                    │
           ▼                    ▼
    ┌─────────────────────────────────┐
    │        COMPOSITE SCORING        │
    │  curviness 20% | scenery 15%   │
    │  community 15% | mention  10%  │
    │  traffic  10%  | condition 10% │ ← NOW: HPMS AADT, HPMS IRI
    │  elevation 10% | designation 5%│
    │  remoteness 5%                  │
    └──────────────┬──────────────────┘
                   │
                   ▼
    ┌─────────────────────────────────┐
    │     ARCHETYPE CLASSIFIER        │
    │  twisties|mountain|coastal|     │
    │  adventure|scenic_byway|desert  │
    └──────────────┬──────────────────┘
                   │
                   ▼
    ┌─────────────────────────────────┐
    │     DATA QUALITY REPORT         │
    │  coverage | completeness |      │
    │  distributions | CI gate        │
    └──────────────┬──────────────────┘
                   │
                   ▼
    ┌─────────────────────────────────────┐
    │        CONVEX PUSH                  │
    │  curated_routes (ext. table)        │
    │    + vectorIndex by_embedding       │
    │  route_posts_raw (NEW)              │
    │  route_matches (NEW)                │
    │  geospatialIndex.ts (viewport only) │
    │  semanticSearch.ts (vector wrapper) │
    │  optional new fields                │
    └─────────────────────────────────────┘
```

## External Dependencies

| Library | Purpose | Docs |
|---------|---------|------|
| @convex-dev/geospatial | Convex Native Geospatial component for mobile map viewport queries (nearest-neighbor, range) — no longer used as a dedup primitive | https://www.convex.dev/components/geospatial |
| Convex native vectorIndex | Built into Convex core — no extra package. Used via `ctx.vectorSearch('curated_routes', 'by_embedding', {...})` in `server/convex/semanticSearch.ts` (Epic 3 INF-006). Primary dedup and match primitive. | https://docs.convex.dev/search/vector-search |
| openai | OpenAI SDK for `text-embedding-3-small` (1536-dim embeddings); used by Epic 3 INF-004 batch embedding pipeline. OpenAI is used **for embeddings only**; all reasoning (extraction, rerank, enrichment, reconciliation) goes through Anthropic/Claude. | https://github.com/openai/openai-python |
| shapely | Geometry operations for GIS centroid/bounds computation | https://shapely.readthedocs.io/ |
| fiona | Read Shapefiles/GeoJSON for Scenic Byways GIS | https://fiona.readthedocs.io/ |
| praw | Reddit API wrapper for subreddit ingestion | https://praw.readthedocs.io/ |
| anthropic | Anthropic SDK for Claude Haiku 4.5 (single-call `PostExtraction` extraction, LLM rerank, enrichment, reconciliation) via tool-use / structured output | https://docs.anthropic.com/ |
| srtm.py | SRTM elevation data access for elevation profiles | https://github.com/tkrajina/srtm.py |
| scipy | Spearman correlation in calibration (already used) | https://docs.scipy.org/doc/scipy/ |
| **HPMS Data** | **FHWA Highway Performance Monitoring System — AADT + IRI (pavement quality)** | https://data.transportation.gov/stories/s/Data-Access-for-Highway-Performance-Monitoring-Sys/3uu4-47sa |
| **NCEI Climate Normals** | **NOAA climate normals for weatherSuitability + bestMonths** | https://www.ncei.noaa.gov/products/climate-normals |

## Scoring Weight Configuration

### Current (diverged from research)

```yaml
curviness: 0.25
scenery: 0.15
traffic: 0.15
condition: 0.10
osm_curvature: 0.15
elevation_drama: 0.10
fhwa_designation: 0.05
community_rating: 0.05
# mention_frequency: ABSENT
```

### Target (aligned to research)

```yaml
curviness: 0.20         # was 0.25 — reduced until OSM curvature is validated
scenery: 0.15           # unchanged
traffic: 0.10           # was 0.15 — NOW: HPMS AADT (measured data, not LLM text)
road_condition: 0.10    # NOW: HPMS IRI (measured pavement quality, not LLM text)
elevation_drama: 0.10   # unchanged
fhwa_designation: 0.05  # was 0.10 — derived from AgencyTags column (NSB/STATE/USFS/NPS/BLM); see Epic 2 DECISIONS.md (2026-04-13)
community_rating: 0.15  # was 0.05 — only actual rider experience signal
mention_frequency: 0.10 # NEW — rider behavior from forums
remoteness: 0.05        # unchanged
```

### Authority Weights (for community signals)

```yaml
rider_magazine: 1.0
revzilla_common_tread: 0.8
advrider: 0.6
reddit_r_advrider: 0.5
reddit_r_motorcyclesroadtrip: 0.5
reddit_r_motorcycles: 0.4
```

### Dedup Source Priority (highest first)

```yaml
1. fhwa_gis            # Epic 2 baseline — DOT ArcGIS layer 107 superset (~645 routes, BASE-000)
2. scenic_byways       # Epic 4 upgrade — Koordinates 799-feature GIS (higher-fidelity geometry)
3. rider_magazine      # Editorial ground truth
4. motorcycleroads     # Community database
5. bestbikingroads     # Community database (existing ~17k backbone)
6. curvature_discovery # Geometric
7. reddit              # Forum
8. advrider            # Forum
```

*Revised 2026-04-12: twtex, usfs_mvum, and bdr removed — see `01-scope.md` Out-of-Scope section for rationale.*
*Revised 2026-04-13: `fhwa_gis` clarified as the Epic 2 baseline (DOT ArcGIS superset ~645 routes, not the predecessor PRD's aspirational "184-route data.gov CSV"). `scenic_byways` clarified as the Epic 4 Koordinates enrichment (geometry quality upgrade over `fhwa_gis`, not a raw volume expansion). Priority order preserves the "Epic 4 wins on geometry overlap" intent. See `tasks/epic-02-baseline-pipeline-validation/DECISIONS.md`.*
