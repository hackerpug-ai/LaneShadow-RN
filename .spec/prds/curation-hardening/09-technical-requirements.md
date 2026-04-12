---
stability: CONSTITUTION
last_validated: 2026-04-12
prd_version: 1.0.0
---

# Technical Requirements

## System Components

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| USDoTScenicBywaysSource | `pipeline/sources/scenic_byways.py` | Ingest 799-route US Scenic Byways GIS layer from Koordinates (GeoJSON/Shapefile) |
| BDRSource | `pipeline/sources/bdr.py` | Ingest 10 BDR multi-day routes from GPX files, segment into ride-sized chunks |
| TwtexSource | `pipeline/sources/twtex.py` | Scrape twtex.com Top 100 crowd-sourced motorcycle roads |
| CurvatureDiscovery | `pipeline/sources/curvature_discovery.py` | Consume adamfranco/curvature output to discover high-curvature unnamed roads from OSM |
| USFSMVUMSource | `pipeline/sources/usfs_mvum.py` | Ingest USFS Motor Vehicle Use Maps from Data.gov; extract surface_type field ("paved", "gravel", "dirt", "improved", "native") |
| RiderMagSource | `pipeline/sources/rider_mag.py` | Extract Rider Magazine 50 Best Roads as editorial ground truth |
| RedditSource | `pipeline/sources/reddit.py` | Fetch motorcycle route mentions from Reddit via public API |
| ADVRiderSource | `pipeline/sources/advrider.py` | Fetch ADVRider regional forum posts via RSS feeds |
| Deduplicator | `pipeline/dedup/deduplicator.py` | Three-stage cross-source dedup: exact, fuzzy, geospatial |
| GeospatialIndex | `convex/geospatialIndex.ts` | Convex Native Geospatial index for efficient proximity queries (nearest-neighbor, rectangular range) |
| GLMExtractor | `pipeline/nlp/glm_extractor.py` | GLM-based extraction of route mentions, sentiment, and attributes |
| QuickFilter | `pipeline/nlp/quick_filter.py` | Keyword-based pre-filter for road-related posts (Stage 1) |
| MentionAggregator | `pipeline/nlp/aggregator.py` | Aggregate mentions per road with authority-weighted sentiment |
| ExtractionCache | `pipeline/nlp/cache.py` | Cache extraction results by post_id to avoid redundant GLM calls |
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
| Route dataclass | `pipeline/models.py` | Add: location (GeoJSON Point), description, rating, designation, source_url, source_refs, highway_number, elevation_gain_m, surface, aadt, aadt_median, aadt_max, pavement_iri, mention_frequency, source_priority, field_provenance, merged_at, merge_count |
| EnrichedRoute dataclass | `pipeline/models.py` | Add: mention_frequency_score, designation_score, elevation_drama_score, road_quality_score, low_traffic_score, weather_suitability, best_months, source_count, quality_tier |
| Composite scoring | `pipeline/scoring/composite.py` | Realign WEIGHTS to research formula; replace placeholder _compute_traffic_score with HPMS AADT lookup; replace condition proxy with HPMS IRI lookup; wire OSM curvature (already implemented) |
| Archetype classifier | `pipeline/classification/archetype.py` | Activate adventure/mountain/desert rules using enrichment data (surface, elevation) |
| Archetype classifier | `pipeline/classification/archetype.py` | Activate adventure/mountain/desert rules using enrichment data |
| Extraction schema | `pipeline/extraction/schema.py` | Bump EXTRACTION_SCHEMA_VERSION=2; add extraction_confidence field |
| Extraction client | `pipeline/extraction/client.py` | Add extract_with_context() for community signal context; add token tracking |
| Calibration gate | `pipeline/extraction/calibration.py` | Integrate GroundTruthBuilder; add per-archetype calibration; output to DataQualityReport |
| OSM client | `pipeline/enrichment/osm_client.py` | Add name-based OSM way lookup; integrate curvature algorithm; extract surface/smoothness tags for surface_type field |
| Convex push | `pipeline/sync/convex_push.py` | Add new score fields, source_refs, quality_tier, location (GeoJSON) to serialization |
| GeospatialIndex | `convex/geospatialIndex.ts` | NEW — Create GeospatialIndex using @convex-dev/geospatial component for nearest-neighbor and range queries |
| Convex schema | `convex/schema.ts` | Add location field (GeoJSON Point), new score fields, route_mentions table |
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
source_priority: dict[str, int]      # NEW — Priority order used in merge
field_provenance: dict[str, str]     # NEW — Which source provided each field
merged_at: str                       # NEW — ISO timestamp of merge
merge_count: int                     # NEW — How many sources were merged
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

### RouteMention (new)

```
road_name: str
highway_number: Optional[str]
state: Optional[str]
sentiment_score: float               # -1.0 to 1.0
sentiment_label: str                 # positive|neutral|negative
aspect_scores: dict[str, float]      # scenery, twistiness, traffic, road_quality
attributes: dict[str, bool]          # twisty, scenic, low_traffic, technical, surface_type
confidence: float                    # 0.0 to 1.0 (GLM confidence)
source: str
source_authority: float
post_url: str
post_score: int
mention_date: str
processed_at: str                    # ISO timestamp
route_id: Optional[str]              # FK after linking
extraction_model: str                # claude-3-haiku|glm-4
extraction_cost: float               # USD per extraction
```

### AggregatedMention (new)

```
road_name: str
state: str
total_mentions: int
weighted_sentiment: float
authority_score: float
source_breakdown: dict[str, int]
top_attributes: list[str]
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
  .index("by_quality_tier", ["qualityTier"]);
```

### route_mentions Table (NEW)

```typescript
import { defineTable, v } from "convex/schema";

route_mentions: defineTable({
  roadName: v.string(),
  highwayNumber: v.optional(v.string()),
  state: v.optional(v.string()),
  sentimentScore: v.number(),
  sentimentLabel: v.string(),
  aspectScores: v.record(v.number()),  // scenery, twistiness, traffic, road_quality
  attributes: v.record(v.boolean()),    // twisty, scenic, low_traffic, technical, surface_type
  confidence: v.number(),
  source: v.string(),
  sourceAuthority: v.number(),
  postUrl: v.string(),
  postScore: v.number(),
  mentionDate: v.number(),
  processedAt: v.number(),
  routeId: v.optional(v.id("curated_routes")),
  extractionModel: v.string(),          // claude-3-haiku|glm-4
  extractionCost: v.number(),           // USD per extraction
})
  .index("by_routeId", ["routeId"])
  .index("by_source_and_date", ["source", "mentionDate"])
  .index("by_roadName_and_state", ["roadName", "state"]);
```

### GeospatialIndex (NEW)

```typescript
// convex/geospatialIndex.ts
import { GeospatialIndex } from "@convex-dev/geospatial";
import { components } from "./_generated/api";

export const geospatial = new GeospatialIndex(components.curated_routes, {
  // Geospatial field on curated_routes documents
  geospatialField: "location",  // { type: "Point", coordinates: [lng, lat] }
  // Optional: filter by state before geospatial query
  fullTextSearchField: "state",
});

// Usage in pipeline or queries:
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
  location?: {  // GeoJSON Point for Convex GeospatialIndex
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
| AD-001 | Three-stage cascading dedup (exact → fuzzy → geospatial) with tuned thresholds | Exact match catches 60-70% at O(n). Fuzzy match (0.85 threshold) using rapidfuzz.token_sort_ratio() catches name variants with word-order insensitivity. Geospatial (0.75 threshold) catches renamed roads. ML matching rejected — no training data. |
| AD-002 | GLM-based NLP with hybrid filtering | Two-stage approach: (1) Keyword quick-filter reduces GLM calls by ~90%. (2) Claude 3 Haiku/GLM-4 extraction for candidates. Expected 85-95% accuracy vs 60-75% regex. Cost: ~$0.0005/post, $370 for 7.4M ADVRider posts with filtering. |
| AD-003 | Realign weights to research formula | community_rating 0.05→0.15 (3x). mention_frequency 0→0.10. Calibration gate validates before deployment. |
| AD-004 | Quality floor as phased rollout (soft → hard) with tiered marking | Phase 1-2: mark as quality_tier: "minimal", include in catalog, track engagement. Phase 3: hard reject routes with 0 engagement. Allows data-driven threshold tuning. |
| AD-005 | Convex Native Geospatial for dedup queries | O(log n) nearest-neighbor with maxDistance filter. @convex-dev/geospatial component (Beta, tested to 1M points). Single-DB architecture — no external PostGIS dependency. |
| AD-006 | Pipeline orchestrator as single Python entry point | Replaces ad-hoc script execution. Enables cross-stage error handling, checkpointing, resumability. |
| AD-007 | Incremental source addition: Scenic Byways → Reddit → ADVRider | Lowest-risk first. Each validated with quality floor + dedup before adding next. |
| AD-008 | Consume adamfranco/curvature as pre-computed data | Multi-hour batch on 11GB PBF. Run once, cache output. Pipeline consumes lookup table. |
| AD-009 | Convex nullable columns with client compatibility handling | New fields added as v.optional() to existing curated_routes table. New route_mentions table for NLP pipeline. Requires deployment coordination with mobile app to handle undefined values safely. |
| AD-010 | Convex Native Geospatial adoption | Use @convex-dev/geospatial (Beta) for all geospatial queries: nearest-neighbor with maxDistance (5km), rectangular range queries, point-in-polygon. Replaces PostGIS external service. Single-DB architecture simplifies deployment and reduces cost. |
| AD-011 | Measured data integration (HPMS + NWS Climate) | Replace placeholder scoring with objective telemetry: HPMS AADT → trafficScore, HPMS IRI → roadQualityScore, NWS Climate Normals → weatherSuitability + bestMonths. Single national download, spatial join to route centroids. ~3.5 days extra effort. |
| AD-012 | Tiered archetype thresholds for coverage gaps | Common archetypes (twisties, mountain, coastal, scenic_byway): 50 routes. Niche archetypes (adventure, desert): 20 routes. Reflects realistic availability by category. |

## Architecture Diagram

```
                                    SOURCES
    ┌─────────────┬──────────────┬──────────────┬─────────────┐
    │ Scenic      │ BDR GPX     │ twtex Top100 │ Curvature   │
    │ Byways GIS  │             │              │ Discovery   │
    └──────┬──────┴──────┬──────┴──────┬───────┴──────┬──────┘
           │             │             │              │
    ┌──────┴──────┬──────┴──────┬──────┴───────┬──────┴──────┐
    │ USFS MVUM   │ Rider Mag   │ motorcycl... │ bestbiking..│
    └──────┬──────┴──────┬──────┴──────┬───────┴──────┬──────┘
           │             │             │              │
           └──────┬──────┴──────┬──────┴──────────────┘
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
           │  exact → fuzzy → geo    │
           │  (Convex Geospatial)    │
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
    └──────┬───────┘   │ Quick Filter     │
           │           │ (keywords)       │
           ▼           │     ↓            │
    ┌──────────────┐   │ GLM Extractor    │
    │ HAIKU        │   │ (Claude 3 Haiku) │
    │ EXTRACTION   │   │     ↓            │
    │ (temp=0,     │   │ Sentiment +      │
    │  Instructor) │   │ Attributes       │
    └──────┬───────┘   │     ↓            │
           │           │ Aggregation      │
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
    │  route_mentions (new table)         │
    │  geospatialIndex.ts (GeospatialIndex)│
    │  optional new fields                │
    └─────────────────────────────────────┘
```

## External Dependencies

| Library | Purpose | Docs |
|---------|---------|------|
| @convex-dev/geospatial | Convex Native Geospatial component for spatial indexing and queries (nearest-neighbor, range) | https://www.convex.dev/components/geospatial |
| rapidfuzz | Fast Levenshtein distance for fuzzy dedup with token_sort_ratio() for word-order-insensitive matching | https://github.com/maxbachmann/RapidFuzz |
| shapely | Geometry operations for GIS centroid/bounds computation | https://shapely.readthedocs.io/ |
| fiona | Read Shapefiles/GeoJSON for Scenic Byways GIS | https://fiona.readthedocs.io/ |
| praw | Reddit API wrapper for subreddit ingestion | https://praw.readthedocs.io/ |
| anthropic | Claude 3 Haiku API for GLM-based extraction | https://docs.anthropic.com/ |
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
fhwa_designation: 0.05  # was 0.10 — relevant for <200 routes
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
1. fhwa_gis          # Government, highest authority
2. scenic_byways     # Government GIS
3. rider_magazine    # Editorial ground truth
4. twtex             # Crowd-sourced rankings
5. motorcycleroads   # Community database
6. bestbikingroads   # Community database
7. curvature_discovery # Geometric
8. usfs_mvum         # Government, narrow scope
9. bdr               # Adventure-specific
10. ridewithgps      # Rider-generated
11. reddit            # Forum
12. advrider          # Forum
```
