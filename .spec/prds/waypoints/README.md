# Waypoints — Moments of Delight Discovery

**Status**: DRAFT v1.0 · Initiated 2026-04-14 · Phase 0.5

## What this is

LaneShadow's **second content type**: a catalog of waypoints — scenic stops, historic sites, iconic independent diners, and (later) rider hangouts — organized by rider intent (**Pause / Wander / Taste** in Phase 0.5; Gather deferred to Phase 1) and discovered through a *Moments Near Me* surface in the mobile app.

Waypoints are parallel to routes, not subordinate. A rider can plan a ride around a waypoint ("let's go see that lighthouse"), find waypoints along a route they've already picked, or open the app cold and discover "what's cool near me."

## Relationship to other initiatives

- **Parent strategy**: [`../../PRODUCT-STRATEGY.md`](../../PRODUCT-STRATEGY.md) Pillar 1 "Discovery spans routes AND waypoints" + Phase 0.5 Feature Sequencing
- **Research validation**: [`../../research/waypoint-demand/`](../../research/waypoint-demand/) — methodology, findings, taxonomy validation, rider lexicon, sourcing alternatives, quality gates architecture
- **Parent pipeline**: [`../curation/`](../curation/) — route catalog, Haiku extraction pattern, op-sqlite sync, intent→SQL
- **Hard dependency**: [`../curation-hardening/07-uc-rider.md`](../curation-hardening/07-uc-rider.md) — UC-RIDER-03 community NLP pipeline is extended to emit waypoint candidates (Taste sourcing)

## PRD structure

| File | Purpose |
|---|---|
| [`00-overview.md`](./00-overview.md) | Product description, problem, solution, pipeline principles |
| [`01-scope.md`](./01-scope.md) | In scope / out of scope for Phase 0.5 |
| [`02-roles.md`](./02-roles.md) | Ownership and founder seeding responsibilities |
| [`03-functional-groups.md`](./03-functional-groups.md) | The four functional groups and use case families |
| [`04-uc-wsrc.md`](./04-uc-wsrc.md) | **WSRC** — Sourcing (Overture, HMDB, GNIS, NRHP, forum NLP, founder seed, density classifier, chain inventory) |
| [`05-uc-wqual.md`](./05-uc-wqual.md) | **WQUAL** — Quality gates (7 layers + 6 rural refinements) |
| [`06-uc-wdisc.md`](./06-uc-wdisc.md) | **WDISC** — Discovery UX (Moments Near Me — map + filters + list + detail + downvote) |
| [`07-uc-wfly.md`](./07-uc-wfly.md) | **WFLY** — Flywheel (downvote loop, freshness SLA, score recalibration) |
| [`08-team-contributions.md`](./08-team-contributions.md) | Contribution guide |
| [`09-technical-requirements.md`](./09-technical-requirements.md) | Data model, APIs, pipelines, costs |

## Headline numbers

| | |
|---|---|
| **Timeline** | 6+ weeks, gated on `curation-hardening` UC-RIDER-03 completion |
| **Sourcing cost** | ~$0 one-time + ~$0/month recurring |
| **LLM cost** | ~$30–50 one-time Phase 0.5 batch with prompt caching enabled |
| **Founder time** | ~6–12 hours for regional seeding (3 regions) |
| **Catalog estimate at launch** | ~50K–150K waypoints (rural density varies) |
| **Ontology** | 3 of 4 categories live in Phase 0.5 (Pause, Wander, Taste); Gather deferred |
