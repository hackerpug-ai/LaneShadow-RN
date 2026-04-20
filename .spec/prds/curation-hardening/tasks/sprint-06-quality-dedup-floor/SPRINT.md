# Sprint 6: Quality Infrastructure — Semantic Dedup & Floor

**Sequence:** 6 / 12
**Priority:** P0
**Status:** Backlog
**Estimated Effort:** 990 minutes (~16.5 hours)

---

## Overview

Build the quality infrastructure that cleans the merged catalog: **semantic deduplication** via Convex native vectorIndex + LLM reranking (replaces the previously-planned deterministic three-stage cascade) and a **quality floor filter** that marks routes as `premium`/`standard`/`minimal` based on data completeness.

Dedup reuses the Epic 3 semantic matching primitive: every curated route already has a `searchEmbedding` populated by INF-004, and the `findCandidateRoutesByEmbedding` query wrapper (INF-006) returns the top-K nearest neighbors by cosine similarity. QUAL-001 walks the catalog, fetches candidate neighbors for each route, auto-merges high-confidence pairs, queues mid-confidence pairs for LLM arbitration (QUAL-002), and leaves low-confidence routes standalone. Every merge decision is written to the `route_matches` audit table via the `addRouteMatch` mutation, and reconciliation entries are appended to `curated_routes.llmReconciliationLog` so every merge is traceable.

The quality floor (QUAL-003) runs after dedup on the reconciled catalog, marking routes as `premium` / `standard` / `minimal` based on data completeness. Coverage validation (QUAL-004) and a data quality report with CI gating (QUAL-005) round out the epic.

**Theme:** Run dedup on the full merged catalog and see duplicates disappear via vector similarity + LLM judgment. Run quality floor and see tier assignments reflect real data completeness. Coverage and quality reports gate the pipeline at CI.

**PRD Reference:** [S5.1, S5.2](../../05-uc-qual.md) — UC-QUAL-01, UC-QUAL-02

---

## Architectural Decision

Sprint 6 previously specified a three-stage deterministic cascade for deduplication (exact name+state → fuzzy Levenshtein via `rapidfuzz.token_sort_ratio` → geospatial proximity via Convex GeospatialIndex). That plan was never validated against real community data, and analysis revealed critical blind spots: nicknames (“The Dragon” vs “Tail of the Dragon” vs “US-129”), contextual references (“that twisty road past the dam”), ambiguous names (“Skyline Drive” in multiple states), and regional shorthand (“that Chattanooga ride”) all fail deterministic string matching.

Epic 3 pivoted the matching primitive to **semantic retrieval via Convex vectorIndex + LLM rerank** (see `../epic-03-foundation-models-schema/EPIC.md` for the full rationale). This sprint now consumes that primitive:

- **Candidate retrieval:** `findCandidateRoutesByEmbedding` (INF-006) returns top-10 cosine-similar routes — embeddings capture semantic similarity across nicknames, synonyms, and contextual references.
- **Decision layer:** cosine > 0.92 auto-merges, 0.75–0.92 queues for Claude Haiku 4.5 arbitration, < 0.75 stays standalone.
- **Audit trail:** every merge decision (auto or arbitrated) is written to `route_matches` via `addRouteMatch` with `matchConfidence`, `cosineSimilarity`, `matchReasoning`, `rerankModel`, and `rerankCost`. Reconciliation summaries are appended to `curated_routes.llmReconciliationLog`.

The old `field_provenance` / `merged_at` / `merge_count` fields and the `route_mentions` table are no longer part of the live schema — reconciliation is now captured by `llmReconciliationLog` on `curated_routes` and by the `route_matches` audit table. Old task files (cascade version) are preserved in git history if revert is ever needed.

---

## Human Test Steps

After all 5 tasks are complete, an administrator should be able to:

1. **Verify Epic 3 backfill complete** — ✅ **PASS CONDITION** — Epic 03 completed 2026-04-15 with all 5,608 routes embedded (1536-dim vectors). Verify: `npx convex run --prod semanticSearch:getRoutesNeedingEmbedding '{"incremental": false, "limit": 1}'` returns 0 routes needing embedding.
2. **Run semantic dedup** — Execute `python -m scripts.curation.pipeline.dedup.semantic_deduplicator`. Verify logged counts at the end of the run: `auto-merge (cosine > 0.92)`, `arbitration queue (0.75 ≤ cosine ≤ 0.92)`, `new routes (cosine < 0.75)`. Confirm runtime under 15 minutes for the full catalog.
3. **Run LLM arbitration batch** — Execute `python -m scripts.curation.pipeline.dedup.llm_arbitrator`. Verify it consumes the arbitration queue, calls Claude Haiku 4.5 on each pair, and updates `route_matches.isArbitrated = true` with `arbitrationNotes`. Inspect per-batch LLM cost in the run log.
4. **Inspect route_matches audit table** — Open the Convex dashboard, open `route_matches`. Spot-check 10 random rows: each should have `matchConfidence`, `cosineSimilarity`, `matchReasoning`, and a valid `routeId`. Verify arbitrated rows have non-null `arbitrationNotes`.
5. **Verify llmReconciliationLog entries** — Query `curated_routes` where `llmReconciliationLog` is non-empty. For each merged route, confirm at least one log entry with `runId`, `reconciledAt`, `conflictsResolved`, and human-readable `notes`.
6. **Spot-check known duplicates** — Confirm “Tail of the Dragon” / “The Dragon” / “Deals Gap” collapses to a single route with source priority merge applied (FHWA > Scenic Byways > Rider Mag > motorcycleroads > BBR > curvature_discovery).
7. **Run quality floor filter** — Execute `python -m scripts.curation.pipeline.quality.floor_filter`. Verify `curated_routes.qualityTier` populated with `premium` / `standard` / `minimal`. Confirm tier distribution is reasonable (not 100% minimal).
8. **Run coverage validation report** — Execute the coverage report generator. Verify `baseline/coverage-report.md` is written with per-state routes, per-archetype routes, and score distribution histograms.
9. **Run data quality report + CI gate** — Execute the data quality generator. Verify the markdown report is written AND the CI gate exits 0 when thresholds pass (or non-zero with a clear failure message when they don't).
10. **Full pipeline end-to-end** — Run source ingest → embed → dedup → arbitration → quality floor → extract → score → classify → push. Verify Convex upsert reflects the reconciled, tiered catalog. Mobile app shows no duplicate routes.
11. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Applicable steps NOW INCLUDE dedup and quality floor for the first time. **Diff against Epic 4 baseline — catalog should shrink due to dedup. Score distributions should tighten. Verify Tail of the Dragon appears exactly once. Verify quality tier distribution is sensible. Landmark spot check: all 5 landmarks appear exactly once.** Write `review.md` with verdict PASS.

All 11 verifications must pass.

---

## Acceptance Criteria (Sprint-Level)

- [ ] `scripts/curation/pipeline/dedup/semantic_deduplicator.py` implements vector-search-based dedup using `findCandidateRoutesByEmbedding`
- [ ] Cosine similarity thresholds: > 0.92 auto-merge, 0.75–0.92 arbitration queue, < 0.75 separate routes
- [ ] Source priority merge order: FHWA > Scenic Byways > Rider Mag > motorcycleroads > BBR > curvature_discovery
- [ ] Every merge decision written to `route_matches` via `addRouteMatch` mutation
- [ ] Every merged route has an `llmReconciliationLog` entry (`runId`, `reconciledAt`, `conflictsResolved`, `notes`)
- [ ] `scripts/curation/pipeline/dedup/llm_arbitrator.py` implements batch LLM arbitration of the mid-confidence queue via Claude Haiku 4.5
- [ ] Arbitrated `route_matches` rows have `isArbitrated = true` and non-null `arbitrationNotes`
- [ ] Per-batch LLM cost logged to the run ledger
- [ ] Dedup end-to-end completes under 15 minutes for the full catalog
- [ ] `scripts/curation/pipeline/quality/floor_filter.py` populates `curated_routes.qualityTier` with `premium` / `standard` / `minimal`
- [ ] Quality tier distribution is sensible (not 100% minimal, not 100% premium)
- [ ] `baseline/coverage-report.md` generated with per-state / per-archetype / score-distribution sections
- [ ] Data quality report generated with CI pass/fail thresholds; CI gate exits 0 on pass, non-zero on fail
- [ ] Full pipeline runs end-to-end with dedup + quality floor active
- [ ] Mobile app shows no duplicate routes

---

## PRD Sections Covered

- **S5.1** — UC-QUAL-01 Deduplicate Routes Across Sources (via semantic matching)
- **S5.2** — UC-QUAL-02 Enforce Quality Floor Filter

---

## Tasks

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks | File |
|----|-------|------|-------|----------|--------|----------|------------|--------|------|
| QUAL-001 | Semantic Deduplication Engine | FEATURE | python-implement | P0 | L | 360 | INF-003, INF-004, INF-006 | QUAL-002, Sprint 7 | [QUAL-001.md](QUAL-001.md) *(not yet written)* |
| QUAL-002 | LLM Arbitration Batch Runner | FEATURE | python-implement | P0 | M | 180 | QUAL-001 | QUAL-003 | [QUAL-002.md](QUAL-002.md) *(not yet written)* |
| QUAL-003 | Quality Floor Filter (premium/standard/minimal) | FEATURE | python-implement | P0 | S | 90 | QUAL-001 | QUAL-004 | [QUAL-003.md](QUAL-003.md) *(not yet written)* |
| QUAL-004 | Coverage Validation Report | FEATURE | python-implement | P1 | M | 180 | QUAL-003 | Sprint 7 | [QUAL-004.md](QUAL-004.md) *(not yet written)* |
| QUAL-005 | Data Quality Report with CI Gating | FEATURE | python-implement | P1 | M | 180 | QUAL-004 | Sprint 12 | [QUAL-005.md](QUAL-005.md) *(not yet written)* |
| QUAL-006 | Implement fetch_all_routes Convex Bridge | FEATURE | python-implement | P0 | S | 60 | QUAL-001 | QUAL-008, Sprint 7 | [QUAL-006.md](QUAL-006.md) |
| QUAL-007 | Calibration Set with Minimum Count Enforcement | FEATURE | python-implement | P1 | S | 45 | QUAL-001 | Sprint-7 tuning | [QUAL-007.md](QUAL-007.md) |
| QUAL-008 | Runtime Benchmark — Full Catalog Dry Run | FEATURE | python-implement | P1 | S | 30 | QUAL-006 | Sprint 7 | [QUAL-008.md](QUAL-008.md) |

**Total Tasks:** 8 (5 original + 3 red-hat remediation)
**Total Estimated Effort:** 1,125 minutes (~18.75 hours)
**Parallelization:** QUAL-001 first → QUAL-002/003/006/007 in parallel → QUAL-004 → QUAL-005 → QUAL-008

### Task Summaries

- **QUAL-001: Semantic Deduplication Engine** — For each `curated_route`, call `findCandidateRoutesByEmbedding` (Epic 3 INF-006) to fetch the top-10 nearest neighbors by cosine similarity. Auto-merge when similarity > 0.92. Queue 0.75–0.92 pairs for LLM arbitration in QUAL-002. Create separate routes below 0.75. Merge using the source priority order (FHWA > Scenic Byways > Rider Mag > motorcycleroads > BBR > curvature_discovery). Append reconciliation entries to `curated_routes.llmReconciliationLog` and audit rows to `route_matches` via the `addRouteMatch` mutation. Cost target: ~$0 (pure vector retrieval; LLM arbitration is QUAL-002's budget). **NOTE**: INF-006 completed in Epic 03 — `findCandidateRoutesByEmbedding` is production-ready and has been verified against 5,608 embedded routes.

- **QUAL-002: LLM Arbitration Batch Runner** — Consume the arbitration queue (cosine similarity 0.75–0.92) produced by QUAL-001. Send batched `(route_a, route_b)` pairs to Claude Haiku 4.5 with a "same road?" decision prompt. On a positive decision, merge the pair using the same source priority rules and append to `llmReconciliationLog`. Update `route_matches.isArbitrated = true` and `arbitrationNotes` with the LLM's stated reasoning. Track per-batch LLM cost in the run ledger.

- **QUAL-003: Quality Floor Filter** — Read the reconciled routes post-dedup. Mark each route as `premium` / `standard` / `minimal` based on data completeness (description, rating, designation, curvature data, elevation, surface). Write `curated_routes.qualityTier`. Log tier distribution counts at the end of the run.

- **QUAL-004: Coverage Validation Report** — Generate `baseline/coverage-report.md` with routes per state, routes per archetype, and score distributions. Sanity-checks the reconciled catalog's breadth.

- **QUAL-005: Data Quality Report with CI Gating** — Comprehensive post-pipeline report with CI pass/fail thresholds (minimum routes per state, minimum routes per archetype, maximum percentage `minimal` tier, non-null description rate, etc.). CI gate exits 0 on pass, non-zero with a clear failure message on fail. Blocks Sprint 12 orchestrator if thresholds are violated.

- **QUAL-006: Implement fetch_all_routes Convex Bridge** *(red-hat remediation)* — Replace the explicit stub `fetch_all_routes()` (returns `[]` unconditionally) with a real paginated Convex HTTP fetch. Uses the `convex_fetch.py` `_dict_to_route` helper and the pagination pattern from `floor_filter.py`. Unblocks production dedup runs.

- **QUAL-007: Calibration Set with Minimum Count Enforcement** *(red-hat remediation)* — Add `label_source: "auto_cosine"` to calibration entries, enforce minimum counts (>= 50 positives/negatives) with WARNING log on shortfall, and add `metadata.meets_minimum` to the JSON schema.

- **QUAL-008: Runtime Benchmark — Full Catalog Dry Run** *(red-hat remediation)* — Add `--dry-run` CLI flag that fetches real routes but skips all writes. Enables safe runtime benchmarking against the full 5,608-route catalog to prove the 15-minute budget.

---

## Dependencies

**Depends On:**
- **✅ SATISFIED** — Epic 03 completed 2026-04-15:
  - INF-003: Convex vector index + `route_matches` + `route_posts_raw` tables ✅
  - INF-004: All 5,608 routes backfilled with `searchEmbedding` ✅
  - INF-006: `findCandidateRoutesByEmbedding`, `addRouteMatch` query wrappers ✅
  - See [Epic 03 RETRO](../epic-03-foundation-models-schema/RETRO.md) for verification evidence.
- Epic 4: Source Diversification (catalog must contain the full merged source set before dedup)

**Blocks:**
- Sprint 7: Quality Infrastructure — Reports
- Sprint 8: Scoring & Calibration (reads reconciled catalog)
- Sprint 12: Orchestrator & E2E Integration (dedup + quality floor are pipeline stages)

---

## Definition of Done

- [ ] All 8 task files written and merged
- [ ] All 8 tasks moved to `Done`
- [ ] `fetch_all_routes()` no longer a stub — real Convex HTTP fetch with pagination (QUAL-006)
- [ ] Calibration set has `label_source`, `metadata.meets_minimum`, and minimum count enforcement (QUAL-007)
- [ ] `--dry-run` mode exists for side-effect-free runtime benchmarking (QUAL-008)
- [ ] Semantic dedup runs on full catalog in under 15 minutes
- [ ] LLM arbitration batch processes the full mid-confidence queue within budget
- [ ] `route_matches` audit table populated; spot-checks show coherent `matchReasoning`
- [ ] `curated_routes.llmReconciliationLog` populated on all merged routes
- [ ] Quality floor produces a tier distribution that makes sense (not 100% minimal)
- [ ] Coverage report generated with per-state / per-archetype / score-distribution sections
- [ ] Data quality report generated; CI gate passes
- [ ] Full pipeline end-to-end test passes with dedup + quality floor active
- [ ] Mobile app shows no duplicate routes (verify "Tail of the Dragon" appears once)
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + updated `baseline/catalog.jsonl` committed
- [ ] Catalog diff vs Epic 4 baseline shows expected dedup-driven shrink
- [ ] User has approved proceeding to Sprint 7

---

## Notes

- **Cosine similarity thresholds (0.92 auto-merge, 0.75 arbitration floor) are initial guesses** — QUAL-001 must emit a held-out test set of known-duplicate pairs so thresholds can be calibrated. Document any adjustment in this epic's close-out notes.
- **Source priority merge order** is fixed: FHWA > Scenic Byways > Rider Mag > motorcycleroads > BBR > curvature_discovery. Higher-priority sources win on conflicting fields.
- **Reconciliation is traceable, not destructive** — `llmReconciliationLog` preserves every merge decision, and `route_matches` preserves the full cosine similarity + LLM reasoning. Nothing is silently overwritten.
- **LLM arbitration is bounded** — batch size should be tuned to keep per-run cost under a documented budget. QUAL-002 must log per-batch cost to the run ledger.
- **Quality floor starts non-destructive** — QUAL-003 only writes `qualityTier`; no routes are rejected in this epic. Hard rejection (if ever wanted) belongs to a follow-up opt-in flag, not to the default pipeline.
- **The allowlist mechanism** for manual overrides of quality tier is in scope for QUAL-003 — government data sources may lack rich descriptions but are authoritative and must not be marked `minimal` by default.
- **The previously-planned `route_mentions` table and `field_provenance` / `merged_at` / `merge_count` fields are gone** — replaced by `route_matches` (audit log) and `llmReconciliationLog` (reconciliation summary on the route itself). See `../epic-03-foundation-models-schema/INF-003.md` for the schema contract.
- **Epic 03 completion note**: The INF-003 schema contract referenced here is now deployed in production Convex. All 5,608 routes have populated `searchEmbedding` fields. Dedup can run against the full production catalog without requiring a re-embed. See [Epic 03 RETRO](../epic-03-foundation-models-schema/RETRO.md) for production verification evidence.
- **Old QUAL task files (rapidfuzz cascade version)** are preserved in git history. Don't reference them from the new task files — they will be rewritten in a separate pass.
- **Boy Scout rule applies** — if the dedup run surfaces a latent bug in the embedding pipeline (INF-004) or the query wrappers (INF-006), fix it as part of this epic and document in the close-out notes.

---

## Task Detail Files

Generated by `/kb-sprint-tasks-plan` on 2026-04-18T00:00:00Z (TASK-TEMPLATE v5.0, avg quality 113/115).

- [QUAL-001-semantic-deduplication-engine.md](QUAL-001-semantic-deduplication-engine.md)
- [QUAL-002-llm-arbitration-batch-runner.md](QUAL-002-llm-arbitration-batch-runner.md)
- [QUAL-003-quality-floor-filter.md](QUAL-003-quality-floor-filter.md)
- [QUAL-004-coverage-validation-report.md](QUAL-004-coverage-validation-report.md)
- [QUAL-005-data-quality-report-with-ci-gating.md](QUAL-005-data-quality-report-with-ci-gating.md)
- [QUAL-006-implement-fetch-all-routes.md](QUAL-006-implement-fetch-all-routes.md) *(red-hat remediation)*
- [QUAL-007-calibration-set-confirmed-labels.md](QUAL-007-calibration-set-confirmed-labels.md) *(red-hat remediation)*
- [QUAL-008-runtime-benchmark-dry-run.md](QUAL-008-runtime-benchmark-dry-run.md) *(red-hat remediation)*
