# Epic 6: Quality Infrastructure — Dedup & Floor

**Sequence:** 6 / 12
**Priority:** P1
**Status:** Backlog
**Estimated Effort:** 540 minutes (~9 hours)

---

## Overview

Implement the two core quality gates that clean the merged catalog: three-stage deduplication (exact name+state → fuzzy Levenshtein → geospatial proximity via Convex GeospatialIndex) and a quality floor filter that marks routes as `premium`/`standard`/`minimal` based on data completeness. Dedup uses source-priority merge to preserve the most authoritative data; the quality floor phased rollout (soft → hard) avoids over-rejecting government data.

**Theme:** Run dedup on the full merged catalog and see duplicates disappear. Run quality floor and see tier assignments reflect data completeness.

**PRD Reference:** [S5.1, S5.2](../../05-uc-qual.md) — UC-QUAL-01, UC-QUAL-02

---

## Human Test Steps

After both tasks are complete, an administrator should be able to:

1. **Run dedup on the full catalog** — Execute `python -m scripts.curation.pipeline.dedup.deduplicator`. Verify runtime < 10 minutes for ~20k routes. Verify Pass 1 (exact name+state), Pass 2 (fuzzy Levenshtein >0.85 via rapidfuzz.token_sort_ratio), Pass 3 (geospatial <3mi + Lev >0.75) counts are logged.
2. **Verify source priority merge** — Spot-check merged routes. For a route appearing in both FHWA and BBR, verify FHWA GIS fields won. Inspect `field_provenance` dict — should show which source contributed each field. Verify `merge_count > 1` on merged records.
3. **Verify community_rating preservation** — For a merged route with ratings from both twtex and motorcycleroads, verify the HIGHEST rating was retained.
4. **Verify description preservation** — For a merged route with descriptions from multiple sources, verify the LONGEST non-null description was retained.
5. **Check dedup report** — Inspect the dedup report markdown. Verify it shows before/after counts per source, and merge rationale for each pair type. Duplicate "Tail of the Dragon" should appear once in the final catalog.
6. **Run quality floor filter (Phase 1 soft mode)** — Execute `python -m scripts.curation.pipeline.quality.floor_filter --phase=1`. Verify routes get `quality_tier` assignments but are NOT rejected — minimal-tier routes stay in the catalog.
7. **Inspect tier distribution** — Verify tier counts: `premium` (all 4 fields), `standard` (core fields), `minimal` (below floor). Should be a reasonable distribution — not 100% minimal.
8. **Try hard mode (dry run)** — Execute `python -m scripts.curation.pipeline.quality.floor_filter --phase=3 --dry-run`. Verify it would reject N minimal-tier routes with zero engagement, without actually rejecting. Review rejection log.
9. **Run allowlist override** — Add a minimal-tier route to the allowlist and re-run. Verify the allowlisted route is promoted to `standard` tier.
10. **Run full pipeline end-to-end post-dedup** — Execute source ingest → dedup → quality floor → extract → score → classify → push. Verify Convex upsert reflects the deduped, tiered catalog. Mobile app shows no duplicate routes.

11. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Applicable steps NOW INCLUDE: 3 (dedup) and 4 (quality floor) for the first time. Full steps: 1, 2, 3, 4, 6, 7, 8, 12. **Diff against Epic 5 baseline — catalog should SHRINK due to dedup (~17k → ~15-16k after merging duplicates). Score distributions should tighten. Verify Tail of the Dragon appears EXACTLY ONCE. Verify quality tier distribution is sensible (not 100% minimal). Landmark spot check: all 5 landmarks appear exactly once.** Write `review.md` with verdict PASS.

All 11 verifications must pass.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/dedup/deduplicator.py` implements three-stage dedup
- [ ] Three-stage cascading logic: exact → fuzzy → geospatial
- [ ] Fuzzy match uses `rapidfuzz.token_sort_ratio()` with 0.85 threshold
- [ ] Geospatial match uses Convex GeospatialIndex (`INF-007`) with 3mi threshold
- [ ] Source priority merge preserves authoritative data per field
- [ ] `field_provenance`, `merged_at`, `merge_count`, `source_priority` populated on merged records
- [ ] Dedup completes for 20k routes in under 10 minutes
- [ ] Dedup report generated (JSON + markdown) with per-source before/after counts
- [ ] `scripts/curation/pipeline/quality/floor.py` implements quality floor filter
- [ ] Quality tier: `premium` / `standard` / `minimal` assigned per rules
- [ ] Phased rollout flags: `--phase=1|2|3`
- [ ] Allowlist mechanism for manual overrides
- [ ] Quality floor report lists excluded/minimal routes
- [ ] Full pipeline runs end-to-end with dedup + quality floor active
- [ ] Mobile app shows no duplicate routes

---

## PRD Sections Covered

- **S5.1** — UC-QUAL-01 Deduplicate Routes Across Sources
- **S5.2** — UC-QUAL-02 Enforce Quality Floor Filter

---

## Tasks (2 stubs)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| QUAL-001 | Three-Stage Deduplication Engine | FEATURE | python-implement | P1 | L | 360 | SRC-001..006, INF-002, INF-007 | QUAL-002, QUAL-003, QUAL-004 |
| QUAL-002 | Quality Floor Enforcement | FEATURE | python-implement | P1 | M | 180 | QUAL-001 | QUAL-003, QUAL-004 |

**Total Tasks:** 2
**Total Estimated Effort:** 540 minutes (~9 hours)
**Parallelization:** Sequential — QUAL-001 must complete before QUAL-002

---

## Dependencies

**Blocks:**
- Epic 7: Quality Infrastructure — Reports (coverage/data quality reports depend on deduped catalog)
- Epic 12: Orchestrator & E2E (dedup is a pipeline stage)

**Depends On:**
- Epic 4: Source Diversification — Government + Editorial (all SRC tasks)
- Epic 5: Source Diversification — Community + Geometric (all SRC tasks)
- Epic 3: Foundation (INF-002, INF-007)

---

## Definition of Done

- [ ] Both task files written and merged
- [ ] Both tasks moved to `Done`
- [ ] Dedup runs on full catalog in under 10 minutes
- [ ] Dedup report shows per-source merge statistics
- [ ] Quality floor produces tier distribution that makes sense (not 100% minimal)
- [ ] Full pipeline end-to-end test passes with dedup + quality floor active
- [ ] Mobile app shows no duplicate routes (verify "Tail of the Dragon" appears once)
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + updated `baseline/catalog.jsonl` committed
- [ ] Catalog diff vs Epic 5 baseline shows expected dedup-driven shrink
- [ ] User has approved proceeding to Epic 7

---

## Notes

- **Dedup is the single highest-risk QUAL task** — performance AND correctness both matter
- Test dedup against known duplicates (Tail of the Dragon appearing in FHWA + BBR + motorcycleroads)
- If geospatial query latency (from INF-007) exceeds budget, dedup runtime will exceed 10 minutes — may need to batch or pre-cluster
- Quality floor should start in Phase 1 (soft mode) — Phase 3 hard rejection only after Week 3-4 engagement analysis
- The allowlist mechanism is critical for government data sources that may lack rich descriptions but are authoritative
- Document dedup threshold tuning decisions in the epic close-out notes (they may need adjustment based on FP/FN analysis)
