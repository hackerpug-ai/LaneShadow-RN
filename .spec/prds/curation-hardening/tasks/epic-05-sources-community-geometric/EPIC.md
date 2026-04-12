# Epic 5: Source Diversification — Community + Geometric

**Sequence:** 5 / 12
**Priority:** P1
**Status:** Backlog
**Estimated Effort:** 590 minutes (~10 hours)

---

## Overview

Complete source diversification with the three higher-risk sources: BDR GPX files (10 adventure routes, segmented), twtex.com Top 100 (community crowd-sourced), and adamfranco/curvature geometric discovery (top 5% curvature roads from OSM). These are ordered after Epic 4 because each depends on a Week 0 validation spike passing:
- SRC-002 (BDR) depends on VAL-002 (HTTP accessibility + GPX format)
- SRC-003 (twtex) depends on VAL-003 (WAF + ToU feasibility)
- SRC-004 (curvature) consumes pre-computed adamfranco/curvature output (AD-008)

**Theme:** Run community and geometric sources end-to-end, see route counts grow, verify no overlap with existing sources.

**PRD Reference:** [S4.2, S4.3, S4.4](../../04-uc-src.md) — UC-SRC-02, UC-SRC-03, UC-SRC-04

---

## Human Test Steps

After all 3 tasks are complete, an administrator should be able to run the full pipeline with these sources and verify:

1. **Run BDR ingestion** — Execute `python -m scripts.curation.pipeline.sources.bdr`. Verify 10 BDR parent routes are downloaded and segmented into 5-50 mile chunks. Spot-check: Washington BDR should produce ~10-15 segments with each segment having `parent_bdr_route_id` reference.
2. **Verify BDR segment archetypes** — Inspect output. Confirm all BDR segments tagged `primary_archetype="adventure"` and `surface="mixed"` or `"gravel"` based on BDR documentation.
3. **Run twtex ingestion** (conditional on VAL-003 `go_no_go=go`) — Execute `python -m scripts.curation.pipeline.sources.twtex`. Verify 100 routes with rank, user score, description. Verify rate limiting was respected (runtime >= 200s for 100 routes).
4. **Run curvature discovery** — Execute `python -m scripts.curation.pipeline.sources.curvature_discovery`. Verify top 5% curvature roads are extracted from pre-computed adamfranco/curvature output. Verify routes already in catalog (by name+state) are excluded from candidates.
5. **Check curvature archetypes** — Confirm all curvature-discovered routes have `primary_archetype="twisties"` and a populated `curvature_score` field.
6. **Run Haiku extraction on twtex + curvature routes** — Pipe sample through extraction. Verify Pydantic schema compliance. twtex descriptions should produce rich attribute extraction; curvature-only routes may have thin extraction results.
7. **Run composite scoring** — Execute on new routes. Verify curvature-discovered routes score high on `curvature_score` component. Verify twtex routes have populated `community_rating`.
8. **Run Convex push** — Verify new routes land in Convex dev deployment with correct `source` field (`bdr`, `twtex`, `curvature_discovery`).
9. **Verify in mobile app** — Open discovery, see new adventure/twisties routes appear. BDR segments should cluster (parent route visible). Curvature discoveries should appear as "hidden gem" twisties.
10. **Run counts comparison** — Compare catalog size before Epic 4/5 (baseline) vs after. Should grow from ~17k to ~18.5k-19k routes.

11. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Applicable steps: 1 (ALL 9 sources now: FHWA, motorcycleroads, BBR, Scenic Byways, USFS MVUM, Rider Mag, BDR, twtex if go, curvature_discovery), 2, 6, 7, 8, 12. **Diff against Epic 4 baseline — catalog should grow by ~1500-2000 routes (BDR segments + twtex 100 + curvature top 5%). Verify adventure archetype population from BDR/curvature. Landmark spot check: Tail of the Dragon from curvature_discovery may collide with BBR entry — expect duplicate pre-dedup (dedup happens in Epic 6).** Write `review.md` with verdict PASS.

All 11 verifications must pass. If a source fails its Week 0 validation, that source is descoped and noted in the epic.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/sources/bdr.py` implements GPX download + segmentation
- [ ] `scripts/curation/pipeline/sources/twtex.py` implements scraping (if VAL-003 go)
- [ ] `scripts/curation/pipeline/sources/curvature_discovery.py` implements top 5% filtering
- [ ] BDR routes segmented into 5-50 mile chunks at natural breakpoints
- [ ] BDR segments preserve parent route reference
- [ ] twtex respects 2-4 second rate limit (or descoped)
- [ ] Curvature excludes already-cataloged routes by name+state match
- [ ] All 3 sources run through full pipeline (extract → score → classify → push)
- [ ] New routes visible in mobile app discovery
- [ ] Catalog count grows by expected amount (~1.5k-2k new routes)
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + updated `baseline/catalog.jsonl` committed
- [ ] Catalog diff vs Epic 4 baseline documented (expected duplicates present — dedup handles in Epic 6)

---

## PRD Sections Covered

- **S4.2** — UC-SRC-02 Ingest BDR GPX
- **S4.3** — UC-SRC-03 Ingest twtex.com Top 100
- **S4.4** — UC-SRC-04 Run adamfranco/curvature Geometric Discovery

---

## Tasks (3 stubs)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| SRC-002 | Ingest BDR GPX Routes | FEATURE | python-implement | P1 | M | 240 | VAL-002, INF-001, INF-002 | QUAL-001 |
| SRC-003 | twtex.com Top 100 Scraper | FEATURE | python-implement | P1 | M | 200 | VAL-003, INF-001, INF-002 | QUAL-001 |
| SRC-004 | adamfranco/curvature Pre-Computed Output Consumer | FEATURE | python-implement | P1 | S | 150 | INF-001, INF-002 | QUAL-001 |

**Total Tasks:** 3
**Total Estimated Effort:** 590 minutes (~10 hours)
**Parallelization:** All 3 can run in parallel — no inter-task dependencies within the epic.

---

## Dependencies

**Blocks:**
- Epic 6: Quality Infrastructure — Dedup & Floor (QUAL-001 needs routes from all sources)

**Depends On:**
- Epic 1: Week 0 Validation (VAL-002, VAL-003 gate SRC-002, SRC-003)
- Epic 3: Foundation (INF-001, INF-002)

**Conditional Descope:**
- If VAL-003 returns `no-go`, remove SRC-003 from this epic and mark UC-SRC-03 as deferred
- If VAL-002 returns FAIL, pivot SRC-002 to manual curation or descope

---

## Definition of Done

- [ ] All 3 task files written and merged (or SRC-003 officially descoped)
- [ ] All 3 tasks moved to `Done`
- [ ] Each source produces a JSONL staging file with expected count
- [ ] Full pipeline runs against each source without crashes
- [ ] New routes visible in Convex dev deployment AND mobile app discovery
- [ ] Catalog count growth documented
- [ ] User has approved proceeding to Epic 6

---

## Notes

- BDR segmentation uses Haversine distance accumulation (prototype from VAL-002)
- twtex is the only source in this epic with legal/WAF risk — VAL-003 is the gate
- Curvature discovery consumes PRE-COMPUTED adamfranco/curvature output (AD-008) — do NOT run the multi-hour OSM PBF processing in the pipeline
- The adamfranco/curvature output file location must be documented in `.spec/prds/curation-hardening/09-technical-requirements.md` before SRC-004 starts
- Some BDR routes may require manual segment review if auto-segmentation produces weird chunks (town boundaries, junctions)
