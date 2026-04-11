---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-10
prd_version: 1.4.0
---

# Curation — Route Discovery & Autonomous Data Flywheel

## Product Description

Curation enables LaneShadow's motorcycle riders to discover great routes without relying on community contributions. By combining autonomous web scraping, LLM-based attribute extraction, geometric enrichment (OSM curvature, elevation), and deterministic scoring, the system builds a comprehensive database of curated routes. A local-first architecture using op-sqlite ensures fast discovery queries work offline, while a data flywheel architecture continuously improves route quality as users provide feedback.

**Aggregation & Data Shape:** The system aggregates data at the **ride segment** level — coherent 5-50 mile experiences that riders name and talk about (e.g., "Deals Gap stretch of US-129"), not raw road segments or full routes. Every route is stored as **one canonical record** in a single `curated_routes` Convex table — all fields (scores, display text, full description, history, photos, sources, provenance) live on one row with one stable `routeId`. The client-side sync path uses **server-side projection**: a "lean" projection with only the narrow catalog-browse fields (~1 KB per row) is synced in bulk to op-sqlite for offline catalog browse, and the **full record** is fetched on demand by `routeId` when the user taps a detail view. No two-table tier split, no shared-ID version tracking, no cross-tier staleness checks — just one row, one `contentVersion`, two projections at the API boundary.

**Product Context:** LaneShadow is an AI-native motorcycle ride planner — map-first, conversation-driven. Tagline: "Ride the Moment" — turn a feeling into a road. Platforms: iOS and Android (React Native + Expo). Aesthetic: Rugged, industrial-warm, copper-accented, dark-first. This PRD extends the local-first routing infrastructure from complete-local-routing with route discovery capabilities.

## Problem Statement

**Current State:**
- LaneShadow has 0 users and 0 community routes — cold start problem
- Riders ask "Where should I ride today?" and have no answer
- Existing route databases (motorcycleroads.com, bestbikingroads.com) are walled gardens
- Great rides are hidden across forums, blogs, and government data sources
- No unified scoring system for route quality across curvature, scenery, and challenge
- Manual curation doesn't scale to covering the US

**Impact:**
- New users have nothing to discover — poor onboarding experience
- Adventure riders in unfamiliar regions have no local route knowledge
- Riders waste time searching scattered sources instead of riding
- Competing apps lock users into their closed ecosystems
- LaneShadow can't deliver on its core value proposition without great routes

## Solution Summary

Build an autonomous curation pipeline that:

1. **Discovers routes from multiple sources:**
   - FHWA National Scenic Byways (184 designated roads, free open data)
   - Community sites (motorcycleroads.com, bestbikingroads.com) via web scraping
   - Editorial sources (Rider Magazine Top 50, RevZilla Common Tread)
   - OSM data via curvature analysis (adamfranco/curvature algorithm)

2. **Extracts structured attributes using LLM (offline, Haiku-only):**
   - Claude Haiku + Instructor for reliable extraction
   - Categorical classification (curviness, scenery, traffic, surface, challenge)
   - Cost-effective: ~$34 for full 17k-route batch
   - All reasoning happens offline so the local 0.8B model never has to reason

3. **Enriches with geometric data:**
   - OSM curvature scores (meters spent in turns, weighted by tightness)
   - Elevation profiles (SRTM or Mapbox Elevation API)
   - FHWA scenic designation lookup
   - Road classification from OSM tags

4. **Computes deterministic composite scores:**
   - Curvature (25%), scenery (15%), traffic (15%), road condition (10%)
   - Elevation drama (10%), scenic designation (10%), community rating (10%), remoteness (5%)
   - Calibrated against editorial ground truth (Rider Magazine Top 50)

5. **Classifies into ride archetypes:**
   - Twisties, Mountain Epic, Coastal, Adventure, Scenic Byway, Desert
   - Decision tree or k-means clustering on normalized features

6. **Aggregates at the ride segment level** (the rider's mental atom):
   - 5–50 mile coherent experiences, not raw OSM ways and not full planned routes
   - One primary archetype, one set of pre-computed scores, one stable `routeId`
   - Matches how editorial lists name things and how communities vote

7. **Stores everything on one canonical Convex row, with projection-based sync:**
   - **Single Convex table** `curated_routes`: holds all fields for a given ride segment — identity, location, pre-computed scores, display text (one-liner, summary, badges), full description, history, photos, safety notes, seasonal notes, sources, provenance, extraction metadata. One mutation path. One `contentVersion`. One source of truth.
   - **Lean projection** (server-side, ~1 KB per row): returned by the bulk-sync query. Contains only the narrow catalog-browse fields — `routeId`, `name`, `state`, `primaryArchetype`, `secondaryTags`, `centroidLat/Lng`, bounds, `lengthMiles`, pre-computed scores, `oneLiner`, `summary`, `badges`, `season`, `contentVersion`. This is what op-sqlite `discovery.db` mirrors on the client. 17k routes × 1 KB ≈ 17 MB bulk sync — manageable on WiFi, tight on cellular but acceptable as a one-time first-launch step.
   - **Full-record projection** (server-side, ~6 KB per row): returned by `getRouteById`. Contains everything on the row. Called when the user taps a detail card. Cached per-route in an op-sqlite `curated_route_full_cache` LRU table for offline replay of previously-viewed detail sheets.
   - **No cross-tier version tracking.** The row has one `contentVersion` field; bulk-sync delta is a simple `WHERE contentVersion > clientLastSyncedVersion`. No `enrichmentVersion` double-bookkeeping, no shared-ID cross-table joins, no "enrichment exists but lean doesn't, or vice versa" failure modes.
   - **Projection rationale:** the two-tier split in v1.1 existed because (a) Qwen3.5 had an 0.8B context window and needed lean records, and (b) we didn't want to blow up the mobile sync payload with photos. Rationale (a) is dead in v1.3 (no on-device LLM). Rationale (b) is addressed by projection at the API layer, not by a second table. For Haiku call sites, the server projects whatever subset of fields the prompt needs at call time — "toss stuff out before context injection" happens per-call, not per-storage-layer.

8. **Powers discovery via intent → query translation + pre-selected local results:**
   - User expresses natural language intent ("twisty mountain roads", "something remote and challenging")
   - **Claude Haiku online** extracts structured query params (10 nullable keys: `archetype`, `state`, `sort_by`, `min_length_mi`, `max_technical`, `min_remoteness`, `season`, etc.) via Instructor-validated slot-filling at `temperature=0`.
   - Results are cached on device keyed by normalized intent string (lowercased, whitespace-collapsed, stop-word-stripped), giving a very high cache hit rate for common phrasings — "twisty mountain roads" is Haiku'd once, then returns from cache forever. The cache is the primary offline-feeling optimization.
   - **Deterministic `params_to_sql()`** converts extracted params into a parameterized SQL query — no SQL is ever written by the model, zero injection risk.
   - op-sqlite executes the query against `discovery.db` (<10ms) → returns top 10 routes ordered by pre-computed scores. **The LLM never sees route candidates** — ranking is fully deterministic via SQL `ORDER BY` on pre-computed composite scores. This is the hard architectural rule enforced across every stage (see "Pipeline Principles" below).
   - **Offline cache-miss UX:** returns an empty state with a "Connect to search, or try one of your recent searches" prompt that surfaces the top cached intents as shortcut chips. Routes cannot be discovered via free-text intent offline unless the cache already knows the answer — this is explicit and intentional.
   - Zero-results + connectivity: re-prompt Haiku with a "broaden the query" system message → re-run `params_to_sql()` → re-query locally.
   - Latency: cache hit <50ms. Cold Haiku hit ~1–2s + network.

9. **Serves via local-first discovery:**
   - op-sqlite `discovery.db` stores the lean-projection mirror of every curated route
   - SQL queries by bounding box, archetype, state, composite score — pure SQL on indexed columns, no LLM involvement, no network
   - Convex as canonical source with bulk sync on first launch and delta sync thereafter (`contentVersion`-gated)
   - Full records fetched on-demand by `routeId` on detail view; cached per-route in a bounded LRU cache table for offline replay
   - Catalog browse works fully offline after initial sync

10. **Builds data flywheel for continuous improvement:**
    - User interaction feedback (save, hide, ride, rate) collected
    - Auto-annotation of routes with user preferences
    - Filter and re-score based on real rider behavior
    - Future: periodic re-scraping to capture new community routes

**Technical Approach:**
- Python aggregation pipeline (local script or GitHub Actions)
- httpx + BeautifulSoup for static page scraping (most sources)
- Instructor + Claude Haiku for LLM extraction (offline pre-digestion) — always temp=0 for reproducibility
- adamfranco/curvature and/or osm_ways geometry for curvature analysis
- op-sqlite for the local lean-projection mirror, the full-record LRU cache, and the normalized-intent cache
- Convex for canonical storage (single `curated_routes` table) with projection-based sync at the API boundary
- Claude Haiku (online) for intent → SQL query param extraction, backed by a normalized-intent cache for offline replay of previously-seen queries

**No on-device LLM.** LaneShadow does not ship any on-device language model. All LLM inference is server-side Haiku. The normalized-intent cache is the sole mechanism that lets previously-seen queries work offline. This is a deliberate architectural choice driven by the 2026-04-10 mobile-latency research — see Pipeline Principles P0 below.

**Timeline:** 6 weeks (full feature with polish)
**Team:** 1 full-stack developer

---

## Pipeline Principles

These principles govern every LLM stage in the curation pipeline and every data-shape decision. They are derived from the 2026-04-10 local-model research cycle (see `.spec/research/local-models/`).

### P0 — No on-device LLM

**All LLM inference is server-side (Claude Haiku).** LaneShadow ships zero on-device language models. The only on-device "intelligence" is op-sqlite and the normalized-intent cache — both pure data structures, no inference.

Why: the 2026-04-10 environment-bias research (`ENVIRONMENT_BIAS_FINDING_2026-04-10.md`) showed that every Qwen3.5 latency measurement in prior research was taken on a 2026 MacBook Pro running MLX (a Mac-only runtime). Production-target mobile hardware (iPhone 15/16 Pro via Core ML, Android via ONNX) has ~4–6× lower memory bandwidth, and estimated mobile latency for the same model is ~6–15s per inference — unusable for an interactive search box. Shipping on an unvalidated performance claim was the single biggest risk in the v1.2 design, and v1.3 eliminates it entirely by removing on-device LLMs from scope.

Consequences enforced throughout this PRD:
- No model downloads, no "Download Your Shadow" onboarding, no Core ML bundle, no ONNX bundle, no mlx-local dependency.
- No "deferred on-device path," no "v1.x offline LLM fallback," no conditional gating on a device benchmark.
- Offline free-text intent search works only for cache hits. Non-cached offline intents surface "Connect to search" with recent-intents shortcuts.
- Catalog browse (bounds, filters, state, archetype) is still fully offline — it's pure SQL over the synced lean tier and doesn't touch any LLM, cached or otherwise.

### P1 — LLMs do text → structure, never structure → selection

**Every LLM call in this pipeline extracts structured attributes from unstructured text. No LLM call selects, ranks, or filters a list of candidates.** Ranking, filtering, and sorting are always deterministic — SQL `ORDER BY` on pre-computed composite scores.

The 2026-04-10 research validated this rule definitively: small local models fail at structure → selection (positional bias, score blindness, hallucinated IDs, instruction inversion), and even frontier models show weaker versions of the same failure modes. The architecture must never depend on "ask the model to pick the top N."

**Applied:**
- Intent → query params: text → flat JSON ✅
- Source blog/listicle → route attributes: text → structured fields ✅
- Haiku ranking 20 route candidates: ❌ never — SQL does this
- Haiku "list great motorcycle roads in Colorado": ❌ never (see P2)

### P2 — Source-grounded only: never ask models to recall routes

**No LLM is ever asked to enumerate, list, or recall motorcycle roads from training knowledge.** Routes enter the system only through verifiable sources: FHWA Scenic Byways open data, scraped community listicles with source URLs, OSM geometric discovery via curvature analysis, and BDR GPX files.

Why: model "recall" is stale, uncalibrated, and silently hallucinates geography (the Qwen research showed it describing I-5 Seattle→Portland as a Pacific-coast route). It also converges on the same 20 famous roads every competing app already has — Tail of the Dragon, PCH, Blue Ridge Parkway — which destroys the originality of the catalog. The moat is the 500 roads nobody has written a listicle about, and those only come from systematic scraping + geometric discovery.

**Applied:**
- LLM reads a blog post about a specific road → extract attributes ✅
- LLM "from your training, list the best twisty roads in California": ❌ never
- OSM curvature pass that surfaces an unnamed county road with curvature score 0.92 → candidate route ✅

### P3 — Calibrate scoring against editorial ground truth before running the long tail

The composite score weights (curvature 25%, scenery 15%, etc.) must be fit against a labeled ground-truth set (Rider Magazine Top 50, FHWA Scenic Byways) **before** running extraction over the 17k-route scrape. Turning "does this scoring feel right?" into a measurable calibration step is cheap and prevents re-scoring the full batch later after we discover the weights are off. Calibration is a gate on Phase 3 completion, not an afterthought.

### P4 — Determinism at temp=0, reproducible pipeline runs

Every LLM extraction stage runs at `temperature=0` with a retry-on-degeneration guard. This gives the pipeline reproducible re-runs: the same source text produces the same extracted attributes on the second run, which means we can safely re-run the batch after schema changes, bug fixes, or prompt updates. Schema version is tracked in `extractionSchemaVersion` so clients know when to refresh.

### P5 — Deterministic boundary between probabilistic and guaranteed

Each pipeline stage has a deterministic parser (StructuredOutputParser / Instructor + Pydantic) between the LLM output and the downstream code. LLM output is validated, enum-checked, and re-prompted on failure before any downstream step runs. The parser is the firewall: everything before it is probabilistic; everything after it is guaranteed. This applies to `params_to_sql()` (validates the 10-key intent schema), the RouteAttributes extractor (validates the Pydantic source-extraction schema), and the archetype classifier (rejects any archetype not in the enum).

---

## Research & Prior Initiatives

### Foundation: Complete Local Routing (`complete-local-routing`)

This PRD builds directly on the infrastructure delivered by the **complete-local-routing** initiative (`.spec/prds/complete-local-routing/`). That initiative established:
- **Mapbox SDK + @rnmapbox/maps** as the map rendering and offline routing engine
- **op-sqlite** as the on-device database layer (used here for `discovery.db`)
- Offline-first architecture pattern (download → sync → query locally)
- Provider-agnostic route storage in Convex

Curation reuses op-sqlite and the offline-first sync pattern to build `discovery.db` as a sibling database alongside the routing data. The `complete-local-routing` MapboxMapView component is the direct dependency for UC-DISC-06 (show route on map).

### Research History: Why No On-Device LLM (and why ranking is always SQL)

**Research files:**
- `.spec/research/local-models/INTENT_TO_QUERY_RESULTS_2026-04-10.md`
- `.spec/research/local-models/VALIDATION_RESULTS_2026-04-10.md`
- `.spec/research/local-models/MAPBOX_MUTATION_RESULTS_2026-04-10.md`
- `.spec/research/local-models/ENVIRONMENT_BIAS_FINDING_2026-04-10.md` (decisive)

Earlier versions of this PRD (v1.1, v1.2) planned to run Qwen3.5 0.8B on-device — first for candidate ranking (v1.1), then for intent → SQL slot-filling (v1.2). Both designs were abandoned. The history is load-bearing context for anyone reviewing this PRD:

**Phase 1: Ranking was rejected (v1.2 correction).** We tested small-model candidate ranking and it failed every viability gate:

| Role tested | Result | Why |
|------|--------|-----|
| Candidate ranking (select top N from 20 route cards) | ❌ NOT VIABLE | Positional bias (0% agreement across shuffles), score blindness, hallucinates IDs |
| Route modification / leg swap | ❌ NOT VIABLE | Echoes original legs, can't apply constraints |
| Intent → SQL query param extraction (slot-filling) | ✅ VIABLE on Mac MLX — 93% pass rate, 0.84 F1 | Text → structure is the direction small models do well |

This crystallized the organizing principle now encoded in P1: **small and medium LLMs are good at structured extraction from unstructured text, bad at selection from structured candidates.** Every viable use case is "text → structure." Every failed use case is "structure → selection." Even frontier models show weaker versions of the same failure modes. Ranking is now always deterministic SQL — this rule applies regardless of model scale, regardless of whether the model is on-device or server-side.

**Phase 2: On-device runtime was rejected (v1.3 correction).** The v1.2 design kept intent → slot-filling on-device via Qwen3.5 because the Mac-MLX numbers looked acceptable (~1.5s). The environment-bias finding exposed the flaw: MLX is a Mac-only runtime. Production-target mobile hardware (iPhone via Core ML, Android via ONNX) has ~4–6× lower memory bandwidth, and estimated mobile latency for the same 0.8B model is ~6–15s per inference. No mobile benchmark was ever run. Shipping a "1.5s on device" claim based on Mac numbers would have been materially misleading.

v1.3 removes on-device LLM from the PRD entirely, not as a deferral but as a decision. The architectural invariant — text → structured params → deterministic SQL — is preserved, but the runtime moves to server-side Haiku with a normalized-intent cache for offline replay. If a future research cycle validates on-device latency on real iPhone + Android hardware with production runtimes, that becomes its own PRD. It is not a dangling branch of this one.

### The v1.3 decision in one paragraph

The v1.3 revision (this version) addresses the **environment-bias finding** in `.spec/research/local-models/ENVIRONMENT_BIAS_FINDING_2026-04-10.md`: every on-device Qwen latency measurement in prior research was taken on a 2026 MacBook Pro running MLX (a Mac-only runtime). Production-target mobile hardware — iPhone via Core ML, Android via ONNX — has ~4–6× lower memory bandwidth, and estimated mobile latency for the same model is ~6–15s per inference. That figure was never validated and is unacceptable for an interactive search box.

Rather than ship on an unvalidated claim or carry a "v1.x deferred" fallback indefinitely, v1.3 removes on-device LLMs from the PRD entirely. The single shipping path is:

**Intent → params via Haiku online, backed by a normalized-intent cache on device:**
- Intent string normalized via `lower(trim(collapse_ws(strip_stopwords(intent))))`
- Cache lookup in op-sqlite `intent_param_cache` keyed by normalized intent + schema version
- Cache hit → validated params → `params_to_sql()` → SQL → results in <50ms, zero network
- Cache miss + online → POST `/api/intent/extract-params` (Haiku at temp=0, Instructor-validated, retry-on-validation-failure) → cache write → SQL → results
- Cache miss + offline → `OFFLINE_UNSUPPORTED` empty state with "Connect to search, or try one of your recent searches" + top cached intents as shortcut chips
- Catalog browse (bounds, filters, state, archetype) remains fully offline via pure SQL over the synced lean tier — no LLM touched, no cache consulted

**Why this is the right answer, not a compromise:**
- The cache is expected to cover the large majority of real search traffic. Route discovery intents cluster heavily on a small set of phrasings — "twisty roads," "coastal ride," "mountain route in Colorado" — and normalization collapses many surface variants onto the same key. After the first few dozen users hit the cache, the user-visible "offline feel" comes from the cache, not from any model.
- Removing on-device LLM eliminates the single biggest unknown in the PRD (mobile latency), removes a ~1GB+ model download from the app bundle, drops the `mlx-local` / Core ML / ONNX dependency chain, and deletes the "Download Your Shadow" onboarding step entirely.
- The architectural invariant — text → structured params → deterministic SQL, model never sees candidates — is preserved exactly. Only the runtime surface changes.
- If a future research cycle ever validates on-device latency on real iPhone and Android hardware, the same prompt + schema + `normalize_params` + retry logic ports over as a drop-in. That becomes a separate initiative with its own PRD, not a dangling "deferred" branch of this one.
