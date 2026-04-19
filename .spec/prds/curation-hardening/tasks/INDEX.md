# Curation Pipeline Hardening — Task Plan

**Project:** LaneShadow Curation Pipeline Hardening
**Feature:** Source Diversification, Quality Infrastructure, Scoring Realignment, Rider Signals
**Generated:** 2026-04-12
**Revised:** 2026-04-12 — BDR (SRC-002), twtex (SRC-003), and USFS (SRC-005) dropped after VAL-002/VAL-003 invalidated PRD assumptions and V3 strategy shifted to lifestyle ride community (ADV/dual-sport sources no longer fit). Sprint 5 deleted; SRC-004 folded into Epic 4.
**Revised:** 2026-04-12 — Epic 2 BASE-001 decomposed from a single 240-min task into 8 smaller tasks (BASE-001..008) for parallelization and context-window manageability. Original file preserved at `epic-02-baseline-pipeline-validation/BASE-001.md.archived`.
**Revised:** 2026-04-13 — Epic 2 BASE-000 inserted as Wave 0 data-prep prerequisite after `/kb-run-epic` preflight revealed the FHWA input CSV did not exist and the canonical DOT ArcGIS source returns 645 routes (not the 184 the PRD originally assumed). Curation-hardening PRD docs updated to reflect the ~645-route superset reality. See `epic-02-baseline-pipeline-validation/DECISIONS.md`.
**Revised:** 2026-04-13 (evening) — BASE-009 inserted as Epic 2 Wave 6 remediation task. [`tasks/CRAWL-PLAN-PROTOCOL.md`](./CRAWL-PLAN-PROTOCOL.md) adopted as mandatory pre-extraction gate for all source tasks (Forms A/B/C/D; Form E pre-computed file consumers exempt). New pipeline principle **P6** added to `00-overview.md` ("Committed crawl plan before extraction at scale"). Step 1 of `CURATION-REVIEW-PROTOCOL.md` upgraded to require a committed verdict-PASS `crawl-report.md` per in-scope source. See `epic-02-baseline-pipeline-validation/DECISIONS.md` "Crawl Plan Protocol adoption" for the full rationale.
**Revised:** 2026-04-16 — Sprint 11 (Mobile UI — New Field Display) deferred to native-rewrite PRD (`.spec/prds/native-rewrite/07-native-app-backlog.md`). Client transitioning to native Kotlin/Swift; React Native UI work would be throwaway. Pipeline still produces all data fields — only the consumption layer is deferred. Task count 45→41, sprints 11→10. Path references updated from `convex/` to `server/convex/` for parallel execution with native-rewrite restructure.
**PRD:** [`.spec/prds/curation-hardening/README.md`](../README.md)
**Appetite:** 7 weeks (including Week 0 validation)

---

## Overview

| Metric | Value |
|--------|-------|
| **Total Sprints** | 10 (Sprint 5 deleted; Sprint 11 deferred 2026-04-16 to native-rewrite; sequence numbers preserved — gaps at 5 and 11) |
| **Total Tasks** | 41 (Epic 2 expanded from 1 → 11 across 2026-04-12 decomposition + 2026-04-13 AM BASE-000 insertion + 2026-04-13 PM BASE-009 Crawl Plan Protocol remediation split into BASE-009a + BASE-009b; Sprint 11's 4 DESIGN tasks deferred 2026-04-16) |
| **Full-Detail Task Files** | 15 (Epic 1: 4 VAL tasks; Epic 2: 11 BASE tasks) |
| **Stub Tasks** | 26 (Epics 3-4, 6-10, 12) |
| **PRD Coverage** | 100% of 16 surviving use cases + cross-priority infra (mobile UI consumption deferred to native-rewrite) |
| **Estimated Effort** | ~6010 minutes (~100.2 hours total) — round-1 Epic 2 decomposition preserved the 240-min total; round-2 (2026-04-13 AM) added 90 min for BASE-000 data prep; round-3 (2026-04-13 PM) added 480 min for BASE-009 Crawl Plan Protocol remediation; round-4 (2026-04-13 PM) split BASE-009 into BASE-009a (270 min) + BASE-009b (300 min), adding 90 min of split overhead for risk isolation; round-5 (2026-04-13 PM, later same evening) revised BASE-009a upward to 330 min after Phase 0 recon corrected the MR route universe from 300-1000 to ~2,044 routes; round-6 (2026-04-16) subtracted 345 min for deferred Sprint 11 (DESIGN-008..011) |

### Task Quality

- **Epic 1 (VAL-001..004)** — Full TASK-TEMPLATE v4.0 compliance, quality score 115/115 average
- **Epic 2 (BASE-000..009b)** — Full TASK-TEMPLATE v4.0 compliance, quality score ~112/115 average (BASE-001 through BASE-008 originated from a 2026-04-12 decomposition; BASE-000 added 2026-04-13 AM as a data-prep prerequisite; BASE-009 added 2026-04-13 PM as a Crawl Plan Protocol remediation task and same-evening split into BASE-009a [framework + MR, 270 min] + BASE-009b [BBR + baseline regeneration + review.md verdict upgrade, 300 min] for risk isolation — see `tasks/CRAWL-PLAN-PROTOCOL.md` and the "Crawl Plan Protocol adoption" decision in Epic 2 DECISIONS.md)
- **Epic 3-4 + Sprint 5-12** — Stub-level (task_id, title, agent, dependencies, one-line spec) per user directive
- **Task files for Epic 3-4 + Sprint 5-12** — Will be written as each sprint enters execution phase

---

## How to Use This Plan

1. **Start with Epic 1** — Run `/kb-run-epic epic-01-week0-validation`. This executes all 4 Week 0 validation spikes. No code is written beyond the validation pilot directories.
2. **Gate on Week 0 report** — Before proceeding to Epic 2, review `results.json` / `verification_report.json` / `feasibility_report.json` from each VAL task. Any FAIL requires remediation or descope.
3. **Run Epic 2 (Baseline Validation)** — Validate the EXISTING curation pipeline works end-to-end before adding hardening.
4. **Sequential sprint execution** — Epic 3-4 and Sprint 6-10/12 depend on earlier planning artifacts (see dependency graph below). Most tasks within a sprint can run in parallel. Sprint 11 (Mobile UI) has been deferred to the native-rewrite PRD.
5. **Write task files just-in-time** — When a sprint enters active development, generate full task files from the stubs via `/kb-project-plan` targeted at that sprint.
6. **Every sprint runs the full curation pipeline** — Per the [Curation Review Protocol](./CURATION-REVIEW-PROTOCOL.md), no sprint is marked Done until the full pipeline (every curation script available at that sprint boundary) has been executed, the catalog diffed against the prior sprint baseline, landmark spot checks pass, and a `review.md` artifact is committed with verdict PASS. The protocol scales — Epic 1 runs a minimal subset, Sprint 12 runs everything.

## Curation Review Protocol (MANDATORY per sprint)

**Every sprint MUST execute the [Curation Review Protocol](./CURATION-REVIEW-PROTOCOL.md) before being marked Done.** The protocol defines a conditional set of pipeline stages that activate as each sprint adds new capabilities:

| Sprint | Protocol Steps Active | What Gets Executed |
|------|----------------------|---------------------|
| 1 | 1 (minimal), 6, 7, 8, 12 | Existing baseline only — no change |
| 2 | 1 (existing), 2 (OSM), 6, 7, 8, 12 | First full baseline run |
| 3 | Same as Epic 2 + extended models | Regression check after schema extension |
| 4 | 1 (+ 3 new sources: Scenic Byways, Rider Mag, curvature), 2, 6, 7, 8, 12 | All 3 surviving new sources run end-to-end |
| ~~5~~ | — | *Deleted 2026-04-12 (source invalidations + V3 strategy mismatch)* |
| 6 | Add step 3 (dedup) + step 4 (quality floor) | First dedup run |
| 7 | Add steps 10 (coverage report) + 11 (data quality report) | First quality reports |
| 8 | Add step 2 (HPMS + NWS) + step 5 (calibration gate) | First calibrated run |
| 9 | Same as Sprint 8 (community staging only, no curated_routes impact) | Regression check |
| 10 | Add step 9 (NLP + signal merge) | First NLP run |
| ~~11~~ | — | *Deferred 2026-04-16 to native-rewrite PRD (React Native UI → native Kotlin/Swift)* |
| 12 | ALL 13 steps + orchestrator + Convex field verification | Final initiative close-out |

**Runtime budget grows per sprint.** Epic 2 review may take ~30 minutes. Sprint 12 review may take 2+ hours. Cache aggressively (OSM cache, NLP extraction cache, HPMS spatial join cache).

---

## Crawl Plan Protocol (MANDATORY pre-extraction gate)

**Every task that extracts data from a remote source at scale MUST produce a committed crawl plan artifact before running execution.** Enforced via [`CRAWL-PLAN-PROTOCOL.md`](./CRAWL-PLAN-PROTOCOL.md), adopted 2026-04-13 PM after Epic 2 BBR/MR "PASS WITH ISSUES" findings. The Crawl Plan Protocol is the **pre-extraction** companion to the Curation Review Protocol (which is the **post-pipeline** gate). See `epic-02-baseline-pipeline-validation/DECISIONS.md` "Crawl Plan Protocol adoption" entry for the cascade-failure rationale.

**Source modality coverage:**

| Form | Description | Sources (initiative-wide) |
|---|---|---|
| A | HTML scraper (editorial or listing pages) | MR, BBR (via BASE-009 remediation), Rider Magazine 50 Best (SRC-006) |
| B | Structured API (GIS / JSON / OpenAPI) | Scenic Byways GIS from Koordinates (SRC-001) |
| C | RSS / syndication feed | ADVRider 17 regional forums (RID-001) |
| D | Paginated authenticated API | Reddit OAuth2 (RID-002), Pushshift historical backfill (RID-006) |
| E | Pre-computed file consumer (**EXEMPT**) | FHWA CSV via BASE-000, adamfranco/curvature (SRC-004) |

**Protocol execution rhythm per source task:** Phase 0 RECON (manual, ~30-60 min) → Phase 1 INVENTORY (committed `urls.jsonl`) → Phase 2 FIXTURES (committed HTML/JSON/XML samples + manifest) → Phase 3 SELECTOR SPEC (AI-assisted, committed `selectors.yaml` with `fixture_yield` scoring) → Phase 4 DRY-RUN PARSE (committed pytest contract tests) → Phase 5 EXECUTION (rate-limited, resumable, audited) → Phase 6 ACCOUNTING (committed `crawl-report.md` with binary PASS verdict).

**Integration point with the Curation Review Protocol:** Step 1 of the review protocol requires that every in-scope source for the current sprint has a committed, verdict-PASS `crawl-report.md`. Missing or failing crawl reports fail the curation review at Step 1, blocking the sprint from being marked Done.

**First application:** [BASE-009a](./epic-02-baseline-pipeline-validation/BASE-009a.md) (framework + MotorcycleRoads) → [BASE-009b](./epic-02-baseline-pipeline-validation/BASE-009b.md) (BestBikingRoads + baseline regeneration + review.md verdict upgrade). Split by source for risk isolation: framework bugs surfaced on MR's ~30 min Phase 5 cost one re-run; the same bugs surfaced on BBR's ~3.75 hr Phase 5 would cost 3.75 hr per re-run. BASE-009a builds the shared `scripts/curation/pipeline/sources/crawl_plan/` framework module that BASE-009b + Epic 4 SRC-001/006 + Sprint 9 RID-001/002/006 subsequently consume.

---

## Sprint Summary

| # | Sprint | Folder | Tasks | Priority | Human Test Focus |
|---|------|--------|-------|----------|------------------|
| 1 | Week 0 — Validation & De-Risking | [epic-01-week0-validation/](./epic-01-week0-validation/) | 4 | P0 | Run 4 validation spikes, verify go/no-go for each risk |
| 2 | Baseline Curation Pipeline Validation | [epic-02-baseline-pipeline-validation/](./epic-02-baseline-pipeline-validation/) | 11 | P0 | Fetch FHWA CSV (BASE-000) + run existing pipeline end-to-end before hardening + BASE-009a/b Crawl Plan Protocol remediation (framework + MR → human checkpoint → BBR + baseline regen + review.md PASS) |
| 3 | Foundation — Models, Schema, Dependencies | [epic-03-foundation-models-schema/](./epic-03-foundation-models-schema/) | 6 | P0 | Install deps, extend models, migrate Convex schema |
| 4 | Source Diversification — Government, Editorial & Geometric | [epic-04-sources-government-editorial/](./epic-04-sources-government-editorial/) | 3 | P1 | Run 3 surviving sources (Scenic Byways, Rider Mag, curvature) through full pipeline |
| ~~5~~ | ~~Source Diversification — Community + Geometric~~ | [sprint-05-sources-community-geometric/](./sprint-05-sources-community-geometric/) | 0 | — | *BDR + twtex sources invalidated; SRC-004 (curvature) folded into Epic 4* |
| 6 | Quality Infrastructure — Dedup & Floor | [sprint-06-quality-dedup-floor/](./sprint-06-quality-dedup-floor/) | 2 | P1 | Run dedup on full catalog, verify tier assignments |
| 7 | Quality Infrastructure — Reports | [sprint-07-quality-reports/](./sprint-07-quality-reports/) | 2 | P1 | Generate coverage + data quality reports with CI gating |
| 8 | Scoring & Calibration | [sprint-08-scoring-calibration/](./sprint-08-scoring-calibration/) | 6 | P1 | Realign weights, calibration gate, extraction audit |
| 9 | Community Sources — Ingestion | [sprint-09-community-ingestion/](./sprint-09-community-ingestion/) | 3 | P2 | Run ADVRider/Reddit/Pushshift ingest, verify staging |
| 10 | Community NLP & Signal Merge | [sprint-10-community-nlp-signals/](./sprint-10-community-nlp-signals/) | 4 | P2 | Run NLP extraction, see mention_frequency in scores |
| ~~11~~ | ~~Mobile UI — New Field Display~~ | *deferred 2026-04-16 to [native-rewrite PRD](../../native-rewrite/07-native-app-backlog.md)* | ~~4~~ | — | *React Native UI deferred; client transitioning to native Kotlin/Swift* |
| 12 | Pipeline Orchestrator & E2E Integration | [sprint-12-orchestrator-integration/](./sprint-12-orchestrator-integration/) | 1 | P1 | Run one command, entire pipeline runs end-to-end |

---

## Dependency Graph

```
Epic 1: Week 0 Validation (VAL-001..004)
    │
    ├─► VAL-002 ✗ (BDR source invalidated — SRC-002 dropped)
    ├─► VAL-003 ✗ (twtex source invalidated — SRC-003 dropped)
    ├─► VAL-001 ──────────────────────────────────► RID-003 (Sprint 10)
    └─► VAL-004 ──► Epic 2 (Baseline Validation)
                            │
                            ▼
                    Epic 3: Foundation
                    (INF-001..007, INF-011)
                            │
                    ┌───────┴───────┐
                    ▼               ▼
             Epic 4: SRC      (Sprint 5 deleted)
             (Gov + Editorial
              + Geometric)
             SRC-001, 006, 004
                    │
                    ▼
             Sprint 6: Quality Dedup + Floor
             (QUAL-001, QUAL-002)
                    │
                    ▼
             Sprint 7: Quality Reports
             (QUAL-003, QUAL-004)
                    │
                    ▼
             Sprint 8: Scoring & Calibration
             (INF-008, 009, SCO-001..004)
                    │
                    ▼
             Sprint 9: Community Ingestion
             (RID-001, 002, 006)
                    │
                    ▼
             Sprint 10: Community NLP + Signals
             (RID-003, 005, 004)
                    │
                    ▼
             Sprint 12: Orchestrator & E2E
             (INF-012)
```

*Dropped from graph 2026-04-12: SRC-002 (BDR), SRC-003 (twtex), SRC-005 (USFS MVUM). Sprint 5 deleted entirely.*
*Deferred from graph 2026-04-16: Sprint 11 (Mobile UI) deferred to native-rewrite PRD.*

---

## Parallelization Opportunities

| Parallel Group | Tasks | Rationale |
|---------------|-------|-----------|
| Epic 1 all 4 VAL | VAL-001, VAL-002, VAL-003, VAL-004 | No inter-task dependencies |
| Epic 3 INF-005/006/007 | After INF-001/002/003 | Independent infra concerns |
| Epic 4 all 3 SRC | SRC-001, SRC-006, SRC-004 | Independent source scrapers (absorbed SRC-004 from deleted Sprint 5) |
| Sprint 6 QUAL-001 → QUAL-002 | Sequential | QUAL-002 uses dedup output |
| Sprint 7 QUAL-003/004 | Parallel | Independent reports |
| Sprint 8 INF-008/009 parallel → SCO-001/002 → SCO-003/004 | Partial parallel | Enrichment first, then scoring |
| Sprint 9 RID-001/002 parallel → RID-006 | Sequential after RID-002 | Pushshift depends on Reddit schema |
| Sprint 10 RID-003 → RID-004 → RID-005/INF-010 | Mostly sequential | NLP pipeline chain |
| ~~Sprint 11~~ | *Deferred 2026-04-16* | *React Native UI work moved to native-rewrite PRD* |

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
| [BASE-009a](./epic-02-baseline-pipeline-validation/BASE-009a.md) | Crawl Plan Protocol framework + MotorcycleRoads remediation | python-implement | M | 330 |
| [BASE-009b](./epic-02-baseline-pipeline-validation/BASE-009b.md) | Apply Crawl Plan Protocol to BestBikingRoads + regenerate Epic 2 baseline | python-implement | L | 300 |

**Total Epic 2 effort:** 1,035 min (~17.25 hours) across 11 tasks. See `epic-02-baseline-pipeline-validation/EPIC.md` for the wave plan and `epic-02-baseline-pipeline-validation/DECISIONS.md` for the 2026-04-13 AM FHWA CSV data source resolution, the 2026-04-13 PM Crawl Plan Protocol adoption, its same-evening split into BASE-009a + BASE-009b, and the Phase 0 recon findings that revised BASE-009a's route universe from 300-1000 to ~2,044 (BASE-009a effort 270 → 330 min).

### Epic 3: Foundation (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| INF-001 | Install Semantic Matching Dependencies | python-implement | XS | 30 |
| INF-002 | Extended Route Models — Embedding, Identifiers, LLM Artifacts | python-implement | S | 90 |
| INF-003 | Convex Vector Index + Match Audit Schema | convex-implementer | M | 120 |
| INF-004 | Route Embedding Generation Pipeline | python-implement | M | 120 |
| INF-005 | LLM Extraction Schema Contract — PostExtraction v2 | python-implement | S | 90 |
| INF-006 | Convex Vector Search Query Wrappers | convex-implementer | S | 90 |
| INF-007 | Convex Push Serialization — Embedding + Artifacts | convex-implementer | S | 60 |
| INF-011 | US_STATES Allowlist in Crawl Plan Inventory | python-implement | S | 60 *(Phase 1 DONE)* |

### Epic 4: Sources — Government, Editorial & Geometric (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| SRC-001 | Ingest US Scenic Byways GIS Layer | python-implement | M | 240 |
| SRC-006 | Ingest Rider Magazine 50 Best Roads | python-implement | S | 150 |
| SRC-004 | adamfranco/curvature Pre-Computed Output Consumer | python-implement | S | 150 |

**Sprint 5 — Deleted 2026-04-12.** Originally held SRC-002 (BDR), SRC-003 (twtex), SRC-004 (curvature). SRC-002 and SRC-003 dropped entirely after VAL-002 and VAL-003 invalidated their PRD assumptions. SRC-004 folded into Epic 4 above. See [sprint-05-sources-community-geometric/](./sprint-05-sources-community-geometric/).

### Dropped Tasks

| Task ID | Title | Reason | Gate |
|---------|-------|--------|------|
| ~~SRC-002~~ | Ingest BDR GPX Routes | V3 lifestyle mismatch (ADV/dual-sport) + VAL-002 found 403s | Dropped 2026-04-12 |
| ~~SRC-003~~ | twtex.com Top 100 Scraper | PRD assumption invalidated (site is a Texas forum, not a curated list) | Dropped 2026-04-12 via VAL-003 |
| ~~SRC-005~~ | Ingest USFS Motor Vehicle Use Maps | V3 lifestyle mismatch (forest service gravel/dirt roads) | Dropped 2026-04-12 |

### Sprint 6: Quality — Dedup & Floor (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| QUAL-001 | Semantic Deduplication Engine | python-implement | L | 360 |
| QUAL-002 | LLM Arbitration Batch Runner | python-implement | M | 180 |
| QUAL-003 | Quality Floor Filter (premium/standard/minimal) | python-implement | S | 90 |
| QUAL-004 | Coverage Validation Report | python-implement | M | 180 |
| QUAL-005 | Data Quality Report with CI Gating | python-implement | M | 180 |

### Sprint 7: Quality — Reports (CONSOLIDATED INTO SPRINT 6 — 2026-04-14)

QUAL-003 (Coverage Report) and QUAL-004 (Data Quality Report) were absorbed into Sprint 6 during the semantic matching pivot (Agent 4 rewrite). Sprint 7 `SPRINT.md` still exists as a placeholder but its tasks now live under Sprint 6 as QUAL-004 and QUAL-005. Resolve this structural cleanup in a follow-up: either delete the Sprint 7 directory or re-expand it with a different set of tasks.

### Sprint 8: Scoring & Calibration (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| INF-008 | HPMS AADT Enrichment Client | python-implement | M | 180 |
| INF-009 | NWS Weather Enrichment Client | python-implement | M | 150 |
| SCO-001 | Scoring Weight Realignment with HPMS and Weather Integration | python-implement | M | 240 |
| SCO-002 | Ground Truth Route Set Builder | python-implement | S | 120 |
| SCO-003 | Calibration Gate Enforcement | python-implement | M | 150 |
| SCO-004 | Extraction Accuracy Audit — Per-Attribute F1 Report | python-implement | M | 150 |

### Sprint 9: Community Sources — Ingestion (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| RID-001 | ADVRider RSS Feed Ingest | python-implement | M | 200 |
| RID-002 | Reddit API OAuth2 Community Source | python-implement | M | 240 |
| RID-006 | Pushshift Historical Backfill | python-implement | M | 180 |

### Sprint 10: Community NLP & Signals (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| RID-003 | Community Post Matching — Semantic Search + LLM Rerank | python-implement | L | 360 |
| RID-005 | Route Reconciliation & Temporal Decay | python-implement | L | 300 |
| RID-004 | Merge Community Signals into Composite Scoring | python-implement | M | 180 |

*Note 2026-04-14: Old INF-010 (GitHub Actions Community Ingest Cron Workflow) was removed during the semantic matching pivot — scheduling now belongs to Sprint 12 Orchestrator. Effort dropped ~40% vs the old two-stage GLM plan because custom NLP (sentiment classifier, aspect scorer, attribute detector) is now folded into the single Claude Haiku 4.5 call at the Sprint 9 ingestion boundary (PostExtraction contract, Epic 3 INF-005).*

### Sprint 11: Mobile UI — New Field Display (DEFERRED 2026-04-16)

**Deferred to native-rewrite PRD:** `.spec/prds/native-rewrite/07-native-app-backlog.md`

The client is transitioning from React Native to native Kotlin (Android) + Swift (iOS). React Native UI work would be throwaway. The pipeline still produces all data fields (surface, qualityTier, bestMonths, etc.) — only the consumption layer is deferred.

| Task ID | Title | Agent | Effort | Est. Min | Status |
|---------|-------|-------|--------|----------|--------|
| ~~DESIGN-008~~ | ~~RouteDiscoveryCard: Surface type badge, best months, and quality tier display~~ | ~~frontend-designer~~ | ~~M~~ | ~~120~~ | Deferred |
| ~~DESIGN-009~~ | ~~Discovery surface-type filter chip in DiscoveryFilterBar~~ | ~~frontend-designer~~ | ~~S~~ | ~~75~~ | Deferred |
| ~~DESIGN-010~~ | ~~RouteDetailsSheet: description, best months, and community signals section~~ | ~~frontend-designer~~ | ~~M~~ | ~~90~~ | Deferred |
| ~~DESIGN-011~~ | ~~Lean sync schema extension: surface, bestMonths, qualityTier in local SQLite~~ | ~~frontend-designer~~ | ~~S~~ | ~~60~~ | Deferred |

### Sprint 12: Orchestrator & E2E (STUBS)

| Task ID | Title | Agent | Effort | Est. Min |
|---------|-------|-------|--------|----------|
| INF-012 | Pipeline Orchestrator — Single Entry Point | python-implement | M | 120 |

*Note 2026-04-14: Renamed from INF-004 → INF-012 to resolve task ID collision with Epic 3 INF-004 (Route Embedding Generation Pipeline), which was added during the semantic matching pivot.*

---

## PRD Coverage Map

| PRD Section | Covered By |
|-------------|------------|
| S1.0 Priority 0: Validation & Setup | VAL-001, VAL-002 (source dropped), VAL-003 (source dropped), VAL-004 |
| S1.1 Priority 1: Source Diversification | SRC-001, SRC-004, SRC-006 *(SRC-002/003/005 dropped)* |
| S1.2 Priority 2: Quality Infrastructure | QUAL-001..004 |
| S1.3 Priority 3: Scoring & Calibration | SCO-001..004, INF-008, INF-009 |
| S1.4 Priority 4: Community Sources & NLP | RID-001..006, INF-010 |
| S1.5 Cross-Priority Infrastructure | INF-001..007, INF-011, INF-012 (orchestrator in Sprint 12) |
| S4 UC-SRC-01, 04, 06 | SRC-001, SRC-004, SRC-006 |
| ~~S4 UC-SRC-02, 03, 05~~ | *Dropped 2026-04-12 — see Dropped Tasks table above* |
| S5 UC-QUAL-01..04 | QUAL-001..004 |
| S6 UC-SCORE-01..04 | SCO-001..004, INF-008, INF-009 |
| S7 UC-RIDER-01..06 | RID-001..006 |
| S9 Technical Requirements | INF-001..010, ~~DESIGN-008..011~~ *(deferred to native-rewrite)* |
| Predecessor PRD Baseline | BASE-000..008 (Epic 2 — 9 tasks covering FHWA data fetch, pipeline validation, and curation review protocol execution) |

**Coverage:** 100% of the 16 surviving PRD use cases + baseline validation. (Down from 19 use cases after the 3 dropped SRC UCs. Mobile UI consumption layer deferred to native-rewrite PRD.)

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

- **Sequential chains**: Epic 1 → Epic 2 → Epic 3 → Epic 4 → Sprint 6 → Sprint 7 → Sprint 8 → Sprint 9 → Sprint 10 → Sprint 12. *(Sprint 5 deleted 2026-04-12. Sprint 11 deferred 2026-04-16 to native-rewrite PRD.)*
- **Human test philosophy**: Every epic's human tests exercise the pipeline end-to-end via the [Curation Review Protocol](./CURATION-REVIEW-PROTOCOL.md). The user hasn't run the existing curation logic before, so Epic 2 establishes the baseline truth before hardening begins.
- **Curation review is non-optional**: every epic runs all available curation scripting, diffs the catalog against the prior baseline, and writes a `review.md` before being marked Done. No epic proceeds without a green review.
- **Stub tasks**: Epics 3-4, 6-12 contain stub-level task references only. Full TASK-TEMPLATE v4.0 files for these epics will be generated as each epic enters active development, to avoid context window bloat at planning time.
- **Week 0 proved its worth**: VAL-002 and VAL-003 invalidated two PRD assumptions before any implementation was written. Budget time for source-level pivots — the Week 0 gate is doing exactly what it was designed to do.
- **Calibration gate is the single biggest risk in Sprint 8**: First run is expected to FAIL. Budget time for prompt iteration.
- **Initiative thesis revised (2026-04-12)**: With 3 of 6 new sources dropped, BBR concentration reduction shifts from ~70% target to ~85-90% achievable. The initiative's real value now lives in Epics 6-10 (signal enrichment — dedup, quality floor, scoring realignment, community NLP, measured data). This is a more honest framing than "volume diversification."
- **Boy Scout rule**: If Epic 2 baseline validation finds bugs in existing pipeline code, fix them in place before layering hardening. Same rule applies to any later epic's curation review.
