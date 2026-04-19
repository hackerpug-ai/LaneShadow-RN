# Epic 2 Baseline Validation Report

This document records the baseline validation results for the curation pipeline sources.

## FHWA (Federal Highway Administration National Scenic Byways)

**Status:** PASS (2026-04-13)

**Source Module:** `scripts/curation.pipeline.sources.fhwa`

**Input File:** `data/fhwa_byways.csv` (committed by BASE-000)

**Output File:** `staging/fhwa.jsonl`

**Route Count:** 645 routes (within expected range 580-710, ±10% of 645)

**Validation Results:**
- AC-1 (module runnable): PASS - `python -m scripts.curation.pipeline.sources.fhwa` exits 0
- AC-2 (count range): PASS - 645 routes is within 580-710 tolerance
- AC-3 (field completeness): PASS - all records have non-null name, state, centroid_lat, centroid_lng, route_id
- AC-4 (baseline report): PASS - this section documents the results

**Sample Record (first route):**
```json
{
  "route_id": "fhwa-a1a-ocean-shore-scenic-highway-florida",
  "name": "A1A Ocean Shore Scenic Highway",
  "state": "Florida",
  "source": "fhwa",
  "centroid_lat": 29.472546,
  "centroid_lng": -81.123682,
  "length_miles": 6.8,
  "bounds_ne_lat": null,
  "bounds_ne_lng": null,
  "bounds_sw_lat": null,
  "bounds_sw_lng": null
}
```

**Notes:**
- FHWA source validated as baseline ingestion stage
- Boy Scout `__main__` fix committed separately (see commit f3472b2)
- No data quality issues detected in parse_fhwa_csv() - all 645 CSV rows parsed successfully
- staging/fhwa.jsonl is runtime output, not committed to git

---

## OSM (OpenStreetMap Overpass API)

**Status:** PARTIAL (2026-04-13) - Infrastructure validated, API service issues encountered

**Enrichment Module:** `scripts/curation.pipeline.enrichment.osm_client`

**Input File:** `staging/fhwa.jsonl` (645 routes from FHWA source)

**Cache Directory:** `.cache/osm/`

**Test Scope:** First 10 routes with valid centroid coordinates from FHWA dataset

**Validation Results:**
- AC-1 (module runnable): PASS - `python -m scripts.curation.pipeline.enrichment.osm_client --input staging/fhwa.jsonl --count 10 --cache-dir .cache/osm` exits 0
- AC-2 (cache behavior): PASS - Second run demonstrates cache hits for previously successful queries
- AC-3 (baseline report): PASS - This section documents the results

**Infrastructure Validation:**
- Boy Scout `__main__` fix committed separately (see commit 8e6d810)
- argparse with `--input`, `--count`, `--cache-dir` flags working correctly
- FileCache layer creates `.cache/osm/` directory and writes JSON cache files
- Rate limiting `RATE_LIMIT_SECONDS=1.0` respected between API calls
- Error handling works gracefully - API failures return None, don't crash the module

**API Service Issues Encountered:**
During validation, the Overpass API (overpass-api.de) experienced significant service degradation:
- Persistent `504 Gateway Timeout` errors (7 of 10 routes affected)
- Intermittent `429 Too Many Requests` errors (rate limiting from API side)
- Only 2 of 10 routes successfully retrieved geometry despite retry logic

**Cache Performance (Second Run):**
- Routes with cached geometry returned instantly with no API calls
- Cache hit behavior verified: `fhwa-a1a-scenic-historic-coastal-byway-florida` (4.80) and `fhwa-alaska-railroad-alaska` (None - empty geometry) served from cache
- Cache persistence confirmed: Files remain in `.cache/osm/` between runs

**First-Run Results (2026-04-13 11:04-11:06 UTC):**
- API requests attempted: 10
- Successful responses: 2 (1 with geometry, 1 empty)
- Gateway timeouts (504): 7
- Rate limit errors (429): 1
- Cache files created: 2

**Second-Run Results (2026-04-13 11:06-11:07 UTC):**
- Cache hits: 2 (instant returns, no API calls)
- New API requests: 8 (for routes that failed in first run)
- Additional successful response: 1 (abo-pass-trail-new-mexico: 5.20)
- Cache files added: 1

**Per-Route Curvature Scores:**
```
fhwa-a1a-scenic-historic-coastal-byway-florida: 4.80 (cached)
fhwa-abo-pass-trail-new-mexico: 5.20 (new)
fhwa-alaska-railroad-alaska: None (no geometry in remote area)
```

**Sample Cache Files:**
```
.cache/osm/fhwa-a1a-scenic-historic-coastal-byway-florida_osm_29.8398_-81.2660_2000.json (884KB - large geometry)
.cache/osm/fhwa-abo-pass-trail-new-mexico_osm_34.4897_-106.5200_2000.json (70KB)
.cache/osm/fhwa-alaska-railroad-alaska_osm_62.7640_-149.1623_2000.json (34B - empty response)
```

**Infrastructure Quality:**
- ✅ Module executable via `python -m`
- ✅ argparse interface working correctly
- ✅ FileCache creates directory and writes JSON files
- ✅ Cache hits eliminate redundant API calls
- ✅ Rate limiter respects 1-second delay
- ✅ Error handling prevents crashes on API failures
- ✅ `compute_curvature_for_route()` returns Optional[float] correctly

**Recommendations for Future Epics:**
- Overpass API reliability is a bottleneck - consider implementing retry with exponential backoff for 504 errors
- For production runs, use a local OSM PBF tile server (as planned for Epic 4)
- The cache layer is critical for avoiding redundant API calls during development
- Consider adding a `--dry-run` mode to validate inputs without hitting the API

**Notes:**
- OSM enrichment infrastructure is working correctly
- API service issues are external to the codebase
- Cache persistence and hit behavior validated successfully
- Boy Scout `__main__` fix improves module usability (see commit 8e6d810)

---

## Community Scrapers (MotorcycleRoads + BestBikingRoads)

**Status:** PASS (2026-04-14) — remediated via BASE-009a/b under the Crawl Plan Protocol.

Both community scrapers were completely rewritten as thin glue over the `scripts/curation/pipeline/sources/crawl_plan/` framework module (built in BASE-009a, consumed unchanged by BASE-009b). The prior "PASS WITH ISSUES" section from 2026-04-13 documented systemic failures (MR 30 routes with Alabama-stamped Blue Ridge Parkway sidebar contamination, BBR 413 routes at 10% yield). Both are now replaced with clean, crawl-plan-protocol-gated outputs.

### MotorcycleRoads (motorcycleroads.com) — REMEDIATED

**Source Module:** `scripts.curation.pipeline.sources.motorcycleroads` (rewritten as 93-line framework glue)

**Crawl Plan:** `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/` — site-map.md, urls.jsonl, selectors.yaml, crawl-report.md (verdict PASS)

**Output File:** `staging/motorcycleroads.jsonl`

**Route Count:** **1,899 routes** (was 30) — from committed inventory of 1,908 PT-03 route-details
**Yield:** 99.5% (1,899 staging / 1,908 inventory; 9 http_errors)
**Schema validation failures:** 0 / 1,899

**Field yield:**
- `route_name` (required): 100.0% (1,899/1,899)
- `state_primary` (required): 100.0% (1,899/1,899) — *except 27 region-aggregator slugs (1.4%) tracked as non-blocking INF-011*
- `description`: 99.6% (1,891/1,899) — from "Written Directions" section
- `rating`: 100.0%
- `distance_mi`: 96.5% (1,833/1,899)
- `states_all` (multi-state list): **7.4% multi-state records** (140/1,899); Natchez Trace Parkway correctly resolves to `['Alabama', 'Mississippi', 'Tennessee']` via meta-description extraction

**Key remediation vs 2026-04-13 version:**
- Prior scraper hit `/motorcycle-roads/{state}` which returned the homepage with a 30-route global sidebar rail — the EXACT root cause of the 30-route yield. Phase 0 recon traced this; new framework uses `/motorcycle-rides-in/united-states` as the master index (103 paginated pages × ~20 routes).
- Alabama-stamped Blue Ridge Parkway / Beartooth Pass sidebar contamination is **gone**: `state_primary` is URL-derived; `states_all` is parsed from the authoritative meta description (not DOM sidebar).
- Blind CSS selectors (`.field-field-rating`, etc.) replaced with validated selectors from `crawl-plans/motorcycleroads/selectors.yaml` with `fixture_yield: 5/5` on all required fields.

**Phase 5 runtime:** ~2 hr 35 min at 2-3s rate limit (first run aborted at 590 routes due to Python module cache trap — parser fix was committed mid-crawl and the running process kept using the old bytecode; killed cleanly and restarted fresh; see DECISIONS.md 3c).

### BestBikingRoads (bestbikingroads.com) — REMEDIATED

**Source Module:** `scripts.curation.pipeline.sources.bestbikingroads` (rewritten as ≤100-line framework glue)

**Crawl Plan:** `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/` — site-map.md, urls.jsonl, selectors.yaml, crawl-report.md (verdict PASS)

**Output File:** `staging/bestbikingroads.jsonl`

**Route Count:** **3,224 routes** (was 413) — from committed inventory of 3,226 PT-03 route-details
**Yield:** 99.94% (3,224 staging / 3,226 inventory; 2 http_errors)
**Schema validation failures:** 0 / 3,224

**Field yield:**
- `route_name` (required): 100.0%
- `state_primary` (required): 100.0% *(except 20 region-aggregator slugs, 0.6% — tracked as INF-011)*
- `rating`: 100.0% (extracted via regex on "Star Rating Graphic" text — BBR stores rating in inline JS as `responseA[i].comments_ave_rating`, not CSS-addressable)
- `distance_km`: 99.9%
- `description`: 60.6% (1,954/3,224) — extracted from first user review paragraph; ~40% of BBR routes have no user reviews and thus no description (declared `required: false` in selectors.yaml; honest source reality)
- `states_all`: single-state by design per DECISIONS.md 3b (`[state_primary]` length-1; BBR has no authoritative multi-state DOM source — see exemption entry)

**Key remediation vs 2026-04-13 version:**
- Prior scraper was declared "slow but functional" at ~18 routes/minute with a 9-hour projected runtime that would have produced a junk baseline. The new framework runs at ~4s/route (rate-limited + parse overhead) and completed in **~3 hr 35 min** for all 3,224 routes.
- `/rides/{cluster}` sub-state cluster pages are now IN-SCOPE and ADDITIVE: 1,050 of 3,226 PT-03 routes (33%) are discovered from cluster pages that Phase 0 recon proved are 83% additive (measured on Tennessee).
- Cross-state sidebar contamination (TRAP-01) defended via URL-derived `state_primary` — Blue Ridge Parkway never gets stamped with the wrong state.
- Mixed-case slugs like `Columbia-2` are preserved (canonicalize() lowercases scheme + host only, preserves path case — framework-wide rule from DECISIONS.md 3b evening session).

**Phase 5 runtime:** ~3 hr 35 min at 3-4s rate limit (first run died at 50 routes because the dispatching python-implement agent session ended and the crawler was its child process; restarted under `nohup ... & disown` so it survived independently — see DECISIONS.md 3d).

**BBR inventory gate recalibration (2026-04-14 morning):** AC-3 was `[3,500, 5,500]` based on summed BBR nav-menu banner totals. Measured reality is 3,226 route-details. Per-state audits confirmed the nav-menu banners are inflated vs what's navigable from state + cluster pages (California banner 401 vs measurable 329). Gate recalibrated to `[3,100, 3,400]` with full audit trail in DECISIONS.md sub-section 3a.

### Overall Assessment — PASS

- **Both scrapers respect robots.txt and rate limits** (unchanged from prior assessment)
- **MR scraper:** PASS — 1,899 routes (from 30), 99.5% yield, 0 schema failures, Natchez Trace multi-state validated, no Alabama-stamped BRP
- **BBR scraper:** PASS — 3,224 routes (from 413), 99.94% yield, 0 schema failures, all 5 landmarks present including BBR-resident Tail of the Dragon and Million Dollar Highway
- **Framework is generic:** `scripts/curation/pipeline/sources/crawl_plan/` is re-usable for Epic 4 SRC-001/006 (Form B + Form A) and Sprint 9 RID-001/002/006 (Form C + Form D) without modification
- **Open follow-ups (non-blocking):** INF-011 Epic 3 stub tracks the `US_STATES` allowlist improvement for the combined ~47 region-aggregator records across MR (27) and BBR (20) = 1.0% of combined community catalog

---

## Composite Scoring (PIPE-007)

**Status:** PASS (2026-04-13)

**Scoring Module:** `scripts.curation.pipeline.scoring.composite`

**Input File:** `staging/fhwa.jsonl` (645 FHWA routes)

**Output File:** `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json`

**Routes Scored:** 20 routes (validation sample)

**Validation Results:**
- AC-1 (module runnable): PASS - `python -m scripts.curation.pipeline.scoring.composite --input staging/fhwa.jsonl --out baseline/scores.json --count 20` exits 0
- AC-2 (count validation): PASS - Output has exactly 20 elements
- AC-3 (score range): PASS - All composite_score values are floats in [0.0, 1.0] with no NaN

**Scoring Weights (from PRD S9-TRD-4 §4.2):**
```python
WEIGHTS = {
    "curviness": 0.25,           # LLM-extracted curviness category
    "scenery": 0.15,             # LLM-extracted scenery quality
    "traffic": 0.15,             # LLM-extracted traffic level
    "condition": 0.10,           # LLM-extracted road condition
    "osm_curvature": 0.15,       # Geometric curvature from OSM (not available in Phase 1)
    "elevation_drama": 0.10,     # Elevation profile (not available in Phase 1)
    "fhwa_designation": 0.05,    # FHWA scenic designation
    "community_rating": 0.05,    # Community ratings (not available in Phase 1)
}
```

**Phase 1 Scoring Behavior:**
- All component scores return neutral 0.5 across all dimensions
- Composite scores are 0.5 for all routes (weighted sum of neutral inputs)
- This is expected behavior for Phase 1 (FHWA-only baseline)
- Future phases will incorporate LLM-extracted attributes and OSM geometry

**Sample Scored Record:**
```json
{
  "route_id": "fhwa-a1a-ocean-shore-scenic-highway-florida",
  "name": "A1A Ocean Shore Scenic Highway",
  "curvature_score": 0.5,
  "scenic_score": 0.5,
  "technical_score": 0.5,
  "traffic_score": 0.5,
  "remoteness_score": 0.5,
  "composite_score": 0.5
}
```

**Notes:**
- Composite scoring infrastructure validated successfully
- Boy Scout `__main__` fix committed separately (see commit prior to this work)
- All 6 component scores computed correctly (curvature, scenic, technical, traffic, remoteness, composite)
- Score clamping to [0.0, 1.0] working as designed
- No NaN or out-of-range values detected
- Phase 2 will activate real scoring when LLM extraction and OSM geometry are available

---

## Archetype Classification (PIPE-008)

**Status:** PASS (2026-04-13)

**Classification Module:** `scripts.curation.pipeline.classification.archetype`

**Input File:** `staging/fhwa.jsonl` (645 FHWA routes)

**Scores File:** `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json` (20 scored routes)

**Output File:** `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json`

**Routes Classified:** 20 routes (validation sample)

**Validation Results:**
- AC-1 (module runnable): PASS - `python -m scripts.curation.pipeline.classification.archetype --routes staging/fhwa.jsonl --scores baseline/scores.json --out baseline/archetype_counts.json --count 20` exits 0
- AC-2 (count validation): PASS - Output has exactly 20 routes classified
- AC-3 (archetype validity): PASS - All keys are in the valid 6-value archetype set

**Archetype Distribution:**
```json
{
  "scenic_byway": 20
}
```

**Classification Rules (from PRD S9-TRD-5 §5):**
Decision tree priority order:
1. adventure (surface or BDR source overrides everything)
2. coastal (coastal proximity + scenic designation)
3. mountain (high elevation gain)
4. twisties (high curvature score)
5. scenic_byway (FHWA designation — default for most Phase 1 routes)
6. desert (low curvature, remote, arid — implicit fallback)

**Phase 1 Behavior:**
- All 20 FHWA routes classified as `scenic_byway` (expected)
- This skew is expected because curvature/elevation scores are neutral 0.5 in Phase 1
- Coastal states with FHWA routes still classify as `scenic_byway` because Rule 2 requires coastal state + scenic designation proxy
- Phase 2 will produce more diverse archetype distribution when real curvature and elevation data are available

**Valid Archetype Set:**
```
{'twisties', 'mountain', 'coastal', 'adventure', 'scenic_byway', 'desert'}
```

**Notes:**
- Archetype classification infrastructure validated successfully
- Boy Scout `__main__` fix committed separately (see commit e303aac)
- All archetypes validated against the 6-value set
- Phase 1 skew toward `scenic_byway` is expected behavior
- Route-score join by `route_id` working correctly
- Phase 2 will activate adventure, mountain, twisties, and desert classifications when real data is available

---

## Convex Push (BASE-007)

**Status:** PASS (2026-04-13)

**Push Module:** `scripts.curation.pipeline.sync.convex_push`

**Input Files:**
- `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json` (20 scored routes)
- `staging/fhwa.jsonl` (645 FHWA routes with metadata)

**Routes Validated:** 20 routes

**Validation Results:**
- AC-1 (dry-run validation): PASS - Exit code 0, 20 routes serialized successfully
- AC-2 (serialization): PASS - All routes JSON-serializable with no TypeError or ValidationError
- AC-3 (no HTTP calls): PASS - Zero HTTP requests made in dry-run mode
- AC-4 (baseline report): PASS - This section documents the results

**Boy Scout Improvements:**
- Added `dry_run: bool = False` parameter to `push_routes()` function
- Added early-return validation in dry-run mode (serializes all routes before HTTP calls)
- Added `__main__` block with argparse CLI interface
- CLI joins scored routes with staging metadata to reconstruct complete EnrichedRoute objects
- Default to `--dry-run=True` for safe validation

**Dry-Run Command:**
```bash
source .env.local && PYTHONPATH=/Users/justinrich/Projects/LaneShadow .venv/bin/python -m scripts.curation.pipeline.sync.convex_push \
  --input .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json \
  --staging staging/fhwa.jsonl \
  --dry-run
```

**Dry-Run Output:**
```
INFO: Read 20 routes from .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json (joined with staging/fhwa.jsonl)
INFO: DRY RUN: 20 routes serialized successfully (no HTTP calls)
INFO: Result: sent=20, inserted=0, failed=0
```

**Environment Variables Required (for live push):**
- `CONVEX_URL`: Base URL of the Convex deployment (e.g., "https://example.convex.site")
- `CURATION_DEPLOY_KEY`: Deploy key for authentication (see 09-technical-requirements.md §API Design)

**Infrastructure Quality:**
- ✅ Module executable via `python -m`
- ✅ argparse interface with `--input`, `--staging`, `--dry-run`, `--base-url`, `--deploy-key` flags
- ✅ Route-score join by route_id working correctly
- ✅ EnrichedRoute reconstruction with all required fields (state, source, centroid_lat, centroid_lng)
- ✅ JSON serialization validation catches malformed data before HTTP calls
- ✅ Dry-run mode prevents accidental production pushes
- ✅ Early-return logic validates all routes without making network requests

**Notes:**
- Convex push infrastructure validated successfully
- Boy Scout `__main__` and `--dry-run` improvements committed separately (see commit 1ee29ea)
- Dry-run validation confirms all 20 routes are serializable and ready for push
- Live push to Convex requires `CURATION_DEPLOY_KEY` and `CONVEX_URL` environment variables
- No HTTP requests were made during validation (dry-run mode)
- Future epics can use `--dry-run=False` to perform actual Convex ingestion

---

*Last updated: 2026-04-13*
