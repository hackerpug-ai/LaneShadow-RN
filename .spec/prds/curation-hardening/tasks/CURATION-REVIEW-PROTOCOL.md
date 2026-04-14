# Curation Review Protocol

**Purpose:** Every epic MUST execute the full curation pipeline end-to-end as part of its human test steps. This protocol defines the canonical review routine — a scalable set of steps that exercises all curation scripting available at each epic boundary, compares against the prior epic's baseline, and produces a review artifact before the epic can be marked Done.

**Companion protocol:** [`CRAWL-PLAN-PROTOCOL.md`](./CRAWL-PLAN-PROTOCOL.md) is the *pre-extraction* gate adopted on 2026-04-13 after Epic 2's BBR/MR "PASS WITH ISSUES" findings. Every task that extracts data from a remote source (HTML scraper, GIS API, RSS feed, paginated authenticated API) MUST produce a committed crawl plan artifact before running at scale. This review protocol is the *post-pipeline* gate that runs after extraction. The two protocols are non-overlapping and both mandatory — see Step 1 below for the integration point.

**Guiding principle:** *Every epic runs all curation scripting that exists at that point in the plan.* No epic is complete until the full pipeline (everything built so far) has been executed, the catalog diffed against the prior epic, and the review artifact written.

---

## When to Execute

- Run at the **end** of every epic's human test steps, **before** marking the epic as Done
- Rerun any time the pipeline, models, or Convex schema changes mid-epic (to catch regressions early)
- Results are the gate: no epic proceeds to "Done" without a green review artifact

---

## Prerequisites

- **Baseline catalog:** the previous epic's output (JSONL staging + Convex dev deployment state) must be preserved as a comparison point. Store in `.spec/prds/curation-hardening/tasks/epic-NN-.../baseline/`.
- **Working Convex dev deployment:** `npx convex dev --once` must pass.
- **Clean git tree:** all epic task work committed. Review runs against the committed state.
- **Env vars set:** `ANTHROPIC_API_KEY`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `CONVEX_URL` (where applicable).

---

## Review Steps (Conditional by Epic)

Each step runs ONLY if the referenced scripting exists at the current epic boundary. Steps marked "required starting Epic X" are skipped for earlier epics. As the plan progresses, more steps apply — by Epic 12 all steps are mandatory.

### Step 1: Run all source scrapers
**Required starting:** Epic 2 (existing sources), grows at Epic 4 (+3 new sources)

**Pre-verification — Crawl Plan Protocol gate (MANDATORY starting 2026-04-13):**

Before running any source scraper, verify that the source has passed the [Crawl Plan Protocol](./CRAWL-PLAN-PROTOCOL.md) and produced a committed verdict-PASS crawl report. This gate is non-negotiable for any source that extracts data from a remote endpoint (Form A HTML scraper, Form B structured API, Form C RSS feed, Form D authenticated paginated API). Form E pre-computed file consumers (FHWA CSV, curvature pre-computed output) are exempt.

For each source in scope at this epic, the following MUST exist and be committed:
1. `.spec/prds/curation-hardening/crawl-plans/{source}/site-map.md` (Phase 0)
2. `.spec/prds/curation-hardening/crawl-plans/{source}/urls.jsonl` (Phase 1)
3. `fixtures/{source}/` directory with ≥3 fixtures per page type + `fixtures.manifest.yaml` (Phase 2)
4. `.spec/prds/curation-hardening/crawl-plans/{source}/selectors.yaml` with fixture_yield 5/5 on all required fields (Phase 3)
5. `scripts/curation/tests/sources/test_{source}_fixtures.py` passing locally (Phase 4)
6. `.spec/prds/curation-hardening/crawl-plans/{source}/crawl-report.md` with verdict PASS from the most recent execution (Phase 6)

**Gate rule:** If any of the above are missing or the most-recent `crawl-report.md` verdict is not PASS, Step 1 FAILS and the curation review CANNOT proceed to the scraper bash commands below. The fix is to run (or re-run) the relevant Crawl Plan Protocol phases, not to soften the verdict.

```bash
# Existing (required from Epic 2 onward)
python -m scripts.curation.pipeline.sources.fhwa                # Form E — pre-computed CSV, Crawl Plan Protocol exempt
python -m scripts.curation.pipeline.sources.motorcycleroads     # Form A — requires crawl plan (see BASE-009)
python -m scripts.curation.pipeline.sources.bestbikingroads     # Form A — requires crawl plan (see BASE-009)

# New sources (all required starting at Epic 4 — Epic 5 deleted 2026-04-12)
python -m scripts.curation.pipeline.sources.scenic_byways       # Epic 4+ — Form B (Koordinates GIS API), requires crawl plan
python -m scripts.curation.pipeline.sources.rider_mag           # Epic 4+ — Form A (editorial HTML), requires crawl plan
python -m scripts.curation.pipeline.sources.curvature_discovery # Epic 4+ — Form E (pre-computed), exempt

# Community (required starting Epic 9+)
python -m scripts.curation.pipeline.sources.advrider            # Epic 9+ — Form C (RSS feeds × 17), requires crawl plan
python -m scripts.curation.pipeline.sources.reddit              # Epic 9+ — Form D (OAuth2 paginated API), requires crawl plan
python -m scripts.curation.pipeline.sources.pushshift           # Epic 9+ — Form D variant (historical backfill), requires crawl plan
```
*Sources removed 2026-04-12: `bdr` (dropped — V3 lifestyle mismatch + VAL-002 403s), `twtex` (dropped — PRD assumption failed, VAL-003 no-go), `usfs_mvum` (dropped — V3 lifestyle mismatch).*
*FHWA data lineage (2026-04-13): `scripts/curation/pipeline/sources/fhwa.py` consumes `data/fhwa_byways.csv`, a static committed file produced by Epic 2 BASE-000 from the DOT ArcGIS `US_Scenic_Byways/MapServer/107` layer (~645 routes across NSB / state / USFS / NPS / BLM tags). The predecessor PRD's aspirational "184-route data.gov CSV" reference has been retired — see `epic-02-baseline-pipeline-validation/DECISIONS.md`. Expected FHWA count in each epic's `source_counts.json` is ~645 (tolerance 580–710) unless DOT updates the layer, in which case a new DECISIONS.md entry documents the delta.*
**Verify:** each source produces a JSONL staging file with record count matching the Phase 1 inventory (±5% for dead links); the source's `.audit.json` shows fetch ≥95%, parse ≥99%, schema_validation_fail <1%. Log discrepancies against the committed `crawl-report.md`.

### Step 2: Run enrichment clients
**Required starting:** Epic 8 (HPMS + NWS) + existing OSM enrichment
```bash
python -m scripts.curation.pipeline.enrichment.osm_client       # Existing (Epic 2+)
python -m scripts.curation.pipeline.enrichment.hpms_client      # Epic 8+
python -m scripts.curation.pipeline.enrichment.weather_client   # Epic 8+
```
**Verify:** enrichment fields populate on Route objects. Spot-check 10 routes.

### Step 3: Run deduplication
**Required starting:** Epic 6
```bash
python -m scripts.curation.pipeline.dedup.semantic_deduplicator
```
**Verify:** dedup runtime < 15 minutes for full catalog (vector search + LLM arbitration adds latency vs the previously-planned rapidfuzz cascade — see Epic 3 Architectural Decision). Merge statistics logged (auto-merge count >0.92, arbitration queue 0.75-0.92, new routes <0.75). No duplicates for known landmarks (Tail of the Dragon appears once).

Then run the arbitration batch runner:
```bash
python -m scripts.curation.pipeline.dedup.llm_arbitrator
```
**Verify:** Arbitration batch completes without errors. `route_matches.isArbitrated=true` rows are populated with `arbitrationNotes` from Claude.

### Step 4: Run quality floor filter
**Required starting:** Epic 6
```bash
python -m scripts.curation.pipeline.quality.floor_filter --phase=1
```
**Verify:** tier distribution (premium/standard/minimal) makes sense. Not 100% minimal. Not 100% premium.

### Step 5: Run calibration gate (ground truth validation)
**Required starting:** Epic 8
```bash
python -m scripts.curation.pipeline.extraction.calibration_gate
```
**Verify:** calibration gate returns PASS (or documented --force override with justification). Per-attribute and composite agreement ≥ 80%.

### Step 6: Run Haiku extraction
**Required starting:** Epic 2 (existing extraction)
```bash
python -m scripts.curation.pipeline.extraction.client
```
**Verify:** extraction succeeds for all non-minimal routes. Extraction schema version logged. Temperature=0 confirmed.

### Step 7: Run composite scoring
**Required starting:** Epic 2 (existing scoring)
```bash
python -m scripts.curation.pipeline.scoring.composite
```
**Verify:** all routes have `composite_score` in [0,1]. Current WEIGHTS logged. Top 10 routes sanity-checked (Rider Mag routes should dominate from Epic 8+).

### Step 8: Run archetype classification
**Required starting:** Epic 2 (existing classification)
```bash
python -m scripts.curation.pipeline.classification.archetype
```
**Verify:** every route has `primary_archetype` from the 6 valid values. Distribution across archetypes looks reasonable.

### Step 9: Run community post matching & signal merge
**Required starting:** Epic 10

Note: per-post LLM extraction into `route_posts_raw` (PostExtraction contract from Epic 3 INF-005) runs upstream in Epic 9 ingestion. Epic 10 handles the semantic matching, reconciliation, and signal merge.
```bash
python -m scripts.curation.pipeline.nlp.post_matcher       # vector search + LLM rerank against route_posts_raw
python -m scripts.curation.pipeline.nlp.reconciler         # llm_reconciliation_log + temporal decay
python -m scripts.curation.pipeline.nlp.merge_signals      # merge reconciled signals into composite scoring
```
**Verify:** `route_matches` rows populated with `matchConfidence`, `llm_reconciliation_log` populated on multi-match routes, `mention_frequency` populated on target routes. Cost logged. Cache hits on re-run.

### Step 10: Run coverage report
**Required starting:** Epic 7
```bash
python -m scripts.curation.pipeline.quality.coverage_report
```
**Verify:** JSON + markdown output. Coverage gaps flagged per tiered thresholds.

### Step 11: Run data quality report
**Required starting:** Epic 7
```bash
python -m scripts.curation.pipeline.quality.data_quality_report
```
**Verify:** exit code 0 (clean) or 1 (anomaly). All 5 metrics populated. Delta vs prior run reported.

### Step 12: Convex push (dev deployment, dry-run first)
**Required starting:** Epic 2 (existing push)
```bash
python -m scripts.curation.pipeline.sync.convex_push --dry-run
python -m scripts.curation.pipeline.sync.convex_push            # Only if dry-run clean
```
**Verify:** serialization succeeds. No type errors. Dev Convex deployment reflects the new catalog. Mobile app renders updated catalog without crashes.

### Step 13: Run orchestrator end-to-end (if available)
**Required starting:** Epic 12
```bash
python -m scripts.curation.pipeline.orchestrator
```
**Verify:** single command replaces all prior steps. Same outputs as running stages individually.

---

## Review Analysis (Human-Driven)

After the scripting completes, the reviewer performs the following qualitative analysis:

### A. Diff against prior epic's baseline
Compare the current catalog to the baseline stored in the previous epic folder:
```bash
# Count delta
python -c "import json; prev=json.load(open('../epic-NN-prior/baseline/catalog.jsonl')); curr=json.load(open('./baseline/catalog.jsonl')); print(f'Prev: {len(prev)}, Curr: {len(curr)}, Delta: {len(curr)-len(prev)}')"

# Or simpler wc -l on JSONL
wc -l ../epic-NN-prior/baseline/catalog.jsonl ./baseline/catalog.jsonl
```
Flag:
- Unexpected deletions (anything more than dedup-driven losses)
- Unexpected duplicates appearing
- Score distribution shifts > 10% in any bucket
- New archetype imbalances

### B. Sample 20 random routes for quality review
```bash
shuf -n 20 ./baseline/catalog.jsonl | jq
```
Review each for:
- Name and state accuracy
- Archetype assignment sensibility
- Score component plausibility
- Description coherence (if present)
- Source provenance correctness

Flag any obvious errors for bug fixes (Boy Scout rule — fix before marking epic Done).

### C. Ground-truth spot checks
Pick 5 known landmark routes and verify each:
- Tail of the Dragon (NC/TN) — appears ONCE, curvature_score > 0.9, primary_archetype=twisties
- Blue Ridge Parkway (NC/VA) — appears ONCE, scenic_score > 0.8, primary_archetype=scenic_byway
- Beartooth Highway (MT/WY) — appears ONCE, elevation_drama_score > 0.8
- Pacific Coast Highway (CA) — appears ONCE, scenic_score > 0.8, primary_archetype=coastal
- Million Dollar Highway (CO) — appears ONCE, mountain archetype or twisties

Flag any missing, duplicated, or mis-scored landmark.

### D. Regression check
Compare against Epic 2 baseline (the original working pipeline state):
- FHWA route count unchanged or handled by dedup merge
- motorcycleroads and bestbikingroads counts still produce data
- Existing archetypes still assigned correctly
- No new crashes in any stage

### E. Mobile app smoke test
- Open Expo dev server, point at Convex dev deployment
- Open discovery screen — routes render without crashes
- Tap 3 routes — details load correctly (optional fields handled)
- Verify any new UI elements from Epic 11 work (if Epic 11 complete)

---

## Review Artifact

At the end of the review, write a `review.md` to the current epic folder with this template:

```markdown
# Epic NN Curation Review

**Date:** YYYY-MM-DD
**Reviewer:** [name/agent]
**Pipeline version:** [git sha]
**Verdict:** [PASS | PASS WITH ISSUES | FAIL]

## Pipeline Execution
- [ ] Step 1 Sources — N routes ingested across M sources
- [ ] Step 2 Enrichment — N routes enriched
- [ ] Step 3 Dedup — X merges (auto: a, arbitrated: b, new: c), runtime Zs, arbitration cost $Y
- [ ] Step 4 Quality floor — premium: a%, standard: b%, minimal: c%
- [ ] Step 5 Calibration gate — PASS | FAIL (threshold met?)
- [ ] Step 6 Extraction — N routes extracted
- [ ] Step 7 Scoring — current WEIGHTS recorded
- [ ] Step 8 Classification — archetype distribution
- [ ] Step 9 Community post matching + signal merge — N routes matched via vector search + LLM rerank, mention_frequency populated on N routes
- [ ] Step 10 Coverage report — generated
- [ ] Step 11 Data quality report — exit code 0
- [ ] Step 12 Convex push — dry-run clean; production push [yes/no]
- [ ] Step 13 Orchestrator — [N/A if not yet built]

## Catalog Diff vs Prior Epic
- Route count: prev N → curr N (delta +/-)
- Score distribution: [summary]
- Archetype shifts: [summary]
- Quality tier shifts: [summary]

## Sample Review (20 routes)
- Accurate: N/20
- Issues found: [list]

## Landmark Spot Check
- Tail of the Dragon: [PASS|FAIL] — appears once, score X
- Blue Ridge Parkway: [PASS|FAIL] — …
- Beartooth Highway: [PASS|FAIL] — …
- Pacific Coast Highway: [PASS|FAIL] — …
- Million Dollar Highway: [PASS|FAIL] — …

## Regressions Detected
- [None, or list]

## Mobile App Smoke Test
- [PASS|FAIL] — [notes]

## Fixes Applied (Boy Scout rule)
- [List bugs fixed as part of this review, with commit SHA]

## Outstanding Issues
- [List issues to track as follow-ups]

## Verdict Rationale
- [1-3 sentences]
```

---

## Verdict Rules

- **PASS** — All steps executed, no regressions, all landmarks correct, diff sensible, mobile smoke test clean.
- **PASS WITH ISSUES** — Executed successfully but minor issues noted (flagged for follow-up, not blocking).
- **FAIL** — Any regression, any landmark missing/duplicated, any stage crash, mobile smoke test fails. Epic CANNOT be marked Done. Must be remediated and re-reviewed.

---

## Baseline Storage

Each epic saves a snapshot of the catalog state to its folder:

```
.spec/prds/curation-hardening/tasks/epic-NN-.../baseline/
├── catalog.jsonl              # Full post-pipeline catalog
├── scores.json                # Score distributions
├── archetype_counts.json      # Count per archetype
├── source_counts.json         # Count per source
└── review.md                  # Review artifact
```

The next epic's review uses this as the baseline diff target.

---

## Notes

- **Protocol is conditional by epic** — don't skip it if some steps don't apply; run the steps that do and note the others as "N/A until Epic X"
- **Boy Scout rule** — if the review finds bugs in existing code, fix them within the epic, commit, re-run the review
- **This protocol is non-optional** — no epic is marked Done without a green (or PASS WITH ISSUES) review artifact
- **Review cost is not zero** — later epics may take 1-2 hours to run the full pipeline. Budget for this in epic timelines.
- **Runtime grows per epic** — Epic 2 review might be 30 minutes; Epic 12 review might be 2+ hours with all stages
- **Cache aggressively** — OSM cache, NLP extraction cache, HPMS spatial join cache — all help keep review runtime manageable
