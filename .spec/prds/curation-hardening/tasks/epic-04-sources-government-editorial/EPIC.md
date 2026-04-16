# Epic 4: Source Diversification — Government, Editorial & Geometric

**Sequence:** 4 / 11
**Priority:** P1
**Status:** Backlog
**Estimated Effort:** 540 minutes (~9 hours)

---

## Overview

Reduce single-source concentration (currently 98.8% BestBikingRoads) by ingesting three sources: US Scenic Byways GIS (799 routes, government), Rider Magazine 50 Best Roads (editorial ground truth), and adamfranco/curvature geometric discovery (OSM top 5% curvature). These are the three surviving sources after the 2026-04-12 revision that dropped BDR, twtex, and USFS MVUM (see PRD `00-overview.md` and `01-scope.md` Out-of-Scope).

**Why these three:**
- Scenic Byways GIS — Government, no WAF/legal risk, higher-fidelity polyline geometry and richer scenic-qualities metadata over the Epic 2 baseline FHWA CSV (~645 routes from DOT ArcGIS via BASE-000). Originally framed as a "4x expansion" against the PRD's aspirational 184-route count; after Epic 2 BASE-000 established the real DOT baseline at ~645 routes, the Koordinates 799-feature set is more accurately a geometry/quality upgrade than a raw volume expansion. See `../epic-02-baseline-pipeline-validation/DECISIONS.md`.
- Rider Magazine 50 Best — Editorial ground truth anchor for Epic 8 (SCO-002) calibration gate
- Curvature discovery — Consumes pre-computed adamfranco/curvature output (AD-008); uncovers "hidden gem" twisties that never appear in editorial/community lists

**Theme:** Run the three surviving new sources end-to-end through the pipeline, see new routes appear in Convex, verify reconciliation against existing FHWA data.

**PRD Reference:** [S4.1, S4.4, S4.6](../../04-uc-src.md) — UC-SRC-01, UC-SRC-04, UC-SRC-06

---

## Crawl Plan Protocol Compliance (MANDATORY)

Epic 4 is the first full application of the [Crawl Plan Protocol](../CRAWL-PLAN-PROTOCOL.md) to new sources. Adopted 2026-04-13 after Epic 2 BBR/MR findings (see [`../epic-02-baseline-pipeline-validation/DECISIONS.md`](../epic-02-baseline-pipeline-validation/DECISIONS.md)), the protocol is non-negotiable for any task that extracts data from a remote source at scale.

**Per-task protocol applicability:**

| Task | Source | Form | Crawl Plan Required? | Reason |
|---|---|---|---|---|
| SRC-001 | US Scenic Byways GIS (Koordinates) | **Form B** — structured GIS API | **Yes** | 799-feature API query, schema-bearing endpoint; JSONPath selectors + fixture-based type/bounds assertions prevent silent field mismatches |
| SRC-006 | Rider Magazine 50 Best Roads | **Form A** — editorial HTML scrape | **Yes** | Small site (50 routes), high-stakes because the output becomes Epic 8 SCO-002's calibration ground truth — sloppy scraping here poisons Epic 8's calibration gate |
| SRC-004 | adamfranco/curvature pre-computed output | **Form E** — file consumer | **Exempt** | Not a crawl; consumes a pre-computed file. Must still produce a small `.spec/prds/curation-hardening/crawl-plans/curvature_discovery/README.md` landing page pointing at the source file, per protocol convention |

**Shared framework dependency:** SRC-001 and SRC-006 consume the `scripts/curation/pipeline/sources/crawl_plan/` framework module built in [BASE-009a](../epic-02-baseline-pipeline-validation/BASE-009a.md) and proven on BBR in [BASE-009b](../epic-02-baseline-pipeline-validation/BASE-009b.md). **✅ SATISFIED** — BASE-009a (framework + MR) and BASE-009b (BBR + baseline regeneration) completed 2026-04-14. The crawl_plan framework module is production-ready with 192 passing tests. See [Epic 02 RETRO](../epic-02-baseline-pipeline-validation/RETRO.md) for evidence.

**Per-task acceptance criteria additions (MUST be present when task files are written):**

For SRC-001 and SRC-006, add to Acceptance Criteria:
- [ ] Phase 0: `.spec/prds/curation-hardening/crawl-plans/{source}/site-map.md` committed with page/endpoint taxonomy, URL patterns, transition graph, sample URLs, known traps
- [ ] Phase 1: `.../crawl-plans/{source}/urls.jsonl` committed with row count in expected range (SRC-001: ~799 GIS features; SRC-006: exactly 50 editorial route URLs)
- [ ] Phase 2: `fixtures/{source}/` committed with ≥3 samples per page/endpoint type + `fixtures.manifest.yaml` with expected values
- [ ] Phase 3: `.../crawl-plans/{source}/selectors.yaml` committed; all `required: true` fields at fixture_yield 5/5
- [ ] Phase 4: `scripts/curation/tests/sources/test_{source}_fixtures.py` exists and passes locally
- [ ] Phase 5: Executor runs against committed inventory, produces resumable `staging/{source}.jsonl` with `.audit.json`
- [ ] Phase 6: `.../crawl-plans/{source}/crawl-report.md` committed with verdict PASS (fetch ≥95%, parse ≥99%, all required fields at 100% yield, all applicable landmarks present)

For SRC-004 (exempt):
- [ ] `.spec/prds/curation-hardening/crawl-plans/curvature_discovery/README.md` committed with one-line pointer to the source file location and provenance note

**Calibration gate cascade risk:** Rider Magazine 50 Best (SRC-006) is the upstream supplier of Epic 8's calibration ground truth. If SRC-006's crawl plan is sloppily executed or the verdict is softened to PASS WITH ISSUES, Epic 8's calibration gate becomes noise and the entire scoring-realignment work is compromised. Epic 4's protocol compliance is Epic 8's insurance policy. Do not proceed past SRC-006 without a PASS verdict on its crawl-report.md.

**Note on BASE-009 references:** BASE-009 was split into BASE-009a (framework + MR) and BASE-009b (BBR + baseline regeneration) on 2026-04-13 evening for risk isolation. All references to "BASE-009" in Epic 4 task files should be read as "BASE-009a/b"; Epic 4 depends on BASE-009b (the final remediation task in Epic 2) being complete before any Epic 4 task starts. **✅ COMPLETED 2026-04-14** — BASE-009a/b both complete. See `epic-02-baseline-pipeline-validation/DECISIONS.md` "Crawl Plan Protocol adoption" split sub-section and [Epic 02 RETRO](../epic-02-baseline-pipeline-validation/RETRO.md) for evidence.

---

## Human Test Steps

After all 3 tasks are complete, an administrator should be able to run the full pipeline with these sources and verify:

1. **Run Scenic Byways ingestion** — Execute `python -m scripts.curation.pipeline.sources.scenic_byways`. Verify `scenic_byways.jsonl` contains ~799 routes with `location` (GeoJSON Point), `name`, `state`, `designation`, `description`. Check runtime < 60s. Spot-check 10 routes for valid coordinates.
2. **Verify reconciliation against existing FHWA** — Inspect the reconciliation log. Confirm the ~645 existing FHWA routes from Epic 02 baseline (BASE-000) AND the ~2,084 MotorcycleRoads + ~2,817 BestBikingRoads routes from Epic 03 are correctly reconciled. Scenic Byways GIS geometry should be preferred on overlap. No duplicates in final output.
3. **Run Rider Magazine ingestion** — Execute `python -m scripts.curation.pipeline.sources.rider_mag`. Verify all 50 routes are ingested, each tagged `ground_truth=true`, `ground_truth_source="rider_magazine_50_best"`, with editorial descriptions preserved.
4. **Run curvature discovery** — Execute `python -m scripts.curation.pipeline.sources.curvature_discovery`. Verify top 5% curvature roads are extracted from pre-computed adamfranco/curvature output. Verify routes already in catalog (by name+state) are excluded from candidates. Verify all surfaced candidates have `primary_archetype="twisties"` and populated `curvature_score`.
5. **Run Haiku extraction on new routes** — Pipe the Rider Mag descriptions + curvature candidates through `extraction/client.py`. Verify Pydantic schema compliance; Rider Mag routes should produce rich attribute extraction (Tail of the Dragon curvature high, scenery high); curvature-only routes may have thin extraction results.
6. **Run composite scoring** — Execute `scoring/composite.py` on the ingested routes. Verify `composite_score` ranges from 0-1 and top-scored routes match editorial reputation (Rider Mag routes should dominate top 10). Curvature-discovered routes should score high on `curvature_score` component.
7. **Run archetype classification** — Execute `classification/archetype.py`. Verify Scenic Byways get `scenic_byway`, curvature candidates get `twisties`, and Rider Mag routes distribute across archetypes appropriately.
8. **Run Convex push (dev deployment)** — Execute `python -m scripts.curation.pipeline.sync.convex_push`. Verify new routes appear in Convex dashboard with `source` field set correctly (`scenic_byways_gis`, `rider_magazine`, `curvature_discovery`). Verify `location` GeoJSON Point serialized.
9. **Verify in mobile app** — Open mobile discovery screen. Verify new routes appear on the map. Tap a Rider Mag route — see editorial description in route details. Curvature discoveries should appear as "hidden gem" twisties.

10. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Applicable steps for Epic 4: 1 (ALL existing sources + 3 new: Scenic Byways, Rider Mag, curvature_discovery), 2, 6, 7, 8, 12. **Diff against Epic 3 baseline — catalog should grow by ~450-1850 routes (799 Scenic Byways - significant overlap with Epic 2's ~645 DOT baseline + 50 Rider Mag + 250-1650 curvature candidates). Verify archetype distribution shifts reflect new sources (more scenic_byway, more twisties). Ground-truth spot check: Rider Mag 50 routes should all appear; Tail of the Dragon may appear via both BBR and curvature_discovery — expect duplicate pre-dedup (dedup happens in Epic 6).** Write `review.md` with verdict PASS. **Note (2026-04-13):** growth estimate revised — the Epic 2 baseline is ~645 routes (not 184), so Koordinates' net contribution after reconciliation is smaller than originally projected. See `../epic-02-baseline-pipeline-validation/DECISIONS.md`.

All 10 verifications must pass. If a source crashes, debug and fix before proceeding.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/sources/scenic_byways.py` implemented with 799-route ingestion
- [ ] `scripts/curation/pipeline/sources/rider_mag.py` implemented with `ground_truth` tagging
- [ ] `scripts/curation/pipeline/sources/curvature_discovery.py` implemented with top 5% filtering
- [ ] Scenic Byways reconciles against the Epic 2 baseline FHWA CSV (~645 routes from DOT ArcGIS via BASE-000, Koordinates GIS geometry preferred on overlap). See `../epic-02-baseline-pipeline-validation/DECISIONS.md`.
- [ ] Rider Mag ingestion validates all 50 routes ingested (no partial)
- [ ] Curvature excludes already-cataloged routes by name+state match
- [ ] Curvature candidates tagged `primary_archetype="twisties"` with populated `curvature_score`
- [ ] All 3 sources write to JSONL staging before Convex upsert
- [ ] Ingestion logs count per source + validation errors
- [ ] Each source runs through full pipeline (extract → score → classify → push)
- [ ] New routes visible in mobile app discovery
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + updated `baseline/catalog.jsonl` committed
- [ ] Catalog diff vs Epic 03 baseline shows expected growth (~450-1850 net-new routes after reconciliation: 799 Scenic Byways - ~645 FHWA overlap + 50 Rider Mag + 250-1650 curvature candidates)

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

- Scenic Byways GIS overlaps significantly with the Epic 2 baseline FHWA CSV (~645 routes from DOT ArcGIS) — reconciliation is critical to avoid duplicates. The net-new volume from Koordinates is modest (799 total vs ~645 baseline); the primary value is higher-fidelity route polyline geometry and scenic-qualities metadata that the DOT layer does not expose. See `../epic-02-baseline-pipeline-validation/DECISIONS.md` for the 2026-04-13 revision.
- Rider Mag 50 is tagged `ground_truth=true` — Epic 8 uses these for calibration gate
- Curvature discovery consumes PRE-COMPUTED adamfranco/curvature output (AD-008) — do NOT run the multi-hour OSM PBF processing in the pipeline
- The adamfranco/curvature output file location must be documented in `.spec/prds/curation-hardening/09-technical-requirements.md` before SRC-004 starts
- Source runtime targets: Scenic Byways < 60s, Rider Mag < 10s, curvature filter < 5 min
- If Scenic Byways API (Koordinates) has stability issues, fall back to a cached download stored in the repo's data/ directory (outside git LFS threshold)
- **Revision history:** 2026-04-12 — Epic absorbed SRC-004 from the deleted Epic 5 (Community + Geometric). USFS MVUM (SRC-005) was removed from this epic in the same revision (see PRD `01-scope.md` Dropped section).
