# Epic 2: Baseline Curation Pipeline Validation

**Sequence:** 2 / 12
**Priority:** P0
**Status:** Backlog
**Estimated Effort:** 240 minutes (~4 hours)

---

## Overview

The existing curation pipeline at `scripts/curation/pipeline/` (from the predecessor `.spec/prds/curation/` PRD) has source scrapers (FHWA, motorcycleroads, bestbikingroads), Haiku extraction, composite scoring, archetype classification, and Convex push — but **no one has ever run it end-to-end against live infrastructure**. Before layering hardening on top, we must prove the baseline works.

This epic is the **baseline truth check**: run every existing stage of the curation pipeline against live sources and the development Convex deployment, and verify each produces sensible output. If the baseline is broken, hardening can't be built on top of it.

**Theme:** Prove the existing curation logic works before extending it.

**PRD Reference:** Predecessor PRD `.spec/prds/curation/` (all UC-INGEST, UC-EXTRACT, UC-SCORE, UC-CLASSIFY, UC-PUSH use cases)

---

## Human Test Steps

After the baseline validation task is complete, an administrator should be able to run each existing pipeline stage and verify correct outputs:

1. **Run FHWA ingestion** — Execute `python -m scripts.curation.pipeline.sources.fhwa`. Verify ~184 All-American/National Scenic Byway routes written to a JSONL staging file. Check: names, states, and centroid coordinates present.
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

- [ ] Every existing pipeline stage has been executed at least once against real data
- [ ] Each stage produces expected output types and ranges
- [ ] JSONL staging files exist for each source with reasonable counts
- [ ] Haiku extraction produces valid `RouteAttributes` objects (no schema violations)
- [ ] Composite scoring produces floats in `[0, 1]` range per dimension
- [ ] Archetype classification assigns one of 6 archetypes to every route
- [ ] Convex push (dry-run) serializes without type errors
- [ ] Any bugs discovered are fixed, committed, and baseline re-validated
- [ ] Baseline validation report written to `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md`
- [ ] Curation Review Protocol executed end-to-end with PASS verdict
- [ ] `review.md` + `baseline/catalog.jsonl` committed (this becomes the reference baseline for all future epic reviews)

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
| BASE-001 | Run and validate existing curation pipeline end-to-end | INFRA | python-implement | P0 | M | 240 | VAL-004 | INF-001 |

**Task file not yet written — per user instruction, only Epic 1 has full task files at this stage.** The stub below captures the required scope.

### BASE-001 Stub

**Title:** Run and validate existing curation pipeline end-to-end

**Objective:** Execute every existing curation pipeline stage against live sources and the dev Convex deployment, verifying each stage produces correct output. Fix any discovered bugs under the Boy Scout rule.

**Scope:**
- Execute all 3 existing source scrapers (`fhwa`, `motorcycleroads`, `bestbikingroads`) — capture route counts and JSONL paths
- Run a sample through `extraction/client.py` — verify Pydantic schema compliance and temperature=0
- Run `scoring/composite.py` — verify score distributions and WEIGHTS currently loaded
- Run `classification/archetype.py` — verify archetype assignments cover all 6 types
- Run `enrichment/osm_client.py` — verify OSM lookups and cache behavior
- Run `sync/convex_push.py --dry-run` — verify serialization without live push
- Write a `baseline-report.md` capturing: stage-by-stage pass/fail, actual counts, current WEIGHTS values, any bugs found and fixed

**Acceptance Criteria (high level):**
1. GIVEN existing pipeline code, WHEN each stage is executed, THEN stage-specific outputs are produced without crashes
2. GIVEN live FHWA data, WHEN fhwa source runs, THEN ~184 routes are ingested
3. GIVEN live BBR catalog, WHEN bestbikingroads source runs, THEN ~17k routes are scraped (baseline for dedup later)
4. GIVEN extracted routes, WHEN composite scoring runs, THEN all routes receive `composite_score` floats in `[0,1]`
5. GIVEN scored routes, WHEN archetype classifier runs, THEN every route has `primary_archetype` set
6. GIVEN serialized routes, WHEN Convex push dry-runs, THEN no type errors

**Agent:** python-implement (existing Python pipeline)

**Dependencies:**
- Depends on: VAL-004 (needs a working dev Convex deployment for the push dry-run)
- Blocks: INF-001 (dependency install — no point installing new deps if baseline is broken)

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
- [ ] User has explicitly approved proceeding to Epic 3

---

## Notes

- **This epic exists because the user has never run the existing curation pipeline.** It's a defensive measure to ensure the baseline is solid before extending.
- If a pipeline stage is broken, STOP and fix it. Do NOT proceed to hardening on a broken foundation.
- `sync/convex_push.py` should be run in `--dry-run` mode only — no writes to production Convex
- Use a fresh Convex dev deployment for any write tests to avoid polluting existing data
- Document the current `WEIGHTS` values in composite.py as a baseline for comparison against the realigned weights in Epic 8 (SCO-001)
- The `baseline-report.md` becomes a reference document — it captures the state of the pipeline at the moment hardening begins
