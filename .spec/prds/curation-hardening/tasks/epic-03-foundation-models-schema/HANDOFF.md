# Epic 3 Handoff — Cold Pickup for New Context Window

**Written**: 2026-04-15T09:00Z
**Branch**: main
**Last commit**: `bddcbc0 epic-03: add 429-aware backoff to extract stage`

---

## What Is Epic 3

Foundation infrastructure for semantic route matching in LaneShadow's curation pipeline. Vector embeddings in Convex, LLM-driven extraction schemas, vector search query wrappers, and extended data models. See `EPIC.md` in this directory for the full spec.

## What's Done (Committed, Verified)

### Code (INF-001 through INF-007 + adjustments)

| Task | Status | Key Files |
|------|--------|-----------|
| INF-001 Dependencies | ✅ Done | `scripts/curation/requirements.txt` — openai, anthropic, fiona, praw, srtm.py, gpxpy, haversine |
| INF-002 Python models | ✅ Done | `scripts/curation/pipeline/models.py` — Route, EnrichedRoute, LLMExtractionArtifact, RouteMatch, CommunityWaypointMention |
| INF-003 Convex schema | ✅ Done | `convex/models/curated-routes.ts`, `convex/schema.ts` — vectorIndex(by_embedding, 1536), route_posts_raw, route_matches, community_waypoint_mentions |
| INF-004 Embedding pipeline | ✅ Done (code) | `scripts/curation/pipeline/embed/batch_embed_routes.py` — CLI, retry, cost ledger. `getRoutesNeedingEmbedding` Convex query exists. |
| INF-005 PostExtraction v3 | ✅ Done | `scripts/curation/pipeline/extraction/schema.py` — EXTRACTION_SCHEMA_VERSION=3, waypoint_mentions, WaypointMentionHint |
| INF-006 Semantic search | ✅ Done | `convex/semanticSearch.ts` — 7 wrappers + findCandidateRoutesHybrid + addCommunityWaypointMention |
| INF-007 Convex push | ✅ Done | `scripts/curation/pipeline/sync/convex_push.py` — batch_size=10, new field serialization |
| INF-011 US States | ✅ Phase 1 | `INF-011-us-states-allowlist.md` |
| INF-012 Descriptive summary | Spec only | `INF-012-descriptive-summary-pregeneration.md` — Backlog, no code |
| INF-013 Calibration | Spec only | `INF-013-hybrid-route-search-calibration.md` — Backlog, no code |

### Remediation (R1–R9 from red-hat reviews)

| Fix | Status | Evidence |
|-----|--------|----------|
| R1 conftest.py import fix | ✅ | `1120c65` — pytest collects 375 tests |
| R2 Remove `as any` | ⚠️ 4/6 fixed | `5f44482`, `a7b2151` — 2 `(q: any)` filter casts remain (Convex SDK limitation, `convex/types.ts:25`) |
| R3 Index findRoutesByIdentifier | ✅ | `a643b13` — uses by_name_lower, by_highway_number via .withIndex() |
| R4 Hybrid search parallelism | ✅ | `ffea927` — outer Promise.all wraps vector + text |
| R5 Behavioral tests | ✅ | `8bb2216` — 28/28 pass, 0 readFileSync |
| R6 by_proposed_category index | ✅ | `50b5098` |
| R7 Pytest triage | ✅ | `633b1d7` — 374 passed, 1 skipped (legit data-gated) |
| R8 Embedding backfill | ❌ Blocked | Only 200 test seeds were embedded; seeds now deleted; real data not yet loaded (see below) |
| R9 TDD checkboxes + sign-offs | ✅ | `3d52bff` — 53/53 REFACTOR, 7/7 APPROVED |

### Waypoints PRD Coordination (Track B)

| Item | Status | Evidence |
|------|--------|----------|
| B1 PostExtraction v3 + waypoint_mentions | ✅ | In extraction/schema.py |
| B2 Convex schema (descriptiveSummary, postEmbedding, community_waypoint_mentions) | ✅ | In schema.ts |
| B3 Hybrid search + addCommunityWaypointMention | ✅ | In semanticSearch.ts |
| B4 INF-012 + INF-013 task files | ✅ | `a521657` |
| B5 Waypoints PRD edits | ✅ | `ff4b579` — candidate_route_ids, searchEmbedding optional fields |

### Pipeline State Manager

| Item | Status | Evidence |
|------|--------|----------|
| Module created | ✅ | `scripts/curation/pipeline/state_manager/` (db.py, cli.py, stages.py, normalize.py, quality.py) |
| SQLite DB | ✅ | `.pipeline-state/curation.db` |
| Committed | ✅ | `84345d9` + `cb30aea` + `bddcbc0` |

---

## What's NOT Done — THE BLOCKER

### Full data load pipeline is stuck at the EXTRACT stage

**State of the pipeline DB** (`.pipeline-state/curation.db`):

| Source | Ingested | Extracted | Pushed | Embedded |
|--------|----------|-----------|--------|----------|
| motorcycleroads | 1,897 | 0 | 0 | 0 |
| bestbikingroads | 3,224 | 0 | 0 | 0 |
| fhwa | 645 | 0 | 0 | 0 |
| **Total** | **5,766** | **0** | **0** | **0** |

**Convex `curated_routes` table: 0 rows** (200 test seeds were deleted, real data not yet pushed).

### Why extraction is stuck

The extraction client (`scripts/curation/pipeline/extraction/client.py`) uses **z.ai API** with `glm-4.7-flash` model. This endpoint has aggressive rate limiting (~1 request per minute). At that rate, 5,766 routes would take **~96 hours**.

A dry-run of 5 routes succeeded (commit `bddcbc0` added 429-aware backoff), confirming the pipeline code works. The blocker is purely **throughput**.

**Cost per route**: ~$0.0001 (total ~$0.58 for all 5,766 — very cheap).

### The decision needed

The extraction client at `scripts/curation/pipeline/extraction/client.py` is hardcoded to z.ai. To fix the throughput problem, you need to either:

1. **Switch to Anthropic Claude Haiku** — `ANTHROPIC_API_KEY` is set in `.env.local`. Higher rate limits. Cost ~$15-25 total. Requires modifying `ExtractionClient` to use the Anthropic SDK or an OpenAI-compatible proxy.

2. **Switch to OpenAI GPT-4o-mini** — `OPENAI_API_KEY` is set. Very high rate limits (500+ RPM). Cost ~$3-5 total. Client already uses the OpenAI SDK — just change `base_url` and `model`.

3. **Stay on z.ai, accept 96-hour runtime** — set `max_workers=1` and run overnight/over-days.

**Recommended**: Option 2 (GPT-4o-mini) is lowest friction — the ExtractionClient already uses the OpenAI SDK. Change 2 lines:
```python
# client.py line 23 — change base URL
# ZAI_BASE_URL = "https://api.z.ai/api/paas/v4"  # comment out
# Use default OpenAI URL (no base_url override needed)

# client.py line 86 — change model  
# self._model = model or "glm-4.7-flash"
self._model = model or "gpt-4o-mini"
```

Then run:
```bash
python3 -m scripts.curation.pipeline.state_manager extract --limit 10  # test 10
python3 -m scripts.curation.pipeline.state_manager extract              # full run
python3 -m scripts.curation.pipeline.state_manager push
python3 -m scripts.curation.pipeline.state_manager embed
python3 -m scripts.curation.pipeline.state_manager quality-report
```

---

## How to Resume (Step by Step)

### Step 0: Verify state
```bash
cd /Users/justinrich/Projects/LaneShadow
sqlite3 .pipeline-state/curation.db "SELECT source, COUNT(*) total, SUM(CASE WHEN extracted_at IS NOT NULL THEN 1 ELSE 0 END) extracted, SUM(CASE WHEN pushed_at IS NOT NULL THEN 1 ELSE 0 END) pushed, SUM(CASE WHEN embedded_at IS NOT NULL THEN 1 ELSE 0 END) embedded FROM route_state GROUP BY source;"
```
Expected: 5,766 ingested, 0 extracted, 0 pushed, 0 embedded.

### Step 1: Fix extraction throughput
Decide on API (see "The decision needed" above). Modify `scripts/curation/pipeline/extraction/client.py` accordingly.

### Step 2: Clear stale pipeline runs
```bash
sqlite3 .pipeline-state/curation.db "UPDATE pipeline_runs SET status='cancelled' WHERE status='running';"
```

### Step 3: Extract (the expensive step)
```bash
python3 -m scripts.curation.pipeline.state_manager extract --limit 10  # verify
python3 -m scripts.curation.pipeline.state_manager extract              # full run (~30-60 min with fast API)
```

### Step 4: Push to Convex
```bash
python3 -m scripts.curation.pipeline.state_manager push
```

### Step 5: Embed
```bash
python3 -m scripts.curation.pipeline.state_manager embed
```

### Step 6: Quality report
```bash
python3 -m scripts.curation.pipeline.state_manager quality-report
```

### Step 7: Verify in Convex
```bash
npx convex run semanticSearch:getRoutesNeedingEmbedding '{"incremental": false, "limit": 1}' | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Convex has {len(d)} routes')"
```
Expected: ~5,700+ routes.

### Step 8: Commit
```bash
git add .pipeline-state/ .spec/research/curation-hardening/artifacts/
git commit -m "epic-03: complete full data load (5,766 routes extracted, pushed, embedded)"
```

---

## Key File Paths

| Purpose | Path |
|---------|------|
| Epic spec | `.spec/prds/curation-hardening/tasks/epic-03-foundation-models-schema/EPIC.md` |
| Task files | `INF-001.md` through `INF-013.md` in this directory |
| Red-hat reviews | `.spec/reviews/red-hat-epic-03-*.md` (3 rounds) |
| Approved adjustment plan | `~/.claude/plans/validated-whistling-journal.md` |
| State manager | `scripts/curation/pipeline/state_manager/` |
| Pipeline state DB | `.pipeline-state/curation.db` |
| Extraction client (MODIFY THIS) | `scripts/curation/pipeline/extraction/client.py` |
| Staging data | `staging/motorcycleroads.jsonl` (1,899), `staging/bestbikingroads.jsonl` (3,224), `staging/fhwa.jsonl` (645) |
| Convex schema | `convex/schema.ts`, `convex/models/curated-routes.ts` |
| Semantic search | `convex/semanticSearch.ts` |
| Python models | `scripts/curation/pipeline/models.py` |
| Embedding pipeline | `scripts/curation/pipeline/embed/batch_embed_routes.py` |
| Convex push | `scripts/curation/pipeline/sync/convex_push.py` |
| Cost ledger (stale — only 200 seeds) | `.spec/research/curation-hardening/artifacts/inf004-embedding-cost-ledger.md` |

---

## Known Residual Issues (Non-Blocking)

1. **2 `(q: any)` filter casts** at `convex/semanticSearch.ts:78, 656` — Convex SDK limitation, root cause in `convex/types.ts:25`. Low priority.
2. **semanticSearch.test.ts uses hand-rolled vi.fn() mocks** instead of `convexTest(schema)`. 28/28 pass, behavioral, but not exercising Convex runtime. Medium priority.
3. **INF-012 and INF-013 are spec-only** — genuine Backlog tasks, not implemented. Defer or schedule separately.
4. **Stale comment** at `batch_embed_routes.py:314` says "not yet wired" but function IS wired. Cosmetic.

---

## After Full Load Completes, Epic 3 Is Done

Once steps 1–8 above finish and `quality-report` looks clean:
- Re-run EPIC.md Human Test Steps 1–9 (especially Step 4: batch embed, Step 5: vector search CLI)
- Update this HANDOFF.md to mark COMPLETE
- Epic 4/6/9/10 can proceed
