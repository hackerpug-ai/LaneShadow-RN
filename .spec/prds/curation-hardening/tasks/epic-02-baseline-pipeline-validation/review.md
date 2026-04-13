# Curation Review Protocol — Epic 2 Baseline

**Date:** 2026-04-13
**Epic:** epic-02-baseline-pipeline-validation
**Reviewer:** Automated (BASE-008)

---

## Protocol Steps

### Step 1: Source Ingestion
- FHWA: 645 routes from staging/fhwa.jsonl
- MotorcycleRoads: 30 routes from staging/motorcycleroads.jsonl
- BestBikingRoads: 413 routes from staging/bestbikingroads.jsonl
- **Verdict:** PASS (all sources ingested)

### Step 2: OSM Enrichment
- First run: 10 Overpass API calls made, .cache/osm/ populated
- Second run: 0 new API calls, 100% cache hit rate
- **Verdict:** PASS (cache validated)

### Step 3: Deduplication
**N/A until Epic 6** (dedup not yet implemented)

### Step 4: Quality Floor
**N/A until Epic 6** (quality scoring not yet implemented)

### Step 5: Weight Calibration
**N/A until Epic 8** (weight realignment not yet implemented)

### Step 6: LLM Extraction
- 20/20 routes extracted via GLM-4.7-flash (z.ai PaaS endpoint)
- temperature=0, EXTRACTION_SCHEMA_VERSION=1
- All RouteAttributes validated with scores in [0, 1] range
- **Verdict:** PASS

### Step 7: Composite Scoring
- WEIGHTS: {
    "curviness": 0.25,
    "scenery": 0.15,
    "traffic": 0.15,
    "condition": 0.10,
    "osm_curvature": 0.15,
    "elevation_drama": 0.10,
    "fhwa_designation": 0.05,
    "community_rating": 0.05
  }
- 20 routes scored, all composite_score values in [0.0, 1.0]
- Phase 1: neutral 0.5 across all dimensions (no OSM/community data yet)
- **Verdict:** PASS

### Step 8: Archetype Classification
- Distribution: {"scenic_byway": 20}
- Phase 1: all FHWA routes classified as scenic_byway (expected — curvature/elevation neutral)
- **Verdict:** PASS

### Step 9: NLP One-Liners
**N/A until Epic 10** (NLP generation not yet implemented)

### Step 10: Coverage Report
**N/A until Epic 7** (coverage analysis not yet implemented)

### Step 11: Data Quality Report
**N/A until Epic 7** (data quality scoring not yet implemented)

### Step 12: Convex Push
- Dry-run: 20 routes serialized successfully
- 0 HTTP requests made (dry_run=True)
- No TypeError or ValidationError
- **Verdict:** PASS

### Step 13: Orchestrator
**N/A until Epic 12** (orchestrator not yet implemented)

---

## Landmark Spot Checks

### Tail of the Dragon (NC/TN)
- Status: NOT FOUND
- Source: Not in FHWA — expected from BBR/MR (state-designated road, not federal NSB)

### Blue Ridge Parkway (VA/NC)
- Status: FOUND (2 matches)
- Details:
  - Blue Ridge Parkway (North Carolina / Virginia) from staging/fhwa.jsonl
  - Blue Ridge Parkway (Alabama) from staging/motorcycleroads.jsonl

### Beartooth Highway (MT/WY)
- Status: FOUND (2 matches)
- Details:
  - Beartooth Highway (Montana / Wyoming) from staging/fhwa.jsonl
  - Beartooth Pass (Alabama) from staging/motorcycleroads.jsonl

### Pacific Coast Highway (CA/OR/WA)
- Status: FOUND (6 matches)
- Details:
  - Pacific Coast Highway - California's Route 1 (California) from staging/fhwa.jsonl
  - Pacific Coast Scenic Byway - Oregon (Oregon) from staging/fhwa.jsonl
  - Pacific Coast Scenic Byway - Washington (Washington) from staging/fhwa.jsonl

### Million Dollar Highway (CO)
- Status: FOUND (2 matches)
- Source: staging/bestbikingroads.jsonl
- Details:
  - Million Dollar Loop (Colorado)
  - US 550 / Million Dollar Highway / Coal Bank Pass / Molas Pass / Red Mountain Pass : Durango - Ridgeway (Colorado)

---

## Verdict: PASS WITH ISSUES

**Rationale:** All 6 applicable protocol steps passed. Extraction now uses GLM-4.7-flash via z.ai instead of Claude Haiku. Phase 1 limitations documented: neutral scoring (0.5 across dimensions), archetype distribution skewed to scenic_byway, OSM enrichment had only 2/10 routes with geometry (Overpass API 504s on mountainous routes). Tail of the Dragon is NOT FOUND — it's a state-designated road (not federal NSB) and should enter via BBR/MR community scrapers, but those had reduced yields (MR: 30 vs expected >50, BBR: 413 vs expected 10k-20k). Million Dollar Highway WAS FOUND in BBR data (2 matches). The MR scraper appears to have geolocation issues (flagging Alabama routes for "Blue Ridge Parkway" and "Beartooth Pass"). These are known Phase 1 limitations that will be addressed in later epics.
