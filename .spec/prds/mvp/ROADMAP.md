---
roadmap: 1
project: LaneShadow Discovery-MVP
generated: 2026-06-13
prd: .spec/prds/mvp/README.md
sprint_count: 4
pr_sequencing: false
---

# Sprint Roadmap: LaneShadow Discovery-MVP

## Overview

**Sprints:** 4
**Total Tasks:** 21
**Current Sprint:** 1 - Live Discovery Home (not yet started)

Re-anchor LaneShadow on its strategic hero — **Discovery** — by making the curated-route catalog the default home, wired end to end to live Convex data on real iOS + Android devices. The roadmap is organized around what a human can verify in the **running product** at the end of each sprint — never around a developer-facing metric. The non-observable backend gates (geospatial seed, archetype map, state/length normalization, the two public queries, the bookmark field) are folded *into* the sprints that render them, so no "foundation" sprint exists in isolation.

**Specialist authorship:** every sprint's gate, test steps, and tasks were proposed by the dispatched planning specialists (convex-planner · react-native-ui-planner · frontend-designer) and consolidated by the orchestrator. No content was authored by the orchestrator alone.

---

## Sprint Sequence

| # | Milestone | Sprint | Gate | Tasks | Dependencies | Status |
|---|-----------|--------|------|-------|--------------|--------|
| 1 | — | [Sprint 01: Live Discovery Home](#sprint-01-live-discovery-home) | App opens to a full-bleed Mapbox map of real ranked curated-route pins (not chat, not mocks) with working filters, sort, and state browse. | 9 | — | Planned |
| 2 | — | [Sprint 02: Trustworthy & Legible Discovery](#sprint-02-trustworthy--legible-discovery) | Discovery tells the truth about loading/empty states and every pin/control is comfortably tappable — including with gloves. | 2 | Sprint 01 | Planned |
| 3 | — | [Sprint 03: Route Detail + Close the Loop](#sprint-03-route-detail--close-the-loop) | Tap a pin → honest detail (headline, score bars, geometry-or-centroid, conditions) → save → reopen → Ride-It opens maps. | 9 | Sprint 01 | Planned |
| 4 | — | [Sprint 04: On-Device D9 Capstone](#sprint-04-on-device-d9-capstone) | The founder completes the full discover-to-ride arc on real iOS **and** real Android against live Convex, with recorded evidence. | 1 | Sprint 01, 02, 03 | Planned |

The `Milestone` cell links to the GitHub Milestone whose title is `sprint-{NN}`. For these newly-planned sprints not yet pushed to GitHub, the cell is `—`; it is backfilled after Milestone creation.

---

## Per-Sprint Details

### Sprint 01: Live Discovery Home

**Sequence:** 1
**Timeline:** Phase 1
**Status:** Planned
**Proposed by:** convex-planner + react-native-ui-planner
**Milestone:** — (`sprint-01`)

#### Human Testing Gate

**Gate:** On a real device, opening the app lands on a full-bleed Mapbox Discovery map of real ranked curated-route pins drawn from the live 5,654-route catalog — not the chat agent and not mock data — with archetype filters and best/nearest sort updating the live pin set, and the chat planning agent reachable only via a secondary "Plan a ride" drawer entry.

**Test Steps:**
1. Launch the app on a real device and observe it open directly to the Discovery map (not the chat planning screen).
2. Observe real curated-route pins appear on the map (not the 8 hardcoded mock routes) drawn from the live Convex catalog.
3. Tap an archetype chip (e.g. "Scenic") and observe the pin set update to only matching routes, with the chip's count badge reflecting live data.
4. Toggle the sort between **Best** and **Nearest** and observe the pin ordering and the rank/distance labels update.
5. Open the drawer and observe "Discover" is the primary entry, with a separate "Plan a ride" entry that opens the unmodified chat screen.
6. Navigate Discover → Plan a ride → Discover and observe the drawer never points two entries at the same screen.
7. Select a state (e.g. North Carolina) and observe pins for that state appear, including routes stored under both dirty spelling variants of the state.

#### Tasks

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

**Next Sprint Tasks:** *(populated JIT when sprint becomes active by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: Sprint 02, Sprint 03, Sprint 04
- Dependent on: None
- **Critical intra-sprint ordering:** per the no-mock-home rule, `DISC-001`'s default-landing flip must land *after* `DISC-003` wires live data — Discovery is never mounted as the home screen while still showing `MOCK_ROUTES`. Backend gates (`DATA-001/002/004`) precede `DATA-005`; the query precedes `DISC-002` (hook) precedes `DISC-003` (screen wire). `DISC-004` (Mapbox convergence) is independent and can run in parallel.

#### PRD Coverage

- UC-DATA-01 (geospatial seed) → DATA-001
- UC-DATA-02 (archetype mapping) → DATA-002
- UC-DATA-04 (state + length normalize) → DATA-004
- UC-DATA-05 (listCuratedRoutes) → DATA-005
- UC-DISC-02 (default home + demote chat) → DISC-001
- UC-DISC-03 (browse by state) → DISC-003
- UC-DISC-04 (useCuratedDiscovery hook) → DISC-002
- UC-DISC-05 (wire screen off mocks) → DISC-003
- UC-DISC-06 (Mapbox convergence) → DISC-004
- `01-scope.md` repo-cleanup bullet → DATA-007

#### Capability Coverage

- SPATIAL-RESOLVE: seed the geospatial points table from centroids (DATA-001) → consumed by `listCuratedRoutes` bbox/nearest browse
- ARCHETYPE-ALIGN: pure UI↔DB archetype mapping in the read path (DATA-002) → never mutates the DB enum, never returns a raw DB-only value to the client
- DATA-NORM: pure state-normalize + length-clamp in the read path (DATA-004) → no write-back to the catalog
- FEATURE(D2) listCuratedRoutes: the net-new public browse query (DATA-005) over the seeded index, no `.filter()` for geography/state

---

### Sprint 02: Trustworthy & Legible Discovery

**Sequence:** 2
**Timeline:** Phase 2
**Status:** Planned
**Proposed by:** react-native-ui-planner + frontend-designer
**Milestone:** — (`sprint-02`)

#### Human Testing Gate

**Gate:** The Discovery surface tells the rider the truth about what is loading and what is empty — distinguishing a bare area from a filtered-out result, with a working escape hatch — and every pin and control is comfortably tappable on a phone, including with gloved hands.

**Test Steps:**
1. Open Discovery and pan the map to an ocean area with no routes; observe "No routes in this area" and "Try zooming out or moving the map," with the map still visible behind the message.
2. Tap an archetype chip that has no routes in the current area; observe "No [archetype] routes in this area," then tap the **Clear filter** button and observe the filter reset and pins reappear.
3. Observe the loading skeleton does **not** flash when routes resolve quickly (under ~300 ms), but does appear during a slow load.
4. With a gloved hand (or wide tap), tap any visible route pin and observe it register — each pin has at least a 44×44-point tap target.
5. Observe the filter bar + sort toggle together leave most of the screen (≥60%) as visible map on an iPhone-class portrait screen.
6. Switch the map between light and dark styles and observe the copper pins stay legible against both.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DISC-005 | Wire loading/empty overlays: 300 ms debounce (no flash), bbox-empty vs filter-empty messaging, working "Clear filter" CTA | react-native-ui-implementer | 120 min |
| DISC-006 | Verify Discovery legibility: ≥44 dp tap targets, ≤40% overlay / ≥60% map visible, active-state affordances, `formatCount` badges, pin contrast on light+dark | react-native-ui-implementer | 120 min |

**Next Sprint Tasks:** *(populated JIT when sprint becomes active by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: Sprint 04
- Dependent on: Sprint 01 (`DISC-005` consumes the live hook + screen wire; `DISC-006` consumes the Mapbox pins)

#### PRD Coverage

- UC-DISC-07 (discovery legibility) → DISC-006
- UC-DISC-08 (empty + loading states) → DISC-005

#### Capability Coverage

- discovery-overlay-legibility: honest loading (300 ms debounce) + context-aware empty messaging (bbox-empty vs filter-empty) with a Clear-filter escape hatch (DISC-005)
- discovery-legibility: 44 dp gloved-hand touch targets, ≥60% map visibility budget, live `formatCount` count badges, pin contrast across light/dark Mapbox styles (DISC-006)

---

### Sprint 03: Route Detail + Close the Loop

**Sequence:** 3
**Timeline:** Phase 3
**Status:** Planned
**Proposed by:** convex-planner + react-native-ui-planner + frontend-designer
**Milestone:** — (`sprint-03`)

#### Human Testing Gate

**Gate:** Tapping a discovery pin opens an honest, complete route detail — a summary/name headline, five score bars with a composite headline, a polyline-or-centroid map, and basic conditions — and from there the rider can save the route, find it again in the Saved screen, reopen it without error, and hand off to Apple/Google Maps to actually ride it.

**Test Steps:**
1. From Discovery, tap a route pin that has geometry and observe the detail open showing the route name, an archetype badge, the composite score headline (e.g. "74/100") above five score bars, and the route polyline on the map.
2. Tap a pin for a route with **no** polyline and observe the detail show a single centroid marker on the map plus an "Approximate location" badge — and never a blank or crashed map section.
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

- Blocks: Sprint 04
- Dependent on: Sprint 01 (`getCuratedRouteDetail` consumes the archetype-map + state/length transforms; `SAVE-001` consumes the `curatedRouteRef` field — both gates land here, rendered by the detail surface)
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

### Sprint 04: On-Device D9 Capstone

**Sequence:** 4
**Timeline:** Phase 4
**Status:** Planned
**Proposed by:** react-native-ui-planner
**Milestone:** — (`sprint-04`)

#### Human Testing Gate

**Gate:** The founder completes the entire discover-to-ride journey on a real iPhone **and** a real Android phone against live Convex — find a road near him or in a state he's curious about, understand why it's good and whether today is rideable, save it, and hand off to maps to ride it — with recorded evidence and no mocks. This is what "done" means.

**Test Steps:**
1. Build and run the app on a real iOS device pointed at live Convex.
2. On the iOS device, open the app to Discovery and find 5 roads you have **never** ridden in a region you actually ride, using filter/sort to surface the best ones.
3. On the iOS device, open one route's detail, confirm its scores/geometry/conditions, save it, reopen it from Saved, and tap **Ride It** to hand off to Apple Maps.
4. Repeat the entire journey on a real Android device, confirming the Google Maps handoff and the browser fallback when Google Maps is unavailable.
5. Record video or screenshot evidence of the complete arc on both platforms.
6. Actually ride at least one discovered road within two weeks and note whether the surfaced ranking matched your own judgment (input to the post-MVP scoring-calibration fast-follow).

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DISC-007 | D9 on-device capstone: verify the full discover-to-ride arc on real iOS **and** real Android against live Convex; surface and fix any platform-specific issues; record per-platform evidence; founder dogfood | react-native-ui-implementer | 240 min |

**Next Sprint Tasks:** *(populated JIT when sprint becomes active by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: None (terminal sprint — the MVP "done" gate)
- Dependent on: Sprint 01, Sprint 02, Sprint 03 (stitches DATA + DISC + DTL + SAVE into the one end-to-end arc)

#### PRD Coverage

- UC-DISC-01 (full discover-to-ride journey on a real device) → DISC-007

#### Capability Coverage

- discover-to-ride-journey: the cross-cutting capstone that integrates every prior seam — default landing, live Mapbox pins, filter/sort, detail, save+reopen, maps handoff — verified on real iOS + real Android against live Convex with no mocks (DISC-007). Satisfies the project iron rule: integration/E2E against real services is the primary acceptance bar.

---

## Notes

- **Backend gates are not standalone sprints.** The five foundational gates (geospatial seed, archetype map, state/length normalize, the two public queries, the bookmark field) are folded into the sprints that render them (Sprint 01 and Sprint 03), per the merge-forward rule. No rider-facing feature is marked complete until its underlying gate is verified against live Convex.
- **Pure transforms are the only unit-justified work** (archetype-map, state-normalize, length-clamp, score→%): zero I/O. Everything else is integration/E2E/human-gate against live Convex + real devices + live Open-Meteo, per `10-e2e-testing-criteria.md`.
- **Scope guardrails honored:** chat is demoted (not deleted, internals unchanged); enrichment stays out (table empty); scores render as bars/% on the 0–1 scale (never "92"); the current RN look ships (no Copper Navigator redesign); no new runtime dependency (expo-linking + expo-location already installed).
