---
roadmap: 1
project: LaneShadow Discovery-MVP
generated: 2026-06-13
prd: .spec/prds/mvp/README.md
sprint_count: 3
pr_sequencing: false
delta: DELTA-001 (folded into Sprint 01, 2026-06-14)
---

# Sprint Roadmap: LaneShadow Discovery-MVP

## Overview

**Sprints:** 3
**Total Tasks:** 23 (Sprint 01: 13 · Sprint 02: 9 · Sprint 03: 1)
**Current Sprint:** 1 - Discovery on the Map/Chat Home (In Progress)

Re-anchor LaneShadow on its strategic hero — **Discovery** — by making the curated-route catalog the experience of the app's single **map + chat home**, wired end to end to live Convex data on real iOS + Android devices. The roadmap is organized around what a human can verify in the **running product** at the end of each sprint — never around a developer-facing metric. The non-observable backend gates (geospatial seed, archetype map, state/length normalization, the public queries, the bookmark field) are folded *into* the sprints that render them, so no "foundation" sprint exists in isolation.

> **⚠️ DELTA-001 folded into Sprint 01 (2026-06-14).** Discovery is delivered on the unified map + chat home: curated-route **suggestion pills** when no route is on the map, plus curated routes surfaced as **chat route-cards** that render on the map (tap an earlier card → it re-renders + returns to map), with the full chat view opening from a **footer button** right of the chat input. The dedicated Discover screen is removed. This **replaces** the earlier plan (a dedicated Discover screen in Sprint 01 with the delta deferred to a Sprint 05); the former Sprint 02 (legibility of the dedicated screen) and Sprint 05 (deferred delta) are **absorbed** into Sprint 01, and the capstone is **re-pointed** at the unified home. Authoritative spec: [DELTA-001](./DELTA-001-unified-map-chat-discovery.md).

**Specialist authorship:** every sprint's gate, test steps, and tasks were proposed by the dispatched planning specialists (convex-planner · react-native-ui-planner · frontend-designer) and consolidated by the orchestrator. No content was authored by the orchestrator alone.

---

## Sprint Sequence

| # | Milestone | Sprint | Gate | Tasks | Dependencies | Status |
|---|-----------|--------|------|-------|--------------|--------|
| 1 | — | [Sprint 01: Discovery on the Map/Chat Home](#sprint-01-discovery-on-the-mapchat-home) | App opens to the map + chat home (no dedicated Discover screen); discover curated routes via suggestion pills when no route is on the map and by chatting — routes render on the map. | 13 | — | In Progress |
| 2 | — | [Sprint 02: Route Detail + Close the Loop](#sprint-02-route-detail--close-the-loop) | Tap a route → honest detail (headline, score bars, geometry-or-centroid, conditions) → save → reopen → Ride-It opens maps. | 9 | Sprint 01 | Planned |
| 3 | — | [Sprint 03: On-Device D9 Capstone](#sprint-03-on-device-d9-capstone) | The founder completes the full discover-to-ride arc on the map + chat home on real iOS **and** real Android against live Convex, with recorded evidence. | 1 | Sprint 01, 02 | Planned |

The `Milestone` cell links to the GitHub Milestone whose title is `sprint-{NN}`. For these newly-planned sprints not yet pushed to GitHub, the cell is `—`; it is backfilled after Milestone creation.

---

## Per-Sprint Details

### Sprint 01: Discovery on the Map/Chat Home

**Sequence:** 1
**Timeline:** Phase 1
**Status:** In Progress
**Proposed by:** react-native-ui-planner + convex-planner + frontend-designer
**Milestone:** — (`sprint-01`)

#### Human Testing Gate

**Gate:** On a real device the app opens to the single map + chat home (no dedicated Discover screen): with no route on the map, suggestion pills offer whole curated routes from the live catalog and tapping one plots it on the map; typing a request like "twisties near Asheville" returns curated routes as chat cards and plots the latest on the map; tapping an earlier card re-renders it and drops back to map view; and the full chat view opens from a button to the right of the chat input.

**Test Steps:**
1. Launch the app on a real device and observe it open directly to the full-screen map + chat home (no separate Discover screen, no drawer-hidden chat).
2. With no route on the map, observe suggestion pills above the chat input offering whole curated routes (e.g. a named curated road with mileage), not generic planning prompts.
3. Tap a suggested-route pill and observe that curated route plot on the map, and observe the suggestion pills disappear once a route is shown.
4. Type "twisties near Asheville" and observe the agent return curated route card(s) in the chat history and plot the latest curated route on the map.
5. Scroll the chat history, tap an earlier curated-route card, and observe it re-render on the map and return you to map view.
6. Clear or dismiss the route on the map and observe the curated suggestion pills return (keyed to no route on map).
7. Tap the button to the right of the chat input and observe the full chat view open; close it and observe the map return.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DATA-007 | Remove stale `react-native/` shadow dir + fix workspace config so builds stay green on both platforms | planner | 60 min |
| DATA-001 | Seed `@convex-dev/geospatial` points table from `curated_routes` centroids (idempotent) | convex-implementer | 180 min |
| DATA-002 | Archetype mapping transform (UI enum ↔ DB enum) — pure, zero-I/O helper | convex-implementer | 60 min |
| DATA-004 | State-normalize + length-clamp pure transforms in the read path (no write-back) | convex-implementer | 90 min |
| DATA-005 | `listCuratedRoutes` public query (bbox/state/archetype/sort, Clerk-gated) | convex-implementer | 240 min |
| DISC-002 | `useCuratedDiscovery` hook wrapping `listCuratedRoutes` (reused as the pill + data source) | react-native-ui-implementer | 120 min |
| DATA-008 | Agent curated-discovery tool: translate an NL request into `listCuratedRoutes` params and surface curated routes as a `routing_card` (determinism seam: fixture the intent, assert which routes are plotted) | convex-implementer | 240 min |
| DISC-010 | Re-key the chat-input suggestion-pill slot from "empty session" to "no active route on the map" (+ `hasActiveRoute`) | react-native-ui-implementer | 120 min |
| DISC-011 | Swap pill content from generic prompts to whole curated routes from the live catalog (tap → plot) | react-native-ui-implementer | 150 min |
| DISC-012 | Render curated routes as cards in the transcript + wire the existing card→map→pin-back loop (curated card variant / shaped routing_card; centroid fallback) | react-native-ui-implementer | 180 min |
| DISC-013 | Footer "open full chat" button to the right of the chat input (reuse `chatMode`), visually distinct from send | react-native-ui-implementer | 90 min |
| DISC-014 | No-route empty home state: pills present + discovery-invite placeholder copy | react-native-ui-implementer | 75 min |
| DISC-015 | Remove the dedicated `discover.tsx`/`RouteDiscoveryScreen`, drop `DiscoveryFilterBar`/`DiscoverySortToggle`, drawer cleanup (lands last) | react-native-ui-implementer | 90 min |

**Next Sprint Tasks:** *(re-expanded JIT by kb-sprint-tasks-plan — the existing `tasks/sprint-01-live-discovery-home/` files for the old dedicated-screen DISC-001/003/004 are superseded by DATA-008 + DISC-010..015 above)*

#### Dependencies

- Blocks: Sprint 02, Sprint 03
- Dependent on: None
- **Critical intra-sprint ordering:** backend gates `DATA-001/002/004` precede `DATA-005`; `DATA-005` precedes `DISC-002` (hook) and `DATA-008` (agent tool). Client: `DISC-010` (re-key) precedes `DISC-011` (pill content); `DATA-008` precedes `DISC-012` (card→map render); `DISC-015` (tear out the dedicated screen) lands LAST, after `DISC-011` + `DISC-012` prove the home discovery path — so there is never a window where discovery is unreachable. The already-built backend gates (`DATA-001/002/004/005`, `DISC-002`) carry forward unchanged.

#### PRD Coverage

- DELTA-001 (folded) → DATA-008, DISC-010..015
- UC-DISC-09 (curated-route suggestion pills) → DISC-010, DISC-011, DISC-014
- UC-DISC-10 (chat-driven curated discovery via the card→map loop) → DATA-008, DISC-012
- UC-DISC-11 (unified map/chat home replaces the dedicated screen) → DISC-013, DISC-015
- UC-DATA-01/02/04/05 (backend gates) → DATA-001/002/004/005
- UC-DISC-04 (useCuratedDiscovery hook) → DISC-002
- Supersedes UC-DISC-02 / 05 / 06 / 07 / 08; `01-scope.md` repo-cleanup bullet → DATA-007

#### Capability Coverage

- SPATIAL-RESOLVE: seed the geospatial points table from centroids (DATA-001) → consumed by `listCuratedRoutes` bbox/nearest browse
- ARCHETYPE-ALIGN: pure UI↔DB archetype mapping in the read path (DATA-002)
- DATA-NORM: pure state-normalize + length-clamp in the read path (DATA-004)
- FEATURE(D2) listCuratedRoutes: the net-new public browse query (DATA-005), reused as the pill + chat data source
- map-chat-discovery: discovery as the **state of the home** (no route ⇒ curated suggestion pills; route ⇒ rendered on the map), riding the existing `routing_card` → map → pin-back machinery; NL/chat-driven curated discovery surfaced via the agent tool (DATA-008), with the intent signal fixtured at the determinism seam (DISC-012)

---

### Sprint 02: Route Detail + Close the Loop

**Sequence:** 2
**Timeline:** Phase 2
**Status:** Planned
**Proposed by:** convex-planner + react-native-ui-planner + frontend-designer
**Milestone:** — (`sprint-02`)

#### Human Testing Gate

**Gate:** Tapping a route opens an honest, complete route detail — a summary/name headline, five score bars with a composite headline, a polyline-or-centroid map, and basic conditions — and from there the rider can save the route, find it again in the Saved screen, reopen it without error, and hand off to Apple/Google Maps to actually ride it.

**Test Steps:**
1. From the home map, tap a route that has geometry and observe the detail open showing the route name, an archetype badge, the composite score headline (e.g. "74/100") above five score bars, and the route polyline on the map.
2. Tap a route with **no** polyline and observe the detail show a single centroid marker on the map plus an "Approximate location" badge — and never a blank or crashed map section.
3. Observe the detail show basic current weather conditions (or "conditions unavailable" if the weather call fails) without blocking the rest of the screen.
4. Observe both the **Save** and **Ride It** buttons are visible without scrolling.
5. Tap **Save** and observe a loading state, then a confirmed "Saved" state, without leaving the screen.
6. Open the Saved screen and observe the route appear in the list; tap it and observe it reopen the detail without an error.
7. Tap **Ride It** and observe Apple Maps open (iOS) / Google Maps open (Android) positioned at the route with its name.
8. On Android with Google Maps uninstalled, tap **Ride It** again and observe it fall back to opening maps in the browser rather than crashing.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DATA-006 | `getCuratedRouteDetail` public query (lean fields + 0–1 scores + `routePolyline: string\|null` + centroid; NO enrichment; Clerk-gated) | convex-implementer | 180 min |
| DATA-003 | Add optional `curatedRouteRef` field to `saved_routes` (additive; make plan-payload fields optional + XOR-validate) | convex-implementer | 120 min |
| DTL-001 | Create `app/(app)/curated-route/[id].tsx` route + `useCuratedRouteDetail` hook (headline, scores, polyline-or-centroid, weather) | react-native-ui-implementer | 150 min |
| DESIGN-001 | Build `ScoreDimensionBar` primitive (labeled % bar, copper fill on inset track, composite "/100" headline) | react-native-ui-implementer | 90 min |
| DESIGN-002 | Build lean curated-route detail screen body (six sections; 40% map + scrollable body, mirrors `saved-route/[id].tsx`) | react-native-ui-implementer | 180 min |
| DESIGN-003 | Implement geometry graceful degradation: polyline when present, centroid marker + "Approximate location" badge when absent | react-native-ui-implementer | 60 min |
| DESIGN-004 | Implement detail actions UX: Save (loading→"Saved" in place) + Ride It affordances, both visible without scrolling | react-native-ui-implementer | 90 min |
| SAVE-001 | Save curated route via `curatedRouteRef` (`useSaveCuratedRoute`, fires `recordRouteFeedback('save')`); Saved-screen + SavedRouteCard tolerance | react-native-ui-implementer | 180 min |
| SAVE-002 | Ride-It maps deep-link util `lib/maps-deeplink.ts` (Apple Maps iOS / Google Maps Android via `expo-linking`; web fallback) | react-native-ui-implementer | 90 min |

**Next Sprint Tasks:** *(populated JIT when sprint becomes active by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: Sprint 03
- Dependent on: Sprint 01 (`getCuratedRouteDetail` consumes the archetype-map + state/length transforms; `SAVE-001` consumes the `curatedRouteRef` field — both gates land here, rendered by the detail surface; the detail is reached by tapping a curated route on the map/chat home)
- **Intra-sprint ordering:** `DATA-006` + `DATA-003` precede the client hooks/mutations; `DTL-001` (route + hook) precedes `DESIGN-002` (body) and `SAVE-001`; `DESIGN-001` (ScoreDimensionBar) precedes `DESIGN-002`; `DESIGN-004` (action affordances) consumes `SAVE-001` (persistence) and `SAVE-002` (deep-link).

#### PRD Coverage

- UC-DATA-03 (curatedRouteRef bookmark field) → DATA-003
- UC-DATA-06 (getCuratedRouteDetail) → DATA-006
- UC-DTL-01 (lean detail layout) → DTL-001 + DESIGN-002
- UC-DTL-02 (score-bar visualization) → DESIGN-001
- UC-DTL-03 (geometry graceful degradation) → DESIGN-003
- UC-DTL-04 (detail actions affordance) → DESIGN-004
- UC-SAVE-01 (save + reopen) → SAVE-001
- UC-SAVE-02 (Ride-It deep-link) → SAVE-002

#### Capability Coverage

- FEATURE(D3) getCuratedRouteDetail: lean detail + 0–1 scores + `routePolyline: string|null` (55%/45% split) + centroid for weather; reads NO enrichment (DATA-006)
- SAVE-RESOLVE: additive optional `curatedRouteRef` bookmark, non-destructive, with `curatedRouteRef XOR planned-payload` validation (DATA-003)
- score-bar-visualization-primitive: the single net-new UI primitive, display-only, pure score→% transform (DESIGN-001)
- geometry-fallback-ux: polyline-or-centroid with "Approximate location" badge (DESIGN-003)
- curated-bookmark-persistence: save via `curatedRouteRef` + `recordRouteFeedback('save')`, reopen without synthesized legs (SAVE-001)
- centroid→maps-deep-link: platform-correct handoff with web fallback, no new dependency (SAVE-002)

---

### Sprint 03: On-Device D9 Capstone

**Sequence:** 3
**Timeline:** Phase 3
**Status:** Planned
**Proposed by:** react-native-ui-planner
**Milestone:** — (`sprint-03`)

#### Human Testing Gate

**Gate:** The founder completes the entire discover-to-ride journey on the map + chat home on a real iPhone **and** a real Android phone against live Convex — open the app, discover a road via the curated suggestion pills and/or by chatting, open it, understand why it's good and whether today is rideable, save it, and hand off to maps to ride it — with recorded evidence and no mocks. This is what "done" means.

**Test Steps:**
1. Build and run the app on a real iOS device pointed at live Convex.
2. On the iOS device, open the app to the map + chat home and find 5 roads you have **never** ridden in a region you actually ride — using the curated suggestion pills (with no route on the map) and by chatting (e.g. "twisties near Asheville").
3. On the iOS device, tap a curated route card/pin to open its detail, confirm its scores/geometry/conditions, save it, reopen it from Saved, and tap **Ride It** to hand off to Apple Maps.
4. Repeat the entire journey on a real Android device, confirming the Google Maps handoff and the browser fallback when Google Maps is unavailable.
5. Record video or screenshot evidence of the complete arc on both platforms.
6. Actually ride at least one discovered road within two weeks and note whether the surfaced ranking matched your own judgment (input to the post-MVP scoring-calibration fast-follow).

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DISC-007 | D9 on-device capstone: verify the full discover-to-ride arc on the **map + chat home** on real iOS **and** real Android against live Convex; surface and fix any platform-specific issues; record per-platform evidence; founder dogfood | react-native-ui-implementer | 240 min |

**Next Sprint Tasks:** *(populated JIT when sprint becomes active by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: None (terminal sprint — the MVP "done" gate)
- Dependent on: Sprint 01, Sprint 02 (stitches DATA + the map/chat discovery + DTL + SAVE into the one end-to-end arc)

#### PRD Coverage

- UC-DISC-01 (full discover-to-ride journey on a real device — re-pointed to the unified map/chat home) → DISC-007

#### Capability Coverage

- discover-to-ride-journey: the cross-cutting capstone that integrates every prior seam — map/chat home landing, curated suggestion pills, chat-driven curated discovery, card→map render, detail, save+reopen, maps handoff — verified on real iOS + real Android against live Convex with no mocks (DISC-007). Satisfies the project iron rule: integration/E2E against real services is the primary acceptance bar.

---

## Notes

- **DELTA-001 is folded into Sprint 01**, not a separate sprint. The earlier plan (dedicated Discover screen in Sprint 01 + a deferred Sprint 05) is superseded: the dedicated screen is removed, the former legibility sprint (DISC-005/006 polish of that screen) is **absorbed** (its surviving ≥44pt/no-route-state intent lives in DISC-010/012/014), and the capstone is **re-pointed** at the unified home. Spec: [DELTA-001](./DELTA-001-unified-map-chat-discovery.md).
- **One genuinely net-new backend task (DATA-008).** Verified in code by convex-planner: the chat agent today has no path to the curated catalog (its tools route start→end trips). DATA-008 adds an agent tool that maps a natural-language request to the existing `listCuratedRoutes` and surfaces results through the existing `routing_card` contract — no schema change, no new curated query. It is the determinism seam: fixture the intent signal, assert which curated routes are plotted, never prose.
- **Backend gates are not standalone sprints.** The foundational gates (geospatial seed, archetype map, state/length normalize, the public queries, the bookmark field) are folded into the sprints that render them (Sprint 01 + Sprint 02), per the merge-forward rule.
- **Pure transforms are the only unit-justified work** (archetype-map, state-normalize, length-clamp, score→%): zero I/O. Everything else is integration/E2E/human-gate against live Convex + real devices + live Open-Meteo, per `10-e2e-testing-criteria.md`.
- **Scope guardrails:** enrichment stays out (table empty); scores render as bars/% on the 0–1 scale (never "92"); the current RN look ships (no Copper Navigator redesign); no new runtime dependency (expo-linking + expo-location already installed). The earlier "chat is demoted" guardrail is **superseded** by DELTA-001 — chat is integral to the home, surfaced via the footer button.
