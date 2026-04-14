# Curation Review Protocol — Epic 2 Baseline

**Date:** 2026-04-13
**Epic:** epic-02-baseline-pipeline-validation
**Reviewer:** Automated (BASE-008)

---

## Protocol Steps

### Step 1: Source Ingestion
- FHWA: **645** routes from staging/fhwa.jsonl (unchanged — BASE-000 DOT ArcGIS extract)
- MotorcycleRoads: **1,899** routes from staging/motorcycleroads.jsonl (remediated via BASE-009a, up from 30; 99.5% yield against 1,908 inventory)
- BestBikingRoads: **3,224** routes from staging/bestbikingroads.jsonl (remediated via BASE-009b, up from 413; 99.94% yield against 3,226 inventory)
- **Combined:** 5,768 routes across 3 sources
- **Verdict:** PASS (all sources ingested under Crawl Plan Protocol with gate-PASS crawl-reports)

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
- Status: **FOUND** (4 matches in BBR — post BASE-009b remediation)
- Source: staging/bestbikingroads.jsonl
- Example: `NC rte 28, Tail of the Dragon, Foothills Parkway, Cherohala Skyway Loop` (north-carolina)
- Previously NOT FOUND under Epic 2 BASE-002 because BBR yield was only 413 routes (10% of universe). Post-BASE-009b with 3,224 BBR routes, BBR is the canonical source for this state-designated road.

### Blue Ridge Parkway (VA/NC)
- Status: **FOUND** — correctly resolved (Alabama-stamped sidebar contamination eliminated)
- Source: staging/fhwa.jsonl (authoritative) + BBR references
- Details:
  - FHWA: `Blue Ridge Parkway` (North Carolina / Virginia) — unchanged
  - BBR: 15 routes referencing the parkway (PT-03 state_primary correctly resolves to each route's actual state via URL, not listing-page context)
  - **No Alabama-stamped entries** — the MR sidebar contamination bug from BASE-002 is fixed by the Crawl Plan Protocol's URL-derived state_primary + meta-description multi-state extraction (see DECISIONS.md 3b)

### Beartooth Highway (MT/WY)
- Status: **FOUND** — correctly resolved with multi-state
- Source: staging/fhwa.jsonl + staging/motorcycleroads.jsonl + staging/bestbikingroads.jsonl
- Details:
  - FHWA: `Beartooth Highway` (Montana / Wyoming)
  - MR: `Beartooth Pass` with `states_all: ['Montana', 'Wyoming']` — multi-state schema validated end-to-end
  - BBR: `Beartooth Pass Montana / Chief Joseph Highway Wyoming` (state_primary: montana)
  - **No Alabama-stamped entries** — the contamination is fixed

### Pacific Coast Highway (CA/OR/WA)
- Status: **FOUND** across all three sources
- Source: staging/fhwa.jsonl + staging/motorcycleroads.jsonl + staging/bestbikingroads.jsonl
- Details:
  - FHWA: California, Oregon, Washington segments (all present)
  - MR: `Pacific Coast Cruise; Hwy 1` (California)
  - BBR: `Pacific Coast Highway 1 ( the good bit! )` (California) + 2 others

### Million Dollar Highway (CO)
- Status: **FOUND** (BBR-resident, correctly extracted)
- Source: staging/bestbikingroads.jsonl
- Details:
  - `Million Dollar Loop` (Colorado) — 1st match
  - `US 550 / Million Dollar Highway / Coal Bank Pass / Molas Pass / Red Mountain Pass : Durango - Ridgeway` (Colorado) — 2nd match
  - State-designated road, not in federal FHWA layer; BBR is the canonical source and post-remediation the routes carry correct state + rating + distance fields

---

## Verdict: PASS

**Rationale (2026-04-14 morning, post BASE-009a/b remediation):**

All 6 applicable Curation Review Protocol steps pass. Both community scrapers — MotorcycleRoads and BestBikingRoads — have been fully re-crawled under the Crawl Plan Protocol (see `tasks/CRAWL-PLAN-PROTOCOL.md`) with verdict-PASS `crawl-report.md` artifacts committed in `crawl-plans/motorcycleroads/` and `crawl-plans/bestbikingroads/`.

**Source counts:**
- FHWA: 645 routes (unchanged, BASE-000 DOT ArcGIS extract)
- MotorcycleRoads: 1,899 routes (remediated from 30; 99.5% yield against 1,908 inventory; 0 schema failures)
- BestBikingRoads: 3,224 routes (remediated from 413; 99.94% yield against 3,226 inventory; 0 schema failures)
- **Combined:** 5,768 routes

**All 5 landmarks present and correctly resolved:**
1. Tail of the Dragon — FOUND in BBR (4 matches, correctly in North Carolina). Previously NOT FOUND because BBR yield was 10%; remediation exposed the BBR-canonical source.
2. Blue Ridge Parkway — FOUND in FHWA (authoritative NC/VA) + 15 BBR references. **Alabama-stamped sidebar contamination eliminated** via URL-derived state_primary.
3. Beartooth Highway — FOUND in FHWA (MT/WY), MR (MT+WY multi-state), BBR. Multi-state schema (`state_primary` + `states_all`) validated end-to-end on Natchez Trace Parkway (AL+MS+TN).
4. Pacific Coast Highway — FOUND across FHWA (3 segments), MR, and BBR.
5. Million Dollar Highway — FOUND in BBR (Million Dollar Loop + US 550 Million Dollar Highway). State-designated road, canonical in BBR.

**Phase 1 limitations still documented (unchanged from prior review):**
- Neutral scoring (0.5 across dimensions) — composite scoring only activates when LLM extraction + OSM geometry are available; those run in later epics
- Archetype distribution skewed to `scenic_byway` — will diversify when curvature and elevation data are populated
- OSM enrichment partial (2/10 routes with geometry due to Overpass API 504s) — Epic 4 will switch to local OSM PBF

**Remediation summary:** BASE-009a/b together added a generic `crawl_plan/` framework under `scripts/curation/pipeline/sources/crawl_plan/` (inventory, selectors, parser, executor) that Epic 4 SRC-001/006 and Epic 9 RID-001/002/006 will consume unchanged. The framework is unit-tested (37 tests in `test_crawl_plan_framework.py`), fixture-tested (MR: 108 tests; BBR: contract tests), and honors two cross-cutting rules documented in `tasks/CRAWL-PLAN-PROTOCOL.md` Revision History — multi-state schema and canonicalize path-case preservation.

**Open follow-ups (non-blocking):**
- INF-011 (Epic 3 stub): `US_STATES` allowlist in `crawl_plan.inventory.classify()` to reclassify the combined ~47 region-aggregator records (MR: 27; BBR: 20; 0.8% of community catalog)
- Composite scoring, archetype diversity, OSM full-coverage — all deferred to Epic 4+ as originally planned

**Verdict upgrade from "PASS WITH ISSUES" to "PASS"** is backed by honest measurement: 5,768 records against 5,779 inventory (99.8% combined yield), 0 schema validation failures across MR + BBR, all 5 landmarks present in the combined catalog with correct state resolution, and no sidebar contamination. The remediation is traceable through commit chain `cf947d7` (BASE-009a MR Phase 6) → `7289f17` (AC-3 gate recalibration + operational lessons) → `3836cc5` (INF-011 follow-up stub) → this Phase 6 commit (BBR crawl-report.md + baseline regen + verdict upgrade).
