# Epic 3: Foundation — Semantic Matching Infrastructure

**Sequence:** 3 / 12
**Priority:** P0
**Status:** Done
**Estimated Effort:** 600 minutes (~10 hours)

---

## Overview

Build the foundational infrastructure for **semantic route matching**: vector embeddings in Convex, LLM-driven extraction schemas, vector search query wrappers, and extended data models that support LLM-based enrichment and reconciliation.

This epic **replaces** the originally-planned deterministic string-matching cascade (rapidfuzz → geospatial fallback) with a **retrieve-then-rerank** architecture:

1. **Index** — Every curated route gets a vector embedding derived from its `search_text` (name + aliases + state + highway + landmarks).
2. **Extract** — Community posts run through an LLM to extract structured identifiers, sentiment, and attributes (`PostExtraction` schema v2).
3. **Retrieve** — Post embedding → Convex `ctx.vectorSearch()` → top-K candidate routes.
4. **Rerank** — LLM picks the confident match with reasoning; low-confidence → no match, mid-confidence → arbitration queue.
5. **Enrich** — LLM extracts structured fields (surface quality, traffic, scenery, warnings) from the matched post.
6. **Reconcile** — Multiple mentions per route → LLM resolves conflicts, applies temporal decay, weights by source authority.

Epic 3 lays the foundation. Downstream epics (Epic 6 dedup, Epic 9/10 community NLP) execute the pipeline on top of this foundation.

**Critical:** All new Convex fields are `v.optional()` — this epic is NON-BREAKING for existing mobile clients.

**Theme:** Build the semantic matching primitives once, use them everywhere. Replace brittle string matching with vector search + LLM judgment.

**PRD Reference:** [S9 Technical Requirements](../../09-technical-requirements.md) — models, schema, components

---

## Architectural Decision

The previous Epic 3 plan implemented deterministic string matching via `rapidfuzz` with a three-stage cascade (exact → fuzzy → geospatial → new route). Validation testing was never performed on that approach, and analysis revealed critical blind spots:

- **Nicknames**: "The Dragon" vs "Tail of the Dragon" vs "US-129" — rapidfuzz fails on all three mappings.
- **Contextual refs**: "that twisty road past the dam" — no string to fuzzy-match against.
- **Ambiguous names**: "Skyline Drive" exists in multiple states.
- **Regional shorthand**: "that Chattanooga ride" — requires domain knowledge rapidfuzz doesn't have.

Vector search + LLM reranking handles all of these by design: embeddings capture semantic similarity, and LLMs bring world knowledge (motorcycle culture, road nicknames, geographic relationships) to the match decision.

**Rather than validate a known-weak approach, we're pivoting to a stronger one now** while the foundation epic is still being built.

Old task files (rapidfuzz cascade version) are preserved in git commit `0bae608` if revert is needed.

---

## Human Test Steps

After all 7 tasks are complete, an administrator should be able to:

1. **Install dependencies** — Run `pip install -r scripts/curation/requirements.txt` and verify `openai`, `anthropic`, `shapely`, `fiona`, `praw`, `srtm.py`, `gpxpy`, `haversine` all install clean. Run `python -c "import openai, anthropic, shapely, fiona, praw, srtm, gpxpy, haversine; print('OK')"`.
2. **Inspect extended Route model** — Open `scripts/curation/pipeline/models.py`. Verify `Route` has `candidate_identifiers`, `search_text`, `embedding`, `match_confidence`, `llm_reconciliation_log`, plus output fields (`description`, `rating`, `designation`, `surface`, `aadt`, `pavement_iri`, `elevation_gain_m`). Verify dataclasses `LLMExtractionArtifact`, `RouteMatch`, `PostExtraction` exist at module level.
3. **Deploy Convex schema migration** — Run `npx convex dev --once`. Verify no errors. Check Convex dashboard for new `curated_routes` optional fields, the `vectorIndex("by_embedding", {dimensions: 1536})`, the `route_posts_raw` table, and the `route_matches` table.
4. **Batch embed existing routes** — Execute `python -m scripts.curation.pipeline.embed.batch_embed_routes --dry-run` then `--commit`. Verify `query(curated_routes)` in Convex dashboard returns 5k routes all with non-null `searchEmbedding` fields.
5. **Call vector search from Convex CLI** — Execute `npx convex run geospatialIndex:findCandidateRoutesByEmbedding --args '{"embedding":[...1536 floats...], "limit":10}'`. Verify candidate routes return sorted by cosine similarity.
6. **Test LLM extraction schema round-trip** — Run `python -c "from scripts.curation.pipeline.extraction.schema import PostExtraction; p = PostExtraction(road_name_mentions=['Tail of the Dragon'], highway_refs=['US-129'], state_refs=['TN'], sentiment='positive', extraction_confidence=0.92, extraction_model='claude-haiku-4-5', extraction_cost=0.0002); print(p.model_dump_json())"`. Verify JSON round-trips cleanly.
7. **Convex push test** — Run `python -m scripts.curation.pipeline.sync.convex_push --dry-run` against the extended Route output from step 2. Verify serialization includes `searchEmbedding` as float array, `candidateIdentifiers`, `searchText`, `matchConfidence`, and all new enrichment fields. Confirm no type errors and batch size dropped to 10 (reduced from 50 due to embedding payload size).
8. **Verify mobile app still loads** — Start Expo dev server (`npx expo start`), open discovery screen. Verify existing routes still render (new optional fields default to `undefined`).
9. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Verify: (a) baseline Epic 2 catalog unchanged in count and scores (semantic foundation doesn't alter scores yet), (b) all existing routes have non-null `searchEmbedding`, (c) `route_posts_raw` and `route_matches` tables exist and are empty. Write `review.md` with verdict PASS.

All 9 verifications must pass to confirm the foundation is solid. Any failure means a regression that must be fixed before proceeding.

---

## Acceptance Criteria (Epic-Level)

- [x] All new Python dependencies installed and importable (LLM SDKs + geometry libs)
- [x] `Route` and `EnrichedRoute` dataclasses extended with semantic matching + LLM artifact fields
- [x] `LLMExtractionArtifact`, `RouteMatch`, `PostExtraction` dataclasses defined at module level
- [x] `convex/schema.ts` has `vectorIndex("by_embedding", {dimensions: 1536})` on `curated_routes`
- [x] `route_posts_raw` and `route_matches` tables created with proper indexes
- [x] All 5,000 existing curated routes have non-null `searchEmbedding` field
- [x] `findCandidateRoutesByEmbedding` query wrapper implemented and callable via CLI
- [x] `addRouteMatch` mutation validates and persists match audit records
- [x] Extraction schema bumped to v2 with full `PostExtraction` structured contract
- [x] `sync/convex_push.py` serializes embedding + identifier + artifact fields correctly
- [x] Existing baseline pipeline (Epic 2) still runs end-to-end without regression
- [x] Mobile app renders existing routes without crashes
- [x] `npx tsc --noEmit` passes
- [x] `npx convex dev --once` passes
- [x] Curation Review Protocol executed with PASS verdict
- [x] `review.md` + updated `baseline/catalog.jsonl` committed

---

## PRD Sections Covered

- **S9.1** — New components: Data entity extensions, semantic matching infrastructure
- **S9.2** — Convex Schema (curated_routes + vectorIndex + route_posts_raw + route_matches)
- **S9.3** — Architecture decisions (semantic retrieval, non-breaking schema evolution)
- **S1.5** — Cross-Priority Infrastructure

---

## Tasks (7 tasks with full TASK-TEMPLATE v4.0 files + 1 completed stub)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks | File |
|----|-------|------|-------|----------|--------|----------|------------|--------|------|
| INF-001 | Install Semantic Matching Dependencies | INFRA | python-implement | P0 | XS | 30 | VAL-*, BASE-001 | INF-002 | [INF-001.md](INF-001.md) |
| INF-002 | Extended Route Models — Embedding, Identifiers, LLM Artifacts | INFRA | python-implement | P0 | S | 90 | INF-001 | INF-003, INF-004, INF-005, INF-007 | [INF-002.md](INF-002.md) |
| INF-003 | Convex Vector Index + Match Audit Schema | INFRA | convex-implementer | P0 | M | 120 | VAL-004, INF-002 | INF-004, INF-006, INF-007 | [INF-003.md](INF-003.md) |
| INF-004 | Route Embedding Generation Pipeline | INFRA | python-implement | P0 | M | 120 | INF-003 | Epic 9/10 | [INF-004.md](INF-004.md) |
| INF-005 | LLM Extraction Schema Contract — PostExtraction v2 | INFRA | python-implement | P0 | S | 90 | INF-002 | SCO-003, SCO-004, Epic 9/10 | [INF-005.md](INF-005.md) |
| INF-006 | Convex Vector Search Query Wrappers | INFRA | convex-implementer | P0 | S | 90 | VAL-004, INF-003 | Epic 6, Epic 9/10 | [INF-006.md](INF-006.md) |
| INF-007 | Convex Push Serialization — Embedding + Artifacts | INFRA | convex-implementer | P1 | S | 60 | INF-002, INF-003 | Epic 9/10 | [INF-007.md](INF-007.md) |
| INF-011 | US_STATES Allowlist in Crawl Plan Inventory | INFRA | python-implement | P2 | S | 60 | BASE-009b | None | [INF-011-us-states-allowlist.md](INF-011-us-states-allowlist.md) (Phase 1 DONE) |

**Total Tasks:** 8 (7 backlog + 1 phase-1 complete)
**Total Estimated Effort:** 600 minutes (~10 hours) for backlog tasks
**Parallelization:** INF-001 first → INF-002 → (INF-003, INF-005 in parallel) → (INF-004, INF-006, INF-007 in parallel)

---

## Dependencies

**Blocks:**
- Epic 4: Source Diversification — needs extended Route model + Convex schema
- Epic 6: Quality Infrastructure — Dedup & Floor — **REWRITE REQUIRED** (cascade logic obsolete; use vector similarity + LLM arbitration)
- Epic 7: Quality Infrastructure — Reports
- Epic 8: Scoring & Calibration — reads from reconciled LLM extractions
- Epic 9: Community Sources — Ingestion — **SIMPLIFIES** (~30%, single LLM extraction call replaces multi-stage rapidfuzz)
- Epic 10: Community Sources — NLP & Signals — **SIMPLIFIES** (~40%, LLM does aspect scoring/sentiment/attributes in one call)
- Epic 11: Mobile UI — New Field Display
- Epic 12: Pipeline Orchestrator & E2E Integration

**Depends On:**
- Epic 1: Week 0 Validation (VAL-004 provides the GeospatialIndex prerequisite; still valid for mobile viewport queries)
- Epic 2: Baseline Pipeline Validation (can't extend a broken pipeline)

---

## Downstream Ripple Effects — PENDING EPIC REWRITES

This semantic matching pivot requires rewriting or simplifying the following downstream epics. They are flagged here so the project team knows to revisit them **before** execution:

### Epic 6 (Quality Infrastructure — Dedup & Floor) — REWRITE REQUIRED

**Old logic:** Three-stage cascade (exact name → fuzzy name → geospatial fallback → new route).

**New logic:**
```
candidate_routes = findCandidateRoutesByEmbedding(post.embedding, limit=10)
for candidate in candidate_routes:
  if cosine_similarity > 0.92:
    auto_merge()                      # high confidence
  elif cosine_similarity > 0.75:
    llm_arbitration_queue()           # LLM decides
  else:
    create_new_route()
```

Net effort: estimated **drop ~25%** (no cascade logic to build, but adds LLM arbitration).

### Epic 9 (Community Sources — Ingestion) — SIMPLIFIES

**Old logic:** Multi-stage extraction — separate name extraction, highway extraction, sentiment classifier, aspect scorer, attribute detector.

**New logic:** Single LLM call per post returning full `PostExtraction` structured output (defined in INF-005). Write to `route_posts_raw`.

Net effort: estimated **drop ~30%**.

### Epic 10 (Community Sources — NLP & Signals) — SIMPLIFIES

**Old logic:** Custom NLP pipeline for sentiment, aspects, attributes; rapidfuzz matching; temporal decay.

**New logic:** Reconciliation only — read `route_posts_raw`, apply match via INF-006 query, run LLM reconciliation for routes with multiple matches, compute temporal decay. All NLP is upstream in the INF-005 schema.

Net effort: estimated **drop ~40%**.

### Epic 8 (Scoring & Calibration) — MINOR REFACTOR

Scoring reads from reconciled LLM extractions (mention_frequency_score, aspect_scores) instead of custom-extracted fields. Net effect: simpler, no effort change.

### Epic 4 (Source Diversification) — STRUCTURALLY UNCHANGED

Same sources ingested, same raw data flow. Extraction becomes uniform across sources (same LLM call pattern). No structural change.

**Recommendation:** Before Epic 6/9/10 are executed, spend one planning session updating their EPIC.md files to reflect this new foundation. Epic 3 can proceed independently in the meantime.

---

## Definition of Done

- [x] All 7 INF task files written and merged
- [x] All 7 tasks moved to `Done`
- [x] `pip install` clean on a fresh virtualenv
- [x] `npx convex dev --once` passes
- [x] All 5,000 existing routes have non-null `searchEmbedding`
- [x] Baseline pipeline (Epic 2) re-runs successfully against extended models
- [x] Mobile app smoke-tested on device — no regression
- [x] Cost ledger for embedding backfill documented (expected ~$0.05 one-time)
- [x] Epic 6/9/10 downstream ripple effects documented in each epic's EPIC.md (can be deferred but flagged)
- [x] User has approved proceeding to Epic 4

---

## Cost Model (Epic 3 Foundation Only)

| Operation | Unit Cost | Expected Volume | Total |
|-----------|-----------|-----------------|-------|
| Route embedding backfill (text-embedding-3-small) | $0.00002/1k tokens | 5k routes × ~80 tok | ~$0.01 |
| Incremental route embedding (ongoing) | $0.00002/1k tokens | ~500/mo | ~$0.001/mo |
| **Epic 3 foundation total** | | | **<$0.05** |

Downstream pipeline LLM costs (extraction, rerank, enrichment, reconciliation) are budgeted in Epic 9/10, not Epic 3. Foundation only pays for the one-time embedding backfill.

**Projected Epic 9/10 LLM budget (for reference, not this epic):**
- Post extraction (100k posts × $0.002/call) = $200
- LLM rerank (60k candidate sets × $0.003/call) = $180
- LLM enrichment (30k matches × $0.003/call) = $90
- LLM reconciliation (5k multi-match routes × $0.005/call) = $25
- **Downstream total:** ~$495 one-time + small ongoing

---

## Notes

- **Non-breaking schema change is critical** — all new Convex fields MUST be `v.optional()`. Older mobile app versions in the wild continue to work.
- **Boy Scout rule applies** — if INF-002 reveals an existing bug in `models.py`, fix it as part of this epic.
- **Vector dimension choice:** 1536 (OpenAI `text-embedding-3-small`). Chosen for low cost + broad ecosystem support. Can upgrade later without schema break — the field is `v.array(v.number())`, dimensions are enforced only at the index level.
- **Cosine similarity thresholds (0.92 auto-merge, 0.75 arbitration)** are initial guesses — Epic 6 should calibrate against a held-out test set.
- **Convex has native vector search** via `.vectorIndex()` and `.vectorSearch()` — no external vector DB needed. One source of truth, simpler ops.
- **LLM provider split:** OpenAI for embeddings (cheap, broad), Anthropic/Claude for all reasoning calls (extraction, rerank, enrichment, reconciliation) per project convention.
- **Old INF-001 through INF-007 task files** are preserved in git commit `0bae608` if revert is needed.

