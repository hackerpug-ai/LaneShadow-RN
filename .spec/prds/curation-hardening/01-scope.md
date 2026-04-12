---
stability: FEATURE_SPEC
last_validated: 2026-04-12
prd_version: 1.1.0
appetite_weeks: 7
---

# Scope

## Appetite

**7 weeks total (including Week 0 validation)**

This appetite supports Week 0 validation to de-risk technical assumptions, followed by 6 weeks of implementation building all four hardening layers: source diversification (6 new sources), quality infrastructure (dedup, quality floor, coverage report, data quality report), scoring realignment with calibration enforcement (measured data integration), and community sources with NLP extraction pipeline.

## In Scope

### Priority 0: Validation & Setup (Week 0)
- **GLM NLP pilot**: Build and test 100-post labeled dataset, measure accuracy against expectations for road name extraction and attribute classification
- **BDR GPX verification**: Live accessibility test of ridebdr.com GPX downloads, verify file format and segmentation feasibility
- **twtex.com comprehensive research**: Full feasibility assessment including WAF bypass, legal/terms-of-use review, and technical scraping approach
- **Convex Geospatial Index setup**: Install @convex-dev/geospatial (Beta), create GeospatialIndex, validate nearest-neighbor and range query performance
- **Decision gate**: Only proceed to Week 1 if validation passes (GLM accuracy >0.75, BDR GPX accessible, twtex feasible, Convex Geospatial performant)

### Priority 1: Source Diversification (Weeks 2-3)
- US Scenic Byways GIS Layer ingestion (799 routes from Koordinates, GeoJSON/Shapefile)
- BDR GPX file ingestion (10 multi-day backcountry routes, segmented to ride-segment chunks)
- twtex.com Top 100 crowd-sourced motorcycle roads ingestion
- adamfranco/curvature geometric discovery from US OSM PBF data (top 5% curvature roads)
- USFS Motor Vehicle Use Maps ingestion from Data.gov (forest roads open to motorcycles)
- Rider Magazine 50 Best Roads editorial ingestion (ground truth anchor)
- Reconciliation of new Scenic Byways GIS against existing FHWA CSV routes (184 overlap)

### Priority 2: Quality Infrastructure (Weeks 4-5)
- Three-stage deduplication engine: exact name+state, fuzzy Levenshtein (>0.85), geospatial proximity (centroid <5km + length <20%)
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
- NLP extraction pipeline: Road NER (regex + gazetteer), sentiment analysis (TextBlob/VADER), attribute classification (keyword → 6 buckets)
- Mention aggregation: mention_frequency score, authority-weighted sentiment
- Community signal merge into composite scoring (mention_frequency at 10% weight)
- Incremental community ingestion scheduling (weekly via GitHub Actions)
- *Note: Community source implementation depends on Week 0 GLM pilot validation*

### Cross-Priority Infrastructure
- Pipeline orchestrator: single entry point sequencing all stages (scrape → dedup → floor → extract → enrich → score → classify → calibrate → push → report)
- Route model extension: description, rating, designation, source_refs, mention_frequency, surface, elevation_gain, aadt, aadt_median, aadt_max, pavement_iri, weather_suitability, best_months
- EnrichedRoute extension: 10-dimension score vector aligned to research formula
- Convex schema evolution: new score fields as nullable columns (non-breaking)
- New enrichment clients: `hpms_client.py` (AADT + IRI spatial join), `weather_client.py` (NWS Climate Normals lookup)

## Out of Scope

### Deferred to Future Cycles
- **Vector embeddings / semantic search** — quality floor + improved scoring addresses catalog quality without ML runtime on device
- **Fine-tuned NLP models** — keyword + regex NLP first; upgrade to sentence-transformer only if accuracy < 0.75
- **State DOT AADT data integration** — varies by state format, high collection effort; USFS + curvature provide sufficient new signals
- **International route sources** — US-focused for this initiative
- **Real-time community monitoring** — weekly batch is sufficient; real-time streaming deferred
- **Elevation profile enrichment** — SRTM/Mapbox integration is specced but deferred to implementation phase based on API availability
- **BLM Recreation & Roads** — similar to USFS but lower priority; add after USFS validates the government data ingestion pattern
- **NPS Roads & Trails** — ArcGIS hub access; add after USFS

### Never in Scope (Separate Initiatives)
- **User-submitted routes** — requires moderation workflow, separate product initiative
- **Social features** — sharing, commenting, leaderboards are separate product
- **Turn-by-turn navigation changes** — covered by complete-local-routing PRD
- **Discovery UI changes** — covered by existing curation PRD Epic 4
- **On-device LLM** — explicitly removed in curation PRD v1.3 (P0)

### Rationale for Exclusions

**AADT INCLUDED:** HPMS (Highway Performance Monitoring System) provides national AADT data in a single GeoJSON download — not per-state collection. Measured traffic data replaces LLM-extracted text signals with objective telemetry from instrument readings. The NLP pipeline's mention_frequency remains valuable as a complementary signal for route popularity and rider engagement.

**Fine-tuned NLP deferred:** The NLP task is narrow — extract road names and classify 6 attribute buckets from motorcycle forum text. Regex handles highway numbers with 95%+ accuracy. Keyword matching for attributes is sufficient for our classification needs. If accuracy falls below 0.75 on validation, the upgrade path to sentence-transformers is specced in AD-002.

**International deferred:** All new sources (Scenic Byways GIS, USFS, BDR, curvature, twtex, Rider Mag) are US-only. International expansion requires localized sources and different government data providers — separate initiative.
