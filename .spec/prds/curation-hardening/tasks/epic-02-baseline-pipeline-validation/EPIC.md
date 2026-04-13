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
| [BASE-001](./BASE-001.md) | FHWA source validation + Boy Scout __main__ entry point | INFRA | python-implement | P0 | S | 30 | VAL-004 | BASE-003, BASE-006, BASE-008 |
| [BASE-002](./BASE-002.md) | Community scrapers validation — MotorcycleRoads + BestBikingRoads | INFRA | python-implement | P0 | S | 30 | VAL-004 | BASE-008 |
| [BASE-003](./BASE-003.md) | Haiku extraction validation + Boy Scout __main__ for extraction/client.py | INFRA | python-implement | P0 | S | 45 | BASE-001 | BASE-004, BASE-008 |
| [BASE-004](./BASE-004.md) | Composite scoring validation + Boy Scout __main__ for scoring/composite.py | INFRA | python-implement | P0 | S | 30 | BASE-003 | BASE-005, BASE-007, BASE-008 |
| [BASE-005](./BASE-005.md) | Archetype classification validation + Boy Scout __main__ for classification/archetype.py | INFRA | python-implement | P0 | S | 30 | BASE-004 | BASE-008 |
| [BASE-006](./BASE-006.md) | OSM enrichment validation + Boy Scout __main__ for enrichment/osm_client.py | INFRA | python-implement | P0 | S | 45 | BASE-001 | BASE-008 |
| [BASE-007](./BASE-007.md) | Convex push dry-run validation + Boy Scout --dry-run flag for sync/convex_push.py | INFRA | python-implement | P0 | S | 45 | BASE-004, VAL-004 | BASE-008 |
| [BASE-008](./BASE-008.md) | Curation Review Protocol execution + baseline artifacts commit | INFRA | python-implement | P0 | M | 60 | BASE-001..007 | INF-001 |

**Total effort:** 315 minutes (~5.25 hours) across 8 tasks. Average quality score ~110/115. Decomposed from archived `BASE-001.md.archived` (240-min single task) on 2026-04-12.

### Decomposition Rationale

The original BASE-001 was a 240-minute single INFRA task with 8 ACs spanning 8 pipeline stages — too big for a single agent context window and impossible to parallelize. The decomposition produces 8 smaller tasks (mostly 30-45 min each) that can be executed across parallelization waves:

```
Wave 1 (after VAL-004):   BASE-001  ║  BASE-002
Wave 2 (after BASE-001):  BASE-003  ║  BASE-006
Wave 3 (after BASE-003):  BASE-004
Wave 4 (after BASE-004):  BASE-005  ║  BASE-007
Wave 5 (after all above): BASE-008  (Curation Review Protocol + baseline commit)
```

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
- [ ] User has explicitly approved proceeding to Epic 3

---

## Notes

- **This epic exists because the user has never run the existing curation pipeline.** It's a defensive measure to ensure the baseline is solid before extending.
- If a pipeline stage is broken, STOP and fix it. Do NOT proceed to hardening on a broken foundation.
- `sync/convex_push.py` should be run in `--dry-run` mode only — no writes to production Convex
- Use a fresh Convex dev deployment for any write tests to avoid polluting existing data
- Document the current `WEIGHTS` values in composite.py as a baseline for comparison against the realigned weights in Epic 8 (SCO-001)
- The `baseline-report.md` becomes a reference document — it captures the state of the pipeline at the moment hardening begins
