# Epic 12: Pipeline Orchestrator & End-to-End Integration

**Sequence:** 12 / 11  *(sequence number retained; Epic 5 gap from 2026-04-12 revision)*
**Priority:** P1
**Status:** Backlog
**Estimated Effort:** 120 minutes (~2 hours)

---

## Overview

Stitch all pipeline stages into a single `orchestrator.py` CLI entry point that sequences ingest → enrich → dedup → quality floor → calibrate → extract → score → classify → coverage report → data quality report → Convex push. With per-stage skip flags, structured logging, and end-to-end observability. This is the final epic — it integrates everything built in Epics 2-10 into one reproducible command.

**Theme:** Run ONE command. Entire pipeline runs. All stages succeed. Reports generated. Production-ready.

**PRD Reference:** [S9 Technical Requirements — Pipeline Orchestrator](../../09-technical-requirements.md)

---

## Human Test Steps

After the single task is complete, an administrator should be able to:

1. **Run orchestrator help** — Execute `python -m scripts.curation.pipeline.orchestrator --help`. Verify all stage flags are documented: `--skip-ingest`, `--skip-dedup`, `--skip-floor`, `--skip-extract`, `--skip-score`, `--skip-classify`, `--skip-push`, `--only-stage`, `--dry-run`.
2. **Run orchestrator dry-run** — Execute `python -m scripts.curation.pipeline.orchestrator --dry-run`. Verify all stages are listed in execution order with estimated counts but no actual writes occur.
3. **Run full pipeline end-to-end** — Execute `python -m scripts.curation.pipeline.orchestrator`. Verify:
   - All 6 sources ingested (existing: FHWA, motorcycleroads, bestbikingroads — new from Epic 4: Scenic Byways 799, Rider Mag 50, curvature top 5%)
   - Dedup runs across sources with merge statistics logged
   - Quality floor filter runs (Phase 1 soft)
   - HPMS + NWS enrichment runs
   - Calibration gate runs on ground truth (PASS expected)
   - Haiku extraction on filtered catalog
   - Composite scoring with realigned WEIGHTS
   - Archetype classification
   - Community signal merge (if RID data present)
   - Coverage report generated
   - Data quality report generated (exit code 0)
   - Convex push to dev deployment
4. **Verify logs structured per stage** — Inspect orchestrator log output. Verify each stage logs: start timestamp, stage name, input count, output count, duration, status. Verify stage failures halt the orchestrator with clear error context.
5. **Verify skip flag** — Execute `python -m scripts.curation.pipeline.orchestrator --skip-extract`. Verify extraction stage is skipped, downstream stages use existing extracted data.
6. **Verify only-stage flag** — Execute `python -m scripts.curation.pipeline.orchestrator --only-stage=score`. Verify only the scoring stage runs (assumes prior stages already completed).
7. **Verify report-gated push** — Data quality report exit code 1 (anomaly) should block Convex push. Test by injecting an anomaly and verifying push is skipped.
8. **Verify resumability** — Kill the orchestrator mid-run (e.g., Ctrl-C during extraction). Re-run. Verify it can resume from the checkpoint without re-running completed stages.
9. **Full pipeline timing** — Run full pipeline to completion. Verify total runtime is reasonable (< 2 hours for the full batch, given HPMS enrichment + calibration + extraction + dedup all running sequentially).
10. **Mobile app final verification** — Open mobile app after full pipeline run. Verify:
    - Catalog shows deduped routes (no duplicates)
    - Surface filter works with OSM-sourced surface data (and GLM NLP fallback)
    - Rider Mag routes in top 10 by score
    - Community signals visible on detail sheet
    - Quality tier badges appear on minimal routes
    - Best months visible on detail sheet

11. **Execute the Curation Review Protocol (FINAL RUN)** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. **ALL 13 protocol steps are now active, including Step 13 (orchestrator). Run once using individual stages, then once via `python -m scripts.curation.pipeline.orchestrator` — verify outputs are byte-identical.** Diff against every prior epic baseline to see the full journey: Epic 2 baseline → Epic 12 final. **Produce a final initiative close-out `review.md` capturing the full journey: route count evolution, score distribution evolution, top-10 routes evolution, dedup merge counts, calibration gate history, cost totals, regressions found + fixed.** This review.md is the final artifact of the Curation Pipeline Hardening initiative. Verdict PASS is required to close the initiative.

All 11 verifications must pass. This is the final validation of the entire Curation Pipeline Hardening initiative.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/orchestrator.py` implemented as single CLI entry point
- [ ] All pipeline stages wired in correct execution order
- [ ] Per-stage skip flags (`--skip-<stage>`, `--only-stage=<stage>`)
- [ ] Dry-run mode shows stages without writes
- [ ] Structured logging per stage (name, counts, duration, status)
- [ ] Stage failures halt with clear error context
- [ ] Resumability via checkpoint files
- [ ] Report-gated Convex push (data quality report exit code must be 0)
- [ ] Full pipeline runs end-to-end without manual intervention
- [ ] Catalog in Convex reflects all hardening outputs
- [ ] Mobile app displays correctly against final catalog

---

## PRD Sections Covered

- **S9** — Technical Requirements — Pipeline orchestrator component
- **Entire PRD** — This is the integration epic

---

## Tasks (1 stub)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| INF-004 | Pipeline Orchestrator — Single Entry Point | INFRA | python-implement | P1 | M | 120 | All Epic 4-10 tasks | — |

**Total Tasks:** 1
**Total Estimated Effort:** 120 minutes (~2 hours)
**Parallelization:** N/A — only 1 task

---

## Dependencies

**Blocks:**
- (none — this is the final epic)

**Depends On:**
- Epic 4: Source Diversification — Government, Editorial & Geometric (all SRC tasks)
- Epic 6: Quality Infrastructure — Dedup & Floor (QUAL-001, QUAL-002)
- Epic 7: Quality Infrastructure — Reports (QUAL-003, QUAL-004)
- Epic 8: Scoring & Calibration (all SCO + INF tasks)
- Epic 10: Community NLP & Signals (RID-003, RID-004)
- Epic 3 (INF-006, INF-007 Convex push + geospatial queries)

---

## Definition of Done

- [ ] INF-004 task file written and merged
- [ ] Task moved to `Done`
- [ ] Full pipeline runs end-to-end in one command
- [ ] Total runtime < 2 hours
- [ ] All quality gates enforced (calibration, coverage, data quality)
- [ ] Report-gated Convex push verified
- [ ] Resumability verified (kill + resume)
- [ ] Mobile app verified against final catalog
- [ ] Curation Review Protocol executed (BOTH stage-by-stage AND via orchestrator — outputs identical)
- [ ] Final initiative close-out `review.md` committed documenting full journey (Epic 2 → Epic 12)
- [ ] All 12 epics moved to `Done`
- [ ] Curation Pipeline Hardening initiative officially complete

---

## Notes

- **The orchestrator is the integration point — if it works, the whole initiative works**
- Use a checkpoint file (JSON) to track completed stages — simple restart-from-checkpoint on failure
- Structured logging should output JSON events for CI/observability tools (not just text)
- Per-stage duration logging is critical for future optimization (which stage is the bottleneck?)
- The `--dry-run` mode should estimate runtime based on prior runs (from checkpoint history)
- Consider a `--parallel` flag for future optimization (independent sources can run in parallel)
- After Epic 12 completes, the Curation Pipeline Hardening initiative is DONE. Update `.spec/prds/curation-hardening/README.md` with close-out notes.
