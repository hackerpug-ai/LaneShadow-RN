---
sprint: 1
title: Discovery on the Map/Chat Home
sequence: 1
timeline: Phase 1
status: In Progress
---

# Sprint 1: Discovery on the Map/Chat Home

**Sequence:** 1
**Timeline:** Phase 1
**Status:** In Progress
**Proposed by:** react-native-ui-planner + convex-planner + frontend-designer

> **Reframed by DELTA-001 (2026-06-14).** This sprint originally shipped a dedicated `discover.tsx` / `RouteDiscoveryScreen`. It is now **Discovery on the Map/Chat Home**: discovery happens on the existing map + chat home (`app/(app)/(tabs)/index.tsx`) via curated-route suggestion pills (when no route is on the map) + curated routes surfaced as the existing chat route-cards that render on the map. See [DELTA-001](../../DELTA-001-unified-map-chat-discovery.md) and [ROADMAP](../../ROADMAP.md) Sprint 01.

---

## Overview

The hero sprint. Open the app → land on the single map + chat home (no dedicated Discover screen) → discover curated routes by interacting with the map **and** by chatting, with routes rendered live on the map from the 5,654-route Convex catalog.

**What is DONE (committed):** the five backend gates + the hook — DATA-007 (repo cleanup), DATA-001 (geospatial seed), DATA-002 (archetype map), DATA-004 (state/length normalize), DATA-005 (`listCuratedRoutes`), DISC-002 (`useCuratedDiscovery`). These carry forward unchanged as the data source.

**What is LEFT (the DELTA-001 work, expanded into task files below):** DATA-008 (agent curated-discovery tool), DISC-010..015 (re-key pills → curated content keyed to "no route on map", curated route-cards + card→map loop, footer full-chat button, no-route empty state, remove the dedicated screen), and OPS-001 (guard against the empty-Convex-deployment footgun that killed the app on 2026-06-14).

**Superseded (dedicated-screen work — see "Superseded task files"):** DISC-001 (default-landing/demote), DISC-003 (wire RouteDiscoveryScreen), DISC-004 (Mapbox convergence on the dedicated screen).

---

## Human Test Deliverable

On a real device, open the app to the single map + chat home, discover curated routes via the suggestion pills (no route on map) and by chatting ("twisties near Asheville"), see routes render on the map, tap an earlier chat route-card to re-render it, and open the full chat view from the footer button — with the chat agent integral to the home (no separate Discover screen).

**Test Steps:**
1. Launch the app on a real device and observe it open directly to the full-screen map + chat home (no separate Discover screen, no drawer-hidden chat).
2. With no route on the map, observe suggestion pills above the chat input offering whole curated routes (named curated road with mileage), not generic planning prompts.
3. Tap a suggested-route pill and observe that curated route plot on the map, and the pills disappear once a route is shown.
4. Type "twisties near Asheville" and observe the agent return curated route card(s) in the chat history and plot the latest on the map.
5. Scroll the chat history, tap an earlier curated-route card, and observe it re-render on the map and return you to map view.
6. Clear or dismiss the route and observe the curated suggestion pills return (keyed to no route on map).
7. Tap the button to the right of the chat input and observe the full chat view open; close it and observe the map return.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DATA-007 | Remove stale `react-native/` shadow dir + fix workspace config | planner | 60 min |
| DATA-001 | Seed `@convex-dev/geospatial` points from centroids *(done)* | convex-implementer | 180 min |
| DATA-002 | Archetype mapping transform (UI↔DB) *(done)* | convex-implementer | 60 min |
| DATA-004 | State-normalize + length-clamp transforms *(done)* | convex-implementer | 90 min |
| DATA-005 | `listCuratedRoutes` public query *(done)* | convex-implementer | 240 min |
| DISC-002 | `useCuratedDiscovery` hook *(done; reused as pill + data source)* | react-native-ui-implementer | 120 min |
| DATA-008 | Agent curated-discovery tool: NL → `listCuratedRoutes` → existing `routing_card` (determinism seam) | convex-implementer | 240 min |
| DISC-010 | Re-key suggestion-pill slot to "no active route on the map" (+ `hasActiveRoute`) | react-native-ui-implementer | 120 min |
| DISC-011 | Pill content → whole curated routes from the live catalog (tap → plot) | react-native-ui-implementer | 150 min |
| DISC-012 | Render curated routes as transcript cards + wire the card→map→pin-back loop | react-native-ui-implementer | 180 min |
| DISC-013 | Footer "open full chat" button (reuse `chatMode`), distinct from send | react-native-ui-implementer | 90 min |
| DISC-014 | No-route empty home state (pills + discovery-invite placeholder) | react-native-ui-implementer | 75 min |
| DISC-015 | Remove dedicated `discover.tsx`/`RouteDiscoveryScreen`, drop filter-bar/sort (lands last) | react-native-ui-implementer | 90 min |
| OPS-001 | Guard against empty-Convex-deployment drift (combined dev + loud health check) | convex-implementer | 60 min |

---

## Human Testing Gate

**Gate:** On a real device the app opens to the single map + chat home (no dedicated Discover screen): with no route on the map, suggestion pills offer whole curated routes and tapping one plots it; typing "twisties near Asheville" returns curated routes as chat cards and plots the latest; tapping an earlier card re-renders it and drops back to map view; and the full chat view opens from a button to the right of the chat input.

---

## Source Coverage

- DELTA-001 (folded) → DATA-008, DISC-010..015
- UC-DISC-09 (curated-route suggestion pills) → DISC-010, DISC-011, DISC-014
- UC-DISC-10 (chat-driven curated discovery via the card→map loop) → DATA-008, DISC-012
- UC-DISC-11 (unified map/chat home replaces the dedicated screen) → DISC-013, DISC-015
- UC-DATA-01/02/04/05 → DATA-001/002/004/005 *(done)* · UC-DISC-04 → DISC-002 *(done)*
- ROADMAP Sprint 01 Human Testing Gate (app-live prerequisite) → OPS-001
- Supersedes UC-DISC-02 / 05 / 06 / 07 / 08

## Capability Coverage

- SPATIAL-RESOLVE / ARCHETYPE-ALIGN / DATA-NORM / FEATURE(D2) listCuratedRoutes — DATA-001/002/004/005 *(done)*, reused as the pill + chat data source
- map-chat-discovery — discovery as the **state of the home** (no route ⇒ curated pills; route ⇒ rendered), riding the existing `routing_card` → map → pin-back machinery; NL/chat-driven curated discovery via the agent tool (DATA-008), intent fixtured at the determinism seam (DISC-012)
- dev-workflow-integrity — the deployment every subscription depends on is never silently empty (OPS-001)

---

## Blocks

- Sprint 02 (Route Detail + Close the Loop)
- Sprint 03 (On-Device D9 Capstone) — re-pointed to the unified home

---

## Task Detail Files

Generated by /kb-sprint-tasks-plan (DELTA-001 delta-replan) on 2026-06-14. Each carries a `<!-- REQUIREMENT-CONTRACT v1 -->` block; every FEATURE task passes the fakeability gate (0 CRITICAL).

- DATA-008-agent-curated-discovery-tool.md
- DISC-010-rekey-suggestion-pill-visibility.md
- DISC-011-curated-route-suggestion-pills.md
- DISC-012-render-curated-route-cards.md
- DISC-013-full-chat-footer-button.md
- DISC-014-no-route-empty-home-state.md
- DISC-015-remove-dedicated-discovery-path.md
- OPS-001-guard-empty-convex-deployment-drift.md

### Superseded task files (dedicated-screen approach — DELTA-001)

These describe the removed dedicated `discover.tsx`/`RouteDiscoveryScreen` and are **superseded** by the delta files above. Preserved as the as-built record; do not execute. DISC-015 removes the code they built.

- DISC-001-discovery-default-home-demote-chat.md
- DISC-003-wire-route-discovery-screen-off-mocks.md
- DISC-004-mapbox-map-convergence-pins.md

### Done (committed) task files

- DATA-001/002/004/005 + DISC-002 — backend gates + hook, carried forward unchanged.
