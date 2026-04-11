---
stability: CONSTITUTION
last_validated: 2026-04-10
prd_version: 1.3.0
---

# Curation TRD — Route Discovery Pipeline (Detailed)

**Version**: 1.3
**Status**: Draft
**Related PRD**: `.spec/prds/curation/README.md`
**Related Research**: 4 docs in `.spec/research/curation/` + `.spec/research/route-discovery-architecture.md` + `.spec/research/local-models/INTENT_TO_QUERY_RESULTS_2026-04-10.md` + `.spec/research/local-models/ENVIRONMENT_BIAS_FINDING_2026-04-10.md`

This document provides the complete technical architecture design for the Curation pipeline, synthesizing all research documents into a single coherent TRD while accounting for the existing codebase (Convex schema, osm_ways/osm_nodes tables, op-sqlite).

**v1.1 changes**: Adds AD-7 (ride segment aggregation), AD-8 (lean/enrichment tier split), AD-9 (shared-ID linking), and a dedicated §11 explaining the local LLM data shape strategy.

**v1.2 changes**: Replaces the Qwen3.5 candidate-ranking approach (failed viability gates: positional bias, score blindness) with validated intent → SQL query param extraction (slot-filling). Qwen's only local responsibility shifts from "rank from pool" to "extract params from intent text." See research: `INTENT_TO_QUERY_RESULTS_2026-04-10.md`.

**v1.3 changes**: Responding to the environment-bias finding (all Qwen latency numbers are Mac-MLX-only; mobile latency is unvalidated and estimated at ~6–15s), **on-device LLM is removed from the PRD entirely** — not deferred, not gated, not "v1.x". The single shipping path uses Claude Haiku online for intent → params extraction, backed by a normalized-intent cache in op-sqlite for offline replay of previously-seen queries. Non-cached offline intents surface a "Connect to search" empty state. The architectural invariant — text → structure only, ranking via SQL `ORDER BY` — is unchanged. Adds AD-10 (Pipeline Principles including new P0 "no on-device LLM"), AD-11 (Haiku + cache as the single path), AD-12 (calibration gate). Replaces §11 (Local LLM Data Shape Strategy) with the intent-cache architecture.

---

## 0. Key Architecture Decisions

Before diving into layers, these decisions shape everything downstream:

**AD-1: Python pipeline is offline, not in-app.**
Why: The pipeline runs once (or monthly). It has zero runtime footprint on the mobile app. Python is the right tool for scraping + LLM extraction + pandas manipulation. The app only consumes the output via Convex sync.

**AD-2: Convex is canonical source, op-sqlite is local cache.**
Why: Convex is already the source of truth for osm_ways, saved_routes, etc. Curated routes follow the same pattern. The mobile app never writes to curated_routes — it reads from local SQLite after syncing from Convex.

**AD-3: Curvature comes from existing osm_ways geometry, not adamfranco/curvature.**
Why: The research docs explored adamfranco/curvature (OSM PBF pipeline), but the codebase already has `osm_ways.geometry: number[][]` in Convex. A TypeScript curvature proxy computed from bearing changes between geometry points is sufficient for MVP ranking. The full adamfranco pipeline is a Phase 2 enhancement when higher-fidelity scores are needed.

**AD-4: All LLM inference is Claude Haiku (server-side). No on-device LLM.**
Why: Mobile latency for on-device Qwen3.5 0.8B was never validated — all prior benchmarks were run on a Mac using MLX, a Mac-only runtime. Estimated iPhone latency (~6–15s per inference) is unusable for interactive search. The 2026-04-10 environment-bias finding closed the book on on-device LLM for v1. Offline catalog browse is served by pure SQL over the synced lean tier; offline free-text intent search is served by the normalized-intent cache or shows a "Connect to search" state. Cost is ~$34 for 17k-route batch extraction (Phase 3) plus per-query Haiku costs for cache misses at runtime. **No on-device LLM appears anywhere in this TRD.** Ranking is always deterministic SQL.

**AD-5: No vector DB, no embedding model, no fine-tuning in MVP.**
Why: Combined with AD-4's "no on-device LLM," the device carries zero ML runtime at all. The full memory footprint of discovery is op-sqlite and the normalized-intent cache — kilobytes, not gigabytes. SQL-based discovery (bounding box + archetype + score) is sufficient. Semantic search is a future enhancement that would require its own PRD and its own research cycle before any embedding model enters the bundle.

**AD-6: Scoring is deterministic code, never LLM output.**
Why: LLM outputs are categorical (curviness: "twisty" | "moderate"). Code maps categories to numeric scores via lookup tables. This ensures reproducible, auditable scores.

**AD-7: Aggregation level is the ride segment, not the road or the route.**
Why: Raw OSM ways are semantically meaningless (1-5mi fragments). Named roads ("US-129") span hundreds of miles with wildly varying character. Full planned routes are compositions with no single archetype. A **ride segment** (5–50 miles, one name, one coherent experience, one primary archetype) is the atomic unit riders think in and the unit editorial lists enumerate.

**AD-8: Curation data splits into a lean local tier and a rich server enrichment tier.**
Why: The lean tier is optimized for **selection** — SQL filters, 0-1 scores, 10-word one-liners, 15-word summaries, discrete badges. Total size: ~50 tokens per record, ~300 bytes on disk. The whole lean tier syncs to every device and stays there. The rich tier is optimized for **display** — full descriptions, photos, GPX, elevation profiles, history, safety notes. It stays server-side and is lazy-loaded per-route only when a user actually needs it. This keeps local memory, sync payload, and LLM context all small without sacrificing richness when online.

**AD-9: Tiers are linked by a stable shared `routeId` and a version contract.**
Why: Every route has one ID that never changes, reused in `curated_routes.routeId`, `curated_route_enrichments.routeId`, `route_feedback.routeId`, and the local SQLite primary keys. The lean tier carries `enrichmentVersion` (bumped whenever the rich tier is regenerated), letting clients detect stale caches cheaply. When the device is offline, every card renders from lean fields alone; when online, tapping a card fires `GET /routes/enrichment?ids=...` against the shared ID for a single round-trip to the full payload. The version contract means we never guess whether a cache is current.

**AD-10: Pipeline Principles are hard constraints across every LLM stage.**
Why: Research 2026-04-10 crystallized six rules that apply regardless of which model is running. They are enforced globally, not per-component:
- **P0** — No on-device LLM. All inference is server-side Haiku. App bundle contains zero model files. (2026-04-10 environment-bias finding.)
- **P1** — LLMs do text → structure, never structure → selection. Ranking is always deterministic SQL.
- **P2** — Routes enter the catalog only from verifiable sources (FHWA, scraped URLs, OSM, BDR). No LLM recall.
- **P3** — Composite-score weights are calibrated against editorial ground truth before full-catalog extraction runs (see AD-12).
- **P4** — All LLM extraction runs at `temperature=0` with retry-on-degeneration.
- **P5** — A deterministic parser sits between every LLM output and downstream code (Instructor + Pydantic, `params_to_sql()`, enum validators).

**AD-11: Single shipping path — Claude Haiku online + normalized-intent cache.**
Why: All prior Qwen latency numbers (~1.5s) were measured with MLX on a 2026 MacBook Pro. MLX is Mac-only. Mobile production runtimes (Core ML on iOS, ONNX on Android) have ~4–6× lower memory bandwidth; estimated iPhone 15/16 Pro latency is ~6–15s — unvalidated and unacceptable for an interactive search box. See `.spec/research/local-models/ENVIRONMENT_BIAS_FINDING_2026-04-10.md`.

Rather than ship on an unvalidated claim or carry a "deferred" fallback indefinitely, on-device LLM is out of scope entirely. The single shipping path is:

1. **Normalize** the user intent string: `lower(trim(collapse_ws(strip_stopwords(intent))))`
2. **Cache lookup** in op-sqlite `intent_param_cache` keyed by (normalized intent, schema version)
3. **Hit** → validated params JSON → `params_to_sql()` → op-sqlite → top 10 (end-to-end <50ms, zero network)
4. **Miss + online** → POST `/api/intent/extract-params` (Haiku, Instructor, `temperature=0`, retry-on-validation-failure) → cache write → `params_to_sql()` → op-sqlite → top 10 (~1–2s)
5. **Miss + offline** → return `OFFLINE_UNSUPPORTED` so the UI can surface the "Connect to search, or try one of your recent searches" empty state with top cached intents as shortcut chips. **No inference is attempted.**

Cache coverage is expected to be high in practice (route search intents cluster heavily on a small set of phrasings). Catalog browse (UC-DISC-01 through UC-DISC-06) is separately offline-capable via pure SQL over the synced lean tier and is not gated on any LLM or cache.

If a future research cycle ever validates on-device LLM latency on real iPhone + Android hardware using production-runtime converters (Core ML / ONNX), that becomes its own initiative with its own PRD. It is not a dangling branch of this PRD.

**AD-12: Calibration is a hard gate on Phase 3 extraction.**
Why: Composite-score weights (curvature 25%, scenery 15%, etc.) must be fit against a labeled ground-truth set (Rider Magazine Top 50 + FHWA Scenic Byways) before running extraction over the long-tail scrape of 17k+ routes. Turning "do these weights feel right?" into a measurable calibration pass (top-10 recovery rate, residual distribution, per-feature sensitivity) prevents the much more expensive alternative of re-scoring the full catalog after the fact. Calibration is a hard gate: full-batch extraction does not run until calibration passes and the fit report is committed alongside the code.

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

The local database holds three tables:
1. `curated_routes` — lean tier, bulk-synced from Convex. Drives all SQL discovery queries and card rendering. Never written to by the app.
2. `curated_route_enrichment_cache` — rich tier cache, lazy-filled per-route when online. Used for detail views.
3. `intent_param_cache` — normalized-intent → extracted params JSON, written on every successful Haiku extraction, read on every intent search. The primary offline-feeling optimization in v1.

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

-- ----------------------------------------------------------------
-- INTENT → PARAMS CACHE — written on every successful Haiku extraction,
-- read first on every intent search before any network call.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS intent_param_cache (
  normalized_intent TEXT PRIMARY KEY,     -- lower(trim(collapse_ws(strip_stopwords(intent))))
  params_json TEXT NOT NULL,              -- validated 10-key JSON (archetype, state, sort_by, ...)
  schema_version INTEGER NOT NULL,        -- matches the intent-extraction prompt/schema version
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_hit_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_intent_hit_count ON intent_param_cache(hit_count DESC);
CREATE INDEX IF NOT EXISTS idx_intent_schema    ON intent_param_cache(schema_version);
```

**Cache policy:**
- **Enrichment cache:** bounded to ~500 most recently fetched rows (LRU eviction by `fetched_at`). When a user opens a detail sheet and the cache is empty or stale, the app fires a single fetch by `route_id` and writes the result back.
- **Lean tier:** never evicted — it's the offline contract.
- **Intent param cache:** no size cap (route-search intents are short and repetitive). Invalidated by `schema_version` mismatch after a prompt schema bump; stale rows are ignored and lazily repopulated, and a startup sweep optionally runs `DELETE FROM intent_param_cache WHERE schema_version < ?current`. The `hit_count DESC` index powers the "recent popular intents" chips shown on the offline empty state.

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

**Intent search (normalize → cache → Haiku → params_to_sql → SQL):**

```typescript
// End-to-end intent search. Does NOT rank with an LLM — ranking is SQL ORDER BY.
searchByIntent(db, {
  rawIntent: string,                       // user-typed text
  center: { lat, lng },                    // anchor for the bounding box
  defaultRadiusMi?: number,                // default 150
  topN?: number,                           // default 10
}): Promise<
  | { status: "ok", routes: CuratedRoute[], params: IntentParams, source: "cache" | "haiku" }
  | { status: "offline_unsupported", recentIntents: string[] }   // cache-miss + offline
  | { status: "empty", params: IntentParams, broadenedParams?: IntentParams }
>
```

Implementation shape:
```ts
async function searchByIntent(db, { rawIntent, center, ... }) {
  const normalized = normalizeIntent(rawIntent);
  const cached = lookupIntentCache(db, normalized, CURRENT_SCHEMA_VERSION);
  let params: IntentParams;
  let source: "cache" | "haiku";

  if (cached) {
    params = cached;
    source = "cache";
    bumpHitCount(db, normalized);
  } else if (isOnline()) {
    params = await fetchHaikuParams(rawIntent, center);  // POST /api/intent/extract-params
    validateEnums(params);                                // drops hallucinated enum values
    writeIntentCache(db, normalized, params, CURRENT_SCHEMA_VERSION);
    source = "haiku";
  } else {
    return { status: "offline_unsupported", recentIntents: topHitIntents(db, 6) };
  }

  const sql = paramsToSql(params, center);  // deterministic, parameterized
  const routes = runQuery(db, sql, topN);
  if (routes.length === 0) return { status: "empty", params };
  return { status: "ok", routes, params, source };
}
```

**No model ever sees a list of route candidates.** The model's entire output is the 10-key `IntentParams` JSON.

### 6.3 File Map (in-app)

```
lib/discovery/
  db.ts                       — op-sqlite discovery.db init + DDL (all three tables)
  sync-lean.ts                — Convex → SQLite bulk/delta pull for lean tier
  fetch-enrichment.ts         — per-route enrichment fetch + cache write + staleness check
  query.ts                    — queryNearby(), queryByState(), queryByArchetype(), queryTopRoutes()
  intent/
    normalize.ts              — normalizeIntent(): stopword strip + whitespace collapse + lowercase
    cache.ts                  — intent_param_cache CRUD + hit_count bumping
    params-to-sql.ts          — paramsToSql(): deterministic parameterized SQL construction
    validate.ts               — enum validator (drops hallucinated archetype/season/sort_by)
    schema.ts                 — IntentParams type + CURRENT_SCHEMA_VERSION constant
    search.ts                 — searchByIntent() orchestrator (normalize → cache → Haiku → SQL)
    haiku-client.ts           — POST /api/intent/extract-params wrapper with retry-on-validation-failure

hooks/
  use-route-discovery.ts      — location + archetype → ranked lean rows (pure SQL, no intent)
  use-intent-search.ts        — rawIntent + location → searchByIntent() result + loading states
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
- Haiku + Instructor integration (all calls at `temperature=0`, retry-on-validation-failure)
- **Calibration gate (AD-12)** — fit composite-score weights against Rider Mag Top 50 + FHWA ground truth, emit fit report, check top-10 recovery rate before proceeding
- Full batch extraction (17k routes) — gated on calibration pass
- Geometric enrichment from osm_ways

### Phase 4: Discovery UI (Weeks 4-5)
- Route discovery screen
- Map integration
- Filter/sort controls
- Route detail cards
- **Intent search (UC-DISC-07, Haiku + cache baseline):**
  - `intent_param_cache` table in op-sqlite
  - `normalizeIntent()` + `paramsToSql()` + enum validator in TypeScript (ported from research)
  - `/api/intent/extract-params` Haiku backend endpoint
  - `searchByIntent()` orchestrator (normalize → cache → Haiku → SQL)
  - Offline cache-miss empty state with recent-intents chips

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

lib/discovery/db.ts                       — op-sqlite discovery.db init + DDL (all three tables)
lib/discovery/sync-lean.ts                — bulk/delta lean tier pull from Convex
lib/discovery/fetch-enrichment.ts         — per-route enrichment fetch + cache
lib/discovery/query.ts                    — queryNearby(), queryByState(), queryByArchetype()
lib/discovery/intent/normalize.ts         — normalizeIntent(): stopword strip + whitespace collapse
lib/discovery/intent/cache.ts             — intent_param_cache CRUD + hit_count bumping + stale invalidation
lib/discovery/intent/params-to-sql.ts     — paramsToSql(): deterministic parameterized SQL construction
lib/discovery/intent/validate.ts          — enum validator (drops hallucinated archetype/season/sort_by)
lib/discovery/intent/schema.ts            — IntentParams type + CURRENT_SCHEMA_VERSION constant
lib/discovery/intent/search.ts            — searchByIntent() orchestrator (normalize → cache → Haiku → SQL)
lib/discovery/intent/haiku-client.ts      — POST /api/intent/extract-params wrapper with retry-on-validation-failure

hooks/use-route-discovery.ts              — location + archetype → lean rows via pure SQL (no intent)
hooks/use-intent-search.ts                — rawIntent + location → searchByIntent() result + loading/empty states
hooks/use-route-enrichment.ts             — routeId → full enrichment, cache-first, online-aware
```

**Modified files:**
```
convex/schema.ts                          — add curated_routes + curated_route_enrichments tables
convex/http.ts                            — add POST /ingest-routes, POST /ingest-enrichments, POST /api/intent/extract-params endpoints
```

---

## 11. Intent → Params → SQL: The Runtime Discovery Architecture

> **v1.3 note:** This section replaces the original v1.1 "candidate ranking" section in its entirety. The ranking approach failed viability gates in 2026-04-10 research (positional bias, score blindness, hallucinated IDs, instruction inversion). Every capability attributed to the local model here is validated by test: `.spec/research/local-models/INTENT_TO_QUERY_RESULTS_2026-04-10.md` (93% pass, 0.84 F1).

This section is the reason the data model looks the way it does. Every decision in §6 and §7 is in service of a single architectural invariant:

> **No LLM ever sees a list of route candidates. Ranking is always deterministic SQL on pre-computed composite scores.**

The model's only job at runtime is to extract 10 nullable query parameters from the user's intent string. Everything else — filtering, bounding-box query, ranking, top-N selection — is pure code.

### 11.1 The Architectural Invariant

**Text → structure, never structure → selection.** (Pipeline Principle P1.)

Research across three candidate Qwen roles (ranking, route modification, intent extraction) landed decisively on a single organizing principle: small and medium LLMs are reliable at extracting structured data from unstructured text, and unreliable at selecting from structured candidate lists. Positional bias, score blindness, hallucinated IDs, and instruction inversion are documented failure modes. They get weaker in larger models but do not vanish. The safe assumption across model scales is: never ask an LLM to rank.

This is the invariant. Every architectural choice below flows from it.

### 11.2 Data Flow (single shipping path)

```
User intent string (~10–20 tokens)
       │
       ▼
Normalize: lower(trim(collapse_ws(strip_stopwords(intent))))
       │
       ▼
┌──────────────────────────────┐
│  intent_param_cache lookup    │
│  (op-sqlite, PK = normalized) │
└──────────────────────────────┘
       │
   ┌───┴────┐
   │        │
  HIT      MISS
   │        │
   │    ┌───┴────┐
   │  online  offline
   │    │        │
   │    ▼        ▼
   │  Haiku   OFFLINE_UNSUPPORTED
   │  /api/    → empty state
   │  intent/   "Connect to search,
   │  extract-  or try a recent one"
   │  params    (shows cached hot intents
   │    │        ordered by hit_count DESC)
   │    ▼
   │  enum validator + retry-on-degeneration
   │    │
   │    ▼
   │  cache write
   │    │
   ▼    ▼
params (validated 10-key JSON)
       │
       ▼
params_to_sql()  (deterministic, parameterized, zero injection)
       │
       ▼
op-sqlite  (bounding box + filters + ORDER BY composite_score DESC LIMIT 10)
       │
       ▼
top 10 routes → render cards from lean tier
```

**No on-device LLM branch exists.** The cache-miss-offline path returns `OFFLINE_UNSUPPORTED` immediately without any inference attempt. Catalog browse (UC-DISC-01 through UC-DISC-06) is a separate flow that hits `curated_routes` directly via pure SQL and is fully offline-capable without consulting the intent cache.

### 11.3 The Validated Extraction Schema (10 nullable keys)

| Key | Type | Purpose |
|---|---|---|
| `archetype` | enum | twisties / mountain / coastal / adventure / scenic_byway / desert |
| `state` | string | 2-letter code; when set, overrides the bounding box |
| `min_length_mi` | number | "long" / "epic" intents |
| `max_length_mi` | number | "short" / "quick" intents |
| `max_technical` | number | 0.5 for "gentle" / "beginner" |
| `min_traffic_score` | number | 0.7 for "low traffic" (inverted: 1.0 = quietest) |
| `min_remoteness` | number | 0.7 for "remote" / "away from crowds" |
| `max_distance_mi` | number | radius override |
| `season` | enum | year_round / apr_nov / may_sep |
| `sort_by` | enum | curvature / scenic / technical / traffic / remoteness / length |

Everything is nullable. The model fills in only what the intent explicitly mentions. Unset keys mean "don't constrain this dimension."

### 11.4 The Intent Cache

```sql
CREATE TABLE intent_param_cache (
  normalized_intent TEXT PRIMARY KEY,
  params_json TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_hit_at INTEGER
);
CREATE INDEX idx_intent_hit_count ON intent_param_cache(hit_count DESC);
CREATE INDEX idx_intent_schema    ON intent_param_cache(schema_version);
```

**Normalization rule:**

```ts
function normalizeIntent(raw: string): string {
  const stopwords = new Set([
    "i", "want", "to", "show", "me", "find", "some", "a", "the",
    "please", "can", "you", "give", "looking", "for", "help", "with"
  ]);
  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")                    // strip punctuation
    .split(/\s+/)
    .filter(t => t.length > 0 && !stopwords.has(t))
    .join(" ")
    .trim();
}
```

**Properties:**
- "Show me something twisty", "twisty please", and "I want twisty roads" all collapse to `"something twisty roads"` (roughly — exact rule above). The cache hit rate is driven by how aggressively the normalizer strips filler, so the stopword list should be tuned against real traffic.
- No TTL. Route-discovery intents are stable over months — "twisty roads in Colorado" means the same thing tomorrow.
- Schema-versioned: after a prompt/schema bump, stale rows are ignored and lazy-repopulated. A startup sweep optionally deletes them.
- The `hit_count DESC` index powers the "recent popular intents" chips shown on the offline empty state.

### 11.5 Why This Is Safer Than Ranking

| Concern | Ranking approach (rejected) | Intent → params approach (shipping) |
|---|---|---|
| Positional bias | Severe (0% agreement across shuffles) | N/A — model never sees candidates |
| Score blindness | Severe (ignored numeric scores) | N/A — SQL reads scores, not the model |
| Hallucinated IDs | Documented | N/A — model never outputs IDs |
| Failure mode breadth | Candidate-list tasks have many edge cases | Flat 10-key JSON has tight, enumerable failure modes |
| Defensive layer | Hard to validate ranked output | Trivial: enum check + `{` present + retry |
| Reproducibility | Temperature drift, candidate order drift | temp=0 on a fixed prompt |
| Offline viability | Requires on-device model at runtime | Cache handles most traffic; Haiku-online handles the rest |

### 11.6 What the LLM Must Never Do

These are forbidden by the Pipeline Principles and are not permitted in any runtime or ingestion component:

- **Rank, select, or filter a candidate list.** SQL `ORDER BY` handles this.
- **Recall routes from training knowledge.** Routes must come from verifiable sources.
- **Generate route descriptions at query time.** Pre-baked in `oneLiner`, `summary`, rich tier `fullDescription`.
- **Assign archetypes at query time.** Decided by the decision tree during ingestion.
- **Compute scores.** Deterministic lookup tables during ingestion.
- **Write SQL.** `params_to_sql()` is pure code.
- **Run at temperature > 0 in any batch extraction stage.**
- **Call tools during the intent→params flow.** The extractor returns params; orchestration is separate.
- **Reason about composition** (multi-ride loops, multi-day trips). These route to Haiku in a separate, still-to-be-scoped flow — not through this PRD.

### 11.6b Never: on-device LLM

Specifically, and in addition to P1–P5, P0 forbids:

- Downloading any model file at app install, first-launch, or runtime.
- Loading any model runtime (`mlx-local`, `transformers`, Core ML, ONNX, `llama.cpp`, `whisper.cpp`, any embedding model).
- Calling any inference API on-device — even for tasks unrelated to intent search.
- Bundling any quantized weights, tokenizer vocabulary, or model config into the app binary.

The app's entire on-device "intelligence" is op-sqlite, the normalized-intent cache, and deterministic code. If a future PRD ever introduces on-device LLM, it must clear a separate research gate and ship in its own release.

### 11.7 Latency Budget

| Branch | Budget |
|---|---|
| Cache hit | <50ms total (normalize + lookup + `params_to_sql()` + SQL + render) |
| Cache miss + online | ~1–2s (Haiku call dominates) + ~50ms local |
| Cache miss + offline | <10ms (returns `OFFLINE_UNSUPPORTED`, no inference attempted) |
| Catalog browse (any filter/sort, any connectivity) | <20ms (pure SQL on indexed lean tier) |

**Expected real-world distribution:** after a few hundred searches, the majority of intent requests hit the cache. The Haiku + network path is the cold-start edge case for new phrasings. Non-cached offline is a hard "come back online" state — there is no fallback inference path.

---

This design is ready for sprint breakdown. The Phase 1 seed path (FHWA + BDR + editorial = ~244 routes) can ship discovery UI immediately while the scraping pipeline is built in parallel. The Python pipeline and the mobile app are completely decoupled — the pipeline writes to Convex (both tiers), the app reads lean from the local SQLite mirror and pulls rich enrichment on demand by shared `routeId`.
