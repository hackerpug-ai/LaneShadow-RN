# Curation — Route Discovery & Autonomous Data Flywheel - PRD

Autonomous route curation and discovery system enabling motorcycle riders to find great rides near them or by archetype, powered by Convex-first architecture and a self-improving data flywheel. Routes are stored in a single Convex table; the client queries Convex directly — no client-side database for discovery.

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 1.4.0 |
| Appetite | 6 weeks |
| Scope Level | full |
| Created | 2026-04-10 |
| Last Updated | 2026-04-10 |

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional group overview and use case summary | FEATURE_SPEC |
| [04-uc-discovery.md](./04-uc-discovery.md) | UC-DISC-01 through UC-DISC-07 | FEATURE_SPEC |
| [05-uc-ingest.md](./05-uc-ingest.md) | UC-INGEST-01 through UC-INGEST-04 | FEATURE_SPEC |
| [06-uc-quality.md](./06-uc-quality.md) | UC-QUALITY-01 through UC-QUALITY-03 | FEATURE_SPEC |
| [07-uc-flywheel.md](./07-uc-flywheel.md) | UC-FLY-01 through UC-FLY-02 | FEATURE_SPEC |
| [08-team-contributions.md](./08-team-contributions.md) | Team phase outputs | - |
| [09-technical-requirements.md](./09-technical-requirements.md) | Technical specifications | CONSTITUTION |
| [10-trd-detail.md](./10-trd-detail.md) | Detailed TRD with 6 architecture layers | CONSTITUTION |
| [11-user-personas-detail.md](./11-user-personas-detail.md) | Detailed personas, journeys, pain points | PRODUCT_CONTEXT |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 4 |
| Use Cases | 16 |
| System Components | 7 |
| Data Entities | 3 (single Convex table + intent_param_cache + route_feedback) |
| API Endpoints | Convex queries/mutations/actions (convex-planner output pending) |
| External Dependencies | 8 |
| Architecture Layers | 5 (no op-sqlite layer) |

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.0.0 | 2026-04-10 | Initial PRD | New initiative |
| 1.1.0 | 2026-04-10 | Added ride segment aggregation strategy, lean/rich tier split with shared-ID linking, dedicated §11 on local LLM data shape (selection-only Qwen3.5 pattern). Added AD-7/8/9 to TRD. Split Convex schema into `curated_routes` (lean) + `curated_route_enrichments` (rich). Added `/ingest-enrichments`, `/routes/enrichment`, `/routes/missing-enrichments` APIs. | Local-first LLM recommendation strategy |
| 1.2.0 | 2026-04-10 | Replaced Qwen3.5 candidate-ranking approach (not viable) with validated intent → SQL query param extraction (slot-filling) pattern. Added UC-DISC-07 (intent-based search). Replaced "Local Ranking Service" with "Intent Query Service". Added Research & Decisions section with prior initiative references. Research: `.spec/research/local-models/INTENT_TO_QUERY_RESULTS_2026-04-10.md` | 2026-04-10 Qwen validation test: candidate ranking ❌, slot-filling ✅ (93% pass, 0.84 F1) |
| 1.3.0 | 2026-04-10 | Removed on-device Qwen entirely (environment-bias finding: Mac-MLX benchmarks not valid on mobile). Established Haiku-online + client-side intent cache as the shipping path. Added P0 (no on-device LLM). Retired Qwen deferred path. | `.spec/research/local-models/ENVIRONMENT_BIAS_FINDING_2026-04-10.md` |
| 1.4.0 | 2026-04-10 | **Removed all client-side persistence.** Single `curated_routes` Convex table (no lean/enrichment split). No op-sqlite, no sync layer, no intent_param_cache on client — all Convex. Shared `intent_param_cache` table on server (cross-user cache warming). AD-8/AD-9 retired. AD-13 (single-table), AD-14 (no client DB), AD-15 (shared intent cache). §6 Local SQLite Architecture retired and replaced with Convex query patterns. §7 and §11 rewritten for single-table Convex model. Offline catalog browse dropped — discovery requires connectivity. `curated_route_enrichments` table removed. `/ingest-enrichments`, `/routes/enrichment`, `/routes/missing-enrichments` endpoints removed. convex-planner dispatched for typed function signatures. | Schema collapse decision: lean/enrichment split rationale was Qwen context-window constraint (dead in v1.3) + mobile sync payload (solved by Convex server-side projection, not a second table). |

## Next Steps

- `/kb-project-plan` - Build implementation plan
- `/kb-project-groom` - groom tasks into sprints
- `/kb-run-epic` - execute implementation tasks
