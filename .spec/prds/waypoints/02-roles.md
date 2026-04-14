---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-14
prd_version: 1.0.0
---

# Roles

## Implementation ownership

- **Full-stack developer (1)** — owns the entire Phase 0.5 build: sourcing pipeline, quality gates, Convex schema + API, op-sqlite mirror, mobile Moments Near Me screen. Reuses existing infrastructure from `../curation/` wherever possible.
- **Founder** — owns: regional seeding (R6, 3 regions), dogfood gate (Saturday-morning ride test on real waypoints before launch), PRD sign-off. Estimated time: 6–12 hours total for regional seeding + ongoing ~1 hour/week for dogfood during Phase 0.5 build.

## Runtime roles

- **Reader/rider** — the primary user. Opens Moments Near Me, browses, saves, downvotes, rides to waypoints. No authentication required for browsing. Account required for save + downvote.
- **Founder as curator** — for founder-seeded waypoints only. Founder seeds regional lists in a CSV/JSON file checked into the repo under `founder-seed/`. Updates once per quarter.
- **Community contributor** — deferred to Phase 1. No community submission in Phase 0.5.

## Role-to-data relationships

| Role | Read waypoints | Save waypoints | Downvote waypoints | Submit new waypoints | Edit waypoints |
|---|---|---|---|---|---|
| Anonymous rider | ✅ | | | | |
| Authenticated rider | ✅ | ✅ | ✅ | | |
| Founder | ✅ | ✅ | ✅ | ✅ (seed list) | ✅ (seed list) |
| Pipeline (automated) | — | — | — | ✅ (ingestion) | ✅ (re-verification) |

## Handoffs

- **Founder → Full-stack developer**: founder produces the regional seed CSVs before Phase 0.5 Epic 5 (sourcing ingestion). Format spec in `04-uc-wsrc.md` UC-WSRC-08.
- **Full-stack developer → Founder**: dogfood gate before launch. Developer hands off a pre-launch build; founder rides to at least one waypoint per MVP region and reports quality.
- **curation-hardening → waypoints**: UC-RIDER-03 in `../curation-hardening/` emits waypoint candidates as a side-effect of the route-mention extraction pipeline. Hand-off is a Convex mutation contract defined in `09-technical-requirements.md` §Rider-forum NLP extension.

## Escalation

- **Taxonomy drift** (rider reports a waypoint that doesn't fit any category): create a ticket, flag for Phase 1 taxonomy review. Do not retro-create a Gather category in Phase 0.5.
- **Chain blocklist miss** (a chain sneaks through): add to the deterministic blocklist via AllThePlaces brand name patch; auto-updates on next Overture sync.
- **Rural coverage gap** (a region has <3 waypoints/20 miles): founder seeds more for that region if it's a dogfood target; otherwise note the gap and address in Phase 1.
