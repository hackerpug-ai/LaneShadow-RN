---
stability: CONSTITUTION
last_validated: 2026-04-10
prd_version: 1.4.0
---

# Technical Requirements

## Pipeline Principles (Hard Constraints)

See `00-overview.md` § Pipeline Principles for the research backing each rule.

| ID | Rule | Enforcement |
|----|------|-------------|
| **P0** | **No on-device LLM.** All inference is server-side Haiku. | No model files, no MLX, no Core ML, no ONNX in the app bundle. |
| **P1** | LLMs do **text → structure**, never **structure → selection** | No component accepts a route candidate list as LLM input. Ranking is always Convex `ORDER BY compositeScore`. |
| **P2** | Routes enter the catalog only from **verifiable sources**. No LLM recall. | Every document has a `source` field and `sources[]` array with URLs. |
| **P3** | Composite-score weights are **calibrated** against ground truth before full-catalog extraction | Phase 3 gate — calibration passes before long-tail extraction runs. |
| **P4** | All LLM extraction runs at **`temperature=0`** | Python pipeline enforces temp=0 for all Instructor calls. |
| **P5** | **Deterministic parser between LLM output and downstream code** | Instructor + Pydantic validates every extraction; enum validators guard intent params. |

## System Components

| Component | Description |
|-----------|-------------|
| **Python Aggregation Pipeline** | Local script or GitHub Actions orchestrating scraping → LLM extraction → geometric enrichment → scoring → archetype classification → Convex ingest. All LLM calls at `temperature=0`. |
| **Web Scraper** | httpx + BeautifulSoup for static pages; Playwright fallback for JS-rendered content. Every row retains source URL and fetch timestamp in `sources[]`. |
| **LLM Extractor** | Claude Haiku + Instructor for structured attribute extraction. Generates display text (oneLiner, summary, badges) and full enrichment content (fullDescription, history) in the same pass. Text → structure only (P1). Schema-versioned via `extractionSchemaVersion`. |
| **Geometric Enricher** | OSM curvature (adamfranco/curvature or osm_ways geometry), elevation (SRTM/Mapbox). Surfaces routes not covered by any listicle. |
| **Scoring Engine** | Deterministic composite formula. Weights fit against editorial ground truth via Calibration Step — not hand-tuned. |
| **Calibration Step** | Phase-3 gate. Fits composite-score weights against Rider Mag Top 50 + FHWA Scenic Byways. Emits a fit report. Full-catalog extraction is blocked until this passes. |
| **Archetype Classifier** | Decision tree mapping normalized features to ride archetypes. Deterministic — no LLM. |
| **Convex Backend** | Single `curated_routes` table (all fields), `route_feedback` table, `intent_param_cache` table (shared across all users). Exposes typed queries, mutations, and actions to the client. |
| **Intent Query Service** | Convex action. Normalizes user intent string → checks shared `intent_param_cache` → on miss calls Haiku at temp=0 via Instructor → writes to cache → runs typed Convex filter/sort query → returns top results. Cache is server-side and cross-user: the first user to ask "twisty mountain roads" triggers one Haiku call; every subsequent user gets an instant cache hit. |
| **Discovery Service** | Convex queries (typed, paginated) for bounding-box browse, archetype/state filter, sort by composite score or proximity. No client-side SQL. |
| **Data Flywheel** | `route_feedback` mutation + aggregation queries for user interaction signals. |

## Data Schema

### Convex: `curated_routes` (single canonical table)

All fields for a route segment live on one document. No lean/enrichment split. The client receives whatever projection the query is built to return.

```typescript
// convex/schema.ts
curated_routes: defineTable({
  // --- Identity ---
  routeId: v.string(),               // stable slug, e.g. "us129-deals-gap"

  // --- Display (always returned by catalog queries) ---
  name: v.string(),                  // "Tail of the Dragon"
  state: v.string(),                 // "TN"
  source: v.union(
    v.literal("fhwa"),
    v.literal("motorcycleroads"),
    v.literal("bestbikingroads"),
    v.literal("bdr"),
    v.literal("editorial"),
  ),
  primaryArchetype: v.union(
    v.literal("twisties"), v.literal("mountain"), v.literal("coastal"),
    v.literal("adventure"), v.literal("scenic_byway"), v.literal("desert"),
  ),
  secondaryTags: v.array(v.string()),    // up to 3

  // --- Location (for proximity queries) ---
  centroidLat: v.number(),
  centroidLng: v.number(),
  boundsNeLat: v.number(),
  boundsNeLng: v.number(),
  boundsSwLat: v.number(),
  boundsSwLng: v.number(),
  lengthMiles: v.optional(v.number()),

  // --- Pre-computed scores (0.0–1.0, deterministic) ---
  compositeScore: v.number(),
  curvatureScore: v.optional(v.number()),
  scenicScore: v.optional(v.number()),
  technicalScore: v.optional(v.number()),
  trafficScore: v.optional(v.number()),      // inverted: 1.0 = low traffic
  remotenessScore: v.optional(v.number()),

  // --- Short display text (always returned by catalog queries) ---
  oneLiner: v.optional(v.string()),          // ≤10 words
  summary: v.optional(v.string()),           // ≤15 words
  badges: v.optional(v.array(v.string())),   // 3–5 chips

  // --- Seasonality ---
  season: v.optional(v.union(
    v.literal("year_round"), v.literal("apr_nov"),
    v.literal("may_sep"), v.literal("spring_fall"),
  )),

  // --- Full content (returned only by getById) ---
  fullDescription: v.optional(v.string()),   // 200–500 words
  history: v.optional(v.string()),
  photos: v.optional(v.array(v.object({
    url: v.string(),
    caption: v.string(),
    attribution: v.string(),
  }))),
  roadClassification: v.optional(v.array(v.string())),
  surfaceMaterial: v.optional(v.string()),
  totalElevationGainM: v.optional(v.number()),
  elevationProfile: v.optional(v.array(v.number())),
  nearestCities: v.optional(v.array(v.string())),
  recommendedStarts: v.optional(v.array(v.object({
    lat: v.number(), lng: v.number(), name: v.string(),
  }))),
  fuelStops: v.optional(v.array(v.object({
    lat: v.number(), lng: v.number(), name: v.string(), milesFromStart: v.number(),
  }))),
  ridershipLevel: v.optional(v.union(
    v.literal("low"), v.literal("moderate"), v.literal("high"),
  )),
  seasonalNotes: v.optional(v.string()),
  safetyWarnings: v.optional(v.array(v.string())),
  gpxUrl: v.optional(v.string()),

  // --- Provenance ---
  sources: v.array(v.object({
    site: v.string(),
    url: v.string(),
    lastFetched: v.number(),
    extractionConfidence: v.number(),
  })),
  extractedBy: v.union(v.literal("haiku"), v.literal("manual")),
  extractedAt: v.number(),
  extractionSchemaVersion: v.number(),

  // --- Version tracking (for pipeline re-runs, not for sync) ---
  contentVersion: v.number(),
  seededAt: v.number(),
})
  .index("by_state", ["state"])
  .index("by_archetype", ["primaryArchetype"])
  .index("by_score", ["compositeScore"])
  .index("by_centroid", ["centroidLat", "centroidLng"])
  .searchIndex("search_name", { searchField: "name", filterFields: ["state", "primaryArchetype"] }),
```

**No second table.** The `curated_route_enrichments` table from v1.1–v1.3 is removed. Full content is on the same document. The client asks for what it needs via typed query arguments.

---

### Convex: `intent_param_cache` (shared cross-user intent cache)

```typescript
intent_param_cache: defineTable({
  normalizedIntent: v.string(),      // lower(trim(collapse_ws(strip_stopwords(intent))))
  paramsJson: v.string(),            // validated 10-key IntentParams JSON
  schemaVersion: v.number(),         // prompt/schema version — cache miss on mismatch
  hitCount: v.number(),              // for surfacing popular recent intents
  createdAt: v.number(),
  lastHitAt: v.optional(v.number()),
})
  .index("by_schema", ["schemaVersion"])
  .index("by_hit_count", ["hitCount"]),
```

Shared on the server — no client-side copy. First user to type "twisty mountain roads" writes to this table; every subsequent user reads from it. Cache warming scales with userbase.

---

### Convex: `route_feedback`

```typescript
route_feedback: defineTable({
  routeId: v.string(),
  userId: v.string(),
  action: v.union(
    v.literal("save"), v.literal("hide"),
    v.literal("complete"), v.literal("rate"),
  ),
  rating: v.optional(v.number()),         // 1–5 for "rate"
  locationLat: v.optional(v.number()),
  locationLng: v.optional(v.number()),
  archetypeFilter: v.optional(v.string()),
  timestamp: v.number(),
})
  .index("by_route", ["routeId"])
  .index("by_user", ["userId"]),
```

---

### No client-side database

There is no op-sqlite discovery.db, no lean-sync cache, no enrichment cache, no intent cache on the device. All persistence is in Convex. The Convex React client maintains an in-memory reactive cache of mounted query results; this is not a persistent offline store.

## API Design

> **Note:** The API is implemented as native Convex queries, mutations, and actions — not HTTP endpoints. The convex-planner agent is producing the full typed function signatures. This section will be replaced with the convex-planner output. Until then, the conceptual surface is:

**Ingestion (admin — Python pipeline):**
- `internalMutation: upsertRoute(routeData)` — upsert one full `curated_routes` document
- `internalMutation: batchUpsertRoutes(routes[])` — batch ingestion

**Client reads:**
- `query: listByBbox({ lat, lng, radiusDeg, archetype?, sortBy?, cursor? })` → lean projection, paginated
- `query: listByState({ state, archetype?, sortBy?, cursor? })` → lean projection, paginated
- `query: getById({ routeId })` → full document
- `query: searchByIntent({ intent, userLat, userLng })` → intent param extraction (cached) → lean results

**Client writes:**
- `mutation: recordFeedback({ routeId, action, rating? })` → writes to `route_feedback`

**Actions (LLM-touching):**
- `action: extractIntentParams({ intent, userLocation? })` → Haiku call at temp=0, writes to `intent_param_cache`, returns `IntentParams`

**Metrics (admin dashboard):**
- `query: pipelineMetrics()` → totalRoutes, bySource, lastIngest, llmCost, feedbackSummary

## Architecture Diagram

```
┌──────────────────────────────────────────────┐
│         PYTHON AGGREGATION PIPELINE          │
│         (local script / GitHub Actions)      │
└──────────────────────────────────────────────┘
         │                │               │
         ▼                ▼               ▼
 ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
 │ Web Scraper │  │ LLM Extract │  │  Geometric  │
 │ httpx + BS4 │  │ Haiku +     │  │  Enricher   │
 │             │  │ Instructor  │  │ curvature + │
 │ FHWA, moto  │  │ temp=0      │  │ elevation   │
 │ roads, BDR  │  │             │  │             │
 └─────────────┘  └─────────────┘  └─────────────┘
         │                │               │
         └────────────────┼───────────────┘
                          ▼
               ┌─────────────────────┐
               │   Scoring Engine    │
               │  (calibrated        │
               │   deterministic)    │
               └─────────────────────┘
                          │
                          ▼
               ┌─────────────────────┐
               │ Archetype Classifier│
               │ (decision tree)     │
               └─────────────────────┘
                          │
                          ▼
               ┌──────────────────────────────────┐
               │         Convex Backend           │
               │                                  │
               │  curated_routes (single table)   │
               │  intent_param_cache (shared)      │
               │  route_feedback                  │
               │                                  │
               │  Queries  │ Mutations │ Actions  │
               └──────────────────────────────────┘
                          │
               ┌──────────┴──────────┐
               ▼                     ▼
    ┌──────────────────┐    ┌──────────────────┐
    │   Mobile Client  │    │ Admin Dashboard  │
    │                  │    │                  │
    │ useQuery(listBy  │    │ pipelineMetrics  │
    │   Bbox/State/    │    │ feedbackTrends   │
    │   Intent)        │    │ ingestScripts    │
    │ getById on tap   │    │                  │
    │ recordFeedback   │    │                  │
    │                  │    │                  │
    │ NO op-sqlite     │    │                  │
    │ NO local cache   │    │                  │
    │ NO sync layer    │    │                  │
    └──────────────────┘    └──────────────────┘
```

## External Dependencies

### Web Scraping (Python pipeline)
- **httpx** — HTTP client
- **beautifulsoup4** — HTML parsing
- **playwright** — JS-rendered page fallback

### LLM Extraction (Python pipeline)
- **anthropic-sdk** — Claude Haiku API
- **instructor** — Structured extraction
- **pydantic** — Schema validation

### Geometric Enrichment (Python pipeline)
- **adamfranco/curvature** — OSM curvature analysis
- **SRTM data** — Elevation data
- **Mapbox Elevation API** — Alternative elevation source

### Data Sources
- **FHWA National Scenic Byways** — data.gov CSV
- **motorcycleroads.com** — Verify ToS before scraping
- **bestbikingroads.com** — Verify ToS before scraping
- **Rider Magazine** — Editorial ground truth

### Backend / Client
- **Convex** — Only database / backend. No op-sqlite for curation.

## UI Infrastructure

### Design Libraries
- React Native + Expo (existing)
- @rnmapbox/maps (existing)
- react-native-paper (existing)
- Copper-accented dark theme

### Component Breakdown

**Reuse Existing:**
- MapboxMapView (complete-local-routing)
- BottomSheet
- Filter chips
- Loading indicators

**New Components:**
- `RouteDiscoveryScreen` — Main discovery map view; queries via `useQuery(api.routes.listByBbox)`
- `RouteDetailsSheet` — Bottom sheet with full route info; queries via `useQuery(api.routes.getById)`
- `ArchetypeFilter` — Filter chips wired to query args
- `StateFilter` — State/region selector wired to query args
- `IntentSearchInput` — Free-text input that calls `api.routes.searchByIntent` action
- `CurationDashboard` — Admin metrics view

## Implementation Phases

### Phase 1: Seed Data (Weeks 1-2)
1. Set up Convex `curated_routes` schema (single table)
2. FHWA CSV ingestion
3. BDR GPX parsing
4. Composite scoring formula
5. Archetype classifier (decision tree)
6. Confirm Convex query/mutation surface (convex-planner output)

### Phase 2: Web Scraping (Weeks 2-3)
1. Python scraping infrastructure
2. motorcycleroads.com + bestbikingroads.com extraction
3. Resumable JSONL writes

### Phase 3: LLM Extraction (Weeks 3-4)
1. Instructor + Anthropic SDK (temp=0)
2. Pydantic RouteAttributes schema (versioned)
3. Parallel extraction (ThreadPoolExecutor)
4. **Calibration gate** — fit weights, emit fit report, gate on top-10 recovery before full batch
5. Full-catalog extraction

### Phase 4: Discovery UI (Weeks 4-5)
1. `RouteDiscoveryScreen` wired to `useQuery(api.routes.listByBbox)`
2. Filter/sort UI
3. `RouteDetailsSheet` wired to `useQuery(api.routes.getById)`
4. Intent search — `IntentSearchInput` → action → reactive results
5. Shared `intent_param_cache` table and cache-first action logic

### Phase 5: Data Flywheel (Weeks 5-6)
1. `recordFeedback` mutation
2. Admin dashboard metrics
3. Pipeline health monitoring
