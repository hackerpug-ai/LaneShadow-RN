---
stability: FEATURE_SPEC
last_validated: 2026-04-10
prd_version: 1.3.0
appetite_weeks: 6
---

# Scope

## Appetite

**6 weeks (full feature with polish)**

This appetite supports building the complete curation and discovery system including web scraping pipeline, LLM extraction, geometric enrichment, local SQLite discovery database, and user-facing discovery UI.

## In Scope

### Phase 1: Seed Data Pipeline (Weeks 1-2)
- FHWA National Scenic Byways CSV ingestion from data.gov
- BDR (Backcountry Discovery Routes) GPX parsing (10 routes)
- Rider Magazine Top 50 editorial extraction
- Composite scoring formula implementation
- Archetype classification (decision tree)
- Convex `curated_routes` schema and upsert mutations
- Local op-sqlite `discovery.db` initialization and sync

### Phase 2: Web Scraping Infrastructure (Weeks 2-3)
- Python scraping pipeline (local script with GitHub Actions option)
- motorcycleroads.com state-paginated route extraction
- bestbikingroads.com route extraction (17,976 routes)
- Rate limiting and polite scraping (2-4s delays, rotating UA)
- Resumable writes to JSONL for crash recovery
- ToS compliance verification before scraping

### Phase 3: LLM Extraction & Enrichment (Weeks 3-4)
- Claude Haiku + Instructor integration (all calls at `temperature=0`, retry-on-validation-failure)
- Pydantic schema for route attributes (curviness, scenery, traffic, etc.) — versioned via `extractionSchemaVersion`
- Parallel extraction with ThreadPoolExecutor (max_workers=5)
- OSM curvature analysis via adamfranco/curvature
- Elevation profile generation (SRTM or Mapbox API)
- FHWA scenic designation lookup and join
- **Calibration gate (BLOCKS Phase 3 exit):** fit composite-score weights against Rider Magazine Top 50 + FHWA Scenic Byways ground truth before running extraction over the long-tail scrape. Document the fit (weights, residuals, top-10 recovered rank) so weights are reproducible. No full-catalog extraction runs before calibration passes.

### Phase 4: Discovery UI (Weeks 4-5)
- Route discovery screen with map view
- Filter by archetype (twisties, mountain, coastal, adventure, scenic_byway, desert)
- Filter by state/region
- Sort by composite score or proximity
- Route detail cards with key highlights
- "Show on map" integration with existing MapboxMapView
- Local SQLite query optimization (bounding box indexes)
- **Intent search (UC-DISC-07) — Haiku-online baseline path:**
  - Intent → params via Haiku online with Instructor validation (10-key schema)
  - Normalized-intent cache table in op-sqlite, keyed by `lower(collapse_ws(strip_stopwords(intent)))`, versioned by schema version
  - Cache hit path: zero network, <50ms to results
  - Cache miss + online path: Haiku ~1–2s, cache on success
  - Cache miss + offline path: graceful "connect to search" empty state with recent-intents shortcuts
  - `params_to_sql()` identical regardless of param source (Haiku, cache, or future on-device)
- Enum validation + retry-on-degeneration layer ported from research (same code path runs on any model output)

### Phase 5: Data Flywheel Foundation (Week 5-6)
- User interaction tracking (save, hide, ride completion, rating)
- Feedback storage in Convex
- Auto-annotation schema for user preferences
- Dashboard for viewing curation pipeline results
- Error handling and retry logic for scraping failures
- Monitoring for scrape success rates

### Cross-Phase Infrastructure
- Error handling and logging throughout pipeline
- Validation at each pipeline stage
- Schema versioning for route data
- Documentation of scoring formula and calibration
- ToS compliance for all scraped sources

## Out of Scope

### Deferred to Future Cycles
- **On-device Qwen3.5 0.8B runtime for intent search** — deferred to v1.x spike, gated on Core ML iPhone benchmark (≤4s cold start, ≤3s warm, no thermal throttling across a 10-intent session on iPhone 15 Pro). Until that benchmark passes, offline cache-miss intents surface the "connect to search" empty state. The prompt + schema + normalize_params + retry-on-degeneration logic ports across, so this is a runtime swap, not a design change.
- **NLP forum mining** — ADVRider, Reddit scraping (high complexity, lower ROI for MVP)
- **Fine-tuning pipeline** — no training data yet, no GPU budget
- **Vector embeddings for local semantic search** — pushes memory toward 1.5GB ceiling
- **Seasonal access data** — mountain pass closure information
- **Real-time user contribution workflow** — users submitting their own routes
- **Social features** — sharing routes, commenting, leaderboards
- **GPX trace import/export** — user-generated route management
- **Advanced filtering** — by traffic levels, road condition, difficulty
- **Multilingual support** — non-English route descriptions
- **International expansion** — non-US routes and data sources

### Never in Scope (Separate Products)
- **Turn-by-turn navigation** — covered by complete-local-routing PRD
- **AI route generation** — covered by separate PRD
- **Community social features** — separate product initiative
- **Route planning tools** — separate product initiative
- **Ride tracking and logging** — separate product initiative

### Never in Scope (Architectural Guard-Rails)

These are forbidden by the Pipeline Principles in `00-overview.md`. Any PR that reintroduces them should be rejected at review:

- **Asking any LLM to enumerate, list, or recall motorcycle roads from training knowledge.** Routes enter the catalog only through verifiable sources (FHWA, scraped listicles with URLs, OSM geometric discovery, BDR GPX). Violates P2 (source-grounded only). Leads to hallucinated geography and convergence on the same 20 famous roads every app already has.
- **Asking any LLM to rank, select, or filter a candidate list of routes** (e.g., "pick the top 5 from these 20 based on the user's preference"). Ranking is always deterministic SQL `ORDER BY` on pre-computed composite scores. Violates P1 (text → structure only). Research 2026-04-10 confirmed severe positional bias and score blindness in the 0.8B model; literature shows weaker versions of the same failure in frontier models.
- **Asking any LLM to write SQL.** `params_to_sql()` is pure code. The model's output is a flat JSON of 10 nullable keys; SQL is constructed deterministically from validated params. Zero injection risk by construction.
- **LLM temperature > 0 in any batch extraction stage.** Reproducibility across pipeline re-runs is a hard requirement. All extraction runs at `temperature=0` with a retry-on-degeneration guard.

### Rationale for Exclusions

**On-device Qwen3.5 runtime deferred:** All Qwen latency benchmarks to date were run on a 2026 MacBook Pro (MLX, Mac-only). The production target is iPhone/Android with ~4–6× lower memory bandwidth and different runtimes (Core ML / ONNX). Estimated mobile latency is ~6–15s — unvalidated and unacceptable for an interactive search box. Shipping on an unvalidated performance claim is worse than shipping without the feature. The v1 path delivers the user-visible "offline feel" via a normalized-intent cache (which covers ~80% of real search traffic for free) and uses Haiku online for cache misses. The on-device Qwen port becomes a targeted v1.x spike once a Core ML device benchmark confirms the latency gate. Full rationale: `.spec/research/local-models/ENVIRONMENT_BIAS_FINDING_2026-04-10.md`.

**NLP forum mining deferred:** Forum text extraction is complex (login walls, dynamic content) and the signal-to-noise ratio is lower than structured sources. Better to start with high-quality structured data (FHWA, motorcycleroads.com) and add forum mining later when we have calibration data.

**Fine-tuning deferred:** Requires training data we don't have yet. The data flywheel will generate this over time. Current approach uses deterministic scoring + LLM extraction without model training.

**Vector embeddings deferred:** Qwen3.5 0.8B (1.15GB) + embedding model (~300MB runtime) would push total memory toward the 1.5GB ceiling. SQL-based discovery is sufficient for MVP.

**Real-time user contributions deferred:** Editorial curation first establishes quality baseline. User submissions can be added later with moderation workflow.

**International routes deferred:** US-focused sources (FHWA, US-based sites) provide sufficient coverage for MVP. International expansion requires localized data sources and multilingual support.

**Model-recalled routes never in scope:** Catalog originality is a strategic moat. A model asked to "list Colorado motorcycle roads" will converge on Million Dollar Highway, Independence Pass, Pikes Peak — the same 10 roads every competing app already has. The unique value of this catalog is the 500 roads that nobody has written a listicle about, surfaced through systematic scraping and OSM curvature discovery. Model recall is the opposite of that strategy; it's explicitly forbidden, not just deferred.

**LLM ranking never in scope:** Research 2026-04-10 showed 0% agreement across shuffles when Qwen ranked identical candidates — positional bias and score blindness make LLM-driven ranking fundamentally unreliable. Frontier models show weaker but present versions of the same failure. Ranking is a solved problem via deterministic SQL on pre-computed composite scores; there is no reason to re-introduce LLM ranking, ever.
