---
stability: CONSTITUTION
last_validated: 2026-04-10
prd_version: 1.3.0
---

# Technical Requirements

## Pipeline Principles (Hard Constraints)

These are enforced globally across every component below. See `00-overview.md` § Pipeline Principles for the research backing each one.

| ID | Rule | Enforcement |
|----|------|-------------|
| **P1** | LLMs do **text → structure**, never **structure → selection** | Code review + schema design. No component accepts candidate lists as LLM input and returns IDs as LLM output. |
| **P2** | Routes enter the catalog only from **verifiable sources** (FHWA, scraped URLs, OSM, BDR). No LLM recall. | Ingestion layer refuses unsourced records; every row has a `source` field and enrichment has a `sources[]` array with URLs. |
| **P3** | **Composite-score weights are calibrated** against ground truth before full-catalog extraction runs | Phase 3 completion gate — see calibration step below. |
| **P4** | All LLM extraction runs at **`temperature=0`** with retry-on-degeneration | Python wrapper enforces temp=0 for all Instructor/Anthropic calls. |
| **P5** | **Deterministic parser between LLM and downstream code** (Instructor + Pydantic, `params_to_sql()`, enum validators) | Every LLM call site has an explicit validator that fails loudly on schema violations and retries with a suffix prompt before falling back. |

## System Components

| Component | Description |
|-----------|-------------|
| **Python Aggregation Pipeline** | Local script or GitHub Actions that orchestrates scraping, extraction, enrichment, scoring, and **pre-digestion** (generating 10-word one-liners, 15-word summaries, and discrete badges via Haiku). All LLM calls at `temperature=0`. Reproducibility is a hard requirement. |
| **Web Scraper** | httpx + BeautifulSoup for static pages, Playwright fallback for JS-rendered content. Every scraped row retains its source URL and fetch timestamp in `enrichment.sources[]` for auditability and re-scrape scheduling |
| **LLM Extractor** | Claude Haiku via Anthropic API with Instructor for structured extraction. Also generates lean display text (one-liner, summary, badges) and full enrichment content (description, history) in the same pass. Does **text → structure only** (P1) — never asked to list, rank, or recall routes (P2). Schema-versioned via `extractionSchemaVersion` so batches can be re-run after prompt/schema changes |
| **Geometric Enricher** | OSM curvature analysis via adamfranco/curvature, elevation via SRTM or Mapbox API. Surfaces candidate routes not covered by any listicle — the primary mechanism for catalog originality |
| **Scoring Engine** | Deterministic composite formula combining LLM-extracted attributes and geometric features. Weights are fit against editorial ground truth (Rider Mag Top 50 + FHWA Scenic Byways) via the Calibration Step below — not hand-tuned |
| **Calibration Step** | Phase-3 gate: solves for composite-score weights against a labeled ground-truth set. Emits a fit report (weights, residuals, top-10 recovery rate, per-feature sensitivity). **Full-catalog extraction does not run until calibration passes.** Re-run whenever the feature set or ground truth changes |
| **Archetype Classifier** | Decision tree mapping features to ride archetypes (twisties, mountain, coastal, etc.). Outputs one `primaryArchetype` for selection and up to 3 `secondaryTags` for filtering. Deterministic — no LLM involvement (violates P1) |
| **Lean Sync Service** | Syncs ONLY the lean tier (curated_routes) from Convex → local op-sqlite. ~50 tokens per route. Tracks `contentVersion` for delta sync |
| **Enrichment Fetch Service** | Lazy-loads rich enrichment by `routeId` when the device is online. Caches recent enrichments in op-sqlite for offline replay. Keyed on shared stable IDs |
| **Discovery Service** | Local op-sqlite database with SQL query layer for bounding box and filter searches over the lean tier. Ranking is SQL `ORDER BY` on pre-computed composite scores — never LLM-driven (P1) |
| **Intent Query Service** | Orchestrator for natural language search. **v1 baseline path (shipping):** (1) normalize user intent string and look up in Intent Cache; (2) cache hit → validated params returned in <5ms; (3) cache miss + online → Haiku extracts params via Instructor with the 10-key schema, enum-validates, caches the result; (4) cache miss + offline → returns `OFFLINE_UNSUPPORTED` so UI can show the "connect to search" empty state with recent-intents shortcuts. Validated params always pass through deterministic `params_to_sql()` → op-sqlite → top 10 routes. **v1.x deferred path:** on-device Qwen3.5 0.8B (Core ML / ONNX) replaces branch (4) once the device latency benchmark passes. The prompt, schema, normalizer, and retry logic are identical across branches — only the inference backend changes. No model ever sees route candidates (P1). Validated: Haiku 100% pass / ~1.0s; Qwen 93% pass / 0.84 F1 on MLX Mac-only (2026-04-10, mobile latency TBD) |
| **Intent Cache** | op-sqlite table `intent_param_cache(normalized_intent TEXT PRIMARY KEY, params_json TEXT NOT NULL, schema_version INTEGER NOT NULL, hit_count INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, last_hit_at INTEGER)`. Normalization rule: `lower(trim(collapse_ws(strip_stopwords(intent))))` with a stop-word list including common filler ("i want to", "show me", "find me", "some", "a", "the", "please"). Invalidated on `schema_version` mismatch (after a prompt schema bump) — the cache simply stops hitting and is repopulated lazily. No TTL beyond schema version; route discovery intents are very stable over time |
| **Convex Backend** | Canonical storage for both lean `curated_routes` and rich `curated_route_enrichments` tables (linked by `routeId`), plus user feedback collection and sync endpoints |
| **Data Flywheel** | Feedback aggregation and auto-annotation for continuous improvement |

## Data Schema

The curation data model is split into two tiers linked by a **stable shared `routeId`**:

1. **Lean tier** (`curated_routes`) — pre-digested, query-optimized. Synced to device. Fields are sized for SQL filtering and fast card rendering — not for LLM context (Qwen does slot-filling from user intent text only, never from route candidates).
2. **Rich tier** (`curated_route_enrichments`) — full content. Stays server-side, lazy-loaded by `routeId` when the device is online.

Both tiers use the same stable ID so the app can request full enrichment for any lean record with a single query.

---

### Convex: curated_routes (LEAN — synced to device)

Contains only what's needed for (a) SQL discovery queries, (b) local LLM ranking, and (c) UI card rendering.

```typescript
{
  // --- Identity (shared across tiers) ---
  routeId: string,                     // stable ID — same as enrichment.routeId

  // --- Basic display fields ---
  name: string,                        // "Tail of the Dragon"
  state: string,                       // "TN"
  source: "fhwa" | "motorcycleroads" | "bestbikingroads" | "bdr" | "editorial",

  // --- Aggregation level: ride segment (not road, not route) ---
  primaryArchetype: "twisties" | "mountain" | "coastal" | "adventure" | "scenic_byway" | "desert",
  secondaryTags: string[],             // up to 3: ["legendary", "technical", ...]

  // --- Location (SQL bounding box queries) ---
  centroidLat: number,
  centroidLng: number,
  boundsNeLat: number,
  boundsNeLng: number,
  boundsSwLat: number,
  boundsSwLng: number,
  lengthMiles: number,

  // --- Pre-computed scores (0.0–1.0, deterministic, not LLM output) ---
  compositeScore: number,              // single ranking signal for sorting
  curvatureScore: number,
  scenicScore: number,
  technicalScore: number,
  trafficScore: number,                // inverted (1.0 = low traffic)
  remotenessScore: number,

  // --- Pre-digested display text (Haiku-generated, baked in at ingestion) ---
  oneLiner: string,                    // ≤10 words (e.g., "The most famous sport road in America.")
  summary: string,                     // ≤15 words (e.g., "318 curves in 11 miles. Technical, legendary, moderate traffic.")
  badges: string[],                    // 3–5 discrete chips (e.g., ["318 curves", "Legendary", "Patrolled"])

  // --- Seasonality (deterministic filter) ---
  season: "year_round" | "apr_nov" | "may_sep" | "spring_fall",

  // --- Tier linking & version tracking ---
  contentVersion: number,              // bumps when any lean field changes → drives delta sync
  enrichmentVersion: number | null,    // bumps when enrichment is regenerated; null = not yet enriched

  seededAt: number,
}
```

**Size target:** ~200–300 bytes per row on disk. Lean fields support SQL filtering (indexed columns) and card rendering. Qwen receives only the user's intent string (~10–20 tokens), not route cards.

---

### Convex: curated_route_enrichments (RICH — stays server-side, lazy-loaded)

Contains everything the lean tier omits. Never synced in bulk. Fetched per-route when the user opens a detail view or when the app pre-warms a visible list.

```typescript
{
  // --- Linking (shared stable ID) ---
  routeId: string,                     // FK to curated_routes.routeId

  // --- Long-form content ---
  fullDescription: string,             // 200–500 words, Haiku-generated
  history: string | null,              // backstory, cultural significance

  // --- Rich media ---
  photos: Array<{
    url: string,
    caption: string,
    attribution: string,
  }>,

  // --- Detailed technical attributes ---
  roadClassification: string[],        // OSM highwayClass tags: ["secondary", "tertiary"]
  surfaceMaterial: string,             // "paved" | "gravel" | "dirt" | "mixed"
  totalElevationGainM: number | null,
  elevationProfile: number[] | null,   // sampled elevation points for graph

  // --- Trip planning context ---
  nearestCities: string[],
  recommendedStarts: Array<{ lat: number, lng: number, name: string }>,
  fuelStops: Array<{ lat: number, lng: number, name: string, milesFromStart: number }>,

  // --- Rich community signal ---
  ridershipLevel: "low" | "moderate" | "high",
  seasonalNotes: string,
  safetyWarnings: string[],

  // --- Track data (optional, for download / navigation hand-off) ---
  gpxUrl: string | null,

  // --- Provenance / trust ---
  sources: Array<{
    site: string,
    url: string,
    lastFetched: number,
    extractionConfidence: number,     // 0.0–1.0
  }>,

  // --- Extraction metadata ---
  extractedBy: "haiku" | "manual",
  extractedAt: number,
  extractionSchemaVersion: number,     // matches the Pydantic schema version

  // --- Version tracking (must match curated_routes.enrichmentVersion) ---
  enrichmentVersion: number,
  lastEnrichedAt: number,
}
```

**Why split:** pulling this onto every device would blow up the sync payload (photos alone dominate). But once a user taps a specific route, one lookup by `routeId` returns everything needed for a full detail view.

---

### Convex: route_feedback

```typescript
{
  routeId: string,                     // shared stable ID (matches both tiers)
  userId: string,
  action: "save" | "hide" | "complete" | "rate",
  rating: number | null,               // 1-5 for "rate" action
  locationLat: number | null,          // user location at interaction time
  locationLng: number | null,
  archetypeFilter: string | null,      // active filter at interaction time
  timestamp: number,
}
```

---

### Local SQLite: discovery.db (LEAN mirror + enrichment cache)

```sql
-- ----------------------------------------------------------------
-- Lean tier (synced in bulk from Convex on launch + delta thereafter)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curated_routes (
  route_id TEXT PRIMARY KEY,              -- shared stable ID
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  source TEXT NOT NULL,

  primary_archetype TEXT NOT NULL,
  secondary_tags TEXT,                    -- JSON array

  centroid_lat REAL NOT NULL,
  centroid_lng REAL NOT NULL,
  bounds_ne_lat REAL, bounds_ne_lng REAL,
  bounds_sw_lat REAL, bounds_sw_lng REAL,
  length_miles REAL,

  composite_score REAL NOT NULL,
  curvature_score REAL,
  scenic_score REAL,
  technical_score REAL,
  traffic_score REAL,
  remoteness_score REAL,

  one_liner TEXT,                         -- ≤10 words
  summary TEXT,                           -- ≤15 words
  badges TEXT,                            -- JSON array
  season TEXT,

  content_version INTEGER NOT NULL,
  enrichment_version INTEGER,             -- matches server; null = no enrichment exists yet

  synced_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cr_state        ON curated_routes(state);
CREATE INDEX IF NOT EXISTS idx_cr_archetype    ON curated_routes(primary_archetype);
CREATE INDEX IF NOT EXISTS idx_cr_score        ON curated_routes(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_cr_centroid     ON curated_routes(centroid_lat, centroid_lng);
CREATE INDEX IF NOT EXISTS idx_cr_enrich_ver   ON curated_routes(enrichment_version);

-- ----------------------------------------------------------------
-- Enrichment cache (lazy-loaded per-route, keyed by shared ID)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curated_route_enrichment_cache (
  route_id TEXT PRIMARY KEY,              -- FK to curated_routes.route_id
  payload TEXT NOT NULL,                  -- JSON blob of full enrichment
  enrichment_version INTEGER NOT NULL,    -- version fetched from server
  fetched_at INTEGER NOT NULL,
  FOREIGN KEY (route_id) REFERENCES curated_routes(route_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enrich_fetched ON curated_route_enrichment_cache(fetched_at);

-- ----------------------------------------------------------------
-- Intent → params cache (normalized user intent → extracted params JSON)
-- Populated on every successful Haiku extraction; read first on every intent search.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS intent_param_cache (
  normalized_intent TEXT PRIMARY KEY,     -- lower(trim(collapse_ws(strip_stopwords(intent))))
  params_json TEXT NOT NULL,              -- validated 10-key params JSON
  schema_version INTEGER NOT NULL,        -- matches the intent-extraction prompt/schema version
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_hit_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_intent_hit_count ON intent_param_cache(hit_count DESC);
CREATE INDEX IF NOT EXISTS idx_intent_schema    ON intent_param_cache(schema_version);
```

**Cache eviction:**
- Enrichment cache: bounded at ~500 most recent rows via LRU. Lean tier is never evicted — it's cheap enough to keep the full synced state on device.
- Intent param cache: no size cap expected in practice (route search intents are highly repetitive and <100 bytes per row). Invalidated by `schema_version` mismatch after a prompt schema bump; stale rows are ignored and repopulated lazily, and a periodic `DELETE FROM intent_param_cache WHERE schema_version < ?current` runs on app start after a version bump.

**Staleness detection:** the app checks `curated_routes.enrichment_version` against `curated_route_enrichment_cache.enrichment_version` for any route. If they differ (or cache is missing), fetch on next online opportunity.

## API Design

### Internal (Admin-Only)

**POST /api/ingest-routes** — Upsert lean tier
- Description: Upsert a batch of `curated_routes` (lean tier) to Convex
- Auth: Bearer token (deploy key)
- Request: `{ routes: CuratedRoute[] }`
- Response: `{ created: number, updated: number, errors: string[] }`
- Note: Writes to `curated_routes` table only. Bumps `contentVersion` on any change.

**POST /api/ingest-enrichments** — Upsert rich tier
- Description: Upsert a batch of `curated_route_enrichments` (rich tier) to Convex
- Auth: Bearer token (deploy key)
- Request: `{ enrichments: CuratedRouteEnrichment[] }`
- Response: `{ created: number, updated: number, errors: string[] }`
- Note: Writes to `curated_route_enrichments` table. Also bumps `curated_routes.enrichmentVersion` on the linked record so clients can detect staleness.

**GET /api/dashboard/metrics**
- Description: Fetch pipeline health metrics
- Auth: Bearer token (deploy key)
- Response: `{ totalRoutes, totalEnrichments, bySource, lastScrape, llmCost, feedbackSummary }`

### Public (Client Access)

**GET /api/routes/lean**  — Bulk lean sync
- Description: Fetch lean tier for client sync (full list or delta)
- Auth: User authentication (Clerk)
- Query params: `state?` (optional filter), `since?` (optional timestamp for delta sync by `contentVersion`)
- Response: `{ routes: CuratedRoute[], lastUpdated: number }`
- Note: Returns ONLY lean fields. Never includes enrichment data.

**GET /api/routes/enrichment**  — On-demand enrichment fetch
- Description: Fetch rich enrichment for one or more routes by shared ID
- Auth: User authentication (Clerk)
- Query params: `ids` (comma-separated `routeId`s, max 50)
- Response: `{ enrichments: Record<string, CuratedRouteEnrichment | null> }`
- Note: Called when user opens a detail view, or when the app pre-warms enrichments for visible cards. `null` values indicate the enrichment is not yet generated for that route.

**GET /api/routes/missing-enrichments**  — Staleness check
- Description: Given a list of `(routeId, cachedEnrichmentVersion)` pairs, return which ones need refreshing
- Auth: User authentication (Clerk)
- Request (POST with JSON body, read-only semantics): `{ pairs: Array<{ routeId, version }> }`
- Response: `{ stale: string[] }` — IDs whose server `enrichmentVersion` exceeds `cachedEnrichmentVersion`
- Note: Cheap way for the app to batch-check staleness without fetching the full payloads.

**POST /api/feedback**
- Description: Record user route interaction
- Auth: User authentication (Clerk)
- Request: `{ routeId, action, rating?, locationLat?, locationLng?, archetypeFilter? }`
- Response: `{ success: boolean }`

**POST /api/intent/extract-params**
- Description: Server-side Haiku wrapper for intent → SQL query param extraction. Takes a user intent string and returns the validated 10-key params JSON. Runs the same prompt + Instructor schema + enum validator as the batch research code. Called by the Intent Query Service only on intent-cache misses when the device is online.
- Auth: User authentication (Clerk) — rate-limited per user
- Request: `{ intent: string, userLocation?: { lat: number, lng: number }, defaultRadiusMi?: number }`
- Response: `{ params: IntentParams, schemaVersion: number, latencyMs: number }` where `IntentParams` is the 10-key nullable schema: `archetype`, `state`, `min_length_mi`, `max_length_mi`, `max_technical`, `min_traffic_score`, `min_remoteness`, `max_distance_mi`, `season`, `sort_by`
- Error: `{ error: "LOW_CONFIDENCE_BROADEN", suggestedParams: Partial<IntentParams> }` when the model returns a result that fails enum validation or produces zero downstream results — the client can retry with a broadened intent.
- Guarantees: Haiku call is `temperature=0`, Instructor-validated, retry-on-validation-failure up to 2 times. Never writes SQL. Never sees route candidates. Returns only the structured params — all ranking is client-side via `params_to_sql()` + op-sqlite.
- Note: `schemaVersion` lets the client decide whether to overwrite an existing cache entry.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PYTHON AGGREGATION PIPELINE                  │
│                     (local script or GitHub Actions)            │
└─────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Web Scraper  │      │  LLM Extractor│      │Geometric      │
│  (httpx + BS4)│      │  (Haiku +     │      │Enricher       │
│               │      │   Instructor) │      │(adamfranco/   │
│ - motorcyclero│      │               │      │ curvature,    │
│   ads.com     │      │ - Pydantic    │      │ SRTM, FHWA)   │
│ - bestbikingr │      │   schema      │      │               │
│   oads.com    │      │ - Parallel    │      │ - OSM curves  │
│ - FHWA CSV    │      │   extraction  │      │ - Elevation   │
│ - BDR GPX     │      │               │      │ - Designation │
└───────────────┘      └───────────────┘      └───────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │    Scoring Engine         │
                    │  (Deterministic Formula,  │
                    │   weights from Calibration│
                    │   Step below — NOT hand-  │
                    │   tuned)                  │
                    │                           │
                    │ - Curvature: ~25%         │
                    │ - Scenery: ~15%           │
                    │ - Traffic: ~15%           │
                    │ - Condition: ~10%         │
                    │ - Elevation: ~10%         │
                    │ - Designation: ~10%       │
                    │ - Community: ~10%         │
                    │ - Remoteness: ~5%         │
                    └───────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │   Calibration Step        │
                    │  (GATE on Phase 3 exit)   │
                    │                           │
                    │ Fit weights vs ground     │
                    │ truth (Rider Mag Top 50   │
                    │ + FHWA Scenic Byways).    │
                    │ Emit fit report. Long-    │
                    │ tail extraction only runs │
                    │ AFTER this passes.        │
                    └───────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │  Archetype Classifier     │
                    │  (Decision Tree)          │
                    └───────────────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │   Convex HTTP   │
                        │   Action        │
                        └─────────────────┘
                                  │
                                  ▼
                        ┌─────────────────────────────┐
                        │     Convex Backend          │
                        │                             │
                        │  • curated_routes table     │
                        │  • route_feedback table     │
                        │  • Public query API         │
                        └─────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌─────────────────┐         ┌─────────────────┐
          │  Mobile Client  │         │  Admin Dashboard│
          │                 │         │                 │
          │ • Sync on launch│         │ • Pipeline      │
          │ • op-sqlite DB  │         │   health        │
          │ • SQL queries   │         │ • Feedback      │
          │ • Offline       │         │   trends        │
          └─────────────────┘         └─────────────────┘
                    │                           │
                    ▼                           ▼
          ┌─────────────────┐         ┌─────────────────┐
          │ Discovery UI    │         │ Pipeline        │
          │                 │         │ Management      │
          │ • Map view      │         │                 │
          │ • Filters       │         │ • Run scripts   │
          │ • Route details │         │ • Monitor logs  │
          │ • Feedback      │         │ • Calibrate     │
          └─────────────────┘         └─────────────────┘
```

## External Dependencies

### Web Scraping
- **httpx** — HTTP client for scraping (https://www.python-httpx.org)
- **beautifulsoup4** — HTML parsing (https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- **playwright** — JS-rendered page fallback (https://playwright.dev/python)

### LLM Extraction
- **anthropic-sdk** — Claude Haiku API (https://docs.anthropic.com)
- **instructor** — Structured extraction (https://python.useinstructor.com)
- **pydantic** — Schema validation (https://docs.pydantic.dev)

### Geometric Enrichment
- **adamfranco/curvature** — OSM curvature analysis (https://github.com/adamfranco/curvature)
- **SRTM data** — Elevation data (https://www.usgs.gov/core-science-systems/nli/eros)
- **Mapbox Elevation API** — Alternative elevation source (https://docs.mapbox.com)

### Data Sources
- **FHWA National Scenic Byways** — data.gov CSV (https://catalog.data.gov/dataset?tags=scenic-byways)
- **motorcycleroads.com** — Verify ToS before scraping
- **bestbikingroads.com** — Verify ToS before scraping
- **Rider Magazine** — Editorial ground truth (https://ridermagazine.com)

### Backend
- **Convex** — Canonical storage and sync (https://convex.dev)
- **op-sqlite** — Local SQLite for React Native (https://github.com/op-engineering/op-sqlite)

## UI Infrastructure

### Design Libraries
- React Native + Expo (existing)
- @rnmapbox/maps (existing from complete-local-routing)
- react-native-paper (existing)
- Existing copper-accented dark theme

### Style Tokens
- Copper accent: #C96D3E
- Dark theme colors (existing palette)
- Typography: Existing font hierarchy
- Spacing: Existing spacing scale

### Component Breakdown

**Reuse Existing Components:**
- MapboxMapView — From complete-local-routing
- BottomSheet — Existing pattern
- Filter chips — Existing UI pattern
- Loading indicators — Existing

**New Components Required:**
- RouteDiscoveryScreen — Main discovery map view
- RouteDetailsSheet — Bottom sheet with route info
- ArchetypeFilter — Filter chips for ride types
- StateFilter — State/region selector
- CurationDashboard — Admin metrics view

## Implementation Phases

### Phase 1: Seed Data (Weeks 1-2)
1. Set up Convex curated_routes schema
2. Implement FHWA CSV ingestion
3. Implement BDR GPX parsing
4. Implement composite scoring formula
5. Implement archetype decision tree
6. Create op-sqlite discovery.db schema
7. Implement Convex → SQLite sync

### Phase 2: Web Scraping (Weeks 2-3)
1. Set up Python project structure
2. Implement httpx + BeautifulSoup scraper
3. Implement rate limiting and politeness
4. Add resumable JSONL writes
5. Scrape motorcycleroads.com
6. Scrape bestbikingroads.com
7. Verify ToS compliance

### Phase 3: LLM Extraction (Weeks 3-4)
1. Set up Instructor + Anthropic SDK
2. Define Pydantic schema for RouteAttributes
3. Implement parallel extraction with ThreadPoolExecutor
4. Add error handling and retries
5. Calibrate against editorial ground truth
6. Validate extraction quality

### Phase 4: Discovery UI (Weeks 4-5)
1. Create RouteDiscoveryScreen with MapboxMapView
2. Implement bounding box queries
3. Add archetype filter UI
4. Add state filter UI
5. Create RouteDetailsSheet
6. Implement "Show on map" integration
7. Add offline support

### Phase 5: Data Flywheel (Weeks 5-6)
1. Implement Convex route_feedback table
2. Add feedback collection to discovery UI
3. Create admin dashboard metrics
4. Implement feedback aggregation
5. Add pipeline health monitoring
6. Document calibration process
