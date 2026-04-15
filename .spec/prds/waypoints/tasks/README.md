# Waypoints Implementation Tasks

This folder holds the implementation plan for the waypoints PRD. Empty scaffold until `/loop` or a planning pass populates it.

See `../README.md` for PRD structure and `../../curation/tasks/` / `../../curation-hardening/tasks/` for the task-breakdown format used by this project.

## Ownership

**Epic 3 Foundation (Semantic Matching Infrastructure)** — The waypoints implementation depends on patterns established in Epic 3 ([`../../curation-hardening/tasks/epic-03-foundation-models-schema/`](../../curation-hardening/tasks/epic-03-foundation-models-schema/)). Key shared components:

- **Vector embeddings** — `searchEmbedding` field on waypoints reuses the 1536-dim OpenAI `text-embedding-3-small` pattern from `curated_routes`
- **Geospatial proximity** — `candidate_route_ids` array uses the same route-proximity scoring logic as Epic 6 deduplication
- **Convex vector search** — `semanticSearch.ts` query wrappers from INF-006 are available for waypoint semantic search

**Epic 3 Status** (as of 2026-04-14):
- ✅ Foundation infrastructure implemented (INF-001 through INF-007)
- ✅ Vector search query wrappers available
- ⚠️ See [`.spec/reviews/red-hat-epic-03-20260414T2210Z.md`](../../../.spec/reviews/red-hat-epic-03-20260414T2210Z.md) for detailed status and remaining work

Implementation planning for this initiative should:

1. Reference the PRD use cases (WSRC-01 through WFLY-03) as the canonical source of requirements
2. Follow the epic-based task breakdown pattern from `../../curation-hardening/tasks/`
3. Honor the 6+ week Phase 0.5 timeline gated on `curation-hardening` UC-RIDER-03 completion
4. Preserve the pipeline principles (P0–P6) throughout implementation
5. Leverage Epic 3 foundation patterns for vector search and geospatial proximity
