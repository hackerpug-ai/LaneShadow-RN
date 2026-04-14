# Epic 2: Baseline Curation Pipeline Validation

**Sequence:** 2 / 12
**Priority:** P0
**Status:** Backlog
**Estimated Effort:** 1,035 minutes (~17.25 hours) — includes BASE-000 data prep (2026-04-13 AM), BASE-009a/b Crawl Plan Protocol remediation (2026-04-13 PM, split by source for risk isolation), and a same-evening upward revision of BASE-009a from 270 → 330 min after Phase 0 recon corrected the MR route universe from 300-1000 to ~2,044 routes
**Revised:** 2026-04-13 AM — BASE-000 inserted as prerequisite after `/kb-run-epic` preflight revealed the FHWA input CSV did not exist and the DOT ArcGIS layer returns 645 routes (not the 184 the PRD originally assumed). See [DECISIONS.md](./DECISIONS.md) for the full rationale and [Preflight Discoveries](#preflight-discoveries-2026-04-13) below.
**Revised:** 2026-04-13 PM — BASE-009 inserted as Wave 6 remediation after BASE-008 surfaced "PASS WITH ISSUES" verdict for the community scrapers (MR: 30 routes vs expected >50 with Alabama-stamped Blue Ridge Parkway entries; BBR: 413 routes vs ~4,100 true US universe). Root-cause analysis identified a systemic failure mode (blind selectors, interleaved discovery/fetch/parse, swallowed errors, no committed URL inventory) that would have reproduced in Epics 4 and 9. Triggered adoption of [`tasks/CRAWL-PLAN-PROTOCOL.md`](../CRAWL-PLAN-PROTOCOL.md) as a mandatory pre-extraction gate for all source tasks. See [DECISIONS.md](./DECISIONS.md) "Crawl Plan Protocol adoption" entry for the full rationale.
**Revised:** 2026-04-13 PM (second revision) — BASE-009 split into BASE-009a (framework + MotorcycleRoads, ~270 min) and BASE-009b (BestBikingRoads + baseline regeneration + review.md verdict upgrade, ~300 min). Split rationale: isolate framework risk to the cheap MR case (~30 min Phase 5) before burning BBR's ~3.75 hr Phase 5 execution. Framework bugs discovered on MR cost one 30-min re-run; same bugs on BBR would cost 3.75 hr per re-run. The split also introduces a human checkpoint between 009a and 009b — user reviews MR crawl-report.md before BBR is dispatched. See [DECISIONS.md](./DECISIONS.md) "Crawl Plan Protocol adoption" entry, split sub-section.

---

## Overview

The existing curation pipeline at `scripts/curation/pipeline/` (from the predecessor `.spec/prds/curation/` PRD) has source scrapers (FHWA, motorcycleroads, bestbikingroads), Haiku extraction, composite scoring, archetype classification, and Convex push — but **no one has ever run it end-to-end against live infrastructure**. Before layering hardening on top, we must prove the baseline works.

This epic is the **baseline truth check**: run every existing stage of the curation pipeline against live sources and the development Convex deployment, and verify each produces sensible output. If the baseline is broken, hardening can't be built on top of it.

**Theme:** Prove the existing curation logic works before extending it.

**PRD Reference:** Predecessor PRD `.spec/prds/curation/` (all UC-INGEST, UC-EXTRACT, UC-SCORE, UC-CLASSIFY, UC-PUSH use cases)

---

## Human Test Steps

After the baseline validation task is complete, an administrator should be able to run each existing pipeline stage and verify correct outputs:

1. **Run FHWA ingestion** — Execute `python -m scripts.curation.pipeline.sources.fhwa` against `data/fhwa_byways.csv` (produced by BASE-000 from the DOT ArcGIS `US_Scenic_Byways/MapServer/107` layer). Verify ~645 scenic byway routes (NSB + state + USFS + NPS + BLM mixed superset) written to a JSONL staging file. Check: names, states, and centroid coordinates present. **Note:** the original "~184" target was a predecessor-PRD assumption against a non-existent data.gov CSV; the real DOT source is a 645-route superset — see [DECISIONS.md](./DECISIONS.md).
2. **Run MotorcycleRoads scraper** — Execute `python -m scripts.curation.pipeline.sources.motorcycleroads`. Verify routes scraped with respect for robots.txt and rate limits. Spot-check 5 routes for correct name/state/description.
3. **Run BestBikingRoads scraper** — Execute `python -m scripts.curation.pipeline.sources.bestbikingroads`. Verify ~17k routes (the known BBR catalog) scraped to JSONL without crashes.
4. **Run Haiku extraction on a sample** — Pipe a 20-route sample through `extraction/client.py`. Verify each route gets a `RouteAttributes` object with curvature/scenery/traffic/condition/elevation populated. Check `temperature=0` and `EXTRACTION_SCHEMA_VERSION` logged.
5. **Run composite scoring** — Execute `scoring/composite.py` on extracted routes. Verify `composite_score`, `curvature_score`, `scenic_score`, etc. are floats in the expected range. Log the current WEIGHTS distribution.
6. **Run archetype classification** — Execute `classification/archetype.py` on scored routes. Verify routes get one of `twisties | mountain | coastal | adventure | scenic_byway | desert` as `primary_archetype` with `secondary_tags` list.
7. **Run OSM enrichment** — Execute `enrichment/osm_client.py` against 10 routes. Verify OSM way lookup returns `surface`, `smoothness`, and curvature data. Verify cached results work on second run.
8. **Run Convex push (dry-run)** — Execute `sync/convex_push.py --dry-run` against the dev deployment. Verify serialization succeeds, batch upsert payloads are valid, no type errors. DO NOT push to production.

9. **Execute the Curation Review Protocol (FIRST FULL RUN)** — This is the epic where the protocol becomes fully operational. Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end against the existing pipeline. Applicable steps for Epic 2: 1 (existing sources only), 2 (OSM only), 6, 7, 8, 12. Steps 3-5, 9-11, 13 are N/A until later epics. Write `review.md` with verdict PASS. Store catalog baseline in `epic-02-.../baseline/`. **This baseline is the reference point all subsequent epics diff against.**

All 9 verifications must pass before proceeding to Epic 3. Any failure means an existing bug that must be fixed (Boy Scout rule) before extending.

---

## Acceptance Criteria (Epic-Level)

- [ ] BASE-000 static CSV committed to `data/fhwa_byways.csv` (~645 routes derived from DOT ArcGIS)
- [ ] Every existing pipeline stage has been executed at least once against real data
- [ ] Each stage produces expected output types and ranges
- [ ] JSONL staging files exist for each source with reasonable counts (FHWA: 580-710; MR: 1,800-2,200; BBR: 2,900-3,400 staging / 3,100-3,400 inventory) — ranges reflect measured reality after the first Phase 5 execution replaced pre-flight site-banner estimates with observed counts. MR revised 2026-04-13 PM from [300, 1000] to [1800, 2200] after Phase 0 recon measured ~2,044 routes. BBR revised 2026-04-14 morning from inventory [3500, 5500] to [3100, 3400] and staging [2900, 3400] after Phase 5 measured 3,226 route-details (the [3500, 5500] range was summed from BBR nav-menu banner numbers which turned out to inflate vs what's actually navigable from state + cluster pages). See [DECISIONS.md](./DECISIONS.md) "Crawl Plan Protocol adoption" → "Phase 0 recon findings" → "BASE-009b Phase 5 findings" chain.
- [ ] Haiku extraction produces valid `RouteAttributes` objects (no schema violations)
- [ ] Composite scoring produces floats in `[0, 1]` range per dimension
- [ ] Archetype classification assigns one of 6 archetypes to every route
- [ ] Convex push (dry-run) serializes without type errors
- [ ] Any bugs discovered are fixed, committed, and baseline re-validated
- [ ] Baseline validation report written to `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md`
- [ ] DECISIONS.md records the actual BASE-000 row count and any anomalies encountered
- [ ] Curation Review Protocol executed end-to-end with PASS verdict
- [ ] `review.md` + `baseline/catalog.jsonl` committed (this becomes the reference baseline for all future epic reviews)
- [ ] BASE-009a complete — `crawl_plan/` framework module committed with unit tests; MotorcycleRoads re-crawled under the new methodology; `crawl-plans/motorcycleroads/crawl-report.md` verdict PASS; `staging/motorcycleroads.jsonl` replaced with clean data; user has reviewed the MR crawl-report and approved proceeding to BASE-009b
- [ ] BASE-009b complete — BestBikingRoads re-crawled under the new methodology using the BASE-009a framework unchanged; `crawl-plans/bestbikingroads/crawl-report.md` verdict PASS; `staging/bestbikingroads.jsonl` replaced with clean data; Epic 2 baseline artifacts regenerated from clean FHWA+MR+BBR staging; `review.md` verdict upgraded from "PASS WITH ISSUES" to "PASS"
- [ ] `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/` and `.../bestbikingroads/` artifacts committed (site-map.md, urls.jsonl, selectors.yaml, crawl-report.md — all four files per source with verdict PASS)
- [ ] `scripts/curation/pipeline/sources/crawl_plan/` shared framework module committed, unit-tested, and importable by future source tasks (Epic 4 SRC-001/006, Epic 9 RID-001/002/006)
- [ ] `fixtures/motorcycleroads/` and `fixtures/bestbikingroads/` committed with ≥3 samples per page type + `fixtures.manifest.yaml` with expected field values
- [ ] `scripts/curation/tests/sources/test_motorcycleroads_fixtures.py` and `test_bestbikingroads_fixtures.py` exist and pass locally
- [ ] `scripts/curation/tests/sources/test_crawl_plan_framework.py` unit tests for the shared framework pass locally
- [ ] BASE-009b final commit is atomic — BBR crawl plan + regenerated baseline + upgraded review.md in a single commit

---

## PRD Sections Covered

This epic validates the PREDECESSOR PRD (`.spec/prds/curation/`):
- UC-INGEST-01..04 — existing source ingestion
- UC-EXTRACT-01..03 — Haiku extraction
- UC-SCORE-01..02 — composite scoring
- UC-CLASSIFY-01 — archetype classification
- UC-PUSH-01..02 — Convex push

No curation-hardening-specific UCs are covered here — this epic exists solely to establish the baseline before hardening begins.

---

## Tasks

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| [BASE-000](./BASE-000.md) | Fetch FHWA Scenic Byways dataset from DOT ArcGIS and write static CSV baseline | INFRA / DATA_PREP | python-implement | P0 | M | 90 | (none — Wave 0 entry) | BASE-001 |
| [BASE-001](./BASE-001.md) | FHWA source validation + Boy Scout __main__ entry point | INFRA | python-implement | P0 | S | 30 | VAL-004, BASE-000 | BASE-003, BASE-006, BASE-008 |
| [BASE-002](./BASE-002.md) | Community scrapers validation — MotorcycleRoads + BestBikingRoads | INFRA | python-implement | P0 | S | 30 | VAL-004 | BASE-008 |
| [BASE-003](./BASE-003.md) | Haiku extraction validation + Boy Scout __main__ for extraction/client.py | INFRA | python-implement | P0 | S | 45 | BASE-001 | BASE-004, BASE-008 |
| [BASE-004](./BASE-004.md) | Composite scoring validation + Boy Scout __main__ for scoring/composite.py | INFRA | python-implement | P0 | S | 30 | BASE-003 | BASE-005, BASE-007, BASE-008 |
| [BASE-005](./BASE-005.md) | Archetype classification validation + Boy Scout __main__ for classification/archetype.py | INFRA | python-implement | P0 | S | 30 | BASE-004 | BASE-008 |
| [BASE-006](./BASE-006.md) | OSM enrichment validation + Boy Scout __main__ for enrichment/osm_client.py | INFRA | python-implement | P0 | S | 45 | BASE-001 | BASE-008 |
| [BASE-007](./BASE-007.md) | Convex push dry-run validation + Boy Scout --dry-run flag for sync/convex_push.py | INFRA | python-implement | P0 | S | 45 | BASE-004, VAL-004 | BASE-008 |
| [BASE-008](./BASE-008.md) | Curation Review Protocol execution + baseline artifacts commit | INFRA | python-implement | P0 | M | 60 | BASE-000..007 | BASE-009a |
| [BASE-009a](./BASE-009a.md) | Crawl Plan Protocol framework + MotorcycleRoads remediation | INFRA / REMEDIATION | python-implement | P0 | M | 330 | BASE-008 | BASE-009b |
| [BASE-009b](./BASE-009b.md) | Apply Crawl Plan Protocol to BestBikingRoads + regenerate Epic 2 baseline | INFRA / REMEDIATION | python-implement | P0 | L | 300 | BASE-009a | INF-001 |

**Total effort:** 1,035 minutes (~17.25 hours) across 11 tasks. Average quality score ~110/115. Originally decomposed from archived `BASE-001.md.archived` (240-min single task) on 2026-04-12; expanded 2026-04-13 AM with BASE-000 data prep after preflight investigation; further expanded 2026-04-13 PM with BASE-009 Crawl Plan Protocol remediation after the community-scraper failure mode was diagnosed as systemic (see [DECISIONS.md](./DECISIONS.md) "Crawl Plan Protocol adoption"); BASE-009 then split 2026-04-13 PM into BASE-009a (framework + MR, initially 270 min) and BASE-009b (BBR + baseline regen + verdict upgrade, 300 min) to isolate framework risk to MR's Phase 5 before burning BBR's ~3.75 hr execution; BASE-009a then revised upward later the same evening to 330 min after Phase 0 recon established the true MR route universe at ~2,044 routes (not 300-1000) — see DECISIONS.md "Phase 0 recon findings" sub-section.

### Decomposition Rationale

**Round 1 — 2026-04-12:** The original BASE-001 was a 240-minute single INFRA task with 8 ACs spanning 8 pipeline stages — too big for a single agent context window and impossible to parallelize. The decomposition produced 8 smaller tasks (BASE-001 through BASE-008, mostly 30-45 min each) that can be executed across parallelization waves.

**Round 2 — 2026-04-13:** `/kb-run-epic` preflight revealed two premise failures in the 2026-04-12 decomposition:
1. **Missing input file.** BASE-001 required `data/fhwa_byways.csv` which did not exist anywhere in the repository. The predecessor PRD claimed it would come from data.gov, but data.gov has never published a federal National Scenic Byways CSV.
2. **Wrong target count.** The canonical authoritative source — DOT ArcGIS `US_Scenic_Byways/MapServer/107` — returns 648 features / 645 distinct routes, NOT the 184 the PRD assumed. The 184 was an aspirational reference to the FHWA "America's Byways" federal program; the DOT layer is a DOT-compiled superset including state-designated, USFS, NPS, and BLM routes.

**Resolution (Option 1 per DECISIONS.md):** Insert BASE-000 as a new Wave 0 data-prep task that fetches layer 107 as GeoJSON, derives the 6-column CSV deterministically, asserts row count in a 580-710 tolerance window (±10% around 645), and commits `data/fhwa_byways.csv` as static data. All downstream BASE-* tasks are hermetic against the committed CSV — no network fetches at pipeline runtime. BASE-001's Boy Scout `__main__` fix is otherwise unchanged; its AC-2 tolerance window updated from 165-203 to 580-710. The "184" references throughout the curation-hardening PRD are updated to reflect the 645-route reality — see the 2026-04-13 diff batch for the full consistency edit list.

**Revised wave plan:**

```
Wave 0 (entry):           BASE-000  (NEW — fetch DOT layer → data/fhwa_byways.csv)
Wave 1 (after BASE-000):  BASE-001  ║  BASE-002
Wave 2 (after BASE-001):  BASE-003  ║  BASE-006
Wave 3 (after BASE-003):  BASE-004
Wave 4 (after BASE-004):  BASE-005  ║  BASE-007
Wave 5 (after all above): BASE-008   (Curation Review Protocol + baseline commit)
Wave 6 (after BASE-008):  BASE-009a  (Crawl Plan Protocol framework + MR remediation, ~270 min)
Wave 7 (after BASE-009a): BASE-009b  (BBR remediation + baseline regen + review.md verdict upgrade, ~300 min)
```

**Human checkpoint between Wave 6 and Wave 7:** User reviews `crawl-plans/motorcycleroads/crawl-report.md` and spot-checks 5 random records in `staging/motorcycleroads.jsonl` before BASE-009b is dispatched. This is the risk-isolation payoff of the split — if framework bugs surface, they are fixed here (cost: ~30 min MR re-run) rather than during BBR's ~3.75 hr Phase 5 execution.

## Preflight Discoveries (2026-04-13)

Captured during `/kb-run-epic` preflight investigation before any agent dispatch. Each item represents a premise failure in the original 2026-04-12 task specs that was discovered, documented, and resolved before execution.

1. **FHWA CSV never existed.** The predecessor PRD (`.spec/prds/curation/05-uc-ingest.md:25`) claimed "System downloads FHWA byways CSV from data.gov URL". That statement was aspirational — data.gov does not publish a federal National Scenic Byways CSV (only Iowa, New York, and North Dakota state subsets are indexed). FHWA publishes the "America's Byways" program only as PDF and HTML, neither with coordinates. `parse_fhwa_csv()` was implemented against a schema no public source provides directly.

2. **Canonical source identified.** The authoritative DOT data lives at `https://geo.dot.gov/server/rest/services/US_Scenic_Byways/MapServer/107` — an ArcGIS FeatureServer supporting GeoJSON query format, public domain per 17 USC §101, no API key required.

3. **184 vs 645 reality gap.** Layer 107 returns **648 features / 645 distinct routes**, not 184. The layer is a DOT-compiled superset of scenic byways across all US agencies. `Admin_Org` field breakdown: 127 NSB-tagged, 525 STATE, 130 USFS, 54 BLM, 9 NPS. The `Type` field is uniformly `"National Scenic Byway"` — AAR is not encoded in this layer. Filtering to NSB-only yields 127 (still not 184, since the DOT layer lags program updates).

4. **BASE-000 inserted as prerequisite.** New Wave 0 data-prep task fetches layer 107, derives the 6-column CSV (`RouteName, State, CentroidLat, CentroidLng, LengthMiles, AgencyTags`), asserts 580-710 rows, and commits `data/fhwa_byways.csv` as static data. See [BASE-000.md](./BASE-000.md) and [DECISIONS.md](./DECISIONS.md).

5. **Landmark set verified.** Blue Ridge Parkway, Beartooth Highway, and Pacific Coast (OR+WA segments) are present in layer 107 with NSB tags. Tail of the Dragon and Million Dollar Highway are **NOT** — they're state-designated and will enter the catalog via BBR/MR community scrapers (BASE-002), not via BASE-001. BASE-008's 5-landmark spot check still works because it validates the full post-dedup catalog, not just the FHWA source.

6. **AAR/NSB binary retired.** The proposed `Designation` column (NSB vs AAR) was replaced with `AgencyTags` because the DOT layer doesn't encode AAR at all. Downstream scoring in Epic 8 (SCO-001) can derive a more granular `fhwa_designation` signal from the raw `Admin_Org` tag string than the current binary.

7. **Narrow-execution strategy adopted.** The two spec-drift findings above (both discovered within minutes of preflight kickoff) indicated the 2026-04-12 task specs had significant unverified assumptions. Execution strategy shifted from full-epic parallel dispatch to narrow sequential: BASE-000 → BASE-001 → evaluate preconditions for each remaining task before dispatching. See DECISIONS.md for rationale.

8. **Stale worktrees flagged for cleanup.** Four worktrees from prior `/kb-run-epic` runs remain at `.claude/worktrees/agent-{a217777d,a402df1a,a80e1c46,a828ec83}`. Confirmed as leftover state from already-merged VAL-001, VAL-002, VAL-004 work. Safe to remove before Wave 0 dispatch.

### Boy Scout __main__ Fixes (inventory)

Pipeline reality check (2026-04-12): 6 of the 8 existing pipeline modules had **no `__main__` block** and therefore could not run as `python -m`. Each validation task includes a minimal Boy Scout fix to add one, committed separately so future epics can diff cleanly:

| Module | Task | Boy Scout Change |
|---|---|---|
| `sources/fhwa.py` | BASE-001 | Add `__main__` block (~15 lines) |
| `sources/motorcycleroads.py` | BASE-002 | None (already has `__main__`) |
| `sources/bestbikingroads.py` | BASE-002 | None (already has `__main__`) |
| `extraction/client.py` | BASE-003 | Add `__main__` block with `--sample/--count/--out` |
| `scoring/composite.py` | BASE-004 | Add `__main__` block with `--input/--out/--count` |
| `classification/archetype.py` | BASE-005 | Add `__main__` block with `--routes/--scores/--out/--count` |
| `enrichment/osm_client.py` | BASE-006 | Add `__main__` block with `--input/--count/--cache-dir` |
| `sync/convex_push.py` | BASE-007 | Add `dry_run: bool` kwarg to `push_routes()` AND `__main__` block with `--dry-run` flag (single commit) |

**Agent:** python-implement for all tasks.

**Dependencies:**
- Epic 2 depends on Epic 1 (VAL-004 specifically, for dev Convex deployment)
- Epic 2 blocks Epic 3 (INF-001) — no hardening begins until BASE-008 commits the Epic 2 baseline

---

## Dependencies

**Blocks:**
- Epic 3: Foundation — Models, Schema, Dependencies (can't extend models if baseline is broken)
- Epic 4+: All downstream epics depend on a working baseline

**Depends On:**
- Epic 1: Week 0 Validation (VAL-004 provides the dev Convex deployment for the push dry-run)

---

## Definition of Done

- [ ] BASE-001 task file written and tasks moved to `Done`
- [ ] `baseline-report.md` committed to this epic directory
- [ ] Every pipeline stage verified with actual counts and output samples
- [ ] Any discovered bugs fixed in a separate commit (Boy Scout rule)
- [ ] BASE-009a Crawl Plan Protocol framework + MR remediation complete (~270 min); user has reviewed the MR crawl-report.md at the human checkpoint between 009a and 009b
- [ ] BASE-009b BBR remediation + Epic 2 baseline regeneration complete (~300 min); `review.md` verdict upgraded from "PASS WITH ISSUES" to "PASS"
- [ ] `scripts/curation/pipeline/sources/crawl_plan/` shared framework module committed (consumed by Epic 4 and Epic 9 source tasks)
- [ ] `.spec/prds/curation-hardening/crawl-plans/motorcycleroads/` and `.../bestbikingroads/` protocol artifacts committed (site-map, inventory, selectors, crawl-report.md with verdict PASS)
- [ ] User has explicitly approved proceeding to Epic 3

---

## Notes

- **This epic exists because the user has never run the existing curation pipeline.** It's a defensive measure to ensure the baseline is solid before extending.
- If a pipeline stage is broken, STOP and fix it. Do NOT proceed to hardening on a broken foundation.
- `sync/convex_push.py` should be run in `--dry-run` mode only — no writes to production Convex
- Use a fresh Convex dev deployment for any write tests to avoid polluting existing data
- Document the current `WEIGHTS` values in composite.py as a baseline for comparison against the realigned weights in Epic 8 (SCO-001)
- The `baseline-report.md` becomes a reference document — it captures the state of the pipeline at the moment hardening begins
