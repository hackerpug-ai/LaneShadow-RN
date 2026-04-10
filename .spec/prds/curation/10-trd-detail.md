---
stability: CONSTITUTION
last_validated: 2026-04-10
prd_version: 1.1.0
---

# Curation TRD — Route Discovery Pipeline (Detailed)

**Version**: 1.1
**Status**: Draft
**Related PRD**: `.spec/prds/curation/README.md`
**Related Research**: 4 docs in `.spec/research/curation/` + `.spec/research/route-discovery-architecture.md`

This document provides the complete technical architecture design for the Curation pipeline, synthesizing all four research documents into a single coherent TRD while accounting for the existing codebase (Convex schema, osm_ways/osm_nodes tables, op-sqlite, Qwen3.5 constraints).

**v1.1 changes**: Adds AD-7 (ride segment aggregation), AD-8 (lean/enrichment tier split), AD-9 (shared-ID linking), and a dedicated §11 explaining the local LLM data shape strategy.

---

## 0. Key Architecture Decisions

Before diving into layers, these decisions shape everything downstream:

**AD-1: Python pipeline is offline, not in-app.**
Why: The pipeline runs once (or monthly). It has zero runtime footprint on the mobile app. Python is the right tool for scraping + LLM extraction + pandas manipulation. The app only consumes the output via Convex sync.

**AD-2: Convex is canonical source, op-sqlite is local cache.**
Why: Convex is already the source of truth for osm_ways, saved_routes, etc. Curated routes follow the same pattern. The mobile app never writes to curated_routes — it reads from local SQLite after syncing from Convex.

**AD-3: Curvature comes from existing osm_ways geometry, not adamfranco/curvature.**
Why: The research docs explored adamfranco/curvature (OSM PBF pipeline), but the codebase already has `osm_ways.geometry: number[][]` in Convex. A TypeScript curvature proxy computed from bearing changes between geometry points is sufficient for MVP ranking. The full adamfranco pipeline is a Phase 2 enhancement when higher-fidelity scores are needed.

**AD-4: LLM extraction and text pre-digestion are Haiku-only. Qwen3.5 does NOT generate.**
Why: Qwen3.5 0.8B is validated only for leg labels in-app. Attribute extraction, composition of 10-word one-liners, 15-word summaries, and discrete badges all require reliable structured output (Instructor + tool calling), which Haiku excels at. Cost is ~$34 for 17k routes — amortized over every future query on device. **Qwen3.5's only job at runtime is selecting from a pre-digested candidate pool.**

**AD-5: No vector DB, no embedding model, no fine-tuning in MVP.**
Why: Qwen3.5 at 1.15GB + embedding model at ~300MB would breach the 1.5GB memory ceiling. SQL-based discovery (bounding box + archetype + score) is sufficient. Semantic search is a future enhancement.

**AD-6: Scoring is deterministic code, never LLM output.**
Why: LLM outputs are categorical (curviness: "twisty" | "moderate"). Code maps categories to numeric scores via lookup tables. This ensures reproducible, auditable scores.

**AD-7: Aggregation level is the ride segment, not the road or the route.**
Why: Raw OSM ways are semantically meaningless (1-5mi fragments). Named roads ("US-129") span hundreds of miles with wildly varying character. Full planned routes are compositions with no single archetype. A **ride segment** (5–50 miles, one name, one coherent experience, one primary archetype) is the atomic unit riders think in and the unit editorial lists enumerate. It's also small enough that 40+ records fit in Qwen3.5's effective context window.

**AD-8: Curation data splits into a lean local tier and a rich server enrichment tier.**
Why: The lean tier is optimized for **selection** — SQL filters, 0-1 scores, 10-word one-liners, 15-word summaries, discrete badges. Total size: ~50 tokens per record, ~300 bytes on disk. The whole lean tier syncs to every device and stays there. The rich tier is optimized for **display** — full descriptions, photos, GPX, elevation profiles, history, safety notes. It stays server-side and is lazy-loaded per-route only when a user actually needs it. This keeps local memory, sync payload, and LLM context all small without sacrificing richness when online.

**AD-9: Tiers are linked by a stable shared `routeId` and a version contract.**
Why: Every route has one ID that never changes, reused in `curated_routes.routeId`, `curated_route_enrichments.routeId`, `route_feedback.routeId`, and the local SQLite primary keys. The lean tier carries `enrichmentVersion` (bumped whenever the rich tier is regenerated), letting clients detect stale caches cheaply. When the device is offline, every card renders from lean fields alone; when online, tapping a card fires `GET /routes/enrichment?ids=...` against the shared ID for a single round-trip to the full payload. The version contract means we never guess whether a cache is current.

---

## 1. Python Aggregation Pipeline

### 1.1 Platform

**Run locally.** This is a batch job, not a service.

- Rate limiting means the pipeline is I/O-bound (mostly waiting between requests)
- Full 17k-route crawl takes several hours — leave running overnight
- Results written incrementally to JSONL for crash recovery
- Final output pushed to Convex via HTTP action

**Fallback**: GitHub Actions manual trigger if laptop uptime is a concern (free tier covers 6-hour runs).

### 1.2 Directory Structure

```
scripts/curation/
  pipeline/
    __init__.py
    main.py              — orchestrator: source → extract → enrich → score → push
    config.py            — API keys, rate limits, Convex URL
    sources/
      __init__.py
      motorcycleroads.py  — state-paginated scraper
      bestbikingroads.py  — 17,976 route scraper
      twtex.py            — Top 100 scraper
      fhwa.py             — data.gov CSV download (no scraping)
      rider_magazine.py   — editorial ground truth extraction
    extraction/
      __init__.py
      schema.py           — Pydantic RouteAttributes model
      extract.py          — Instructor + Haiku extraction
      calibration.py      — run against known ground truth first
    enrichment/
      __init__.py
      elevation.py        — Mapbox/SRTM elevation profiles
      fhwa_join.py        — scenic designation lookup
    scoring/
      __init__.py
      score.py            — deterministic composite score
      classify.py         — archetype decision tree
    push/
      __init__.py
      convex_push.py      — HTTP action batch upsert
  data/
    raw/                  — JSONL output per source
    enriched/             — enriched + scored JSONL
    calibrated/           — calibration outputs
  requirements.txt
```

### 1.3 Scraping Layer

**Static pages (httpx + BeautifulSoup):**
- 2-4 second random delay between requests
- Rotating User-Agent strings
- Exponential backoff on 429/503 (2x delay, max 60s)
- Persistent httpx session (cookies, connection reuse)

**JS-rendered pages (Playwright fallback only):**
- Detect when httpx returns empty content
- Only use for sources that need it (most motorcycle sites are static)
- `playwright-stealth` for Cloudflare/bot detection

**Resumable writes:**
- Write each route to JSONL immediately after extraction
- Check `source_url` against existing JSONL before re-scraping
- Crash recovery = re-run the same command

### 1.4 Rate Limiting Rules

```
- 2-4s between requests to same domain (randomized jitter)
- Max 20 req/min to any single domain
- Exponential backoff on 429/503: 2x delay up to 60s max
- Reuse httpx session
- Check robots.txt before scraping
- Verify ToS for each source before first run
```

---

## 2. LLM Extraction Layer

### 2.1 Model Selection

**Claude Haiku 4.5** via Anthropic API + Instructor library.

| Factor | Decision |
|--------|----------|
| Cost | ~$34 for full 17k-route batch |
| Speed | 5 concurrent workers finishes in under 1 hour |
| Structured output | Excellent via Instructor (tool calling mode) |
| Temperature | 0 for all extraction (no creativity) |

### 2.2 Pydantic Schema

```python
class RouteAttributes(BaseModel):
    # Chain-of-thought FIRST — improves accuracy ~60%
    reasoning: str = Field(description="Brief reasoning about route character")

    road_name: str
    state: str
    region: Literal["northeast","southeast","midwest","southwest","west","pacific","mountain"]

    # Categorical ONLY — code computes numeric scores from these
    curviness: Literal["straight","mild","moderate","twisty","very_twisty"]
    scenery_type: list[Literal["mountain","coastal","forest","desert","canyon","valley","plains","urban"]]
    scenery_quality: Literal["unremarkable","pleasant","beautiful","spectacular"]
    traffic_level: Literal["low","moderate","high"]
    road_condition: Literal["poor","fair","good","excellent"]
    challenge_level: Literal["beginner","intermediate","advanced","expert"]
    surface: Literal["paved","gravel","dirt","mixed"]

    approx_length_miles: float | None = None
    key_highlights: list[str] = Field(max_length=3)
```

Design rules from Instructor benchmarks:
- Field names are semantic (use natural English labels)
- `reasoning` field first forces chain-of-thought
- `Literal` types constrain output, reduce hallucination
- Flat or one-level nesting only
- Tool calling mode over JSON mode (50% less variance)

### 2.3 Calibration

Before full batch:
1. Extract Rider Magazine Top 50 (known ground truth)
2. Review outputs — do categories match expectations?
3. Adjust prompt definitions if needed
4. Full batch only after calibration passes

### 2.4 Cross-Source Validation

For routes appearing on multiple sources (e.g., Tail of the Dragon):
- Run extraction independently per source
- Compare outputs — disagreement flags ambiguous text
- Merge by majority vote per field

---

## 3. Geometric Enrichment

### 3.1 Curvature (from existing osm_ways)

The codebase already has `osm_ways.geometry: number[][]` in Convex. Curvature is computed as a proxy from bearing changes:

```typescript
function curvatureScore(geometry: number[][]): number {
  // geometry = [[lon, lat], ...] — simplified (3+ points per way)
  let totalDelta = 0
  for (let i = 1; i < geometry.length - 1; i++) {
    const b1 = bearing(geometry[i - 1], geometry[i])
    const b2 = bearing(geometry[i], geometry[i + 1])
    let delta = Math.abs(b2 - b1)
    if (delta > 180) delta = 360 - delta
    totalDelta += delta
  }
  const lengthKm = pathLengthKm(geometry)
  return Math.min(totalDelta / (lengthKm * 10), 1.0)
}
```

This runs in the seed script, not the Python pipeline. The seed script queries `osm_ways` from Convex, computes curvature, and adds it to curated route records.

Note: Geometry is simplified (3 representative points per way), so this is a coarse proxy. Sufficient for MVP ranking.

### 3.2 Elevation (Mapbox/SRTM)

Mapbox Elevation API or SRTM data for elevation profiles:
- Total ascent in meters over route length
- Max elevation change over any 10-mile window (elevation_drama)

For FHWA seed data, elevation can be approximated from centroid lat/lng + known terrain. Full elevation profiles are a Phase 2 enhancement.

### 3.3 FHWA Scenic Designation

Direct download from data.gov — no scraping needed:
- 184 designated roads
- Classification: All-American Road (2+ intrinsic qualities) or State Scenic Byway
- 6 intrinsic qualities: scenic, natural, historic, cultural, recreational, archaeological
- Join by road name + state

---

## 4. Deterministic Scoring Engine

### 4.1 Lookup Tables

```python
CURVINESS_SCORE  = {"straight": 0, "mild": 2, "moderate": 5, "twisty": 8, "very_twisty": 10}
SCENERY_SCORE    = {"unremarkable": 0, "pleasant": 3, "beautiful": 7, "spectacular": 10}
CONDITION_SCORE  = {"poor": 0, "fair": 4, "good": 7, "excellent": 10}
TRAFFIC_SCORE    = {"low": 10, "moderate": 5, "high": 1}   # inverted
CHALLENGE_SCORE  = {"beginner": 2, "intermediate": 5, "advanced": 8, "expert": 10}
```

### 4.2 Composite Score Formula

```
composite_score = (
  0.25 * curviness_normalized
+ 0.15 * scenery_quality_normalized
+ 0.15 * traffic_score_normalized
+ 0.10 * road_condition_normalized
+ 0.15 * osm_curvature_normalized
+ 0.10 * elevation_drama_normalized
+ 0.05 * fhwa_designation_score     # 0, 0.5, or 1.0
+ 0.05 * community_rating_normalized
)
```

Output: 0.0 to 1.0

### 4.3 Calibration

Calibrate against Rider Magazine Top 50 as ground truth. Known iconic routes (Tail of the Dragon, Blue Ridge Parkway, Pacific Coast Highway) should score in the top tier. Adjust weights if calibration fails.

---

## 5. Archetype Classifier

Decision tree (not ML — interpretable, adjustable):

```python
def classify(attrs, geo) -> str:
    if surface in ("gravel","dirt","mixed") or bdr_tagged:
        return "adventure"
    if coastal_miles < 15 and fhwa_designation:
        return "coastal"
    if elevation_gain_m > 1200:
        return "mountain"
    if curviness in ("twisty","very_twisty"):
        return "twisties"
    if fhwa_designation:
        return "scenic_byway"
    return "desert"  # default: low curvature, remote, arid
```

MVP: most FHWA routes default to `scenic_byway`. Richer archetypes emerge after OSM curvature scoring.

---

## 6. Local SQLite discovery.db Architecture

The local database holds two tables linked by the shared stable `route_id`:
1. `curated_routes` — lean tier, bulk-synced, used for SQL discovery + Qwen3.5 ranking
2. `curated_route_enrichment_cache` — rich tier cache, lazy-filled, used for detail views

### 6.1 Schema

```sql
-- ----------------------------------------------------------------
-- LEAN TIER — bulk-synced from Convex, always available offline
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curated_routes (
  route_id TEXT PRIMARY KEY,              -- shared stable ID (matches Convex)
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  source TEXT NOT NULL,

  -- Aggregation level: ride segment (5-50 mile named experience)
  primary_archetype TEXT NOT NULL,        -- one of: twisties, mountain, coastal, adventure, scenic_byway, desert
  secondary_tags TEXT,                    -- JSON array, up to 3

  -- Location (drives bounding box SQL queries)
  centroid_lat REAL NOT NULL,
  centroid_lng REAL NOT NULL,
  bounds_ne_lat REAL, bounds_ne_lng REAL,
  bounds_sw_lat REAL, bounds_sw_lng REAL,
  length_miles REAL,

  -- Pre-computed scores (0.0-1.0, deterministic)
  composite_score REAL NOT NULL,
  curvature_score REAL,
  scenic_score REAL,
  technical_score REAL,
  traffic_score REAL,                     -- inverted (1.0 = low traffic)
  remoteness_score REAL,

  -- Pre-digested display text (Haiku-generated, baked in)
  one_liner TEXT,                         -- ≤10 words
  summary TEXT,                           -- ≤15 words
  badges TEXT,                            -- JSON array of 3-5 discrete chips
  season TEXT,

  -- Version tracking for delta sync + enrichment staleness
  content_version INTEGER NOT NULL,
  enrichment_version INTEGER,             -- matches server; null = no enrichment yet

  synced_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cr_state        ON curated_routes(state);
CREATE INDEX IF NOT EXISTS idx_cr_archetype    ON curated_routes(primary_archetype);
CREATE INDEX IF NOT EXISTS idx_cr_score        ON curated_routes(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_cr_centroid     ON curated_routes(centroid_lat, centroid_lng);
CREATE INDEX IF NOT EXISTS idx_cr_enrich_ver   ON curated_routes(enrichment_version);

-- ----------------------------------------------------------------
-- RICH TIER CACHE — lazy-filled per route when device is online
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curated_route_enrichment_cache (
  route_id TEXT PRIMARY KEY,              -- FK → curated_routes.route_id
  payload TEXT NOT NULL,                  -- JSON blob: full enrichment
  enrichment_version INTEGER NOT NULL,    -- version fetched from server
  fetched_at INTEGER NOT NULL,
  FOREIGN KEY (route_id) REFERENCES curated_routes(route_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enrich_fetched ON curated_route_enrichment_cache(fetched_at);
```

**Cache policy:** the enrichment cache is bounded to ~500 most recently fetched rows (LRU eviction by `fetched_at`). The lean tier is never evicted — it's the offline contract. When a user opens a detail sheet and the cache is empty or stale, the app fires a single fetch by `route_id` and writes the result back.

### 6.2 Query Patterns

**Lean tier (discovery, always local):**

```typescript
// Nearby routes — bounding box + optional archetype filter
queryNearby(db, lat, lng, radiusDeg=0.5, { archetype?, limit? })

// By state
queryByState(db, state, { archetype?, limit? })

// By archetype
queryByArchetype(db, archetype, { limit? })

// Top routes overall
queryTopRoutes(db, { limit? })
```

**Enrichment tier (detail, network-aware):**

```typescript
// Returns cached enrichment if present AND version matches lean tier.
// Otherwise fetches from server, writes cache, returns fresh payload.
// Throws `OfflineError` if network is required but unavailable.
getEnrichment(db, routeId): Promise<CuratedRouteEnrichment>

// Pre-warm a batch (e.g., for visible discovery cards)
prefetchEnrichments(db, routeIds: string[]): Promise<void>

// Cheap staleness check (no payload transfer)
checkStaleness(db, routeIds: string[]): Promise<string[]>  // returns stale IDs
```

**Ranking (combines SQL + local LLM):**

```typescript
// End-to-end discovery: filter → rank → return lean rows ready for rendering
rankForIntent(db, {
  center: { lat, lng },
  archetype?: string,
  intent?: string,             // free-text user intent; passed to Qwen3.5
  candidateLimit?: number,     // default 20 — how many pre-filtered rows to hand to the model
  topN?: number,               // default 5 — how many final picks to return
}): Promise<CuratedRoute[]>
```

### 6.3 File Map (in-app)

```
lib/discovery/
  db.ts                       — op-sqlite discovery.db init + DDL (both tables)
  sync-lean.ts                — Convex → SQLite bulk/delta pull for lean tier
  fetch-enrichment.ts         — per-route enrichment fetch + cache write + staleness check
  query.ts                    — queryNearby(), queryByState(), queryByArchetype(), queryTopRoutes()
  rank.ts                     — rankForIntent() orchestrator (SQL + Qwen3.5 JSON-only call)
  prompts.ts                  — Qwen3.5 ranking prompt template (no generation, just selection)

hooks/
  use-route-discovery.ts      — location + archetype → ranked lean rows
  use-route-enrichment.ts     — routeId → full enrichment, online-aware, optimistic from cache
```

---

## 7. Convex Integration

Two tables, shared stable `routeId`. Never joined at query time — the app does the join by ID only when it needs the rich tier.

### 7.1 Schema Additions

```typescript
// models/curated-routes.ts — LEAN TIER
export const curatedRouteValidator = v.object({
  routeId: v.string(),                   // stable shared ID

  name: v.string(),
  state: v.string(),
  source: v.union(
    v.literal('fhwa'), v.literal('bdr'), v.literal('editorial'),
    v.literal('motorcycleroads'), v.literal('bestbikingroads'),
    v.literal('twtex'),
  ),

  // Ride segment aggregation
  primaryArchetype: v.union(
    v.literal('twisties'), v.literal('mountain'), v.literal('coastal'),
    v.literal('adventure'), v.literal('scenic_byway'), v.literal('desert'),
  ),
  secondaryTags: v.array(v.string()),    // up to 3

  // Location
  centroidLat: v.number(),
  centroidLng: v.number(),
  boundsNeLat: v.number(),
  boundsNeLng: v.number(),
  boundsSwLat: v.number(),
  boundsSwLng: v.number(),
  lengthMiles: v.number(),

  // Pre-computed scores
  compositeScore: v.number(),
  curvatureScore: v.number(),
  scenicScore: v.number(),
  technicalScore: v.number(),
  trafficScore: v.number(),              // inverted
  remotenessScore: v.number(),

  // Pre-digested text
  oneLiner: v.string(),                  // ≤10 words
  summary: v.string(),                   // ≤15 words
  badges: v.array(v.string()),           // 3-5 discrete chips
  season: v.union(
    v.literal('year_round'), v.literal('apr_nov'),
    v.literal('may_sep'), v.literal('spring_fall'),
  ),

  // Version tracking
  contentVersion: v.number(),
  enrichmentVersion: v.optional(v.number()),

  seededAt: v.number(),
})

// models/curated-route-enrichments.ts — RICH TIER
export const curatedRouteEnrichmentValidator = v.object({
  routeId: v.string(),                   // FK to curated_routes.routeId

  fullDescription: v.string(),
  history: v.optional(v.string()),

  photos: v.array(v.object({
    url: v.string(),
    caption: v.string(),
    attribution: v.string(),
  })),

  roadClassification: v.array(v.string()),
  surfaceMaterial: v.string(),
  totalElevationGainM: v.optional(v.number()),
  elevationProfile: v.optional(v.array(v.number())),

  nearestCities: v.array(v.string()),
  recommendedStarts: v.array(v.object({
    lat: v.number(), lng: v.number(), name: v.string(),
  })),
  fuelStops: v.array(v.object({
    lat: v.number(), lng: v.number(), name: v.string(), milesFromStart: v.number(),
  })),

  ridershipLevel: v.union(
    v.literal('low'), v.literal('moderate'), v.literal('high'),
  ),
  seasonalNotes: v.string(),
  safetyWarnings: v.array(v.string()),

  gpxUrl: v.optional(v.string()),

  sources: v.array(v.object({
    site: v.string(),
    url: v.string(),
    lastFetched: v.number(),
    extractionConfidence: v.number(),
  })),

  extractedBy: v.union(v.literal('haiku'), v.literal('manual')),
  extractedAt: v.number(),
  extractionSchemaVersion: v.number(),

  enrichmentVersion: v.number(),
  lastEnrichedAt: v.number(),
})

// convex/schema.ts additions:
curated_routes: defineTable(curatedRouteValidator)
  .index('by_routeId', ['routeId'])           // primary lookup for enrichment joins
  .index('by_state', ['state'])
  .index('by_archetype', ['primaryArchetype'])
  .index('by_compositeScore', ['compositeScore'])
  .index('by_contentVersion', ['contentVersion']),  // powers delta sync

curated_route_enrichments: defineTable(curatedRouteEnrichmentValidator)
  .index('by_routeId', ['routeId'])           // the only index you need — lookups are always by ID
  .index('by_enrichmentVersion', ['enrichmentVersion']),
```

### 7.2 Convex Functions

**HTTP Actions** (receive batches from Python pipeline):
```typescript
// convex/http.ts
POST /ingest-routes       → api.curatedRoutes.ingestBatch         (lean tier)
POST /ingest-enrichments  → api.curatedRoutes.ingestEnrichments   (rich tier)
```

**Internal Mutations** (batch upsert):
```typescript
// convex/curated-routes.ts

ingestBatch: internalMutation({
  args: { routes: v.array(curatedRouteValidator) },
  handler: async (ctx, { routes }) => {
    // Upsert by routeId. Bump contentVersion on any field change.
    // Do NOT touch enrichmentVersion — that's owned by ingestEnrichments.
  },
})

ingestEnrichments: internalMutation({
  args: { enrichments: v.array(curatedRouteEnrichmentValidator) },
  handler: async (ctx, { enrichments }) => {
    // Upsert enrichment by routeId.
    // Bump curated_routes.enrichmentVersion on the linked record
    // so clients can detect staleness on next sync.
  },
})
```

**Public Queries** (for mobile app):

```typescript
// convex/curated-routes.ts

// Lean tier — bulk/delta sync
listLean: query({
  args: {
    state: v.optional(v.string()),
    sinceContentVersion: v.optional(v.number()),
  },
  handler,  // returns lean rows only, never joins with enrichments
}),

listLeanByBounds: query({
  args: { swLat, swLng, neLat, neLng },
  handler,  // for region-based sync after initial bulk pull
}),

// Rich tier — per-ID fetch
getEnrichment: query({
  args: { routeId: v.string() },
  handler,  // single lookup by routeId
}),

getEnrichmentBatch: query({
  args: { routeIds: v.array(v.string()) },  // up to 50
  handler,  // parallel lookups, returns { [routeId]: enrichment | null }
}),

// Cheap staleness check
checkEnrichmentStaleness: query({
  args: {
    pairs: v.array(v.object({
      routeId: v.string(),
      cachedVersion: v.number(),
    })),
  },
  handler,  // returns routeIds where server version > cachedVersion
}),
```

### 7.3 Sync Patterns

**Lean tier (bulk + delta):**

```
App launch → check last_synced_content_version
  → if null: full listLean → SQLite pull (all lean rows)
  → if set:  listLean({ sinceContentVersion: X }) → apply delta
  → record max contentVersion as new watermark
```

Frequency: on app launch, on manual refresh, on state/region change if the user moves.

**Rich tier (on-demand, per-route):**

```
User taps card → hook queries enrichment cache by routeId
  → hit + version matches lean.enrichmentVersion:  use cache
  → hit + version stale:                           background refetch + optimistic render
  → miss + online:                                 fetch getEnrichment, write cache, render
  → miss + offline:                                render lean-only view, show "full details when online" affordance
```

**Prefetch (optional optimization):**

```
Discovery list rendered → extract visible routeIds
  → checkEnrichmentStaleness({ pairs }) → stale list
  → getEnrichmentBatch({ routeIds: stale }) in background
  → write cache, no UI change until user taps
```

This gives instant detail-view opens for any card the user scrolls past, without blowing up the sync payload.

---

## 8. Phase Sequencing for Implementation

### Phase 1: Seed Data (Weeks 1-2) — Zero external dependencies
- FHWA CSV ingestion script
- Composite scoring formula (pure functions)
- Archetype classifier (decision tree)
- Convex `curated_routes` schema + upsert mutations
- Local `discovery.db` init + sync
- ~184 FHWA routes + 10 BDR routes + 50 editorial routes = ~244 seed routes

### Phase 2: Web Scraping (Weeks 2-3)
- Python scraping infrastructure
- motorcycleroads.com + bestbikingroads.com extraction
- Resumable JSONL writes
- ToS compliance verification

### Phase 3: LLM Enrichment (Weeks 3-4)
- Haiku + Instructor integration
- Calibration against ground truth
- Full batch extraction (17k routes)
- Geometric enrichment from osm_ways

### Phase 4: Discovery UI (Weeks 4-5)
- Route discovery screen
- Map integration
- Filter/sort controls
- Route detail cards

### Phase 5: Data Flywheel (Weeks 5-6)
- User interaction tracking
- Feedback storage
- Auto-annotation schema
- Monitoring dashboard

---

## 9. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ToS violation on scraping | Medium | High | Verify each source before first run; prioritize FHWA (free) and editorial (citable) |
| LLM hallucination in attributes | Medium | Medium | Calibration against ground truth; cross-source validation; deterministic scoring |
| osm_ways geometry too simplified | Medium | Low | Coarse proxy is sufficient for MVP; Phase 2 adds adamfranco/curvature |
| Convex sync too slow for 17k routes | Low | Medium | Batch upsert in groups of 50; paginated initial sync; delta sync after first pull |
| Pipeline crash mid-batch | Medium | Low | JSONL incremental writes; resumable by checking already-scraped URLs |
| Memory ceiling on mobile | Low | High | No embedding model; SQL-only queries; discovery.db is separate file |

---

## 10. Files to Create/Modify

**New files:**
```
scripts/curation/                         — entire Python pipeline directory
  pipeline/extraction/extract.py          — Haiku extraction (attributes + lean text + rich content)
  pipeline/extraction/schema.py           — Pydantic RouteAttributes + LeanText + RichEnrichment
  pipeline/push/convex_push.py            — two endpoints: ingest-routes + ingest-enrichments

models/curated-routes.ts                  — lean tier Convex validator
models/curated-route-enrichments.ts       — rich tier Convex validator
convex/curated-routes.ts                  — lean + rich queries and mutations (both tiers)

lib/discovery/db.ts                       — op-sqlite discovery.db init + DDL (both tables)
lib/discovery/sync-lean.ts                — bulk/delta lean tier pull from Convex
lib/discovery/fetch-enrichment.ts         — per-route enrichment fetch + cache
lib/discovery/query.ts                    — queryNearby(), queryByState(), queryByArchetype()
lib/discovery/rank.ts                     — rankForIntent() orchestrator (SQL → Qwen3.5 → top N)
lib/discovery/prompts.ts                  — ranking prompt template (selection-only, no generation)

hooks/use-route-discovery.ts              — location + archetype + intent → ranked lean rows
hooks/use-route-enrichment.ts             — routeId → full enrichment, cache-first, online-aware
```

**Modified files:**
```
convex/schema.ts                          — add curated_routes + curated_route_enrichments tables
convex/http.ts                            — add POST /ingest-routes and POST /ingest-enrichments endpoints
```

---

## 11. Local LLM Data Shape Strategy

This section is the reason the data model looks the way it does. Every decision in §6 and §7 is in service of making Qwen3.5 0.8B useful without asking it to reason.

### 11.1 The Constraint That Shapes Everything

Qwen3.5 0.8B is validated in-app only for leg labels (per swarm research: 100% validity, 2.16x faster than Haiku, ~0.35s inference). For anything requiring reasoning, Haiku is required. This TRD extends the model's responsibilities by exactly one new task: **structured selection from a pre-digested candidate pool**. Nothing else. No generation. No free-text matching. No tool calling. No archetype inference.

The principle: **a small model's speed and consistency come from giving it a small, well-defined job. Make the data do the reasoning so the model doesn't have to.**

### 11.2 Why Ride Segments Are the Right Atom

| Level | Verdict | Reason |
|-------|---------|--------|
| OSM way (1-5mi fragment) | ❌ | No semantic identity; 0.8B can't assemble meaning from fragments |
| Named road ("US-129") | ❌ | Spans 500mi with wildly varying character; can't be labeled with one archetype |
| **Ride segment (5-50mi, e.g., "Deals Gap stretch of US-129")** | ✅ | One coherent experience, one primary archetype, one set of scores, one stable ID. Matches how editorial lists enumerate and how riders talk. |
| Full planned route (A → B composition) | ❌ | Composition of segments with mixed character; can't be categorically labeled |
| Multi-day loop / tour | ❌ | Too high-level for query-time recommendation |

### 11.3 The Pre-Digestion Asymmetry

All hard reasoning happens once, offline, during the Python pipeline. Runtime gets only the distilled result.

**Done offline (Haiku + deterministic code, one time per route):**
- Extract attributes from source text (Instructor + Haiku)
- Map categorical attributes → 0.0-1.0 scores (deterministic lookup tables)
- Compute geometric features from osm_ways geometry (curvature, elevation)
- Assign one `primaryArchetype` via decision tree
- Generate a 10-word `oneLiner` and 15-word `summary` (Haiku)
- Extract 3-5 discrete `badges` (Haiku, constrained to short phrases)
- Generate full `fullDescription`, `history`, trip planning context for the rich tier (Haiku)

**Done at query time on device (deterministic + narrow Qwen3.5):**
- SQL filter the lean tier: `WHERE centroid in bbox AND primary_archetype = X ORDER BY composite_score DESC LIMIT 20` (~10ms)
- Pass 20 structured cards + user intent to Qwen3.5 with a selection-only prompt
- Parse JSON output: `{ picks: ["id1", "id2", "id3", "id4", "id5"] }`
- Render lean fields directly; lazy-load rich enrichment when a card is tapped

### 11.4 The Ranking Prompt (Selection Only)

```
System: You are a motorcycle ride recommender. You pick rides from a pre-scored list.
You do not write descriptions. You do not invent facts. You return JSON only.

User intent: {intent}

Candidates (pre-scored, 0.0-1.0):
1. id=us129-deals-gap  primary=twisties  length=11mi  curvature=0.95 scenic=0.70 technical=0.90 traffic=0.30 remoteness=0.55  "The most famous sport road in America."
2. id=brp-mile-420     primary=mountain  length=43mi  curvature=0.55 scenic=0.95 technical=0.40 traffic=0.45 remoteness=0.75  "Highest paved peak east of the Mississippi."
... (18 more)

Task: Return the top 5 IDs that best match the intent, ordered best first.
Respond with JSON only: {"picks": ["id1","id2","id3","id4","id5"]}
```

Key properties of this prompt:
- **No free text in the output.** Model returns only pre-existing IDs.
- **All comparisons are over 0.0-1.0 numbers**, not prose.
- **One-line summaries are included only for tie-breaking context**, not for the model to paraphrase.
- **Temperature = 0** for deterministic output.
- **~2K tokens total**, sub-second inference, same consistency as a SQL query.

### 11.5 Token Budget Math

| Component | Tokens |
|---|---|
| System prompt | ~300 |
| Intent text | ~50 |
| 20 candidate cards × ~50 tokens each | ~1000 |
| Response format instruction | ~100 |
| Output (5 IDs as JSON) | ~100 |
| **Total per query** | **~1550** |

Comfortably inside any 0.8B context window. Inference time: 500-900ms on mid-range mobile hardware. Memory footprint: no change (model stays resident at 1.15GB — the only per-query cost is the prompt).

### 11.6 Escalation Path

The local path is intentionally narrow. When the intent doesn't fit it, escalate.

| Intent type | Path |
|---|---|
| "twisty near me" | Local: SQL + Qwen3.5 rank |
| "best for a Saturday morning" | Local: add time/traffic filter + rank |
| "something adventurous but beginner-friendly" | Local: multiple score filters + rank |
| **"something that feels like freedom"** | **Haiku (online)** — returns structured filters, runs local pipeline with them |
| **"plan me a 3-day loop through the Smokies"** | **Haiku (online)** — composition is a cloud task; local path remains the selection primitive |

The local path is the fast primitive. Haiku is the smart intent-to-filters translator. Both read from the same underlying data tier.

### 11.7 What the Local Model Must Never Do

These are all Haiku's job. Qwen3.5 never touches them:

- **Generate route descriptions.** Pre-baked in `oneLiner`, `summary`, rich tier `fullDescription`.
- **Assign archetypes.** Decided by the decision tree during ingestion.
- **Compute scores.** Deterministic lookup tables during ingestion.
- **Match free-text intent against free-text descriptions.** The SQL filter does the narrowing; the model only ranks a small already-structured pool.
- **Call tools.** Orchestrator decides what to fetch; model just ranks what's handed to it.
- **Reason about composition** (multi-ride loops, multi-day trips). These route to Haiku.

### 11.8 Why This Gives Speed + Consistency

**Speed:**
- SQL filter on indexed op-sqlite: <10ms
- Qwen3.5 ranking of 20 structured items: 500-900ms
- No embedding generation, no tool calling, no free-text parsing
- End-to-end: <1 second from tap to cards on screen

**Consistency:**
- Scores are deterministic — same data → same ordering every time
- The model's task is so narrow it can't drift
- `primaryArchetype` is single-valued, so "twisties" always means the same thing
- Summaries are pre-written offline, so no generation variance
- Temperature = 0 on the ranking call → same query twice returns the same top 5

The whole strategy is: prevent the 0.8B model from generating anything substantive. It only picks rows from a pre-validated pool. That's where speed and consistency come from.

---

This design is ready for sprint breakdown. The Phase 1 seed path (FHWA + BDR + editorial = ~244 routes) can ship discovery UI immediately while the scraping pipeline is built in parallel. The Python pipeline and the mobile app are completely decoupled — the pipeline writes to Convex (both tiers), the app reads lean from the local SQLite mirror and pulls rich enrichment on demand by shared `routeId`.
