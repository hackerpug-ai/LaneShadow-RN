# Epic 4: Source Diversification — Government + Editorial

**Sequence:** 4 / 12
**Priority:** P1
**Status:** Backlog
**Estimated Effort:** 590 minutes (~10 hours)

---

## Overview

Reduce single-source concentration (currently 98.8% BestBikingRoads) by ingesting three high-authority, low-risk sources: US Scenic Byways GIS (799 routes), USFS Motor Vehicle Use Maps (forest roads with surface type), and Rider Magazine 50 Best Roads (editorial ground truth). These sources are prioritized first because:
- They are government or editorial — no WAF/legal risk
- They provide route geometry, surface type, and editorial ratings
- Rider Magazine 50 becomes the ground truth anchor for Epic 8 (SCO-002)

**Theme:** Run real government and editorial sources end-to-end through the pipeline, see new routes appear in Convex, verify reconciliation against existing FHWA data.

**PRD Reference:** [S4.1, S4.5, S4.6](../../04-uc-src.md) — UC-SRC-01, UC-SRC-05, UC-SRC-06

---

## Human Test Steps

After all 3 tasks are complete, an administrator should be able to run the full pipeline with these sources and verify:

1. **Run Scenic Byways ingestion** — Execute `python -m scripts.curation.pipeline.sources.scenic_byways`. Verify `scenic_byways.jsonl` contains ~799 routes with `location` (GeoJSON Point), `name`, `state`, `designation`, `description`. Check runtime < 60s. Spot-check 10 routes for valid coordinates.
2. **Verify reconciliation against existing FHWA** — Inspect the reconciliation log. Confirm ~184 existing FHWA routes from Epic 2 baseline are either merged (GIS geometry preferred) or flagged for manual review. No duplicates in final output.
3. **Run USFS MVUM ingestion** — Execute `python -m scripts.curation.pipeline.sources.usfs_mvum`. Verify forest roads are extracted with `surface` field populated (`paved`|`gravel`|`dirt`|`improved`|`native`), `primary_archetype="adventure"`, and seasonal closure metadata. Spot-check 5 routes.
4. **Run Rider Magazine ingestion** — Execute `python -m scripts.curation.pipeline.sources.rider_mag`. Verify all 50 routes are ingested, each tagged `ground_truth=true`, `ground_truth_source="rider_magazine_50_best"`, with editorial descriptions preserved.
5. **Run Haiku extraction on new routes** — Pipe the Rider Mag descriptions through `extraction/client.py`. Verify Pydantic schema compliance and that extracted attributes (curvature, scenery, traffic, condition) are sensible for known routes (e.g., Tail of the Dragon should have high curvature).
6. **Run composite scoring** — Execute `scoring/composite.py` on the ingested routes. Verify `composite_score` ranges from 0-1 and top-scored routes match editorial reputation (Rider Mag routes should dominate top 10).
7. **Run archetype classification** — Execute `classification/archetype.py`. Verify Scenic Byways get `scenic_byway`, USFS MVUM gets `adventure`, and Rider Mag routes distribute across archetypes appropriately.
8. **Run Convex push (dev deployment)** — Execute `python -m scripts.curation.pipeline.sync.convex_push`. Verify new routes appear in Convex dashboard with `source` field set correctly (`scenic_byways_gis`, `usfs_mvum`, `rider_magazine`). Verify `location` GeoJSON Point serialized.
9. **Verify in mobile app** — Open mobile discovery screen. Verify new routes appear on the map. Tap a Rider Mag route — see editorial description in route details.

10. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Applicable steps for Epic 4: 1 (ALL existing sources + 3 new: Scenic Byways, USFS MVUM, Rider Mag), 2, 6, 7, 8, 12. **Diff against Epic 3 baseline — catalog should grow by ~800-900 routes (799 Scenic Byways + USFS + 50 Rider Mag - reconciliation overlap). Verify archetype distribution shifts reflect new sources (more scenic_byway, adventure from USFS). Ground-truth spot check: Rider Mag 50 routes should all appear.** Write `review.md` with verdict PASS.

All 10 verifications must pass. If a source crashes, debug and fix before proceeding.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/sources/scenic_byways.py` implemented with 799-route ingestion
- [ ] `scripts/curation/pipeline/sources/usfs_mvum.py` implemented with surface type mapping
- [ ] `scripts/curation/pipeline/sources/rider_mag.py` implemented with `ground_truth` tagging
- [ ] Scenic Byways reconciles against existing FHWA CSV (184 overlap, GIS geometry preferred)
- [ ] USFS MVUM filters to motorcycle-allowed roads only
- [ ] Rider Mag ingestion validates all 50 routes ingested (no partial)
- [ ] All 3 sources write to JSONL staging before Convex upsert
- [ ] Ingestion logs count per source + validation errors
- [ ] Each source runs through full pipeline (extract → score → classify → push)
- [ ] New routes visible in mobile app discovery
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + updated `baseline/catalog.jsonl` committed
- [ ] Catalog diff vs Epic 3 baseline shows expected growth (~800-900 new routes)

---

## PRD Sections Covered

- **S4.1** — UC-SRC-01 Ingest US Scenic Byways GIS Layer
- **S4.5** — UC-SRC-05 Ingest USFS Motor Vehicle Use Maps
- **S4.6** — UC-SRC-06 Ingest Rider Magazine 50 Best Roads

---

## Tasks (3 stubs)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| SRC-001 | Ingest US Scenic Byways GIS Layer | FEATURE | python-implement | P1 | M | 240 | INF-001, INF-002, INF-003 | QUAL-001 |
| SRC-005 | Ingest USFS Motor Vehicle Use Maps | FEATURE | python-implement | P1 | M | 200 | INF-001, INF-002 | QUAL-001 |
| SRC-006 | Ingest Rider Magazine 50 Best Roads | FEATURE | python-implement | P1 | S | 150 | INF-001, INF-002 | QUAL-001, SCO-002 |

**Total Tasks:** 3
**Total Estimated Effort:** 590 minutes (~10 hours)
**Parallelization:** All 3 can run in parallel — no inter-task dependencies within the epic.

---

## Dependencies

**Blocks:**
- Epic 6: Quality Infrastructure — Dedup & Floor (QUAL-001 needs routes from all sources)
- Epic 8: Scoring & Calibration (SCO-002 needs Rider Mag ground truth from SRC-006)

**Depends On:**
- Epic 3: Foundation (INF-001 deps, INF-002 models, INF-003 schema)

---

## Definition of Done

- [ ] All 3 task files written and merged
- [ ] All 3 tasks moved to `Done`
- [ ] Each source produces a JSONL staging file with the expected count
- [ ] Full pipeline (ingest → extract → score → classify → push) runs against each source without crashes
- [ ] New routes visible in Convex dev deployment AND mobile app discovery
- [ ] Reconciliation log shows Scenic Byways vs FHWA overlap handled correctly
- [ ] User has approved proceeding to Epic 5

---

## Notes

- Scenic Byways GIS is 4x expansion beyond existing FHWA CSV — reconciliation is critical to avoid duplicates
- USFS MVUM is the primary source for `surface` field (feeds DESIGN-009 surface filter in Epic 11)
- Rider Mag 50 is tagged `ground_truth=true` — Epic 8 uses these for calibration gate
- Source runtime targets: Scenic Byways < 60s, USFS variable by forest count, Rider Mag < 10s
- If Scenic Byways API (Koordinates) has stability issues, fall back to a cached download stored in the repo's data/ directory (outside git LFS threshold)
