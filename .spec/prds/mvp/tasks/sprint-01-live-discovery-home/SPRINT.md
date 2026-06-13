---
sprint: 1
title: Live Discovery Home
sequence: 1
timeline: Phase 1
status: In Progress
---

# Sprint 1: Live Discovery Home

**Sequence:** 1
**Timeline:** Phase 1
**Status:** In Progress
**Proposed by:** convex-planner + react-native-ui-planner

---

## Overview

The hero sprint. Open the app → land on a full-bleed Mapbox Discovery map of real ranked curated-route pins drawn from the live 5,654-route Convex catalog — not the chat planning agent, not the 8 hardcoded mock routes. Archetype chips, best/nearest sort, and by-state browse all update the live pin set. The chat agent is demoted to a secondary "Plan a ride" drawer entry, kept and unmodified.

This sprint does the wiring that the strategy always demanded: it connects the healthy catalog (the engine) to the orphaned discovery UI (the dashboard) and drives the car from the front seat for the first time. The five non-observable backend gates (geospatial seed, archetype mapping, state/length normalization, `listCuratedRoutes`) are folded INTO this sprint because they are unbuildable or broken without each other and have no standalone user-observable gate. **Critical ordering:** Discovery is never mounted as the default home while still rendering `MOCK_ROUTES` — the default-landing flip (DISC-001) lands only after DISC-003 wires live data.

---

## Human Test Deliverable

At the end of this sprint a reviewer can, on a real device, open the app and see real ranked curated-route pins on a Mapbox map (not chat, not mocks), filter and sort them live, browse by state, and reach the chat agent only via the "Plan a ride" drawer.

**Test Steps:**
1. Launch the app on a real device and observe it open directly to the Discovery map (not the chat planning screen).
2. Observe real curated-route pins appear on the map (not the 8 hardcoded mock routes) drawn from the live Convex catalog.
3. Tap an archetype chip (e.g. "Scenic") and observe the pin set update to only matching routes, with the chip's count badge reflecting live data.
4. Toggle the sort between **Best** and **Nearest** and observe the pin ordering and the rank/distance labels update.
5. Open the drawer and observe "Discover" is the primary entry, with a separate "Plan a ride" entry that opens the unmodified chat screen.
6. Navigate Discover → Plan a ride → Discover and observe the drawer never points two entries at the same screen.
7. Select a state (e.g. North Carolina) and observe pins for that state appear, including routes stored under both dirty spelling variants of the state.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DATA-007 | Remove stale `react-native/` shadow dir + fix workspace config so builds stay green on both platforms | planner | 60 min |
| DATA-001 | Seed `@convex-dev/geospatial` points table from `curated_routes` centroids (idempotent, ~5,654 points) | convex-implementer | 180 min |
| DATA-002 | Archetype mapping transform (UI enum ↔ DB enum) — pure, zero-I/O helper | convex-implementer | 60 min |
| DATA-004 | State-normalize + length-clamp pure transforms applied in the read path (no write-back) | convex-implementer | 90 min |
| DATA-005 | `listCuratedRoutes` public query (bbox via geospatial / state via `by_state` both spellings / archetype[] / sort / limit, Clerk-gated) | convex-implementer | 240 min |
| DISC-002 | Author `useCuratedDiscovery` hook wrapping `listCuratedRoutes` ({routes, isLoading, isEmpty}; 0–1 scores carried unmodified) | react-native-ui-implementer | 120 min |
| DISC-003 | Wire `RouteDiscoveryScreen` off `MOCK_ROUTES` to the live hook (+ state browse via `StateFilterSheet`); scores as bars/%, not 0–100 | react-native-ui-implementer | 180 min |
| DISC-004 | Resolve map divergence: standardize Discovery pins on `MapboxMapView`; rework `RoutePin` off `react-native-maps` `Marker` | react-native-ui-implementer | 240 min |
| DISC-001 | Make Discovery the default landing; demote chat to a "Plan a ride" drawer entry (chat internals unchanged) | react-native-ui-implementer | 180 min |

---

## Human Testing Gate

**Gate:** On a real device, opening the app lands on a full-bleed Mapbox Discovery map of real ranked curated-route pins drawn from the live 5,654-route catalog — not the chat agent and not mock data — with archetype filters and best/nearest sort updating the live pin set, and the chat planning agent reachable only via a secondary "Plan a ride" drawer entry.

---

## Source Coverage

- PRD `04-uc-data.md`: UC-DATA-01 → DATA-001, UC-DATA-02 → DATA-002, UC-DATA-04 → DATA-004, UC-DATA-05 → DATA-005
- PRD `05-uc-disc.md`: UC-DISC-02 → DISC-001, UC-DISC-03 → DISC-003, UC-DISC-04 → DISC-002, UC-DISC-05 → DISC-003, UC-DISC-06 → DISC-004
- PRD `01-scope.md` repo-cleanup bullet → DATA-007
- PRD `09-technical-requirements/01-architecture-posture.md`, `03-data-schema.md`, `04-api-design.md`, `07-ui-infrastructure.md`, `09-routing.md`

## Capability Coverage

- SPATIAL-RESOLVE: seed the geospatial points table from centroids (DATA-001) → consumed by `listCuratedRoutes`
- ARCHETYPE-ALIGN: pure UI↔DB archetype mapping in the read path (DATA-002) → never mutates the DB enum
- DATA-NORM: pure state-normalize + length-clamp in the read path (DATA-004) → no write-back
- FEATURE(D2) listCuratedRoutes: the net-new public browse query (DATA-005)

---

## Blocks

- Sprint 02 (Trustworthy & Legible Discovery)
- Sprint 03 (Route Detail + Close the Loop)
- Sprint 04 (On-Device D9 Capstone)

## Critical Intra-Sprint Ordering

Per the no-mock-home rule, `DISC-001`'s default-landing flip must land **after** `DISC-003` wires live data — Discovery is never the home screen while still showing `MOCK_ROUTES`. Backend gates (`DATA-001/002/004`) precede `DATA-005`; the query precedes `DISC-002` (hook) precedes `DISC-003` (screen wire). `DISC-004` (Mapbox convergence) is independent and may run in parallel with the backend work.

---

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-06-13

- DATA-007-remove-stale-react-native-shadow-dir.md
- DATA-001-seed-geospatial-points-from-centroids.md
- DATA-002-archetype-mapping-transform.md
- DATA-004-state-normalize-and-length-clamp.md
- DATA-005-listCuratedRoutes-public-query.md
- DISC-002-use-curated-discovery-hook.md
- DISC-003-wire-route-discovery-screen-off-mocks.md
- DISC-004-mapbox-map-convergence-pins.md
- DISC-001-discovery-default-home-demote-chat.md
