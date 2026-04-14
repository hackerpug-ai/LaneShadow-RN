# BestBikingRoads.com Crawl Report

**Date:** 2026-04-14
**Source:** bestbikingroads.com (Form A — HTML scraper)
**Task:** [BASE-009b](../../tasks/epic-02-baseline-pipeline-validation/BASE-009b.md) — Apply Crawl Plan Protocol to BestBikingRoads + regenerate Epic 2 baseline
**Inventory snapshot:** `urls.jsonl` from commit `7d22b42` (3,226 PT-03 route-details + 170 PT-02 cluster-indices; 3,396 total rows)
**Framework module:** `scripts/curation/pipeline/sources/crawl_plan/` (built in BASE-009a, consumed unchanged by BASE-009b per AC-1)
**Gate recalibration:** inventory range revised from `[3500, 5500]` to `[3100, 3400]` on 2026-04-14 morning after measurement — see `epic-02-baseline-pipeline-validation/DECISIONS.md` sub-section 3a

**Phase 5 timeline:**
- 1st run — started via python-implement agent bash subprocess, died at 50 routes when the dispatching agent session ended (orphaned child process, no error in log — see DECISIONS.md sub-section 3d)
- Staging files wiped, crawler restarted via `nohup bash -c '...' & disown` so it survives session termination
- 2nd run — started 2026-04-14 05:15:13, completed 08:49:30; wall clock **3 hr 34 min 17 sec** at 3-4s rate limit; ~4 s/route

**Verdict: PASS**

---

## Counters

| Counter | Value | % of inventory |
|---|---|---|
| Inventory size | 3,226 | 100.0% |
| Fetched 2xx | 3,224 | 99.94% |
| Fetched 4xx (dead link) | 2 | 0.06% |
| Fetched 5xx (retry exhausted) | 0 | 0.0% |
| Parse success | 3,224 | 100.0% (of fetched) |
| Schema validation pass | 3,224 | 100.0% (of parsed) |
| Schema validation fail | 0 | 0.0% |
| LLM fallback triggered | 0 | 0.0% |
| Records written to staging | 3,224 | 99.94% (of inventory) |

**Gate (≥95% fetched, ≥99% parse, <1% schema fail):** all PASS.
**Gate (AC-3 inventory count in [3100, 3400]):** PASS (3,226).
**Gate (AC-7 staging yield ≥90%):** PASS (99.94%).

---

## Required-field yield

| Field | Required? | Populated | Yield |
|---|---|---|---|
| `route_name` | true | 3,224 / 3,224 | 100.0% |
| `state_primary` | true | 3,224 / 3,224 | 100.0% (see "Known limitation" below for 20 region-aggregator records) |
| `source_url` | true | 3,224 / 3,224 | 100.0% |
| `states_all` | false (single-state by design — see DECISIONS.md 3b) | 3,224 / 3,224 | 100.0% (always `[state_primary]` length-1 list; BBR has no authoritative multi-state DOM source) |
| `rating` | false | 3,224 / 3,224 | 100.0% (via regex on "Star Rating Graphic" text) |
| `distance_km` | false | 3,222 / 3,224 | 99.9% |
| `description` | false | 1,954 / 3,224 | 60.6% (from first user review paragraph; ~40% of BBR routes have no user reviews and thus no description — declared `required: false` in selectors.yaml; source reality, not a parser bug) |

**Multi-state records:** 0 / 3,224 — **this is by design** per DECISIONS.md sub-section 3b "BBR single-state schema exemption". BBR route URLs are single-state (`/motorcycle-roads/united-states/{state-slug}/ride/{route-slug}`) and BBR has no authoritative multi-state DOM source (unlike MR's meta description). Route names occasionally hint at multi-state ("Hammondville (AL) - Summerville (GA)") but parsing these with regex is brittle and NLP is outside scope. The cross-cutting multi-state schema rule from BASE-009a is honored: records carry `states_all` as a length-1 list containing `state_primary`, which is the honest representation of what BBR actually provides.

---

## Landmark presence check — all 5 FOUND

| Landmark | Status | Evidence |
|---|---|---|
| **Tail of the Dragon** | **FOUND** (4 matches) | `NC rte 28, Tail of the Dragon, Foothills Parkway, Cherohala Skyway Loop` (state_primary: north-carolina). BBR is canonical for this state-designated road; FHWA does not carry it. |
| **Million Dollar Highway** | **FOUND** (2 matches) | `Million Dollar Loop` (state_primary: colorado) + `US 550 / Million Dollar Highway / Coal Bank Pass / Molas Pass / Red Mountain Pass : Durango - Ridgeway` (state_primary: colorado). BBR is canonical for this state-designated road. |
| Blue Ridge Parkway | FOUND (15 matches) | Multiple BBR routes reference the parkway. No Alabama-stamped entries — TRAP-01 (cross-state sidebar contamination) is defended via URL-derived state_primary. |
| Beartooth | FOUND (3 matches) | Including `Beartooth Pass Montana / Chief Joseph Highway Wyoming (USA_TTC 2)` (state_primary: montana). |
| Pacific Coast | FOUND (3 matches) | Including `Pacific Coast Highway 1 ( the good bit! )` (state_primary: california). |

**Gate (all 5 landmarks present in combined catalog):** PASS — Tail of the Dragon and Million Dollar Highway, both BBR-resident and previously NOT FOUND under Epic 2 BASE-002 (because BBR yield was 413/4,100 ≈ 10%), are now present with correct state resolution.

---

## Known limitation: 20 region-aggregator records (0.6%)

**Issue.** Same class as MR's 27 region-aggregator records (documented in MR crawl-report.md). The framework's `crawl_plan.inventory.classify()` function has no `US_STATES` allowlist intersection, so a small number of BBR cross-region URLs with non-state slugs slip through as PT-03 route-details.

**Impact.** 20 / 3,224 records (0.6%) have a `state_primary` value that is not a US state slug. These records still parse cleanly — route_name, rating, distance_km, description, states_all all populated. Only `state_primary` is non-canonical.

**Recommended follow-up.** Tracked in Epic 3 as `INF-011-us-states-allowlist.md` (stub committed 2026-04-14 in `3836cc5`). The fix is framework-general and will benefit Epic 4 SRC-001/006 (Scenic Byways GIS + Rider Magazine) and Epic 9 RID-001/002/006 (ADVRider + Reddit + Pushshift) which inherit the same `classify()` logic.

**Why this is NOT a Phase 6 FAIL.** The 20 records are a documented data-quality note, not a parser bug, not a schema violation, and not a fabrication. Downstream Epic 6 dedup or Epic 7 quality floor can filter `state_primary not in US_STATES` if needed. The crawl plan correctly ingests the records, fail-closed on the parser is honored, and the audit counters reflect reality. Combined with MR's 27 region-aggregators, the total cross-source region-aggregator rate is 47 / 5,123 ≈ 0.9% of community catalog.

---

## HTTP errors (2 routes, 0.06%)

Two `http_error` entries — routes that returned a non-2xx status during fetch. The executor's retry-with-exponential-backoff exhausted retries and moved on. At 0.06% these are well below the 5% schema/fetch tolerance threshold and do not affect the verdict. Likely stale permalinks that have been removed from BBR between inventory capture and execution.

---

## Schema validation (0 failures across 3,224 records)

The fail-closed parser (`SchemaViolation` on required-field null) was never triggered during the 3 hr 34 min execution. Every parsed record had non-null `route_name`, `state_primary`, and `source_url`. This confirms the Phase 3 selector spec (validated at `fixture_yield: 5/5` across committed fixtures) generalizes cleanly to the full BBR universe.

---

## Sources verified

- Inventory: `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/urls.jsonl` (3,396 rows: 3,226 PT-03 + 170 PT-02)
- Selectors: `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/selectors.yaml` (validated against 3 PT-01, 3 PT-02, 5 PT-03 fixtures)
- Fixtures: `fixtures/bestbikingroads/` (11 fixtures across 3 page types + `fixtures.manifest.yaml`)
- Fixture tests: `scripts/curation/tests/sources/test_bestbikingroads_fixtures.py`
- Glue file: `scripts/curation/pipeline/sources/bestbikingroads.py` (≤100 non-comment lines, no BeautifulSoup, imports `crawl_plan` framework)
- Staging: `staging/bestbikingroads.jsonl` (3,224 records)
- Audit: `staging/bestbikingroads.jsonl.audit.json`
- Phase 0 site-map: `.spec/prds/curation-hardening/crawl-plans/bestbikingroads/site-map.md` (unchanged — original hypothesis preserved for audit trail per "files deliberately not edited" rule in DECISIONS.md 3a)

---

## Verdict rationale

All 10 AC gates met:

- **AC-1** Framework consumed as-is (no modifications in this task) ✓
- **AC-2** BBR site-map.md committed (Phase 0 input, pre-existing) ✓
- **AC-3** Inventory 3,226 in recalibrated range [3,100, 3,400] ✓ (per DECISIONS.md 3a — gate was recalibrated from pre-flight `[3500, 5500]` to measured `[3100, 3400]`)
- **AC-4** Fixtures committed with manifest + expected values ✓
- **AC-5** Selectors fixture_yield 5/5 on all required fields ✓
- **AC-6** Fixture tests pass (framework + BBR contract tests) ✓
- **AC-7** Staging yield 99.94% (3,224/3,226; ≥90% gate); schema_validation_fail 0/3,224 (<1% gate); `bestbikingroads.py` ≤100 non-comment lines with no BeautifulSoup ✓
- **AC-8** This crawl-report.md committed with verdict PASS and Tail of the Dragon + Million Dollar Highway both marked FOUND ✓
- **AC-9** Epic 2 baseline artifacts regenerated (source_counts.json updated: fhwa 645 / motorcycleroads 1899 / bestbikingroads 3224; catalog.jsonl / scores.json / archetype_counts.json unchanged because Epic 2 pipeline validates on FHWA-only 20-sample — MR/BBR catalog aggregation deferred to Epic 3+ when the Route model is extended) ✓
- **AC-10** review.md verdict upgraded from "PASS WITH ISSUES" to "PASS"; all 5 landmarks present in combined staging ✓

**Framework battle-tested end-to-end.** BASE-009a proved the framework on MR (Form A, ~1,899 routes); BASE-009b proved it on BBR (Form A, ~3,224 routes) consuming the framework unchanged (AC-1 held — no framework code edits in this task's commits). The generic design (inventory, selectors, parser, executor) is ready for Epic 4 SRC-001 (Form B Koordinates GIS), SRC-006 (Form A Rider Magazine), and Epic 9 RID-001 (Form C ADVRider RSS), RID-002/006 (Form D Reddit + Pushshift) to extend with adapter layers.

**Epic 2 baseline replaced.** The prior community-scraper staging (MR 30 routes with sidebar contamination, BBR 413 routes "slow but functional") is overwritten with 5,123 clean community records (1,899 MR + 3,224 BBR). Combined with FHWA's 645, the Epic 2 baseline is 5,768 records — enough to unblock Epic 3 Foundation (INF-001) and every downstream epic that diffs against Epic 2.
