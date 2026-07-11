---
title: Route Enrichment — Why This Road Is Good
version: 1.0.0
scope_posture: full
pr_sequencing: false
---

# Route Enrichment — "Why This Road Is Good" — PRD

Fill the empty `curated_route_enrichments` table with one grounded, QA-gated paragraph per
curated route — every claim traceable to that route's real attributes — and render it inside
the existing route detail screen. This is the **R-leg (Richness)** of
[`.spec/FOUNDER-BAR.md`](../../FOUNDER-BAR.md): R1 "every detail view answers *why this road
is worth riding*" + R2 "the couch test".

> **Grounding:** authored by a planner team (product-manager lead, convex-planner,
> frontend-designer) against live repo + data verification: `curated_route_enrichments` = 0
> docs with a leftover web-scraper validator; the detail surface is the full-screen
> `app/(app)/curated-route/[id].tsx` route; the pipeline mirrors the proven geometry
> backfill; the LLM rides the repo's existing pi-ai indirection with a **zai / GLM-5.2**
> enrichment tier (locked 2026-07-10). See [08-team-contributions.md](./08-team-contributions.md).

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Scope Posture | Full feature (default) |
| PR Sequencing | Disabled |
| Created | 2026-07-10 |
| Last Updated | 2026-07-10 |

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional group overview and use case summary | FEATURE_SPEC |
| [04-uc-gen.md](./04-uc-gen.md) | UC-GEN-01 … UC-GEN-03 — Enrichment Generation | FEATURE_SPEC |
| [05-uc-qual.md](./05-uc-qual.md) | UC-QUAL-01 … UC-QUAL-03 — Quality Gate & Couch Test | FEATURE_SPEC |
| [06-uc-why.md](./06-uc-why.md) | UC-WHY-01 … UC-WHY-03 — Rider-Facing "Why" Rendering | FEATURE_SPEC |
| [07-uc-life.md](./07-uc-life.md) | UC-LIFE-01 … UC-LIFE-03 — Enrichment Lifecycle & Ops | FEATURE_SPEC |
| [08-team-contributions.md](./08-team-contributions.md) | Phase contributions | - |
| [09-technical-requirements/](./09-technical-requirements/README.md) | Technical specifications — folder; see its README Section Index (incl. 10-routing.md route/state delta) | CONSTITUTION |
| [10-e2e-testing-criteria.md](./10-e2e-testing-criteria.md) | Per-UC test criteria with type tags, AC refs, setup, pass/fail + UC×journey×tier coverage matrix — sprint gates draw [human-gate] criteria from here | TEST_SPEC |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 4 |
| Use Cases | 12 |
| System Components | 12 |
| Data Entities | 1 repurposed table + 1 route-doc field |
| API Endpoints | 1 public query delta + 9 internal functions/actions |
| External Dependencies | 3 active (z.ai GLM-5.2, OpenAI low-tier QA, @mariozechner/pi-ai) + 4 deferred |
| Routes | 0 new / 1 changed (content states only) |

## Sequencing Constraint

Generation runs **after** the Trust wave's catalog drop (`.spec/prds/catalog-geometry-recovery/`):
only routes that survive the drop **and** have `geometryStatus === 'generated'` are enriched.
Enriching before the drop wastes spend on rows that get deleted and grounds "why" on centroid dots.

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.0.0 | 2026-07-10 | Initial PRD | Saturday Bar R-leg (FOUNDER-BAR.md) |

## Next Steps

- `/kb-sprint-plan` — build the implementation roadmap. **Every sprint's human testing gate draws [human-gate] criteria from [`10-e2e-testing-criteria.md`](./10-e2e-testing-criteria.md).**
- `/review-red-hat` — out-of-band adversarial review of this PRD, then `/kb-prd-plan --update` to fold corrections.
