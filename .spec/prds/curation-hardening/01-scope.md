---
stability: FEATURE_SPEC
last_validated: 2026-04-12
prd_version: 1.2.0
appetite_weeks: 7
---

# Scope

## Appetite

**7 weeks total (including Week 0 validation)**

This appetite supports Week 0 validation to de-risk technical assumptions, followed by 6 weeks of implementation building all four hardening layers: source diversification (3 new sources), quality infrastructure (dedup, quality floor, coverage report, data quality report), scoring realignment with calibration enforcement (measured data integration), and community sources with NLP extraction pipeline.

## In Scope

### Priority 0: Validation & Setup (Week 0)
*Historical (Week 0, COMPLETED): The original Week 0 validation included a GLM NLP pilot. Epic 3's semantic matching pivot (2026-04-14) superseded that approach — LLM extraction now uses the `PostExtraction` contract (Epic 3 INF-005) returning structured output via Claude Haiku 4.5 tool-use. The bullets below describe what was validated at the time; they remain for historical traceability but are no longer the forward plan.*

- **GLM NLP pilot** *(historical)*: Build and test 100-post labeled dataset, measure accuracy against expectations for road name extraction and attribute classification
- **Convex Geospatial Index setup**: Install @convex-dev/geospatial (Beta), create GeospatialIndex, validate nearest-neighbor and range query performance
- **Decision gate**: Only proceed to Week 1 if validation passes (GLM accuracy >0.75, Convex Geospatial performant)
- **Source invalidation spikes (completed, sources dropped)**: VAL-002 (BDR GPX — PRD assumption 403-blocked; source also a V3 lifestyle mismatch) and VAL-003 (twtex.com — PRD assumption invalidated, site is a Texas forum not a curated Top 100 list) produced no-go verdicts. Retained as historical evidence.

### Priority 1: Source Diversification (Weeks 2-3)
- US Scenic Byways GIS Layer ingestion (799 routes from Koordinates, GeoJSON/Shapefile)
- adamfranco/curvature geometric discovery from US OSM PBF data (top 5% curvature roads)
- Rider Magazine 50 Best Roads editorial ingestion (ground truth anchor)
- Reconciliation of new Scenic Byways GIS against the Epic 2 baseline FHWA CSV (~645 routes derived from DOT ArcGIS `US_Scenic_Byways/MapServer/107` via BASE-000; see `tasks/epic-02-baseline-pipeline-validation/DECISIONS.md`)

### Priority 2: Quality Infrastructure (Weeks 4-5)
- Semantic deduplication engine: Convex native vectorIndex (cosine similarity via ctx.vectorSearch) + LLM arbitration via Claude Haiku. Auto-merge above 0.92 similarity, LLM arbitration for 0.75-0.92, create new route below 0.75. Uses the findCandidateRoutesByEmbedding query wrapper from Epic 3 INF-006.
- Convex Native Geospatial index for efficient proximity queries (nearest-neighbor with maxDistance)
- Source-priority merge policy (FHWA > editorial > community database > forum)
- Quality floor filter: require description OR rating OR designation OR curvature data
- Quality floor rejection log for manual review
- Coverage validation report: routes per state, per archetype, score distributions, gap detection
- Post-pipeline data quality report (JSON + markdown) with CI exit code gating
- Delta reporting against previous pipeline run

### Priority 3: Scoring & Calibration (Weeks 4-5)
- Composite score weight realignment: community_rating 5%→15%, mention_frequency 0%→10%, curviness 25%→20%, traffic 15%→10%, fhwa_designation 10%→5%
- **Measured data integration** (~3.5 days extra):
  - HPMS AADT → trafficScore (replace placeholder with measured Annual Average Daily Traffic)
  - HPMS IRI → pavementCondition (replace proxy with measured pavement quality)
  - NWS Climate Normals → weatherSuitability + bestMonths (compute seasonality from climate data)
- Configurable weight file (YAML/JSON, not hardcoded)
- Ground truth dataset: Rider Magazine 50 Best + FHWA All-American Roads + known iconic routes (50-100 total)
- Calibration gate enforcement: 80% per-attribute agreement, 80% composite score agreement
- Haiku extraction accuracy audit: per-attribute F1, confusion matrices, confidence tracking
- Weight change impact report (top gainers/losers)

### Priority 4: Community Sources & NLP (Weeks 5-7)
- ADVRider regional forum RSS feed ingestion (17 forums)
- Reddit motorcycle subreddit ingestion via public API (r/motorcycles, r/advrider, r/motorcyclesroadtrip)
- LLM extraction pipeline: single Claude Haiku 4.5 call per post returning the PostExtraction contract (Epic 3 INF-005) — road_name_mentions, highway_refs, state_refs, landmark_refs, sentiment, aspect_scores, attributes, warnings — replacing the previously-planned Road NER (regex + gazetteer) + TextBlob/VADER sentiment + keyword bucketing approach
- Mention aggregation: mention_frequency score, authority-weighted sentiment
- Community signal merge into composite scoring (mention_frequency at 10% weight)
- Incremental community ingestion scheduling (weekly via GitHub Actions)
- *Note: Community source implementation depends on Epic 3 semantic matching foundation (embeddings + PostExtraction contract) rather than the previously-planned Week 0 GLM pilot.*

### Cross-Priority Infrastructure
- Pipeline orchestrator: single entry point sequencing all stages (scrape → dedup → floor → extract → enrich → score → classify → calibrate → push → report)
- Route model extension: description, rating, designation, source_refs, mention_frequency, surface, elevation_gain, aadt, aadt_median, aadt_max, pavement_iri, weather_suitability, best_months
- EnrichedRoute extension: 10-dimension score vector aligned to research formula
- Convex schema evolution: new score fields as nullable columns (non-breaking)
- New enrichment clients: `hpms_client.py` (AADT + IRI spatial join), `weather_client.py` (NWS Climate Normals lookup)

## Out of Scope

### Deferred to Future Cycles

**Note (2026-04-14):** Vector embeddings were moved IN-SCOPE during the Epic 3 semantic matching pivot. The previously-planned rapidfuzz three-stage cascade was never validated against real community data; analysis revealed critical blind spots (nicknames, contextual refs, ambiguous names). See Epic 3 EPIC.md 'Architectural Decision' section for rationale.

- **Fine-tuned NLP models** — LLM extraction via the PostExtraction contract (Epic 3 INF-005) is accurate enough at ~90% on road name extraction via Claude Haiku 4.5. Sentence-transformers and fine-tuned BERT are not needed. Bumping to a larger embedding model (text-embedding-3-large, 3072-dim) is deferred — 1536-dim is sufficient for the current catalog size.
- **State DOT AADT data integration** — varies by state format, high collection effort; curvature provides sufficient new signals
- **International route sources** — US-focused for this initiative
- **Real-time community monitoring** — weekly batch is sufficient; real-time streaming deferred
- **Elevation profile enrichment** — SRTM/Mapbox integration is specced but deferred to implementation phase based on API availability

### Dropped (2026-04-12) — V3 strategy and PRD-assumption failures
- **BDR GPX (UC-SRC-02)** — Backcountry Discovery Routes are multi-day ADV/dual-sport routes. V3 pivot (lifestyle ride discovery community) targets street riders; ADV/off-road is a different persona. VAL-002 also found the published GPX URLs return 403. Dropped entirely; no replacement.
- **twtex.com Top 100 (UC-SRC-03)** — PRD assumption that twtex.com hosts a curated "Top 100 Motorcycle Roads" list is false. VAL-003 confirmed the site is Two Wheeled Texans, a Texas-only motorcycle forum with no structured listing. Dropped entirely; no replacement.
- **USFS Motor Vehicle Use Maps (UC-SRC-05)** — MVUM data is forest service gravel/dirt roads for dual-sport/ADV use. Same V3 lifestyle mismatch as BDR. Dropped entirely.
- **BLM Recreation & Roads** — was already deferred behind USFS; with USFS dropped, also removed from the roadmap entirely.
- **NPS Roads & Trails** — was already deferred behind USFS; with USFS dropped, also removed from the roadmap entirely.

### Never in Scope (Separate Initiatives)
- **User-submitted routes** — requires moderation workflow, separate product initiative
- **Social features** — sharing, commenting, leaderboards are separate product
- **Turn-by-turn navigation changes** — covered by complete-local-routing PRD
- **Discovery UI changes** — covered by existing curation PRD Epic 4
- **On-device LLM** — explicitly removed in curation PRD v1.3 (P0)

### Deferred to Native-Rewrite (2026-04-16)

Epic 11 (Mobile UI — New Field Display) has been deferred to the [native-rewrite PRD](../../native-rewrite/07-native-app-backlog.md). The client is transitioning from React Native to native Kotlin (Android) + Swift (iOS). Writing React Native UI components now would be throwaway work.

**What is deferred (consumption layer only):**
- Surface type badge on route discovery cards (DESIGN-008)
- Surface-type filter chips in discovery filter bar (DESIGN-009)
- Expanded route details sheet with description, best months, community signals (DESIGN-010)
- SQLite lean sync schema extension for surface/qualityTier/bestMonths (DESIGN-011)

**What is NOT deferred (production layer — stays in this initiative):**
- All pipeline data fields are still produced: `surface`, `qualityTier`, `bestMonths`, `description`, `rating`, `sourceCount`, `mentionFrequency`, `weatherSuitability`
- Convex schema (Epic 3 INF-003) still adds these optional fields
- Pipeline output (Epic 12 orchestrator) still pushes these fields to Convex
- The native apps will consume these fields via the same Convex API

**Data contract guarantee:** The curation-hardening pipeline ensures all fields listed in `09-technical-requirements.md` exist in Convex as `v.optional()` columns by Epic 12 completion. The native-rewrite PRD documents these fields as the consumption contract.

### Rationale for Exclusions

**AADT INCLUDED:** HPMS (Highway Performance Monitoring System) provides national AADT data in a single GeoJSON download — not per-state collection. Measured traffic data replaces LLM-extracted text signals with objective telemetry from instrument readings. The NLP pipeline's mention_frequency remains valuable as a complementary signal for route popularity and rider engagement.

**Fine-tuned NLP deferred:** LLM extraction deferred the need for fine-tuned models: the single-call PostExtraction contract (Epic 3 INF-005) gives structured road names, highways, states, landmarks, sentiment, aspects, attributes, and warnings in one Claude Haiku 4.5 call at ~$0.002/post. Total extraction cost for the 100k-post corpus is ~$200 — cheap enough that per-stage keyword filtering is no longer a cost lever. If extraction_confidence averages drop below 0.75 on validation, the upgrade path is a larger Claude model, not a smaller fine-tuned model.

**International deferred:** All new sources (Scenic Byways GIS, curvature, Rider Mag) are US-only. International expansion requires localized sources and different government data providers — separate initiative.

**Initiative thesis revised (2026-04-12):** Original thesis was aggressive source volume diversification to reduce BBR concentration from 98.8% to ~70-75%. With BDR, twtex, and USFS dropped, the achievable reduction is only ~85-90%. The remaining value of this initiative lives in **signal enrichment** — deduplication, quality floor, scoring realignment against research weights, community NLP, and measured traffic/weather data — all of which were already in scope as Epics 6-10. The three retained sources (Scenic Byways, curvature, Rider Mag) still contribute but are no longer the headline outcome.
