# Epic 4: Source Diversification — Government, Editorial & Geometric

**Sequence:** 4 / 11
**Priority:** P1
**Status:** Backlog
**Estimated Effort:** 540 minutes (~9 hours)

---

## Overview

Reduce single-source concentration (currently 98.8% BestBikingRoads) by ingesting three sources: US Scenic Byways GIS (799 routes, government), Rider Magazine 50 Best Roads (editorial ground truth), and adamfranco/curvature geometric discovery (OSM top 5% curvature). These are the three surviving sources after the 2026-04-12 revision that dropped BDR, twtex, and USFS MVUM (see PRD `00-overview.md` and `01-scope.md` Out-of-Scope).

**Why these three:**
- Scenic Byways GIS — Government, no WAF/legal risk, 4x expansion over existing FHWA CSV
- Rider Magazine 50 Best — Editorial ground truth anchor for Epic 8 (SCO-002) calibration gate
- Curvature discovery — Consumes pre-computed adamfranco/curvature output (AD-008); uncovers "hidden gem" twisties that never appear in editorial/community lists

**Theme:** Run the three surviving new sources end-to-end through the pipeline, see new routes appear in Convex, verify reconciliation against existing FHWA data.

**PRD Reference:** [S4.1, S4.4, S4.6](../../04-uc-src.md) — UC-SRC-01, UC-SRC-04, UC-SRC-06

---

## Human Test Steps

After all 3 tasks are complete, an administrator should be able to run the full pipeline with these sources and verify:

1. **Run Scenic Byways ingestion** — Execute `python -m scripts.curation.pipeline.sources.scenic_byways`. Verify `scenic_byways.jsonl` contains ~799 routes with `location` (GeoJSON Point), `name`, `state`, `designation`, `description`. Check runtime < 60s. Spot-check 10 routes for valid coordinates.
2. **Verify reconciliation against existing FHWA** — Inspect the reconciliation log. Confirm ~184 existing FHWA routes from Epic 2 baseline are either merged (GIS geometry preferred) or flagged for manual review. No duplicates in final output.
3. **Run Rider Magazine ingestion** — Execute `python -m scripts.curation.pipeline.sources.rider_mag`. Verify all 50 routes are ingested, each tagged `ground_truth=true`, `ground_truth_source="rider_magazine_50_best"`, with editorial descriptions preserved.
4. **Run curvature discovery** — Execute `python -m scripts.curation.pipeline.sources.curvature_discovery`. Verify top 5% curvature roads are extracted from pre-computed adamfranco/curvature output. Verify routes already in catalog (by name+state) are excluded from candidates. Verify all surfaced candidates have `primary_archetype="twisties"` and populated `curvature_score`.
5. **Run Haiku extraction on new routes** — Pipe the Rider Mag descriptions + curvature candidates through `extraction/client.py`. Verify Pydantic schema compliance; Rider Mag routes should produce rich attribute extraction (Tail of the Dragon curvature high, scenery high); curvature-only routes may have thin extraction results.
6. **Run composite scoring** — Execute `scoring/composite.py` on the ingested routes. Verify `composite_score` ranges from 0-1 and top-scored routes match editorial reputation (Rider Mag routes should dominate top 10). Curvature-discovered routes should score high on `curvature_score` component.
7. **Run archetype classification** — Execute `classification/archetype.py`. Verify Scenic Byways get `scenic_byway`, curvature candidates get `twisties`, and Rider Mag routes distribute across archetypes appropriately.
8. **Run Convex push (dev deployment)** — Execute `python -m scripts.curation.pipeline.sync.convex_push`. Verify new routes appear in Convex dashboard with `source` field set correctly (`scenic_byways_gis`, `rider_magazine`, `curvature_discovery`). Verify `location` GeoJSON Point serialized.
9. **Verify in mobile app** — Open mobile discovery screen. Verify new routes appear on the map. Tap a Rider Mag route — see editorial description in route details. Curvature discoveries should appear as "hidden gem" twisties.

10. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Applicable steps for Epic 4: 1 (ALL existing sources + 3 new: Scenic Byways, Rider Mag, curvature_discovery), 2, 6, 7, 8, 12. **Diff against Epic 3 baseline — catalog should grow by ~1100-2500 routes (799 Scenic Byways + 50 Rider Mag + 250-1650 curvature candidates - reconciliation overlap). Verify archetype distribution shifts reflect new sources (more scenic_byway, more twisties). Ground-truth spot check: Rider Mag 50 routes should all appear; Tail of the Dragon may appear via both BBR and curvature_discovery — expect duplicate pre-dedup (dedup happens in Epic 6).** Write `review.md` with verdict PASS.

All 10 verifications must pass. If a source crashes, debug and fix before proceeding.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/sources/scenic_byways.py` implemented with 799-route ingestion
- [ ] `scripts/curation/pipeline/sources/rider_mag.py` implemented with `ground_truth` tagging
- [ ] `scripts/curation/pipeline/sources/curvature_discovery.py` implemented with top 5% filtering
- [ ] Scenic Byways reconciles against existing FHWA CSV (184 overlap, GIS geometry preferred)
- [ ] Rider Mag ingestion validates all 50 routes ingested (no partial)
- [ ] Curvature excludes already-cataloged routes by name+state match
- [ ] Curvature candidates tagged `primary_archetype="twisties"` with populated `curvature_score`
- [ ] All 3 sources write to JSONL staging before Convex upsert
- [ ] Ingestion logs count per source + validation errors
- [ ] Each source runs through full pipeline (extract → score → classify → push)
- [ ] New routes visible in mobile app discovery
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + updated `baseline/catalog.jsonl` committed
- [ ] Catalog diff vs Epic 3 baseline shows expected growth (~1100-2500 new routes)

---

## PRD Sections Covered

- **S4.1** — UC-SRC-01 Ingest US Scenic Byways GIS Layer
- **S4.4** — UC-SRC-04 Run adamfranco/curvature Geometric Discovery
- **S4.6** — UC-SRC-06 Ingest Rider Magazine 50 Best Roads

---

## Tasks (3 stubs)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| SRC-001 | Ingest US Scenic Byways GIS Layer | FEATURE | python-implement | P1 | M | 240 | INF-001, INF-002, INF-003 | QUAL-001 |
| SRC-006 | Ingest Rider Magazine 50 Best Roads | FEATURE | python-implement | P1 | S | 150 | INF-001, INF-002 | QUAL-001, SCO-002 |
| SRC-004 | adamfranco/curvature Pre-Computed Output Consumer | FEATURE | python-implement | P1 | S | 150 | INF-001, INF-002 | QUAL-001 |

**Total Tasks:** 3
**Total Estimated Effort:** 540 minutes (~9 hours)
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
- [ ] User has approved proceeding to Epic 6

---

## Notes

- Scenic Byways GIS is 4x expansion beyond existing FHWA CSV — reconciliation is critical to avoid duplicates
- Rider Mag 50 is tagged `ground_truth=true` — Epic 8 uses these for calibration gate
- Curvature discovery consumes PRE-COMPUTED adamfranco/curvature output (AD-008) — do NOT run the multi-hour OSM PBF processing in the pipeline
- The adamfranco/curvature output file location must be documented in `.spec/prds/curation-hardening/09-technical-requirements.md` before SRC-004 starts
- Source runtime targets: Scenic Byways < 60s, Rider Mag < 10s, curvature filter < 5 min
- If Scenic Byways API (Koordinates) has stability issues, fall back to a cached download stored in the repo's data/ directory (outside git LFS threshold)
- **Revision history:** 2026-04-12 — Epic absorbed SRC-004 from the deleted Epic 5 (Community + Geometric). USFS MVUM (SRC-005) was removed from this epic in the same revision (see PRD `01-scope.md` Dropped section).
