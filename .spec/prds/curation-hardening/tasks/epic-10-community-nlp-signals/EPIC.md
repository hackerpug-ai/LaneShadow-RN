# Epic 10: Community Sources — Matching, Reconciliation & Signal Merge

**Sequence:** 10 / 12
**Priority:** P1
**Status:** Backlog
**Estimated Effort:** 840 minutes (~14 hours)

---

## Overview

Epic 9 writes raw `PostExtraction` artifacts to the `route_posts_raw` Convex table — one Claude Haiku 4.5 call per community post producing structured identifier mentions, sentiment, aspect scores, attributes, and warnings. **This epic reads those artifacts**, runs semantic matching via `findCandidateRoutesByEmbedding` + LLM rerank to decide which curated route(s) each post mentions, writes `route_matches` audit rows via `addRouteMatch`, and runs LLM reconciliation on routes with multiple conflicting mentions.

After matching and reconciliation, per-route signals are computed and merged into `curated_routes`:

- **`mentionFrequencyScore`** — percentile-normalized count of matched posts over the recency window.
- **Authority-weighted sentiment** — ADVRider post 1.0, Reddit post 0.7, Reddit comment 0.3, weighted by recency decay.
- **Per-aspect scores** — aggregated from `PostExtraction.aspect_scores` across all matched posts for the route.

These feed Epic 8's composite scoring. **All custom NLP (sentiment classifier, aspect scorer, attribute detector, surface-type extractor) is gone** — it's all inside the single Claude call in Epic 9's `PostExtraction` schema. This epic is purely matching, reconciliation, and signal merge.

**Theme:** Read `route_posts_raw`, match every post to its route via semantic search + LLM rerank, reconcile conflicts across multi-mention routes, and watch `mentionFrequencyScore` surface in composite scores.

**PRD Reference:** [S7.3, S7.4, S7.5](../../07-uc-rider.md) — UC-RIDER-03, UC-RIDER-04, UC-RIDER-05

---

## Architectural Decision

Epic 10 previously specified a two-stage NLP pipeline: Stage 1 was a keyword quick-filter (prune ~90% of posts) and Stage 2 was a GLM-4 / Claude Haiku extraction call with custom sentiment classification, custom aspect scoring, custom attribute bucketing, and custom surface-type extraction. Matching was deterministic (road-name + state lookup) and reconciliation was a bespoke aggregation step.

Epic 3's semantic matching pivot folded all of that into a **single Claude Haiku 4.5 call per post** that returns a structured `PostExtraction` (see `../epic-03-foundation-models-schema/INF-005.md`). **✅ DEPLOYED** — The PostExtraction v3 schema referenced here is in production Convex as of Epic 03 completion (2026-04-15). Epic 9 runs that call once per post and persists the artifact to `route_posts_raw`. This epic now focuses only on:

1. **Matching** — `findCandidateRoutesByEmbedding` (Epic 3 INF-006) returns top-10 cosine-similar routes for each post embedding; Claude Haiku reranks them and picks the confident match (if any).
2. **Reconciliation** — routes with multiple matches run through Claude Haiku 4.5 to resolve conflicts (e.g., one post says paved, another says gravel) with recency decay and source authority weighting.
3. **Signal merge** — reconciled signals feed `mentionFrequencyScore` and aspect aggregations on `curated_routes`, which Epic 8 composite scoring consumes.

The Stage 1 keyword filter is gone: a single LLM call is cheap enough (~$0.001 per post × 100k posts ≈ $100 one-time) that pre-filtering adds complexity without saving meaningful cost. The custom sentiment / aspect / attribute / surface extractors are gone: they're all fields on `PostExtraction`. Net effort drops ~40% from the old plan. Old task files (two-stage GLM version) are preserved in git history if revert is ever needed. See `../epic-03-foundation-models-schema/EPIC.md` for the full rationale.

---

## Human Test Steps

After all 3 tasks are complete, an administrator should be able to:

1. **Confirm Epic 9 has populated `route_posts_raw`** — Query Convex: sample 100 rows, verify `payload` is a well-formed `PostExtraction` blob (road_name_mentions, highway_refs, sentiment, etc.) and `extractionSchemaVersion = 3`. **NOTE**: PostExtraction v3 schema (EXTRACTION_SCHEMA_VERSION=3) is deployed in production from Epic 03. Epic 09 will populate route_posts_raw using this schema.
2. **Run post matching** — Execute `python -m scripts.curation.pipeline.match.post_matcher`. Verify `route_matches` table populated with `matchConfidence`, `cosineSimilarity`, `matchReasoning`, `rerankModel`, and `rerankCost`. Log the counts for high-confidence (> 0.92), arbitration (0.75–0.92), and no-match (< 0.75).
3. **Spot-check high-confidence matches** — Pick 10 `route_matches` rows with `matchConfidence > 0.92` and read the `matchReasoning`. Each should be coherent and cite specific identifiers from the post.
4. **Spot-check arbitration matches** — Pick 10 rows with `matchConfidence` in [0.75, 0.92] and verify `isArbitrated = true` and `arbitrationNotes` explains the LLM's reasoning.
5. **Run route reconciliation** — Execute `python -m scripts.curation.pipeline.reconcile.route_reconciler`. Verify `curated_routes.llmReconciliationLog` entries appear on multi-mention routes with `runId`, `reconciledAt`, `conflictsResolved`, and `notes`.
6. **Verify signal fields populated** — Query `curated_routes` for Tail of the Dragon (or an equivalent high-mention route). Verify `mentionFrequencyScore` is a percentile-normalized value in [0, 1], and that reconciled aspect signals are present.
7. **Run Epic 8 composite scoring** — Re-run scoring. Verify the `mentionFrequencyScore` weight now has real data and that routes with high community engagement rise accordingly.
8. **Verify cost tracking** — Inspect the run ledger: per-batch cost logged for post matching AND reconciliation. Total matches run should fall within the cost budget documented in Epic 3.
9. **Verify idempotency** — Re-run post matching. Posts that already have a `route_matches` row should be skipped. Second-run cost should be near-zero.
10. **Full pipeline end-to-end** — Run source ingest → embed → dedup → quality floor → extract (Epic 9) → match (this epic) → reconcile → score → classify → push. Verify mobile app now shows community-influenced ranking.
11. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. **Diff against Epic 9 baseline — `mentionFrequencyScore` NOW populated. Score distributions shift as community signals feed the composite. Top-10 routes may shift further — routes with high community engagement should rise.** Write `review.md` with verdict PASS.

All 11 verifications must pass.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/match/post_matcher.py` implements post-to-route semantic matching via `findCandidateRoutesByEmbedding` + Claude Haiku 4.5 rerank
- [ ] Every matched post produces a `route_matches` row via the `addRouteMatch` mutation
- [ ] `route_matches` row includes `matchConfidence`, `cosineSimilarity`, `matchReasoning`, `rerankModel`, `rerankCost`
- [ ] Mid-confidence matches (0.75–0.92) run through LLM arbitration and set `isArbitrated = true` with `arbitrationNotes`
- [ ] Post matching is idempotent — re-running skips already-matched posts
- [ ] `scripts/curation/pipeline/reconcile/route_reconciler.py` reconciles multi-mention routes via Claude Haiku 4.5
- [ ] Reconciliation resolves conflicts (e.g., surface type disagreement) and logs outcomes to `curated_routes.llmReconciliationLog`
- [ ] Recency decay applied: older mentions weighted less by configurable half-life
- [ ] Source authority weighting: ADVRider 1.0, Reddit post 0.7, Reddit comment 0.3
- [ ] `mentionFrequencyScore` populated on `curated_routes` (percentile-normalized 0–1)
- [ ] Authority-weighted sentiment + aspect score aggregations populated on `curated_routes`
- [ ] Composite scoring (Epic 8) consumes the new signals
- [ ] Per-batch cost tracking for post matching + reconciliation logged to the run ledger
- [ ] Retry with exponential backoff on LLM rate limits
- [ ] Full pipeline runs with community signals integrated
- [ ] Top-scored routes reflect community consensus

---

## PRD Sections Covered

- **S7.3** — UC-RIDER-03 Match Community Posts to Routes (semantic retrieval + LLM rerank)
- **S7.4** — UC-RIDER-04 Merge Community Signals Into Route Scoring
- **S7.5** — UC-RIDER-05 Schedule Incremental Community Ingestion (matches populate on schedule)

---

## Tasks

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks | File |
|----|-------|------|-------|----------|--------|----------|------------|--------|------|
| RID-003 | Community Post Matching — Semantic Search + LLM Rerank | FEATURE | python-implement | P0 | L | 360 | Epic 3 (INF-003, INF-005, INF-006), Epic 9 | RID-005, RID-004 | [RID-003.md](RID-003.md) *(needs rewrite)* |
| RID-005 | Route Reconciliation & Temporal Decay | FEATURE | python-implement | P0 | L | 300 | RID-003 | RID-004 | [RID-005.md](RID-005.md) *(new task)* |
| RID-004 | Merge Community Signals into Composite Scoring | FEATURE | python-implement | P1 | M | 180 | RID-005 | Epic 8 | [RID-004.md](RID-004.md) *(needs rewrite)* |

**Total Tasks:** 3
**Total Estimated Effort:** 840 minutes (~14 hours)
**Parallelization:** Strictly sequential — RID-003 → RID-005 → RID-004.

### Task Summaries

- **RID-003: Community Post Matching — Semantic Search + LLM Rerank** — For each row in `route_posts_raw` that has no associated `route_matches` row yet, build a post embedding from the `PostExtraction` payload (concatenation of `road_name_mentions` + `highway_refs` + `landmark_refs` + a `rawText` prefix) via OpenAI `text-embedding-3-small`. Call `findCandidateRoutesByEmbedding` for the top-10 candidates. LLM-rerank via Claude Haiku 4.5 with the prompt "which candidate is this post about, if any?". Write one `route_matches` row per decision via `addRouteMatch`, including `matchConfidence`, `cosineSimilarity`, and the LLM's stated `matchReasoning`. Mid-confidence matches (0.75–0.92) set `isArbitrated = true` with LLM `arbitrationNotes`. Idempotent: skip posts already present in `route_matches` on re-run. **Epic 03 infrastructure**: `findCandidateRoutesByEmbedding` (INF-006) is production-ready and has been verified against 5,608 embedded routes. Post matching can run against the full production catalog.

- **RID-005: Route Reconciliation & Temporal Decay** — For each curated route with more than one `route_matches` row, run LLM reconciliation via Claude Haiku 4.5. Resolve conflicts across mentions (e.g., one post says paved, another says gravel), apply temporal decay (older mentions weighted less by recency half-life), and weight by source authority (Reddit post score, ADVRider reputation, etc.). Compute `mentionFrequencyScore` (percentile-normalized 0–1 across the catalog), aggregate aspect scores from `PostExtraction.aspect_scores`, and compute authority-weighted sentiment. Append a summary entry to `curated_routes.llmReconciliationLog` (`runId`, `reconciledAt`, `conflictsResolved`, `notes`). Track per-batch LLM cost.

- **RID-004: Merge Community Signals into Composite Scoring** — Read the reconciled signals (`mentionFrequencyScore`, aggregated aspect scores, authority-weighted sentiment) directly from `curated_routes` and feed them into Epic 8's composite scoring pipeline. Similar role to the old plan but reads from reconciled `curated_routes` fields rather than a separate NLP output table.

### Tasks Removed from the Old Plan

The following tasks from the previous Epic 10 plan are **removed** in this rewrite. They are all now folded into Epic 9's single `PostExtraction` LLM call:

- Stage 1 keyword quick-filter — no filter needed, a single Claude Haiku call is cheap enough.
- Stage 2 custom extraction — replaced by `PostExtraction` v2 (Epic 3 INF-005).
- Custom sentiment classifier — field on `PostExtraction`.
- Custom aspect scorer — `PostExtraction.aspect_scores` dict.
- Custom attribute detector — `PostExtraction.attributes` dict.
- Custom surface-type extractor — expressed via `PostExtraction.attributes` and `PostExtraction.warnings`.
- Separate GitHub Actions community ingest cron workflow task — scheduling belongs to Epic 12 orchestrator.

Net effort drops ~40% compared to the old plan.

---

## Dependencies

**Depends On:**
- **✅ SATISFIED** — Epic 03 completed 2026-04-15:
  - INF-003: `route_posts_raw` table, `route_matches` table, `curated_routes.llmReconciliationLog` ✅
  - INF-005: `PostExtraction` v3 schema contract ✅
  - INF-006: `findCandidateRoutesByEmbedding`, `addRouteMatch`, `getRouteMatchesForPost`, `getRawPostsForRoute` query wrappers ✅
  - See [Epic 03 RETRO](../epic-03-foundation-models-schema/RETRO.md) for production verification.
- Epic 9: Community Sources — Ingestion (populates `route_posts_raw` with `PostExtraction` artifacts)

**Blocks:**
- Epic 8: Scoring & Calibration (consumes `mentionFrequencyScore` and reconciled aspect signals)
- Epic 12: Orchestrator & E2E Integration (match + reconcile are pipeline stages)

---

## Definition of Done

- [ ] All 3 task files written and merged
- [ ] All 3 tasks moved to `Done`
- [ ] Post matching runs idempotently; re-run cost near zero
- [ ] `route_matches` table populated with coherent `matchReasoning`; spot-checks pass
- [ ] Reconciliation runs on multi-mention routes; `llmReconciliationLog` populated
- [ ] `mentionFrequencyScore` populated on routes with community signals
- [ ] Composite scores reflect community signals
- [ ] Per-batch cost logged; total cost within the Epic 3 documented budget
- [ ] Full pipeline end-to-end test with community signals integrated
- [ ] Mobile app shows community-influenced ranking
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + updated `baseline/catalog.jsonl` committed
- [ ] User has approved proceeding to Epic 11

---

## Notes

- **All custom NLP is upstream in Epic 9's `PostExtraction` call.** This epic does not classify sentiment, score aspects, detect attributes, or extract surface type — it only matches posts to routes, reconciles conflicts, and merges signals.
- **Matching is idempotent** — re-running `post_matcher.py` must skip rows that already have `route_matches` entries for the current `extractionSchemaVersion`. Versioned skipping allows re-matching when Epic 3's schema bumps.
- **Post embeddings are ephemeral** — they're computed at match time from the `PostExtraction` payload, used for candidate retrieval, and not persisted (the retrievable artifact is the post itself, not its embedding).
- **LLM arbitration for mid-confidence matches** shares the same threshold policy as Epic 6 dedup (0.75–0.92). Keep the thresholds in a shared config module so they can be tuned together.
- **Temporal decay half-life** is initially set to 12 months but must be configurable via a pipeline flag — older posts should still count, just less.
- **Authority weighting** (ADVRider 1.0, Reddit post 0.7, Reddit comment 0.3) is inherited from the old plan and remains unchanged. Weights are applied in reconciliation, not matching.
- **Reconciliation runs at the route level, not the post level** — a route with 50 matched posts gets one reconciliation call, not 50.
- **No `route_mentions` table** — that was the old plan. Live tables are `route_posts_raw` (raw LLM artifacts) and `route_matches` (audit log). See `../epic-03-foundation-models-schema/INF-003.md` for the schema.
- **No `field_provenance` / `merged_at` / `merge_count` fields** — reconciliation state lives in `llmReconciliationLog` on `curated_routes`.
- **Old RID task files (two-stage GLM version)** are preserved in git history. Don't reference them from the new task files — they will be rewritten in a separate pass.
- **Boy Scout rule applies** — if matching surfaces a bug in the Epic 3 query wrappers (INF-006) or the `PostExtraction` schema (INF-005), fix it as part of this epic and document in the close-out notes.
