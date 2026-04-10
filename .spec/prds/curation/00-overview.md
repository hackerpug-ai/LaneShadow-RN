---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-10
prd_version: 1.3.0
---

# Curation — Route Discovery & Autonomous Data Flywheel

## Product Description

Curation enables LaneShadow's motorcycle riders to discover great routes without relying on community contributions. By combining autonomous web scraping, LLM-based attribute extraction, geometric enrichment (OSM curvature, elevation), and deterministic scoring, the system builds a comprehensive database of curated routes. A local-first architecture using op-sqlite ensures fast discovery queries work offline, while a data flywheel architecture continuously improves route quality as users provide feedback.

**Aggregation & Data Shape:** The system aggregates data at the **ride segment** level — coherent 5-50 mile experiences that riders name and talk about (e.g., "Deals Gap stretch of US-129"), not raw road segments or full routes. Data is split across two tiers linked by **stable shared IDs**: a **lean local tier** (~50 tokens per route) optimized for SQL filtering and on-device Qwen3.5 ranking, and a **rich server enrichment tier** with full descriptions, photos, GPX, and community data that is lazy-loaded when the device has connectivity. This split keeps the mobile app fast and offline-capable while still delivering full richness of curated content when the network allows.

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
   - One primary archetype, one set of pre-computed scores, one stable ID
   - Matches how editorial lists name things and how communities vote
   - Small enough that 40+ fit in a single Qwen3.5 0.8B context window

7. **Splits data into lean local + rich server enrichment (shared-ID linking):**
   - **Lean Local tier** (op-sqlite `discovery.db`, ~50 tokens per route): pre-computed scores, 10-word one-liner, 15-word summary, discrete badges, location bounds. Optimized for SQL filtering and on-device LLM ranking. Fully offline capable.
   - **Rich Server tier** (Convex `curated_route_enrichments`): full descriptions, photos, history, GPX, community reviews, elevation profiles, provenance. Stays server-side, lazy-loaded by shared `routeId` when connectivity is available.
   - **Shared stable ID**: every route uses the same `id` in both tiers. When the device comes online, the app identifies which enrichments are missing or stale via `enrichmentVersion` tracking and prefetches only what's needed. A single call returns full enrichment for any route card.

8. **Powers discovery via intent → query translation + pre-selected local results:**
   - User expresses natural language intent ("twisty mountain roads", "something remote and challenging")
   - **Baseline shipping path (v1):** Claude Haiku online extracts structured query params (10 nullable keys: `archetype`, `state`, `sort_by`, `min_length_mi`, `max_technical`, `min_remoteness`, `season`, etc.) via Instructor-validated slot-filling. Results are cached on device keyed by normalized intent string (lowercased, whitespace-collapsed, stop-word-stripped), giving a very high cache hit rate for common phrasings — "twisty mountain roads" is Haiku'd once, then returns from cache forever.
   - **Deterministic `params_to_sql()`** converts extracted params into a parameterized SQL query — no SQL is ever written by any model, zero injection risk. This layer is identical regardless of which model produced the params.
   - op-sqlite executes the query against `discovery.db` (<10ms) → returns top 10 routes ordered by pre-computed scores. **The LLM never sees route candidates** — ranking is fully deterministic via SQL `ORDER BY` on pre-computed composite scores. This is the hard architectural rule enforced across every stage (see "Pipeline Principles" below).
   - **Deferred offline optimization path (v1.x, gated on Core ML device benchmark):** Port the same prompt + normalize + retry logic to Qwen3.5 0.8B running on-device for a fully offline non-cached hot path. Only activated after the curation-unrelated Core ML latency validation proves ≤3s on iPhone 15 Pro / iPhone 16 Pro. Until then, non-cached offline intents show "connect to search" state. Validated in principle: 93% pass rate, 0.84 F1 on MLX/Mac (2026-04-10); mobile latency TBD.
   - Zero-results + connectivity: re-prompt Haiku with a "broaden the query" system message → re-run `params_to_sql()` → re-query locally.
   - Cached-hit latency: <50ms. Cold Haiku latency: ~1–2s + network. Offline non-cached: unavailable in v1, offline-optimized in v1.x.

9. **Serves via local-first discovery:**
   - op-sqlite `discovery.db` stores lean curated routes locally
   - SQL queries by bounding box, archetype, state, composite score
   - Convex as canonical source with sync on first launch
   - Works fully offline after initial sync; enrichment is additive when connected

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
- op-sqlite for local lean discovery database
- Convex for canonical storage (lean + enrichment tiers) and sync
- Claude Haiku (online) for intent → SQL query param extraction in v1
- Normalized-intent → params cache on device (the primary offline-feeling optimization in v1)
- Qwen3.5 0.8B on-device as a deferred offline fallback (v1.x, gated on Core ML device benchmark)

**Timeline:** 6 weeks (full feature with polish)
**Team:** 1 full-stack developer

---

## Pipeline Principles

These principles govern every LLM stage in the curation pipeline and every data-shape decision. They are derived from the 2026-04-10 local-model research cycle (see `.spec/research/local-models/`) and apply regardless of which model is running.

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

### Qwen3.5 0.8B: Validated Role

**Research file:** `.spec/research/local-models/INTENT_TO_QUERY_RESULTS_2026-04-10.md`

**Why intent/filter instead of ranking:**

We tested three roles for Qwen3.5 0.8B in this cycle:

| Role | Result | Why |
|------|--------|-----|
| Candidate ranking (select top N from 20 route cards) | ❌ NOT VIABLE | Positional bias, score blindness, hallucinates IDs |
| Route modification / leg swap | ❌ NOT VIABLE | Echoes original legs, can't apply constraints |
| Intent → SQL query param extraction (slot-filling) | ✅ **VIABLE** — 93% pass rate, 0.84 F1 | Text → structure is the direction 0.8B models do well |

The core insight: **Qwen3.5 is good at structured extraction from unstructured text, bad at selection from structured candidates.** Every viable use case is "text → structure." Every failed use case is "structure → selection."

**Consequence for the discovery architecture:**

The previous v1.1 design (SQL pre-filters to 20 candidates → Qwen ranks them → returns top 5 IDs) inverts this. The model must reason over structured route objects, compare scores, and return IDs — exactly the "structure → selection" pattern it cannot reliably do.

The v1.2+ design corrects this:
- The model (Haiku or Qwen) receives **only the user's intent string** (~10–20 tokens) and extracts 10 nullable query params
- Deterministic `params_to_sql()` constructs the query; SQL handles ranking via `ORDER BY` on pre-computed scores
- Routes returned are **pre-selected by the database**, not the model

### v1.3: Haiku-first with deferred on-device Qwen

The v1.3 revision (this version) addresses a second research finding — the **environment-bias caveat** in `.spec/research/local-models/ENVIRONMENT_BIAS_FINDING_2026-04-10.md`. All Qwen latency numbers were measured on a 2026 MacBook Pro running MLX, a Mac-only runtime. Mobile inference runs Core ML (iOS) or ONNX (Android) with ~4–6× lower memory bandwidth. The estimated iPhone 15/16 Pro latency for Qwen is ~6–15s, not the ~1.5s observed on Mac. This figure is unvalidated and blocks any offline latency promise.

Rather than ship on an unvalidated claim, v1.3 treats the on-device model as a **deferred optimization**:

**v1 shipping path (Haiku online + intent cache):**
- Intent → params via Haiku online, with Instructor validation
- Normalized-intent cache on device: `lower(trim(collapse_ws(strip_stopwords(intent))))` → cached params JSON, indefinite TTL (schema-versioned for invalidation)
- Cache hit → local SQL → results in <50ms, zero network
- Cache miss + online → Haiku ~1–2s → SQL → results, cache the result
- Cache miss + offline → "Searching needs a connection right now — or try one of your recent searches" (show recent-intents list)
- Same `params_to_sql()` layer, same schema, same defensive enums

**v1.x deferred path (on-device Qwen fallback for offline cache misses):**
- Gated on a Core ML iPhone benchmark: cold-start ≤4s, warm inference ≤3s sustained across 20 scenarios, no thermal throttling within a 10-intent session
- Same validated prompt + normalize_params + retry-on-degeneration logic, ported from MLX to Core ML (iOS) and ONNX (Android)
- Enables offline non-cached search; everything online still goes through Haiku + cache for quality
- If Core ML benchmark fails, the on-device path is dropped permanently and "offline intent search" becomes a non-goal

**Why this ordering is better:**
- Ships UC-DISC-07 end-to-end on day 1 of Phase 4, not gated on model-conversion work
- Cache covers ~80%+ of real search traffic (common intents repeat heavily), so the user-visible "offline feel" is delivered by the cache, not the local model
- De-risks the PRD against the single biggest unknown (mobile Qwen latency)
- Keeps the on-device Qwen code path optional and swappable — the Core ML port is a one-week spike, not a blocker
