---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-14
prd_version: 1.0.0
---

# Team Contributions

## For implementers

This PRD is written for a single full-stack developer to implement. Contributions from subagents, teammates, or future contributors must follow these norms:

- **Reuse the existing curation pipeline patterns.** Waypoints is an additive thin layer. If you find yourself building a parallel sync mechanism, a parallel Haiku client, or a parallel Convex table access layer, stop — reuse what `../curation/` and `../curation-hardening/` already established.
- **Preserve P0–P6 pipeline principles** verbatim. No on-device LLM. No LLM selection. No model recall. Temperature zero. Deterministic parser boundary. Crawl plan before scrape. See `00-overview.md` §Pipeline Principles.
- **Preserve the Phase 0.5 scope guardrail.** If a task exceeds the 6-week timeline or adds a new top-level UX surface beyond Moments Near Me, stop and escalate. See `../../PRODUCT-STRATEGY.md` Phase 0.5 scope guardrail.
- **Update research artifacts when the implementation reveals new truths.** If a source doesn't behave as the research predicted, update [`../../research/waypoint-demand/`](../../research/waypoint-demand/) with the new finding and a timestamp. Keep truth in one place.

## Out-of-scope contribution patterns

- **Do not add new content types.** Waypoints is already the "second content type" — Phase 0.5 is not the time to design a third.
- **Do not add community submission.** Deferred to Phase 1. If a rider wants to submit a waypoint, note it for Phase 1 and move on.
- **Do not build the Gather category.** Deferred to Phase 1. Gather has a hard dependency on community density that doesn't exist yet.
- **Do not build Surprise Me, Moments Feed, or along-route bloom.** All deferred per Thread 5 Option A decision. See `../../PRODUCT-STRATEGY.md` Phase 0.5 row for Discovery UI.

## Where to start

Read in order:
1. [`../../PRODUCT-STRATEGY.md`](../../PRODUCT-STRATEGY.md) Pillar 1 + Phase 0.5 (context)
2. [`00-overview.md`](./00-overview.md) (this PRD's summary)
3. [`01-scope.md`](./01-scope.md) (boundaries)
4. [`../../research/waypoint-demand/03-findings.md`](../../research/waypoint-demand/03-findings.md) (why the taxonomy is what it is)
5. [`../../research/waypoint-demand/07-quality-gates-architecture.md`](../../research/waypoint-demand/07-quality-gates-architecture.md) (why the quality gates are what they are)
6. [`09-technical-requirements.md`](./09-technical-requirements.md) (how to actually build it)
7. The relevant `04-uc-*.md` or `05-uc-*.md` file for the area you're touching
