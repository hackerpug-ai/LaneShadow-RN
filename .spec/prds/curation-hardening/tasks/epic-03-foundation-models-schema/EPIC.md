# Epic 3: Foundation — Models, Schema, Dependencies

**Sequence:** 3 / 12
**Priority:** P0
**Status:** Backlog
**Estimated Effort:** 420 minutes (~7 hours)

---

## Overview

Prepare the foundational data structures, dependencies, and Convex schema changes that every subsequent epic depends on. This epic extends the `Route` and `EnrichedRoute` dataclasses with 25+ new fields, adds the `route_mentions` Convex table, wires the production geospatial queries, and installs all new Python dependencies (rapidfuzz, shapely, fiona, praw, srtm.py, gpxpy, haversine).

**Critical:** All new Convex fields are `v.optional()` — this epic is NON-BREAKING for existing mobile app clients.

**Theme:** Lay the foundation. Every field that hardening needs is available in Python and Convex before any source or scoring task starts.

**PRD Reference:** [S9 Technical Requirements](../../09-technical-requirements.md) — models, schema, components

---

## Human Test Steps

After all 6 tasks are complete, an administrator should be able to:

1. **Install dependencies** — Run `pip install -r requirements.txt` and verify `rapidfuzz`, `shapely`, `fiona`, `praw`, `srtm.py`, `gpxpy`, `haversine` all install clean. Run `python -c "import rapidfuzz, shapely, fiona, praw, srtm, gpxpy, haversine; print('OK')"` and verify all imports.
2. **Inspect extended Route model** — Open `scripts/curation/pipeline/models.py` in an editor. Verify `Route` dataclass has `location`, `description`, `rating`, `designation`, `source_refs`, `surface`, `aadt`, `pavement_iri`, `mention_frequency`, `source_priority`, `field_provenance`, `merged_at`, `merge_count` fields. Verify `EnrichedRoute` has `mention_frequency_score`, `designation_score`, `elevation_drama_score`, `road_quality_score`, `low_traffic_score`, `weather_suitability`, `best_months`, `source_count`, `quality_tier` fields.
3. **Deploy Convex schema migration** — Run `npx convex dev --once`. Verify no errors. Check Convex dashboard for the new `curated_routes` optional fields and the new `route_mentions` table.
4. **Run the extended pipeline with one source** — Execute the baseline FHWA source from Epic 2 against the new models. Verify the pipeline runs without crashes and the new fields default to `None` / `Optional` gracefully. Check that `field_provenance` tracks which source wrote which field (even for single-source).
5. **Call the production geospatial query** — Execute `npx convex run routes:nearestRoutes --args '{"lng":-86.78,"lat":36.17,"limit":10}'`. Verify results come back from the dev deployment. (Uses Epic 1's seeded test routes.)
6. **Convex push test** — Run `python -m scripts.curation.pipeline.sync.convex_push --dry-run` against the extended Route output from step 4. Verify serialization includes `location` as GeoJSON Point, `sourceRefs` array, `qualityTier` field (nullable), and all new scoring fields. Confirm no type errors.
7. **Verify mobile app still loads** — Start the Expo dev server (`npx expo start`), open discovery screen. Verify existing routes still render without crashes (new optional fields default to `undefined`, guarded by `?? undefined` pattern).

8. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end against the extended-model pipeline. Applicable steps for Epic 3: same as Epic 2 (baseline sources, OSM, extraction, scoring, classification, push) PLUS verification that the new model fields serialize correctly (all optional, default None). **Diff against Epic 2 baseline — route counts should be identical, score distributions unchanged (same scoring logic, no new data yet).** Write `review.md` with verdict PASS. If catalog diff shows any unexpected changes, that's a regression — Boy Scout rule applies.

All 8 verifications must pass to confirm the foundation is solid. Any failure means a regression that must be fixed before proceeding.

---

## Acceptance Criteria (Epic-Level)

- [ ] All new Python dependencies installed and importable
- [ ] `Route` and `EnrichedRoute` dataclasses extended with 25+ fields
- [ ] `convex/schema.ts` has all new optional fields + `route_mentions` table
- [ ] `convex/geospatialIndex.ts` has production query wrappers (not validation-only)
- [ ] Extraction schema version bumped to v2 with `extraction_confidence` field
- [ ] `sync/convex_push.py` serializes all new fields correctly
- [ ] Existing baseline pipeline (Epic 2) still runs end-to-end without regression
- [ ] Mobile app renders existing routes without crashes (new optional fields undefined)
- [ ] `npx tsc --noEmit` passes
- [ ] `npx convex dev --once` passes
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + updated `baseline/catalog.jsonl` committed
- [ ] Catalog diff vs Epic 2 baseline shows no unexpected changes (same data, extended schema only)

---

## PRD Sections Covered

- **S9.1** — New components: Data entity extensions
- **S9.2** — Convex Schema (curated_routes + route_mentions)
- **S9.3** — Architecture decisions AD-005, AD-009, AD-010 (Convex Geospatial, schema evolution)
- **S1.5** — Cross-Priority Infrastructure

---

## Tasks (6 tasks with full TASK-TEMPLATE v4.0 files + 1 completed stub)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks | File |
|----|-------|------|-------|----------|--------|----------|------------|--------|------|
| INF-001 | Install New Python Dependencies | INFRA | python-implement | P0 | XS | 30 | VAL-*, BASE-001 | INF-002 | [INF-001.md](INF-001.md) |
| INF-002 | Route and EnrichedRoute Model Extension | INFRA | python-implement | P0 | S | 60 | INF-001 | INF-003, INF-005, INF-006 | [INF-002.md](INF-002.md) |
| INF-003 | Convex Schema Migration — New Fields and route_mentions Table | INFRA | convex-implementer | P0 | M | 90 | VAL-004, INF-002 | INF-006, INF-007 | [INF-003.md](INF-003.md) |
| INF-005 | Extraction Schema v2 — Add extraction_confidence Field | INFRA | python-implement | P1 | XS | 30 | INF-002 | SCO-003, SCO-004 | [INF-005.md](INF-005.md) |
| INF-006 | Convex Push Serialization Update | INFRA | convex-implementer | P1 | S | 60 | INF-002, INF-003 | INF-004 | [INF-006.md](INF-006.md) |
| INF-007 | Convex Geospatial Query Mutations — Production Wrappers | INFRA | convex-implementer | P1 | S | 90 | VAL-004, INF-003 | INF-004, QUAL-001 | [INF-007.md](INF-007.md) |
| INF-011 | US_STATES Allowlist in Crawl Plan Inventory | INFRA | python-implement | P2 | S | 60 | BASE-009b | None | [INF-011-us-states-allowlist.md](INF-011-us-states-allowlist.md) (Phase 1 DONE) |

**Total Tasks:** 7 (6 backlog + 1 phase-1 complete)
**Total Estimated Effort:** 360 minutes (~6 hours) for backlog tasks
**Parallelization:** INF-001 first → INF-002 parallel with INF-003 → INF-005/INF-006/INF-007 in parallel

---

## Dependencies

**Blocks:**
- Epic 4: Source Diversification — Government, Editorial & Geometric (all SRC tasks need extended Route model + Convex schema)
- Epic 6: Quality Infrastructure — Dedup & Floor (needs `field_provenance` and geospatial queries)
- Epic 7: Quality Infrastructure — Reports
- Epic 8: Scoring & Calibration (needs extraction schema v2)
- Epic 9: Community Sources — Ingestion
- Epic 10: Community Sources — NLP & Signals
- Epic 11: Mobile UI — New Field Display (needs Convex schema fields available)
- Epic 12: Pipeline Orchestrator & E2E Integration

**Depends On:**
- Epic 1: Week 0 Validation (VAL-004 provides the GeospatialIndex prerequisite for INF-003/INF-007)
- Epic 2: Baseline Pipeline Validation (can't extend a broken pipeline)

---

## Definition of Done

- [ ] All 6 INF task files written and merged
- [ ] All 6 tasks moved to `Done`
- [ ] `pip install` clean on a fresh virtualenv
- [ ] `npx convex dev --once` passes
- [ ] Baseline pipeline (Epic 2) re-runs successfully against extended models
- [ ] Mobile app has been smoke-tested on device to confirm no regression
- [ ] User has approved proceeding to Epic 4

---

## Notes

- **Non-breaking schema change is critical** — all new Convex fields MUST be `v.optional()`. Older mobile app versions in the wild continue to work.
- **Boy Scout rule applies** — if INF-002 reveals an existing bug in `models.py` (e.g., missing type hints, incorrect defaults), fix it as part of this epic.
- `extraction_confidence` field in INF-005 is required by SCO-003/SCO-004 to enable per-attribute F1 scoring
- `sync/convex_push.py` must handle backward-compat: if a Route doesn't have `quality_tier`, serialize as `null`/undefined (not crash)
- `GeospatialIndex` from VAL-004 is validation-only; INF-007 replaces the scaffold with production query wrappers
