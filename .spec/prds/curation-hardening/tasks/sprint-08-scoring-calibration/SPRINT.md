# Sprint 8: Scoring & Calibration

**Sequence:** 8 / 12
**Priority:** P1
**Status:** Backlog
**Estimated Effort:** 1140 minutes (~19 hours)

---

## Overview

The largest epic: realign composite scoring weights to research, integrate measured data (HPMS AADT + IRI for traffic/pavement, NWS Climate Normals for weather), build a 50-100 route ground truth set from Rider Mag + FHWA + known routes, enforce the calibration gate at 80% agreement threshold, and run an extraction accuracy audit (per-attribute F1). This epic transforms scoring from "extracted text → heuristic score" to "extracted text + measured telemetry → calibrated, validated score".

**Theme:** Update weights, re-score, see scores change, run calibration gate, verify ground truth alignment, run extraction audit.

**PRD Reference:** [S6.1-S6.4](../../06-uc-score.md) — UC-SCORE-01..04 + [S1.3 measured data](../../01-scope.md)

---

## Human Test Steps

After all 6 tasks are complete, an administrator should be able to:

1. **Run HPMS AADT/IRI enrichment** — Execute `python -m scripts.curation.pipeline.enrichment.hpms_client`. Verify routes get `aadt`, `aadt_median`, `aadt_max`, `pavement_iri` populated via spatial join. Spot-check 10 routes against FHWA HPMS web UI.
2. **Run NWS Climate enrichment** — Execute `python -m scripts.curation.pipeline.enrichment.weather_client`. Verify routes get `weather_suitability` (0-1 float) and `best_months` (list of strings). Spot-check a Florida route (year-round) vs a Montana route (May-Sep).
3. **Update weights config file** — Edit `pipeline/config/scoring_weights.yaml`. Change a weight (e.g., community_rating 0.15 → 0.20). Re-run composite scoring. Verify weights reload without code change.
4. **Run re-scoring** — Execute composite scoring on all routes. Verify WEIGHTS sum == 1.0. Verify the new weight distribution applied (curviness 0.20, scenery 0.15, traffic 0.10, condition 0.10, elevation 0.10, fhwa 0.05, community 0.15, mention_freq 0.10, remoteness 0.05).
5. **Inspect impact report** — Verify top 10 gainers and top 10 losers from weight change are logged. Sanity check: routes with strong community ratings should gain; routes relying on FHWA designation should drop.
6. **Build ground truth set** — Execute `python -m scripts.curation.pipeline.extraction.ground_truth_builder`. Verify `ground_truth.json` contains 50-100 routes including Rider Mag 50, FHWA All-American Roads, and manually added landmark routes (Tail of the Dragon, PCH, Beartooth, Blue Ridge, Million Dollar Highway). **NOTE**: Epic 03 has 5,608 production routes available for ground truth selection. The ground truth builder can sample from the full production catalog instead of being limited to Epic 02 baseline data.
7. **Run calibration gate** — Execute `python -m scripts.curation.pipeline.extraction.calibration_gate`. Verify it runs Haiku extraction + scoring on ground truth only (~50-100 routes), measures per-attribute + composite agreement, and outputs PASS/FAIL. First run may FAIL — inspect discrepancies and tune prompts.
8. **Verify --force override** — Run calibration gate with `--force` flag and document-justified override. Verify it proceeds despite FAIL and logs the override.
9. **Block full batch on FAIL** — Attempt full batch extraction without `--force` when calibration failed. Verify script blocks with non-zero exit code.
10. **Run extraction accuracy audit** — Execute `python -m scripts.curation.pipeline.extraction.validator`. Verify per-attribute precision/recall/F1 reported. Confusion matrix shown for categorical attributes. Flag attributes with F1 < 0.7 as "needs prompt improvement".
11. **Full pipeline end-to-end with calibrated scoring** — Run source ingest → dedup → quality floor → calibration gate (PASS) → extraction → scoring → classify → push. Verify Rider Mag 50 routes appear in top 10 by composite score in mobile app.

12. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Applicable steps NOW INCLUDE: 2 (HPMS + NWS enrichment for the first time) and 5 (calibration gate) for the first time. Full steps: 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12. **Diff against Sprint 7 baseline — this is the largest score shift of the plan. Expect TOP-10 ROUTES TO CHANGE SIGNIFICANTLY (community_rating and mention_frequency now weight more). Verify Rider Mag 50 routes dominate top 25. Verify aadt/pavement_iri populated on routes with HPMS coverage. Verify best_months populated. Calibration gate MUST return PASS (or documented --force with justification).** Write `review.md` with verdict PASS.

All 12 verifications must pass. First-run calibration gate FAIL is expected and part of the process.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/enrichment/hpms_client.py` implemented
- [ ] `scripts/curation/pipeline/enrichment/weather_client.py` implemented
- [ ] `scripts/curation/pipeline/config/scoring_weights.yaml` configurable file
- [ ] WEIGHTS realigned to PRD spec (sum to 1.0)
- [ ] HPMS AADT → `traffic_score` integration
- [ ] HPMS IRI → `road_quality_score` integration
- [ ] NWS Climate → `weather_suitability` + `best_months`
- [ ] `ground_truth.json` with 50-100 labeled routes
- [ ] `calibration_gate.py` enforces 80% per-attribute + 80% composite thresholds
- [ ] `--force` override supported with justification logging
- [ ] `validator.py` computes per-attribute precision/recall/F1 + confusion matrices
- [ ] F1 < 0.7 flagged as "needs prompt improvement"
- [ ] Weight change impact report with top gainers/losers
- [ ] Full pipeline runs with calibrated scoring and passes quality gates

---

## PRD Sections Covered

- **S6.1** — UC-SCORE-01 Realign Composite Score Weights
- **S6.2** — UC-SCORE-02 Build and Validate Ground Truth Calibration Set
- **S6.3** — UC-SCORE-03 Enforce Calibration Gate Before Full Pipeline Run
- **S6.4** — UC-SCORE-04 Validate Haiku Extraction Accuracy
- **S1.3** — Measured data integration (HPMS + NWS)

---

## Tasks (6 stubs)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| INF-008 | HPMS AADT Enrichment Client | FEATURE | python-implement | P1 | M | 180 | INF-002 | SCO-001 |
| INF-009 | NWS Weather Enrichment Client | FEATURE | python-implement | P1 | M | 150 | INF-002 | SCO-001 |
| SCO-001 | Scoring Weight Realignment with HPMS and Weather Integration | FEATURE | python-implement | P1 | M | 240 | INF-002, INF-008, INF-009 | SCO-003, RID-004 |
| SCO-002 | Ground Truth Route Set Builder | FEATURE | python-implement | P1 | S | 120 | SRC-006, INF-002 | SCO-003, SCO-004 |
| SCO-003 | Calibration Gate Enforcement | FEATURE | python-implement | P1 | M | 150 | SCO-002, INF-005 | INF-004 |
| SCO-004 | Extraction Accuracy Audit — Per-Attribute F1 Report | FEATURE | python-implement | P1 | M | 150 | SCO-002, INF-005 | INF-004 |

**Total Tasks:** 6
**Total Estimated Effort:** 990 minutes (~16.5 hours)
**Parallelization:** INF-008/INF-009 parallel → SCO-001/SCO-002 parallel → SCO-003/SCO-004 parallel

---

## Dependencies

**Blocks:**
- Sprint 10: Community NLP & Signals (RID-004 depends on SCO-001 for mention_frequency weight)
- Sprint 12: Orchestrator & E2E (all scoring tasks are pipeline stages)

**Depends On:**
- Epic 3: Foundation (INF-002 models, INF-005 extraction schema v2)
- Epic 4: Source Diversification (SRC-006 Rider Mag for ground truth)

---

## Definition of Done

- [ ] All 6 task files written and merged
- [ ] All 6 tasks moved to `Done`
- [ ] HPMS + NWS enrichment run successfully on full catalog
- [ ] Weights realigned and verified to sum to 1.0
- [ ] Ground truth set exists with 50-100 routes
- [ ] Calibration gate PASSES at 80% threshold on ground truth (after prompt tuning if needed)
- [ ] Extraction audit shows per-attribute F1 with all attributes > 0.7 (or flagged for improvement)
- [ ] Rider Mag 50 routes appear in top 10 by composite score (sanity check)
- [ ] Full pipeline end-to-end passes with calibrated scoring
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + updated `baseline/catalog.jsonl` committed
- [ ] Top-10 route changes documented in review.md (gainers/losers from weight realignment)
- [ ] User has approved proceeding to Sprint 9

---

## Notes

- **Calibration gate is the biggest risk in this epic** — first run is expected to FAIL. Budget time for prompt iteration.
- HPMS GeoJSON is a single national download (~1GB) — cache locally, don't re-download
- NWS Climate Normals are computed monthly averages — one lookup per route centroid
- Measured data (AADT, IRI) REPLACES LLM-extracted signals for traffic/pavement — LLM extraction for these attributes is deprecated
- Weight changes cause score shifts — the impact report helps detect unintended consequences
- If calibration gate consistently fails, escalate to user: either tune prompts, change weights, or pivot to sentence-transformer NLP per AD-002
- Ground truth should include some INTENTIONAL edge cases (e.g., a route known to be average — verify it scores as average)
