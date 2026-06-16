---
title: LaneShadow Discovery-MVP
version: 3.0.0
scope_posture: full
pr_sequencing: false
---

# LaneShadow Discovery-MVP — PRD

Re-anchor LaneShadow on its strategic hero — **Discovery** — by surfacing the curated-route catalog on the route plan view (the app's home) and wiring it, end to end, to live Convex data on real iOS + Android devices. The one job: **open the app → find a great road near me (or by state) → see why it's good and whether today is rideable → save it → go ride it.**

> **Grounding:** This PRD was authored by a project planner team (product-manager lead, convex-planner, react-native-ui-planner, frontend-designer) against the locked scope from the prior scoping workflow AND a live D0 data verification (`convex export` of the dev deployment: **5,654 curated routes**, 100% centroids, 0–1 scores, 55% geometry, empty enrichment, dirty state strings). See [08-team-contributions.md](./08-team-contributions.md).

> **✅ v3.0.0 (2026-06-15): the separate discovery view is removed.** Discovery is the behavior of the **route plan view** (map + chat home): curated-route **suggestion cards** over the chat input (tap → plot) plus **chat-driven natural-language curated discovery** surfaced as the existing route-cards on the map. There is no dedicated Discover screen and no archetype filter-bar / best-nearest sort-toggle / by-state browse picker. This **folds [DELTA-001](./DELTA-001-unified-map-chat-discovery.md) into the canonical PRD body** and tightens it to suggestion-cards-over-the-input + chat NL discovery.

## PRD Metadata

| Field | Value |
|---|---|
| Version | 3.0.0 |
| Scope Posture | Full feature (default) |
| PR Sequencing | Disabled |
| Created | 2026-06-13 |
| Last Updated | 2026-06-15 |
| Active Delta | [DELTA-001](./DELTA-001-unified-map-chat-discovery.md) — folded into the canonical PRD body at v3.0.0 (separate discovery view removed) |

## Document Index

| File | Section | Stability |
|---|---|---|
| [00-overview.md](./00-overview.md) | Product description, problem (strategy/code drift), solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope (5 backend gates + rider surface) / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | Rider / System / Founder roles, tied to personas | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional groups + use case summary | FEATURE_SPEC |
| [04-uc-data.md](./04-uc-data.md) | UC-DATA-01..06 — backend gates + public queries | FEATURE_SPEC |
| [05-uc-disc.md](./05-uc-disc.md) | UC-DISC-01/04/09/10/11 — discovery on the route plan view (suggestion cards + chat NL discovery) + journey capstone | FEATURE_SPEC |
| [06-uc-dtl.md](./06-uc-dtl.md) | UC-DTL-01..04 — lean route detail | FEATURE_SPEC |
| [07-uc-save.md](./07-uc-save.md) | UC-SAVE-01..02 — library save + maps handoff | FEATURE_SPEC |
| [08-team-contributions.md](./08-team-contributions.md) | Authoring team, consolidation decisions, risks, OUT-of-MVP | - |
| [09-technical-requirements/](./09-technical-requirements/README.md) | Technical constitution — folder (architecture, schema, API, deps, risks, UI infra, **routing + Route Delta**, design system) | CONSTITUTION |
| [10-e2e-testing-criteria.md](./10-e2e-testing-criteria.md) | Per-UC test criteria (type, AC ref, setup, pass/fail) | TEST_SPEC |
| [DELTA-001-unified-map-chat-discovery.md](./DELTA-001-unified-map-chat-discovery.md) | **Historical delta (folded into the canonical PRD body at v3.0.0):** remove the dedicated Discover screen; discovery on the route plan view (suggestion cards + chat NL discovery). | FEATURE_SPEC |

## Quick Stats

| Metric | Value |
|---|---|
| Functional Groups | 4 |
| Use Cases | 17 |
| System Components | 11 |
| Data Entities | 4 |
| API Endpoints | 2 |
| Routes | 4 |
| Live catalog (D0) | 5,654 curated routes (dev) |

## Functional Groups

| Group | Prefix | UCs |
|---|---|---|
| Backend Data & Queries | DATA | 6 |
| Discovery (on the route plan view) | DISC | 5 |
| Route Detail | DTL | 4 |
| Library & Handoff | SAVE | 2 |
| **Total** | | **17** |

## The MVP build order (gates before features)

1. **Gates (parallel):** UC-DATA-01 geospatial seed · UC-DATA-02 archetype mapping · UC-DATA-03 curatedRouteRef · UC-DATA-04 state/length normalize · (+ repo cleanup)
2. **Queries:** UC-DATA-05 listCuratedRoutes · UC-DATA-06 getCuratedRouteDetail
3. **Client:** UC-DISC-04 hook → UC-DISC-09 suggestion cards over the plan input → UC-DISC-10 chat-driven curated discovery (card→map loop) → UC-DISC-11 no-separate-screen contract
4. **Detail + close loop:** UC-DTL-01..04 → UC-SAVE-01 save · UC-SAVE-02 ride-it
5. **Gate:** UC-DISC-01 full on-device journey (iOS + Android, live Convex)

## Version History

| Version | Date | Changes | Trigger |
|---|---|---|---|
| 1.0.0 | 2026-06-13 | Initial PRD | New initiative (Discovery-MVP) |
| 1.1.0 | 2026-06-13 | Resolved auth posture (gap #1 / R-DATA-9 / open item #74): both Discovery queries locked to Clerk `requireIdentity` (gated); added auth-gate-enforcement precondition note reflecting verified codebase state | Completeness-review gap #1 |
| 2.0.0 | 2026-06-14 | **DELTA-001 (post-start):** remove the dedicated Discover screen — all discovery via one fully-interactive map + chat home; natural-language/chat-driven discovery moved INTO scope; full chat view opens from a footer button right of the chat input. First approved deferred, then **folded into Sprint 01** via `kb-sprint-plan --delta-replan` (ROADMAP: 5→3 sprints). See [DELTA-001](./DELTA-001-unified-map-chat-discovery.md). | Product-owner scope change |
| 3.0.0 | 2026-06-15 | **Separate discovery view removed.** Discovery collapsed to the route plan view: curated-route suggestion cards over the chat input (tap → plot) + chat-driven NL curated discovery via the existing route-card→map loop. Dedicated Discover screen, archetype filter-bar, best/nearest sort-toggle, and by-state browse picker all dropped. DELTA-001 folded into the canonical PRD body; DISC UCs 02/03/05/06/07/08 retired and 09/10/11 authored in full; routing reduced to 4 routes; corrected the pre-existing SAVE count (4→2) so the total is now 17. | Product-owner scope change |

## ⚠️ Downstream actions (v3.0.0 is a FEATURE_SPEC change)

- **Re-plan the sprints.** `ROADMAP.md` and `tasks/sprint-01-live-discovery-home/*` still describe the dedicated-screen / two-mechanism discovery. Re-run `/kb-sprint-plan --delta-replan` (and `/kb-sprint-tasks-plan`) so sprint tasks match v3.0.0 (suggestion cards over the input + chat NL discovery; no dedicated screen, filter-bar, sort-toggle, or by-state picker).
- **Known code↔spec gaps (the v3.0.0 spec is correct; the app still lags — these are the discovery failures observed in testing).** Adversarial review of the live code found: (1) `components/layouts/menu-layout.tsx` still has the removed "Plan a ride" drawer entry; (2) `app/(app)/(tabs)/index.tsx` `handleSelectCuratedRoute` routes a suggestion-card tap through the NL agent as a chat message instead of plotting the already-fetched curated route directly (UC-DISC-09 AC3 expects a direct plot); (3) the suggestion slot falls back to `IDLE_SUGGESTIONS` planning prompts while curated routes load/empty; (4) `hooks/use-curated-route-detail.ts`, `hooks/use-save-curated-route.ts`, and `app/(app)/curated-route/[id].tsx` are not yet implemented; (5) verify the UI→DB archetype mapping is applied (hook or `listCuratedRoutes`) so `scenic`/`cruising`/etc. return results. These belong to implementation, not the PRD.

## Next Steps

- `/kb-sprint-plan` — decompose into human-testable sprints (each sprint's human gate draws [human-gate] criteria from [10-e2e-testing-criteria.md](./10-e2e-testing-criteria.md)).
- `/trd-plan` — generate the detailed TRD from [09-technical-requirements/](./09-technical-requirements/README.md).
