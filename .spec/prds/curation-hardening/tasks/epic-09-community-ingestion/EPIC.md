# Epic 9: Community Sources — Ingestion

**Sequence:** 9 / 12
**Priority:** P2
**Status:** Backlog
**Estimated Effort:** 620 minutes (~10 hours)

---

## Overview

Ingest raw community content from ADVRider's 17 regional forum RSS feeds, Reddit's 3 motorcycle subreddits (via public API with strict rate limiting + jitter), and Pushshift historical archives (2020-2025 backfill). These sources populate the `community_mentions` staging table. NLP extraction and signal merge happen in Epic 10.

**Theme:** Run community source ingests and see raw posts land in staging. No NLP yet — just raw text.

**PRD Reference:** [S7.1, S7.2, S7.6](../../07-uc-rider.md) — UC-RIDER-01, UC-RIDER-02, UC-RIDER-06

---

## Human Test Steps

After all 3 tasks are complete, an administrator should be able to:

1. **Run ADVRider RSS ingestion** — Execute `python -m scripts.curation.pipeline.sources.advrider`. Verify posts from all 17 regional forums are fetched via RSS XML parsing. Verify rate limit (1 req/5s) was respected.
2. **Inspect parsed ADVRider posts** — Query `community_mentions` staging table (SQLite or local storage). Verify fields: `post_id`, `source='advrider'`, `forum_id`, `title`, `author`, `preview_text`, `published_at`. Spot-check 5 posts match the live forum view.
3. **Verify ADVRider filtering** — Confirm only route-mentioning posts were retained (keyword match on road/route/highway/pass/canyon etc.). Raw non-filtered count vs filtered count should be logged.
4. **Verify ADVRider incremental tracking** — Check that `last_fetched_at` is stored per forum. Run ingestion again — should only fetch new posts since last run (idempotent).
5. **Run Reddit API ingestion** — Execute `python -m scripts.curation.pipeline.sources.reddit`. Verify 50 req/min rate limit enforced with 1.3s base + 0.1-0.5s random jitter. Verify round-robin across r/motorcycles, r/advrider, r/motorcyclesroadtrip.
6. **Verify Reddit OAuth2** — Confirm `ANTHROPIC_*` or `REDDIT_CLIENT_ID` env vars are set and Reddit API responds 200. Spot-check posts in staging table.
7. **Verify Reddit fallback** — Force a 429 response (mock). Confirm exponential backoff kicks in. Verify old.reddit.com HTML parsing fallback works when API is rate-limited.
8. **Verify Reddit conservative user agent** — Inspect request headers. Confirm User-Agent is `linux:laneshadow-research:v1.0 (by /u/LaneShadowResearch)`.
9. **Run Pushshift historical backfill** — Execute `python -m scripts.curation.pipeline.sources.pushshift`. Verify 2020-2025 range, ~10k posts per subreddit (30k total), 100 req/min rate limit. Dedup against existing Reddit posts by Reddit post ID.
10. **Inspect staging table totals** — Query `community_mentions` count per source. Should show ADVRider (thousands), Reddit (thousands), Pushshift (30k historical).
11. **Verify no PII stored** — Spot-check posts. Verify author handles are stored (public) but no PII beyond what's publicly available. Verify raw post bodies are stored (needed for NLP in Epic 10).

12. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Applicable steps: 1 (all sources INCLUDING new ADVRider/Reddit/Pushshift community staging), 2, 3, 4, 5, 6, 7, 8, 10, 11, 12. Step 9 (NLP) still N/A — deferred to Epic 10. **Diff against Epic 8 baseline — `curated_routes` table unchanged (community_mentions staging is separate). Route count, scores, archetypes identical. Verify community_mentions staging populated with ~30k+ posts across 3 sources. No regression in curated catalog.** Write `review.md` with verdict PASS.

All 12 verifications must pass. Rate limiting is the biggest risk.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/sources/advrider.py` implements 17-forum RSS fetch
- [ ] `scripts/curation/pipeline/sources/reddit.py` implements OAuth2 + async rate limiting
- [ ] `scripts/curation/pipeline/sources/pushshift.py` implements historical backfill
- [ ] `community_mentions` staging table populated from all 3 sources
- [ ] Rate limits respected: ADVRider 1 req/5s, Reddit 50 req/min with jitter, Pushshift 100 req/min
- [ ] Round-robin subreddit rotation in Reddit ingest
- [ ] Reddit API fallback to old.reddit.com HTML on 429
- [ ] Exponential backoff on 429 responses
- [ ] Conservative user-agent strings on all community requests
- [ ] Last-fetched timestamp/post-id tracking per source
- [ ] Pushshift dedups against existing Reddit posts by post ID
- [ ] All sources run without crashes or bans

---

## PRD Sections Covered

- **S7.1** — UC-RIDER-01 Ingest ADVRider Regional Forum RSS Feeds
- **S7.2** — UC-RIDER-02 Ingest Reddit Motorcycle Subreddit Posts
- **S7.6** — UC-RIDER-06 Historical Backfill from Pushshift

---

## Tasks (3 stubs)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| RID-001 | ADVRider RSS Feed Ingest | FEATURE | python-implement | P2 | M | 200 | INF-001, INF-002 | RID-003 |
| RID-002 | Reddit API OAuth2 Community Source | FEATURE | python-implement | P2 | M | 240 | INF-001, INF-002 | RID-003 |
| RID-006 | Pushshift Historical Backfill | FEATURE | python-implement | P2 | M | 180 | RID-002, INF-001, INF-002 | RID-004 |

**Total Tasks:** 3
**Total Estimated Effort:** 620 minutes (~10 hours)
**Parallelization:** RID-001/RID-002 parallel → RID-006 after RID-002

---

## Dependencies

**Blocks:**
- Epic 10: Community NLP & Signals (RID-003 NLP extraction depends on ingested raw posts)

**Depends On:**
- Epic 3: Foundation (INF-001 deps, INF-002 models)

---

## Definition of Done

- [ ] All 3 task files written and merged
- [ ] All 3 tasks moved to `Done`
- [ ] `community_mentions` staging populated with thousands of raw posts
- [ ] No bans from ADVRider or Reddit
- [ ] Incremental re-runs are idempotent (last-fetched tracking works)
- [ ] Pushshift backfill has ~30k historical posts
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` committed confirming no curated_routes regression
- [ ] User has approved proceeding to Epic 10

---

## Notes

- **Reddit rate limiting is the highest-risk element** — conservative limits and jitter are required per PRD (AD-002 guardrails)
- If Reddit API access is revoked/changed, fall back to old.reddit.com HTML scraping (slower but viable)
- Pushshift's reliability has been inconsistent — verify API accessibility at task start; may need a third-party mirror
- Store raw post bodies in staging — Epic 10 NLP extraction needs them
- The `community_mentions` staging should be deletable without affecting `curated_routes` — it's a transient analysis layer
- No PII should be logged beyond public author handles and public post content
