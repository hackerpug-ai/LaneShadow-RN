---
title: LaneShadow Discovery-MVP
version: 2.0.0
scope_posture: full
pr_sequencing: false
---

# LaneShadow Discovery-MVP — PRD

Re-anchor LaneShadow on its strategic hero — **Discovery** — by making the curated-route catalog the default home and wiring it, end to end, to live Convex data on real iOS + Android devices. The one job: **open the app → find a great road near me (or by state) → see why it's good and whether today is rideable → save it → go ride it.**

> **Grounding:** This PRD was authored by a project planner team (product-manager lead, convex-planner, react-native-ui-planner, frontend-designer) against the locked scope from the prior scoping workflow AND a live D0 data verification (`convex export` of the dev deployment: **5,654 curated routes**, 100% centroids, 0–1 scores, 55% geometry, empty enrichment, dirty state strings). See [08-team-contributions.md](./08-team-contributions.md).

> **⚠️ DELTA-001 (v2.0.0, added 2026-06-14 — folded into Sprint 01):** All discovery moves to **one fully-interactive map + chat home**; the dedicated Discover screen (`discover.tsx` / `RouteDiscoveryScreen`) is removed, natural-language/chat-driven discovery comes **into** scope, and the full chat view opens from a **footer button to the right of the chat input**. **First approved as deferred; on 2026-06-14 it was folded into Sprint 01** (see [ROADMAP.md](./ROADMAP.md)). Full spec: [DELTA-001-unified-map-chat-discovery.md](./DELTA-001-unified-map-chat-discovery.md).

## PRD Metadata

| Field | Value |
|---|---|
| Version | 2.0.0 |
| Scope Posture | Full feature (default) |
| PR Sequencing | Disabled |
| Created | 2026-06-13 |
| Last Updated | 2026-06-14 |
| Active Delta | [DELTA-001](./DELTA-001-unified-map-chat-discovery.md) — unified map/chat discovery (folded into Sprint 01, 2026-06-14) |

## Document Index

| File | Section | Stability |
|---|---|---|
| [00-overview.md](./00-overview.md) | Product description, problem (strategy/code drift), solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope (5 backend gates + rider surface) / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | Rider / System / Founder roles, tied to personas | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional groups + use case summary | FEATURE_SPEC |
| [04-uc-data.md](./04-uc-data.md) | UC-DATA-01..06 — backend gates + public queries | FEATURE_SPEC |
| [05-uc-disc.md](./05-uc-disc.md) | UC-DISC-01..08 — discovery surface + journey capstone | FEATURE_SPEC |
| [06-uc-dtl.md](./06-uc-dtl.md) | UC-DTL-01..04 — lean route detail | FEATURE_SPEC |
| [07-uc-save.md](./07-uc-save.md) | UC-SAVE-01..02 — library save + maps handoff | FEATURE_SPEC |
| [08-team-contributions.md](./08-team-contributions.md) | Authoring team, consolidation decisions, risks, OUT-of-MVP | - |
| [09-technical-requirements/](./09-technical-requirements/README.md) | Technical constitution — folder (architecture, schema, API, deps, risks, UI infra, **routing + Route Delta**, design system) | CONSTITUTION |
| [10-e2e-testing-criteria.md](./10-e2e-testing-criteria.md) | Per-UC test criteria (type, AC ref, setup, pass/fail) | TEST_SPEC |
| [DELTA-001-unified-map-chat-discovery.md](./DELTA-001-unified-map-chat-discovery.md) | **Post-start delta (v2.0.0):** remove the dedicated Discover screen; all discovery via the interactive map + chat home; NL discovery in scope; full chat via footer button. **Folded into Sprint 01 (see [ROADMAP.md](./ROADMAP.md)).** | FEATURE_SPEC |

## Quick Stats

| Metric | Value |
|---|---|
| Functional Groups | 4 |
| Use Cases | 22 |
| System Components | 11 |
| Data Entities | 4 |
| API Endpoints | 2 |
| Routes | 5 |
| Live catalog (D0) | 5,654 curated routes (dev) |

## Functional Groups

| Group | Prefix | UCs |
|---|---|---|
| Backend Data & Queries | DATA | 6 |
| Discovery Surface | DISC | 8 |
| Route Detail | DTL | 4 |
| Library & Handoff | SAVE | 4 |
| **Total** | | **22** |

## The MVP build order (gates before features)

1. **Gates (parallel):** UC-DATA-01 geospatial seed · UC-DATA-02 archetype mapping · UC-DATA-03 curatedRouteRef · UC-DATA-04 state/length normalize · (+ repo cleanup)
2. **Queries:** UC-DATA-05 listCuratedRoutes · UC-DATA-06 getCuratedRouteDetail
3. **Client:** UC-DISC-04 hook → UC-DISC-02/05/06 mount+wire+Mapbox → UC-DISC-03/07/08 browse+polish
4. **Detail + close loop:** UC-DTL-01..04 → UC-SAVE-01 save · UC-SAVE-02 ride-it
5. **Gate:** UC-DISC-01 full on-device journey (iOS + Android, live Convex)

## Version History

| Version | Date | Changes | Trigger |
|---|---|---|---|
| 1.0.0 | 2026-06-13 | Initial PRD | New initiative (Discovery-MVP) |
| 1.1.0 | 2026-06-13 | Resolved auth posture (gap #1 / R-DATA-9 / open item #74): both Discovery queries locked to Clerk `requireIdentity` (gated); added auth-gate-enforcement precondition note reflecting verified codebase state | Completeness-review gap #1 |
| 2.0.0 | 2026-06-14 | **DELTA-001 (post-start):** remove the dedicated Discover screen — all discovery via one fully-interactive map + chat home; natural-language/chat-driven discovery moved INTO scope; full chat view opens from a footer button right of the chat input. First approved deferred, then **folded into Sprint 01** via `kb-sprint-plan --delta-replan` (ROADMAP: 5→3 sprints). See [DELTA-001](./DELTA-001-unified-map-chat-discovery.md). | Product-owner scope change |

## Next Steps

- `/kb-sprint-plan` — decompose into human-testable sprints (each sprint's human gate draws [human-gate] criteria from [10-e2e-testing-criteria.md](./10-e2e-testing-criteria.md)).
- `/trd-plan` — generate the detailed TRD from [09-technical-requirements/](./09-technical-requirements/README.md).
