# Epic 10: Community Sources — NLP Extraction & Signal Merge

**Sequence:** 10 / 12
**Priority:** P2
**Status:** Backlog
**Estimated Effort:** 780 minutes (~13 hours)

---

## Overview

Transform raw community posts (from Epic 9) into structured route-level signals via GLM-based NLP extraction: a keyword quick-filter (Stage 1) prunes ~90% of irrelevant posts, then Claude 3 Haiku (Stage 2) extracts road names, attribute sentiment, and route attributes from the remaining candidates. Extracted mentions are aggregated per route (with authority weighting), merged into `curated_routes` as `mention_frequency`, and the scoring pipeline picks up the new signal at its 10% weight (from Epic 8 SCO-001). Finally, weekly GitHub Actions cron keeps the signal fresh.

**Theme:** Run NLP extraction on community posts, see `mention_frequency` surface in route scores, verify routes with strong community signals rise to the top.

**PRD Reference:** [S7.3, S7.4, S7.5](../../07-uc-rider.md) — UC-RIDER-03, UC-RIDER-04, UC-RIDER-05

---

## Human Test Steps

After all 4 tasks are complete, an administrator should be able to:

1. **Run NLP Stage 1 quick-filter** — Execute `python -m scripts.curation.pipeline.nlp.quick_filter` on community_mentions staging. Verify ~90% reduction rate (only posts with keyword match advance to Stage 2). Verify filter runtime is fast (< 60s for 30k posts).
2. **Run NLP Stage 2 GLM extraction** — Execute `python -m scripts.curation.pipeline.nlp.glm_extractor`. Verify Claude 3 Haiku called per filtered post with JSON schema validation (Instructor). Spot-check extraction output for 20 posts — road name, confidence, sentiment, aspect scores, attribute buckets.
3. **Verify cost tracking** — Check cost log. Verify per-post cost ~$0.0005, total cost for filtered posts matches estimate (~$370 for full backfill). Verify cost logged per extraction batch.
4. **Verify token tracking** — Confirm `total_input_tokens` and `total_output_tokens` logged per run.
5. **Verify caching** — Re-run extraction. Verify cached results (by `post_id`) skip redundant API calls. Cost on re-run should be near-zero.
6. **Run mention aggregation** — Execute `python -m scripts.curation.pipeline.nlp.aggregator`. Verify per-route mention counts over 12-month window. Verify authority weighting: ADVRider post = 1.0, Reddit post = 0.7, Reddit comment = 0.3. Spot-check Tail of the Dragon: should have high `total_mentions` and positive `weighted_sentiment`.
7. **Run signal merge** — Execute `python -m scripts.curation.pipeline.nlp.merge_signals`. Verify `mention_frequency` populated on `curated_routes` (percentile-normalized 0-1). Verify sentiment modifier: >0.6 = +0.05 bonus, <0.3 = -0.05 penalty.
8. **Re-score with community signals** — Run composite scoring. Verify the 10% `mention_frequency` weight from SCO-001 now has real data. Verify Tail of the Dragon score rises vs pre-merge. Verify routes with no community signals still score normally (mention_frequency=0 default).
9. **Configure weekly scheduling** — Set up `.github/workflows/community_ingest.yml` with weekly cron trigger. Verify cron triggers the pipeline orchestrator community ingest stage. Verify env var secrets are wired.
10. **Verify idempotency** — Trigger the cron manually twice in quick succession. Verify second run detects already-processed posts and skips them.
11. **Verify notification** — Inspect GitHub Actions logs. Verify summary notification includes post count, new mentions, errors.
12. **Full pipeline end-to-end with community signals** — Run source ingest → dedup → quality floor → calibration → extract → score (with community signals) → classify → push. Verify mobile app now shows routes with community-driven ranking — Rider-recommended routes should rise to the top.

13. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Step 9 (NLP + signal merge) is NOW ACTIVE for the first time. Full applicable steps: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12. **Diff against Epic 9 baseline — `mention_frequency` field NOW populated on routes. Score distributions shift again (community signals feed into 10% weight). Top-10 routes may shift further — routes with high community engagement should rise. Verify cached NLP results cut cost to near-zero on re-run. Extraction cost for first run should match pilot estimate (~$370 for full backfill, much less for incremental).** Write `review.md` with verdict PASS.

All 13 verifications must pass.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/nlp/quick_filter.py` implements keyword-based Stage 1 filter
- [ ] `scripts/curation/pipeline/nlp/glm_extractor.py` implements Haiku Stage 2 extraction
- [ ] `scripts/curation/pipeline/nlp/aggregator.py` implements mention aggregation
- [ ] `scripts/curation/pipeline/nlp/cache.py` implements per-post_id cache
- [ ] `scripts/curation/pipeline/nlp/merge_signals.py` implements signal merge
- [ ] Extraction schema includes: road_name, highway_number, state, confidence, sentiment (overall + 5 aspects), 7 attribute buckets
- [ ] Authority weighting: ADVRider 1.0, Reddit post 0.7, Reddit comment 0.3
- [ ] Mention frequency normalized to 0-1 via percentile ranking
- [ ] Sentiment modifier ±0.05 cap
- [ ] `mention_frequency` populated on `curated_routes` for routes with signals
- [ ] Token + cost tracking per batch
- [ ] Retry with exponential backoff on rate limits
- [ ] Weekly GitHub Actions cron configured and idempotent
- [ ] Full pipeline runs with community signals integrated
- [ ] Top-scored routes reflect community consensus

---

## PRD Sections Covered

- **S7.3** — UC-RIDER-03 Extract Route Mentions via GLM-Based NLP
- **S7.4** — UC-RIDER-04 Merge Community Signals Into Route Scoring
- **S7.5** — UC-RIDER-05 Schedule Incremental Community Ingestion

---

## Tasks (4 stubs)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| RID-003 | GLM NLP Extractor — Two-Stage Pipeline | FEATURE | python-implement | P2 | L | 480 | VAL-001, RID-001, RID-002, INF-001, INF-002 | RID-004 |
| RID-004 | Community Signal Merge into Scoring | FEATURE | python-implement | P2 | M | 180 | RID-003, SCO-001 | INF-004 |
| RID-005 | Incremental Community Ingest Scheduling | INFRA | python-implement | P2 | S | 60 | RID-001, RID-002, RID-003, INF-004 | — |
| INF-010 | GitHub Actions Community Ingest Cron Workflow | INFRA | python-implement | P2 | S | 60 | RID-001, RID-002, RID-003, INF-004 | — |

**Total Tasks:** 4
**Total Estimated Effort:** 780 minutes (~13 hours)
**Parallelization:** RID-003 must complete first → RID-004 → RID-005/INF-010 in parallel

---

## Dependencies

**Blocks:**
- Epic 12: Orchestrator & E2E (signal merge is pipeline stage)

**Depends On:**
- Epic 1: Week 0 Validation (VAL-001 GLM pilot gates RID-003 approach)
- Epic 8: Scoring & Calibration (SCO-001 provides 10% weight for mention_frequency)
- Epic 9: Community Sources — Ingestion (raw posts to extract from)

---

## Definition of Done

- [ ] All 4 task files written and merged
- [ ] All 4 tasks moved to `Done`
- [ ] GLM extraction runs with cached results on re-run
- [ ] Cost per full run under $400 (with caching, incremental much less)
- [ ] `mention_frequency` field populated on top 1000 routes
- [ ] Composite scores reflect community signals
- [ ] Weekly cron runs successfully (manual trigger)
- [ ] Full pipeline end-to-end test with community signals integrated
- [ ] Mobile app shows community-influenced ranking
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + updated `baseline/catalog.jsonl` committed
- [ ] Cost per full run under $400 (with caching, incremental much less)
- [ ] User has approved proceeding to Epic 11

---

## Notes

- **RID-003 is the biggest task in the entire plan (8 hours)** — allocate dedicated focus time
- Stage 1 keyword filter is the cost lever — aim for ~90% reduction before Stage 2 GLM calls
- The 7th attribute bucket (surface type) is new — Stage 2 must extract it from forum text
- Surface type extraction uses cascading sources: MVUM (primary) → OSM tags (secondary) → GLM NLP (tertiary)
- Sentiment modifier is capped at ±0.05 (not ±0.5) per PRD team synthesis decision — prevents community from dominating composite
- The `route_community_signals` table is an intermediate aggregation layer; signal merge writes to `curated_routes.mention_frequency` as the final field
- Pushshift historical backfill (RID-006) feeds into the same NLP pipeline — no code change needed for historical vs incremental
