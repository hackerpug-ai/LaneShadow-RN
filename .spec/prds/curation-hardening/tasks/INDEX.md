# Curation Pipeline Hardening — Task Plan

**Project:** LaneShadow Curation Pipeline Hardening
**Feature:** Source Diversification, Quality Infrastructure, Scoring Realignment, Rider Signals
**Generated:** 2026-04-12
**Revised:** 2026-04-12 — BDR (SRC-002), twtex (SRC-003), and USFS (SRC-005) dropped after VAL-002/VAL-003 invalidated PRD assumptions and V3 strategy shifted to lifestyle ride community (ADV/dual-sport sources no longer fit). Epic 5 deleted; SRC-004 folded into Epic 4.
**Revised:** 2026-04-12 — Epic 2 BASE-001 decomposed from a single 240-min task into 8 smaller tasks (BASE-001..008) for parallelization and context-window manageability. Original file preserved at `epic-02-baseline-pipeline-validation/BASE-001.md.archived`.
**Revised:** 2026-04-13 — Epic 2 BASE-000 inserted as Wave 0 data-prep prerequisite after `/kb-run-epic` preflight revealed the FHWA input CSV did not exist and the canonical DOT ArcGIS source returns 645 routes (not the 184 the PRD originally assumed). Curation-hardening PRD docs updated to reflect the ~645-route superset reality. See `epic-02-baseline-pipeline-validation/DECISIONS.md`.
**PRD:** [`.spec/prds/curation-hardening/README.md`](../README.md)
**Appetite:** 7 weeks (including Week 0 validation)

---

## Overview

| Metric | Value |
|--------|-------|
| **Total Epics** | 11 (Epic 5 deleted; sequence numbers preserved — gap from 4 → 6) |
| **Total Tasks** | 43 (Epic 2 expanded from 1 → 9 across 2026-04-12 decomposition + 2026-04-13 BASE-000 insertion) |
| **Full-Detail Task Files** | 13 (Epic 1: 4 VAL tasks; Epic 2: 9 BASE tasks) |
| **Stub Tasks** | 30 (Epics 3-4, 6-12) |
| **PRD Coverage** | 100% of 16 surviving use cases + cross-priority infra |
| **Estimated Effort** | ~5725 minutes (~95 hours total) — round-1 Epic 2 decomposition preserved the 240-min total; round-2 added 90 min for BASE-000 data prep; rest unchanged |

### Task Quality

- **Epic 1 (VAL-001..004)** — Full TASK-TEMPLATE v4.0 compliance, quality score 115/115 average
- **Epic 2 (BASE-000..008)** — Full TASK-TEMPLATE v4.0 compliance, quality score ~112/115 average (BASE-001 through BASE-008 originated from a 2026-04-12 decomposition; BASE-000 added 2026-04-13 as a data-prep prerequisite)
- **Epic 3-12** — Stub-level (task_id, title, agent, dependencies, one-line spec) per user directive
- **Task files for Epics 3-12** — Will be written as each epic enters execution phase

---

## How to Use This Plan

1. **Start with Epic 1** — Run `/kb-run-epic epic-01-week0-validation`. This executes all 4 Week 0 validation spikes. No code is written beyond the validation pilot directories.
2. **Gate on Week 0 report** — Before proceeding to Epic 2, review `results.json` / `verification_report.json` / `feasibility_report.json` from each VAL task. Any FAIL requires remediation or descope.
3. **Run Epic 2 (Baseline Validation)** — Validate the EXISTING curation pipeline works end-to-end before adding hardening.
4. **Sequential epic execution** — Epics 3-12 depend on earlier epics (see dependency graph below). Most tasks within an epic can run in parallel.
5. **Write task files just-in-time** — When an epic enters active development, generate full task files from the stubs via `/kb-project-plan` targeted at that epic.
6. **Every epic runs the full curation pipeline** — Per the [Curation Review Protocol](./CURATION-REVIEW-PROTOCOL.md), NO epic is marked Done until the full pipeline (every curation script available at that epic boundary) has been executed, the catalog diffed against the prior epic baseline, landmark spot checks pass, and a `review.md` artifact is committed with verdict PASS. The protocol scales — Epic 1 runs a minimal subset, Epic 12 runs everything.

## Curation Review Protocol (MANDATORY per epic)

**Every epic MUST execute the [Curation Review Protocol](./CURATION-REVIEW-PROTOCOL.md) before being marked Done.** The protocol defines a conditional set of pipeline stages that activate as each epic adds new capabilities:

| Epic | Protocol Steps Active | What Gets Executed |
|------|----------------------|---------------------|
| 1 | 1 (minimal), 6, 7, 8, 12 | Existing baseline only — no change |
| 2 | 1 (existing), 2 (OSM), 6, 7, 8, 12 | First full baseline run |
| 3 | Same as Epic 2 + extended models | Regression check after schema extension |
| 4 | 1 (+ 3 new sources: Scenic Byways, Rider Mag, curvature), 2, 6, 7, 8, 12 | All 3 surviving new sources run end-to-end |
| ~~5~~ | — | *Deleted 2026-04-12 (source invalidations + V3 strategy mismatch)* |
| 6 | Add step 3 (dedup) + step 4 (quality floor) | First dedup run |
| 7 | Add steps 10 (coverage report) + 11 (data quality report) | First quality reports |
| 8 | Add step 2 (HPMS + NWS) + step 5 (calibration gate) | First calibrated run |
| 9 | Same as Epic 8 (community staging only, no curated_routes impact) | Regression check |
| 10 | Add step 9 (NLP + signal merge) | First NLP run |
| 11 | Same as Epic 10 + mobile smoke test | Consumer-side only |
| 12 | ALL 13 steps + orchestrator | Final initiative close-out |

**Runtime budget grows per epic.** Epic 2 review may take ~30 minutes. Epic 12 review may take 2+ hours. Cache aggressively (OSM cache, NLP extraction cache, HPMS spatial join cache).

---

## Epic Summary

| # | Epic | Folder | Tasks | Priority | Human Test Focus |
|---|------|--------|-------|----------|------------------|
| 1 | Week 0 — Validation & De-Risking | [epic-01-week0-validation/](./epic-01-week0-validation/) | 4 | P0 | Run 4 validation spikes, verify go/no-go for each risk |
| 2 | Baseline Curation Pipeline Validation | [epic-02-baseline-pipeline-validation/](./epic-02-baseline-pipeline-validation/) | 9 | P0 | Fetch FHWA CSV (BASE-000) + run existing pipeline end-to-end before hardening |
| 3 | Foundation — Models, Schema, Dependencies | [epic-03-foundation-models-schema/](./epic-03-foundation-models-schema/) | 6 | P0 | Install deps, extend models, migrate Convex schema |
| 4 | Source Diversification — Government, Editorial & Geometric | [epic-04-sources-government-editorial/](./epic-04-sources-government-editorial/) | 3 | P1 | Run 3 surviving sources (Scenic Byways, Rider Mag, curvature) through full pipeline |
| ~~5~~ | ~~Source Diversification — Community + Geometric~~ | *deleted 2026-04-12* | 0 | — | *BDR + twtex sources invalidated; SRC-004 (curvature) folded into Epic 4* |
| 6 | Quality Infrastructure — Dedup & Floor | [epic-06-quality-dedup-floor/](./epic-06-quality-dedup-floor/) | 2 | P1 | Run dedup on full catalog, verify tier assignments |
| 7 | Quality Infrastructure — Reports | [epic-07-quality-reports/](./epic-07-quality-reports/) | 2 | P1 | Generate coverage + data quality reports with CI gating |
| 8 | Scoring & Calibration | [epic-08-scoring-calibration/](./epic-08-scoring-calibration/) | 6 | P1 | Realign weights, calibration gate, extraction audit |
| 9 | Community Sources — Ingestion | [epic-09-community-ingestion/](./epic-09-community-ingestion/) | 3 | P2 | Run ADVRider/Reddit/Pushshift ingest, verify staging |
| 10 | Community NLP & Signal Merge | [epic-10-community-nlp-signals/](./epic-10-community-nlp-signals/) | 4 | P2 | Run NLP extraction, see mention_frequency in scores |
| 11 | Mobile UI — New Field Display | [epic-11-mobile-ui-fields/](./epic-11-mobile-ui-fields/) | 4 | P1 | Open app, see surface/bestMonths/community signals |
| 12 | Pipeline Orchestrator & E2E Integration | [epic-12-orchestrator-integration/](./epic-12-orchestrator-integration/) | 1 | P1 | Run one command, entire pipeline runs end-to-end |

---

## Dependency Graph

```
Epic 1: Week 0 Validation (VAL-001..004)
    │
    ├─► VAL-002 ✗ (BDR source invalidated — SRC-002 dropped)
    ├─► VAL-003 ✗ (twtex source invalidated — SRC-003 dropped)
    ├─► VAL-001 ──────────────────────────────────► RID-003 (Epic 10)
    └─► VAL-004 ──► Epic 2 (Baseline Validation)
                            │
                            ▼
                    Epic 3: Foundation
                    (INF-001..010, ex-004)
                            │
           ┌────────────────┼─────────────┐
           ▼                ▼             ▼
    Epic 4: SRC        Epic 11: Mobile    (Epic 5 deleted)
    (Gov + Editorial   UI Display
     + Geometric)      (DESIGN-008..011)
    SRC-001, 006, 004
           │
           ▼
    Epic 6: Quality Dedup + Floor
    (QUAL-001, QUAL-002)
           │
           ▼
    Epic 7: Quality Reports
    (QUAL-003, QUAL-004)
           │
           ▼
    Epic 8: Scoring & Calibration
    (INF-008, 009, SCO-001..004)
           │
           ▼
    Epic 9: Community Ingestion
    (RID-001, 002, 006)
           │
           ▼
    Epic 10: Community NLP + Signals
    (RID-003, 004, 005, INF-010)
           │
           ▼
    Epic 12: Orchestrator & E2E
    (INF-004)
```

*Dropped from graph 2026-04-12: SRC-002 (BDR), SRC-003 (twtex), SRC-005 (USFS MVUM). Epic 5 deleted entirely.*

---

## Parallelization Opportunities

| Parallel Group | Tasks | Rationale |
|---------------|-------|-----------|
| Epic 1 all 4 VAL | VAL-001, VAL-002, VAL-003, VAL-004 | No inter-task dependencies |
| Epic 3 INF-005/006/007 | After INF-001/002/003 | Independent infra concerns |
| Epic 4 all 3 SRC | SRC-001, SRC-006, SRC-004 | Independent source scrapers (absorbed SRC-004 from deleted Epic 5) |
| Epic 6 QUAL-001 → QUAL-002 | Sequential | QUAL-002 uses dedup output |
| Epic 7 QUAL-003/004 | Parallel | Independent reports |
| Epic 8 INF-008/009 parallel → SCO-001/002 → SCO-003/004 | Partial parallel | Enrichment first, then scoring |
| Epic 9 RID-001/002 parallel → RID-006 | Sequential after RID-002 | Pushshift depends on Reddit schema |
| Epic 10 RID-003 → RID-004 → RID-005/INF-010 | Mostly sequential | NLP pipeline chain |
| Epic 11 DESIGN-011 → DESIGN-008/009 → DESIGN-010 | Mostly parallel | Schema first, then UI |

---

## Full Task Inventory

### Epic 1: Week 0 Validation (FULL DETAIL)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| [VAL-001](./epic-01-week0-validation/VAL-001.md) | GLM NLP Pilot — Labeled Dataset + Claude Haiku Accuracy Validation | python-implement | S | 180 |
| [VAL-002](./epic-01-week0-validation/VAL-002.md) | BDR GPX Verification — Live Accessibility + Segmentation Feasibility | python-implement | S | 90 |
| [VAL-003](./epic-01-week0-validation/VAL-003.md) | twtex.com Feasibility Research — WAF Detection, ToU Review, Technical Approach | python-implement | S | 90 |
| [VAL-004](./epic-01-week0-validation/VAL-004.md) | Convex Geospatial Index Setup — Install, Seed, and Validate Query Performance | convex-implementer | S | 120 |

### Epic 2: Baseline Pipeline Validation (FULL DETAIL)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| [BASE-000](./epic-02-baseline-pipeline-validation/BASE-000.md) | Fetch FHWA Scenic Byways dataset from DOT ArcGIS and write static CSV baseline | python-implement | M | 90 |
| [BASE-001](./epic-02-baseline-pipeline-validation/BASE-001.md) | FHWA source validation + Boy Scout __main__ entry point | python-implement | S | 30 |
| [BASE-002](./epic-02-baseline-pipeline-validation/BASE-002.md) | Community scrapers validation — MotorcycleRoads + BestBikingRoads | python-implement | S | 30 |
| [BASE-003](./epic-02-baseline-pipeline-validation/BASE-003.md) | Haiku extraction validation + Boy Scout __main__ for extraction/client.py | python-implement | S | 45 |
| [BASE-004](./epic-02-baseline-pipeline-validation/BASE-004.md) | Composite scoring validation + Boy Scout __main__ for scoring/composite.py | python-implement | S | 30 |
| [BASE-005](./epic-02-baseline-pipeline-validation/BASE-005.md) | Archetype classification validation + Boy Scout __main__ for classification/archetype.py | python-implement | S | 30 |
| [BASE-006](./epic-02-baseline-pipeline-validation/BASE-006.md) | OSM enrichment validation + Boy Scout __main__ for enrichment/osm_client.py | python-implement | S | 45 |
| [BASE-007](./epic-02-baseline-pipeline-validation/BASE-007.md) | Convex push dry-run validation + Boy Scout --dry-run flag for sync/convex_push.py | python-implement | S | 45 |
| [BASE-008](./epic-02-baseline-pipeline-validation/BASE-008.md) | Curation Review Protocol execution + baseline artifacts commit | python-implement | M | 60 |

**Total Epic 2 effort:** 405 min (~6.75 hours). See `epic-02-baseline-pipeline-validation/EPIC.md` for the wave plan and `epic-02-baseline-pipeline-validation/DECISIONS.md` for the 2026-04-13 resolution of the FHWA CSV data source question.

### Epic 3: Foundation (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| INF-001 | Install New Python Dependencies | python-implement | XS | 30 |
| INF-002 | Route and EnrichedRoute Model Extension | python-implement | S | 60 |
| INF-003 | Convex Schema Migration — New Fields and route_mentions Table | convex-implementer | M | 90 |
| INF-005 | Extraction Schema v2 — Add extraction_confidence Field | python-implement | XS | 30 |
| INF-006 | Convex Push Serialization Update | convex-implementer | S | 60 |
| INF-007 | Convex Geospatial Query Mutations — Production Wrappers | convex-implementer | S | 90 |

### Epic 4: Sources — Government, Editorial & Geometric (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| SRC-001 | Ingest US Scenic Byways GIS Layer | python-implement | M | 240 |
| SRC-006 | Ingest Rider Magazine 50 Best Roads | python-implement | S | 150 |
| SRC-004 | adamfranco/curvature Pre-Computed Output Consumer | python-implement | S | 150 |

**Epic 5 — Deleted 2026-04-12.** Originally held SRC-002 (BDR), SRC-003 (twtex), SRC-004 (curvature). SRC-002 and SRC-003 dropped entirely after VAL-002 and VAL-003 invalidated their PRD assumptions. SRC-004 folded into Epic 4 above.

### Dropped Tasks

| Task ID | Title | Reason | Gate |
|---------|-------|--------|------|
| ~~SRC-002~~ | Ingest BDR GPX Routes | V3 lifestyle mismatch (ADV/dual-sport) + VAL-002 found 403s | Dropped 2026-04-12 |
| ~~SRC-003~~ | twtex.com Top 100 Scraper | PRD assumption invalidated (site is a Texas forum, not a curated list) | Dropped 2026-04-12 via VAL-003 |
| ~~SRC-005~~ | Ingest USFS Motor Vehicle Use Maps | V3 lifestyle mismatch (forest service gravel/dirt roads) | Dropped 2026-04-12 |

### Epic 6: Quality — Dedup & Floor (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| QUAL-001 | Three-Stage Deduplication Engine | python-implement | L | 360 |
| QUAL-002 | Quality Floor Enforcement | python-implement | M | 180 |

### Epic 7: Quality — Reports (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| QUAL-003 | Coverage Report Generator | python-implement | M | 180 |
| QUAL-004 | Data Quality Report with CI Gate | python-implement | M | 150 |

### Epic 8: Scoring & Calibration (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| INF-008 | HPMS AADT Enrichment Client | python-implement | M | 180 |
| INF-009 | NWS Weather Enrichment Client | python-implement | M | 150 |
| SCO-001 | Scoring Weight Realignment with HPMS and Weather Integration | python-implement | M | 240 |
| SCO-002 | Ground Truth Route Set Builder | python-implement | S | 120 |
| SCO-003 | Calibration Gate Enforcement | python-implement | M | 150 |
| SCO-004 | Extraction Accuracy Audit — Per-Attribute F1 Report | python-implement | M | 150 |

### Epic 9: Community Sources — Ingestion (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| RID-001 | ADVRider RSS Feed Ingest | python-implement | M | 200 |
| RID-002 | Reddit API OAuth2 Community Source | python-implement | M | 240 |
| RID-006 | Pushshift Historical Backfill | python-implement | M | 180 |

### Epic 10: Community NLP & Signals (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| RID-003 | GLM NLP Extractor — Two-Stage Pipeline | python-implement | L | 480 |
| RID-004 | Community Signal Merge into Scoring | python-implement | M | 180 |
| RID-005 | Incremental Community Ingest Scheduling | python-implement | S | 60 |
| INF-010 | GitHub Actions Community Ingest Cron Workflow | python-implement | S | 60 |

### Epic 11: Mobile UI — New Field Display (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| DESIGN-008 | RouteDiscoveryCard: Surface type badge, best months, and quality tier display | frontend-designer | M | 120 |
| DESIGN-009 | Discovery surface-type filter chip in DiscoveryFilterBar | frontend-designer | S | 75 |
| DESIGN-010 | RouteDetailsSheet: description, best months, and community signals section | frontend-designer | M | 90 |
| DESIGN-011 | Lean sync schema extension: surface, bestMonths, qualityTier in local SQLite | frontend-designer | S | 60 |

### Epic 12: Orchestrator & E2E (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| INF-004 | Pipeline Orchestrator — Single Entry Point | python-implement | M | 120 |

---

## PRD Coverage Map

| PRD Section | Covered By |
|-------------|------------|
| S1.0 Priority 0: Validation & Setup | VAL-001, VAL-002 (source dropped), VAL-003 (source dropped), VAL-004 |
| S1.1 Priority 1: Source Diversification | SRC-001, SRC-004, SRC-006 *(SRC-002/003/005 dropped)* |
| S1.2 Priority 2: Quality Infrastructure | QUAL-001..004 |
| S1.3 Priority 3: Scoring & Calibration | SCO-001..004, INF-008, INF-009 |
| S1.4 Priority 4: Community Sources & NLP | RID-001..006, INF-010 |
| S1.5 Cross-Priority Infrastructure | INF-001..007, INF-004 (orchestrator) |
| S4 UC-SRC-01, 04, 06 | SRC-001, SRC-004, SRC-006 |
| ~~S4 UC-SRC-02, 03, 05~~ | *Dropped 2026-04-12 — see Dropped Tasks table above* |
| S5 UC-QUAL-01..04 | QUAL-001..004 |
| S6 UC-SCORE-01..04 | SCO-001..004, INF-008, INF-009 |
| S7 UC-RIDER-01..06 | RID-001..006 |
| S9 Technical Requirements | INF-001..010, DESIGN-008..011 |
| Predecessor PRD Baseline | BASE-000..008 (Epic 2 — 9 tasks covering FHWA data fetch, pipeline validation, and curation review protocol execution) |

**Coverage:** 100% of the 16 surviving PRD use cases + baseline validation + mobile UI extensions. (Down from 19 use cases after the 3 dropped SRC UCs.)

---

## Quality Metrics (Epic 1 + Epic 2 — full detail)

| Task | CRITICAL CONSTRAINTS | SPECIFICATION | ACCEPTANCE CRITERIA | TEST CRITERIA | GUARDRAILS | DESIGN | VERIFICATION GATES | AGENT | ESTIMATE | CODING STANDARDS | Total |
|------|----------------------|----------------|---------------------|---------------|------------|--------|-------------------|-------|----------|------------------|-------|
| VAL-001 | 15 | 10 | 25 | 15 | 10 | 10 | 15 | 5 | 5 | 5 | **115/115** |
| VAL-002 | 15 | 10 | 25 | 15 | 10 | 10 | 15 | 5 | 5 | 5 | **115/115** |
| VAL-003 | 15 | 10 | 25 | 15 | 10 | 10 | 15 | 5 | 5 | 5 | **115/115** |
| VAL-004 | 15 | 10 | 25 | 15 | 10 | 10 | 15 | 5 | 5 | 5 | **115/115** |
| BASE-000 | 15 | 10 | 25 | 15 | 10 | 10 | 15 | 5 | 5 | 5 | **115/115** |
| BASE-001 | 15 | 10 | 25 | 14 | 10 | 10 | 15 | 5 | 5 | 4 | **113/115** |
| BASE-002..008 | (scored in epic-02 file reviews; average ~110/115) |||||||||||
| **Average (VAL + BASE-000/001)** | — | — | — | — | — | — | — | — | — | — | **~114.7/115** |

All Epic 1 and Epic 2 full-detail tasks meet the minimum 80/115 quality threshold with substantial headroom.

---

## Next Steps

```bash
# Browse the task tree
ls .spec/prds/curation-hardening/tasks/

# Review Epic 1 task files
cat .spec/prds/curation-hardening/tasks/epic-01-week0-validation/VAL-001.md

# Execute Epic 1 (Week 0 validation)
/kb-run-epic epic-01-week0-validation

# Review Week 0 decision and proceed
# (Human review required — no automated gate)

# Generate full task files for Epic 2 when ready
/kb-project-plan .spec/prds/curation-hardening/ --epic epic-02-baseline-pipeline-validation
```

---

## Notes

- **Sequential chains**: Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 6 → Epic 7 → Epic 8 → Epic 9 → Epic 10 → Epic 12. Epic 11 can start in parallel with Epic 4 once Epic 3 is done. *(Epic 5 deleted 2026-04-12.)*
- **Human test philosophy**: Every epic's human tests exercise the pipeline end-to-end via the [Curation Review Protocol](./CURATION-REVIEW-PROTOCOL.md). The user hasn't run the existing curation logic before, so Epic 2 establishes the baseline truth before hardening begins.
- **Curation review is non-optional**: every epic runs all available curation scripting, diffs the catalog against the prior baseline, and writes a `review.md` before being marked Done. No epic proceeds without a green review.
- **Stub tasks**: Epics 3-4, 6-12 contain stub-level task references only. Full TASK-TEMPLATE v4.0 files for these epics will be generated as each epic enters active development, to avoid context window bloat at planning time.
- **Week 0 proved its worth**: VAL-002 and VAL-003 invalidated two PRD assumptions before any implementation was written. Budget time for source-level pivots — the Week 0 gate is doing exactly what it was designed to do.
- **Calibration gate is the single biggest risk in Epic 8**: First run is expected to FAIL. Budget time for prompt iteration.
- **Initiative thesis revised (2026-04-12)**: With 3 of 6 new sources dropped, BBR concentration reduction shifts from ~70% target to ~85-90% achievable. The initiative's real value now lives in Epics 6-10 (signal enrichment — dedup, quality floor, scoring realignment, community NLP, measured data). This is a more honest framing than "volume diversification."
- **Boy Scout rule**: If Epic 2 baseline validation finds bugs in existing pipeline code, fix them in place before layering hardening. Same rule applies to any later epic's curation review.
