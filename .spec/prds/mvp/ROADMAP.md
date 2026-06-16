---
roadmap: 1
project: LaneShadow Discovery-MVP
generated: 2026-06-15
prd: .spec/prds/mvp/README.md
sprint_count: 3
pr_sequencing: false
delta: v3.0.0 replan — separate discovery view removed; discovery re-homed onto the route plan view (2026-06-15)
---

# Sprint Roadmap: LaneShadow Discovery-MVP

## Overview

**Sprints:** 3
**Total Tasks:** 28 (Sprint 01: 18 · Sprint 02: 9 · Sprint 03: 1)
**Current Sprint:** 1 - Discovery on the Route Plan View (In Progress)

Re-anchor LaneShadow on its strategic hero — **Discovery** — delivered as the behavior of the app's single **route plan view** (the map + chat home, `app/(app)/(tabs)/index.tsx`), wired end to end to live Convex data on real iOS + Android devices. The roadmap is organized around what a human can verify in the **running product** at the end of each sprint — never a developer-facing metric. The non-observable backend gates (geospatial seed, archetype map, state/length normalization, the public queries, the bookmark field) are folded *into* the sprints that render them, so no "foundation" sprint exists in isolation.

> **⚠️ v3.0.0 replan (2026-06-15): the separate discovery view was removed.** Discovery is no longer a dedicated screen or a standalone surface — it is the behavior of the route plan view: curated-route **suggestion cards over the chat input** (tap → the route plots directly on the map) plus **chat-driven natural-language curated discovery** (curated routes returned as the existing route-cards that render on the map). The dedicated `discover.tsx`/`RouteDiscoveryScreen`, the archetype filter-bar, the best/nearest sort-toggle, and the by-state browse picker are all out of the MVP. The **deprecated old Sprint 01** ("Live Discovery Home" / dedicated discovery) is archived at `tasks/_archived/sprint-01-live-discovery-home/`; its salvageable scope (some built, some built poorly) is re-homed into the new plan-view Sprint 01 below, with explicit fix tasks for the built-but-rough pieces. See PRD [README](./README.md) v3.0.0 and [05-uc-disc.md](./05-uc-disc.md).

**Specialist authorship:** every sprint's gate, test steps, and tasks were proposed by the dispatched planning specialists (react-native-ui-planner · convex-planner · frontend-designer) and consolidated by the orchestrator. No content was authored by the orchestrator alone.

---

## Sprint Sequence

| # | Milestone | Sprint | Gate | Tasks | Dependencies | Status |
|---|-----------|--------|------|-------|--------------|--------|
| 1 | — | [Sprint 01: Discovery on the Route Plan View](#sprint-01-discovery-on-the-route-plan-view) | App opens to the route plan view (no dedicated Discover screen, filter-bar, sort-toggle, state-picker, or "Plan a ride" drawer entry); with no route on the map, curated-route suggestion cards over the input plot a route directly on tap; chatting "twisties near Asheville" returns curated routes as cards and plots the latest. | 18 | — | In Progress |
| 2 | — | [Sprint 02: Route Detail + Close the Loop](#sprint-02-route-detail--close-the-loop) | Tapping a curated route on the plan view opens honest detail (headline, score bars, geometry-or-centroid, conditions) → save → reopen → Ride-It opens maps with a web fallback. | 9 | Sprint 01 | Planned |
| 3 | — | [Sprint 03: On-Device D9 Capstone](#sprint-03-on-device-d9-capstone) | The founder completes the full discover-to-ride arc on the route plan view on real iOS **and** real Android against live Convex, with recorded evidence. | 1 | Sprint 01, 02 | Planned |

The `Milestone` cell links to the GitHub Milestone whose title is `sprint-{NN}`. For these locally-planned sprints not yet pushed to GitHub, the cell is `—`.

---

## Per-Sprint Details

### Sprint 01: Discovery on the Route Plan View

**Sequence:** 1
**Timeline:** Phase 1
**Status:** In Progress
**Proposed by:** react-native-ui-planner + convex-planner + frontend-designer
**Milestone:** — (`sprint-01`)

> **Re-homed from the deprecated `sprint-01-live-discovery-home` (archived).** The backend gates (DATA-001/002/004/005), the `useCuratedDiscovery` hook (DISC-002), and the agent discovery tool (DATA-008) were BUILT in the deprecated sprint and carry forward (verify). The plan-view discovery UX was partly built and partly built poorly — this sprint FIXES the rough pieces (suggestion-card tap routing, the IDLE_SUGGESTIONS fallback, the agent tool's zero-score bug, the leftover "Plan a ride" drawer entry) and drops the dedicated-screen scope.

#### Human Testing Gate

**Gate:** On a real device the app opens directly to the single route plan view (map + chat home — no dedicated Discover screen, no archetype filter-bar, no sort-toggle, no by-state picker, no "Plan a ride" drawer entry): with no route on the map, curated-route suggestion cards over the chat input offer whole curated roads from the live 5,654-route catalog and tapping one plots that route **directly** on the map (no chat round-trip); typing "twisties near Asheville" (or "scenic roads in North Carolina") returns curated routes as chat cards with real non-zero scores and plots the latest on the map; tapping an earlier card re-renders it and returns to map view; clearing the route brings the suggestion cards back; and the full chat view opens from the footer button right of the chat input, visually distinct from send.

**Test Steps:**
1. Launch the app on a real device and observe it open directly to the full-screen map + chat home (no separate Discover screen). Open the drawer and confirm its only navigation entries are the standard ones (e.g. Settings, Saved) — with NO "Plan a ride" entry and NO "Discover" entry — and confirm there is no filter-bar, sort-toggle, or state-picker control on the home. *(Run the full gate only after all sprint tasks, including DISC-021 quarantine, have landed.)*
2. With no route on the map, observe curated-route suggestion cards over the chat input showing a real curated road name and its mileage from the live catalog (styled distinct from generic planning prompts — copper accent + road icon), and observe the input placeholder read as a discovery invite, never the generic "Plan a scenic ride"/"Find coffee nearby" prompts.
3. Tap a suggestion card and observe that exact curated route plot on the map **immediately, with no chat message sent**, and observe the suggestion cards disappear once the route is shown.
4. Clear or dismiss the route on the map and observe the curated suggestion cards return.
5. Type "twisties near Asheville" and observe curated route card(s) appear in the chat history and the latest curated route plot on the map; observe the card shows a real composite score as a percentage/bars (never 0%, never a raw 0–1 decimal, never a raw 0–100 number).
6. Type "scenic roads in North Carolina" (no filter-bar or state picker) and observe matching curated routes returned for that state and plotted.
7. Scroll the chat history, tap an earlier curated-route card, and observe it re-render on the map and drop you back to map view.
8. Tap the footer button to the right of the chat input — confirm it is visually distinct from the send button — and observe the full chat view open; close it and observe the map return.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DATA-001 | Geospatial points seeded from `curated_routes` centroids *(carried — built; verify idempotent + non-empty)* | convex-implementer | 30 min |
| DATA-002 | Archetype UI↔DB mapping in the read path *(carried — built; verify pure + applied)* | convex-implementer | 30 min |
| DATA-004 | State-normalize + length-clamp transforms in the read path *(carried — built; verify)* | convex-implementer | 30 min |
| DATA-005 | `listCuratedRoutes` public query (bbox/center/state/archetype/sort, Clerk-gated) *(carried — built; verify all 4 modes)* | convex-implementer | 45 min |
| DATA-008 | Verify the agent `discoverCuratedRoutes` tool maps NL intent → `listCuratedRoutes` → `routing_card` and is actually invoked by the ReAct loop (determinism seam: fixture intent, assert plotted routes; concrete fixture mechanism ratified in the e2e harness constitution at sprint time — split off a harness task if it needs scaffolding) | convex-implementer | 90 min |
| DATA-008b | **FIX:** `discoverCuratedRoutes` reads `route.scores`/`route.score` (nested) but `listCuratedRoutes` returns flat `compositeScore`/`*Score` fields → chat cards currently show composite 0 / all-zero bars; map flat fields so surfaced scores are the route's real 0–1 values | convex-implementer | 90 min |
| OPS-001 | Guard against empty-Convex-deployment drift (combined dev script + loud health check; canary = `listCuratedRoutes`) *(carried; re-verify/harden — the plan view IS the discovery surface now)* | convex-implementer | 60 min |
| DISC-002 | Verify + harden `useCuratedDiscovery` against all five UC-DISC-04 ACs: suggestion-card row shape; center derived from `useCurrentLocation` when absent; nearest-first when located / best-first fallback; UI-enum archetypes pass through; 0–1 scores carried; loading≠empty *(carried — built; verify vs T-DISC-004)* | react-native-ui-implementer | 60 min |
| DISC-016 | **FIX:** tapping a suggestion card plots the already-fetched curated route on the map directly (today `handleSelectCuratedRoute` sends a chat message to the NL agent — UC-DISC-09 AC3 wants a direct plot) | react-native-ui-implementer | 150 min |
| DISC-017 | **FIX:** suggestion slot shows curated cards (or nothing while loading/empty) — never the generic `IDLE_SUGGESTIONS` planning prompts | react-native-ui-implementer | 90 min |
| DISC-018 | Verify/harden the footer "open full chat" button (distinct from send) + suggestion-card visibility keyed to "no active route on the map" | react-native-ui-implementer | 75 min |
| DISC-019 | **FIX:** remove the leftover "Plan a ride" drawer entry from `menu-layout.tsx` (chat is integral to the plan view) | react-native-ui-implementer | 30 min |
| DISC-020 | Render chat-driven curated routes as transcript cards (curated variant; score as %/bars) + verify the card→map→return-to-map loop with centroid fallback | react-native-ui-implementer | 120 min |
| DISC-021 | Quarantine the dropped dedicated-discovery components so none are imported by an active screen/hook (no Discover screen / filter-bar / sort-toggle / state-picker reachable); leave the offline `use-route-discovery.ts` untouched (lands last) | react-native-ui-implementer | 60 min |
| DESIGN-S01-001 | Suggestion-card visual spec/audit: copper accent + road-variant icon, `surface.glass` scrim @ 72% alpha, ≥44pt targets, hidden when a route is shown | frontend-designer | 60 min |
| DESIGN-S01-002 | Curated-route chat-card variant spec: composite score as %/bars on the 0–1 scale, visually distinct from a planned-trip routing card | frontend-designer | 75 min |
| DESIGN-S01-003 | No-route empty/invite home-state spec (`home-empty-state`): discovery-invite copy + empty-catalog messaging over a `surface.glass` scrim | frontend-designer | 45 min |
| DESIGN-S01-004 | Footer full-chat button distinction spec (icon/shape vs send; ≥44pt; active-state) | frontend-designer | 30 min |

**Next Sprint Tasks:** Expanded by /kb-sprint-tasks-plan (2026-06-16) → [`tasks/sprint-01-discovery-on-the-route-plan-view/`](./tasks/sprint-01-discovery-on-the-route-plan-view/SPRINT.md) — 18 task files + SPRINT.md, avg quality 108/115 (min 105), every FEATURE task passes the fakeability floor (validate_scenario, 0 CRITICAL/HIGH). Built-and-carried: DATA-001/002/004/005, DISC-002, DATA-008 (verify). New/fix work: DATA-008b, DISC-016/017/018/019/020/021, OPS-001 (re-verify), and the four DESIGN-S01 specs. Run with `/kb-run-sprint tasks/sprint-01-discovery-on-the-route-plan-view`.

#### Dependencies

- Blocks: Sprint 02, Sprint 03
- Dependent on: None
- **Critical intra-sprint ordering:** backend gates `DATA-001/002/004` precede `DATA-005`; `DATA-005` precedes `DISC-002` (hook), `DATA-008`/`DATA-008b` (agent tool), and `OPS-001` (canary). Client: `DISC-016` (card-tap direct plot) + `DISC-017` (curated-only slot) precede `DISC-018` (footer/visibility verify); `DATA-008b` precedes `DISC-020` (chat cards show real scores); `DISC-021` (quarantine) lands LAST after the plan-view discovery path is proven, so discovery is never unreachable. Design specs (`DESIGN-S01-001..004`) are each a short spec/audit and are written FIRST, before the matching UI fix begins (not skipped as "co-development"). The carried verify-only gates (DATA-001/002/004/005, DISC-002) are re-confirmed against their `T-DATA-001/002/003/006/007/008` / `T-DISC-004` criteria in [10-e2e-testing-criteria.md](./10-e2e-testing-criteria.md) — "verify" means re-run that criterion against live Convex, not glance at code.

#### PRD Coverage

- UC-DISC-09 (suggestion cards over the plan input → plot) → DISC-016, DISC-017, DESIGN-S01-001, DESIGN-S01-003
- UC-DISC-10 (chat-driven curated discovery via the card→map loop) → DATA-008, DATA-008b, DISC-020, DESIGN-S01-002
- UC-DISC-11 (discovery lives on the plan view; no separate screen; full chat from footer button) → DISC-018, DISC-019, DISC-021, DESIGN-S01-004
- UC-DISC-04 (`useCuratedDiscovery` hook) → DISC-002
- UC-DATA-01, UC-DATA-02, UC-DATA-04, UC-DATA-05 (backend gates) → DATA-001, DATA-002, DATA-004, DATA-005
- Sprint 01 app-live prerequisite + R-DATA-6 (empty-deployment / geospatial drift guard) → OPS-001
- Supersedes the deprecated dedicated-discovery scope (archived old Sprint 01: DISC-010..015, the pills/filter-bar/sort/state-picker framing). State-browse intent is absorbed into UC-DISC-10 (conversational state query → `listCuratedRoutes` `state` param, normalized by DATA-004).

#### Capability Coverage

- SPATIAL-RESOLVE: geospatial points seeded from centroids (DATA-001) → consumed by `listCuratedRoutes` bbox/nearest
- ARCHETYPE-ALIGN: pure UI↔DB archetype mapping in the read path (DATA-002)
- DATA-NORM: pure state-normalize + length-clamp in the read path (DATA-004)
- FEATURE(D2) listCuratedRoutes: the net-new public browse query (DATA-005), the single data source for the suggestion cards (via DISC-002) and chat discovery (via DATA-008)
- plan-view-discovery: discovery as the **state of the route plan view** — no route ⇒ curated suggestion cards over the input (tap → direct plot); route ⇒ rendered, cards hidden — riding the existing `routing_card` → `RouteAttachmentCard` → map → return-to-map machinery; NL/chat-driven curated discovery via the agent tool (DATA-008/008b), intent fixtured at the determinism seam
- dev-workflow-integrity: the Convex deployment every subscription depends on is never silently empty (OPS-001) — now load-bearing because the plan view IS the discovery surface

---

### Sprint 02: Route Detail + Close the Loop

**Sequence:** 2
**Timeline:** Phase 2
**Status:** Planned
**Proposed by:** convex-planner + react-native-ui-planner + frontend-designer
**Milestone:** — (`sprint-02`)

> **Re-pointed for v3.0.0:** detail is reached by tapping a curated route **on the plan view** (its chat card or its map pin), not from a dead Discover screen. The query/save/deep-link contracts are otherwise unchanged. All of this is net-new (the curated detail route, its hooks, `getCuratedRouteDetail`, and `curatedRouteRef` are not yet built).

#### Human Testing Gate

**Gate:** From a curated route discovered on the route plan view (Sprint 01) — tapping its card or its map pin — an honest, complete curated-route detail opens (summary/name headline, five score bars with a composite headline as %/bars on the 0–1 scale, a polyline-or-centroid map with an "Approximate location" badge for the ~45% lacking geometry, and basic current conditions); from there the rider can save the route via `curatedRouteRef`, find it again in the existing Saved screen, reopen it without error, and hand off to Apple/Google Maps to ride it (with a web fallback when the native maps app is absent).

**Test Steps:**
1. On the plan view, tap a curated route (its chat card or its map pin) that HAS geometry and observe the detail open showing the route name, an archetype badge, the composite score headline above five score bars, and the route polyline on the map.
2. Tap a curated route with NO polyline and observe the detail show a single centroid marker plus an "Approximate location" badge — never a blank or crashed map; also open a route with no summary and observe a "No description yet" muted placeholder, not a blank gap.
3. Observe the detail show basic current weather conditions (or "conditions unavailable" on failure) without blocking the rest of the screen.
4. On a short detail page, observe both Save and Ride It are visible without scrolling; then open a route whose summary + conditions push content below the fold and observe Save/Ride It scroll with the body to the bottom (not pinned to the screen bottom).
5. Tap Save and observe a loading state resolve to a confirmed "Saved" state in place without leaving the screen.
6. Open the Saved screen, observe the route appear in the list, tap it and observe it reopen without an error (no legs/PlanInput crash).
7. Tap Ride It and observe Apple Maps open (iOS) / Google Maps open (Android) at the route with its name.
8. On Android with Google Maps uninstalled, tap Ride It and observe it fall back to opening maps in the browser rather than crashing.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DATA-006 | `getCuratedRouteDetail` public query (lean fields + 0–1 scores + `routePolyline: string\|null` + centroid; NO enrichment; Clerk-gated) | convex-implementer | 180 min |
| DATA-003 | Add optional `curatedRouteRef` to `saved_routes` (additive; make plan-payload fields optional + XOR-validate) | convex-implementer | 120 min |
| DTL-001 | Create `app/(app)/curated-route/[id].tsx` route + `useCuratedRouteDetail` hook, and wire the plan-view card/pin tap to `router.push` the curated route id | react-native-ui-implementer | 150 min |
| DESIGN-001 | Build `ScoreDimensionBar` primitive in `components/ui/` (labeled % bar, copper fill on inset track; composite "/100" headline above the five bars) | react-native-ui-implementer | 90 min |
| DESIGN-002 | Build the lean curated-route detail screen body (six sections; ~40% map + scrollable body, mirrors `saved-route/[id].tsx`) | react-native-ui-implementer | 180 min |
| DESIGN-003 | Geometry graceful degradation: polyline when present, centroid marker + "Approximate location" badge when absent | react-native-ui-implementer | 60 min |
| DESIGN-004 | Detail actions UX: Save (loading→"Saved" in place) + Ride It affordances | react-native-ui-implementer | 90 min |
| SAVE-001 | Save curated route via `curatedRouteRef` (`useSaveCuratedRoute`, fires `recordRouteFeedback('save')`); Saved-screen + SavedRouteCard tolerance | react-native-ui-implementer | 180 min |
| SAVE-002 | Ride-It maps deep-link util `lib/maps-deeplink.ts` (Apple Maps iOS / Google Maps Android via `expo-linking`; web fallback) | react-native-ui-implementer | 90 min |

**Next Sprint Tasks:** *(populated JIT when sprint becomes active by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: Sprint 03
- Dependent on: Sprint 01 (`getCuratedRouteDetail` reuses the archetype-map + state/length transforms; `SAVE-001` consumes the `curatedRouteRef` field; the detail is reached by tapping a curated route on the plan view)
- **Intra-sprint ordering:** `DATA-006` + `DATA-003` precede the client hooks/mutations; `DTL-001` (route + hook + tap-wiring) precedes `DESIGN-002` (body) and `SAVE-001`; `DESIGN-001` (ScoreDimensionBar) precedes `DESIGN-002`; `DESIGN-003` co-develops with the body's map section; `DESIGN-004` consumes `SAVE-001` + `SAVE-002`.

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
- SAVE-RESOLVE: additive optional `curatedRouteRef` bookmark with `curatedRouteRef XOR planned-payload` validation (DATA-003)
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

> **Re-pointed for v3.0.0** from the "map + chat home" to the canonical route plan view discovery surface (no separate Discover screen).

#### Human Testing Gate

**Gate:** The founder completes the entire discover-to-ride journey on the route plan view on a real iPhone **and** a real Android phone against live Convex — open the app to the plan view (no separate Discover screen), discover a road via the curated suggestion cards over the input and/or by chatting (including at least one state-scoped request), tap a route to its detail, understand its scores/geometry/conditions, save it, reopen it from Saved, and hand off to maps to ride it — with recorded per-platform evidence and no mocks. This is what "done" means.

**Test Steps:**
1. Build and run the app on a real iOS device pointed at live Convex, and confirm it opens directly to the route plan view with no separate Discover screen.
2. On iOS, find 5 roads you have never ridden in a region you actually ride — using the curated suggestion cards over the input (tap-to-plot) AND by chatting (e.g. "twisties near Asheville"); include at least one state-scoped request (e.g. "twisties in North Carolina") and confirm matching curated routes are returned and plotted, verifying browse-by-state intent survives conversationally.
3. On iOS, tap an earlier curated-route card to re-render it on the map (returning to map view), then tap the route to open its detail — confirm its score bars, geometry-or-centroid, and conditions; save it; reopen it from Saved; and tap Ride It to hand off to Apple Maps.
4. Repeat the entire journey on a real Android device, confirming the Google Maps handoff and the browser fallback when Google Maps is unavailable.
5. Record video or screenshot evidence of the complete arc on both platforms.
6. *(Post-gate reflection — NOT required to mark the sprint complete):* actually ride at least one discovered road within two weeks and note whether the surfaced ranking matched your own judgment (input to the post-MVP scoring-calibration fast-follow).

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DISC-007 | D9 on-device capstone: verify the full discover-to-ride arc on the **route plan view** on real iOS **and** real Android against live Convex; surface and fix platform-specific issues; record per-platform evidence; founder dogfood | react-native-ui-implementer | 240 min |

**Next Sprint Tasks:** *(populated JIT when sprint becomes active by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: None (terminal sprint — the MVP "done" gate)
- Dependent on: Sprint 01, Sprint 02 (stitches the backend gates + plan-view discovery + detail + save into the one end-to-end arc)

#### PRD Coverage

- UC-DISC-01 (full discover-to-ride journey on a real device — on the route plan view) → DISC-007

#### Capability Coverage

- discover-to-ride-journey: the cross-cutting capstone integrating every prior seam — plan-view landing, curated suggestion cards (tap-to-plot), chat-driven curated discovery, card→map render, detail, save+reopen, maps handoff — verified on real iOS + real Android against live Convex with no mocks (DISC-007). Satisfies the project iron rule: integration/E2E against real services is the primary acceptance bar.

---

## Notes

- **v3.0.0 replan supersedes the DELTA-001 fold.** The old Sprint 01 ("Live Discovery Home" / dedicated discovery, then DELTA-001's pills + chat cards) is **archived** at `tasks/_archived/sprint-01-live-discovery-home/` (preserved as the as-built record; do not execute). Its salvageable scope is re-homed into the new plan-view Sprint 01 above, with explicit fix tasks for the pieces that were built poorly.
- **Built-but-rough scope (the user's "built or maybe built poorly").** Verified in code by the planning specialists: the plan view already has suggestion pills + chat routing + the card→map loop + the footer chat button + `useCuratedDiscovery` + the agent `discoverCuratedRoutes` tool. Four concrete defects are captured as fix tasks: (1) `handleSelectCuratedRoute` sends a chat message instead of plotting directly (DISC-016); (2) the slot falls back to `IDLE_SUGGESTIONS` generic prompts (DISC-017); (3) the agent tool reads nested score fields the query doesn't return → all-zero scores on chat cards (DATA-008b); (4) `menu-layout.tsx` still has the removed "Plan a ride" drawer entry (DISC-019).
- **Backend gates are not standalone sprints.** The foundational gates fold into the sprints that render them (Sprint 01 + Sprint 02), per the merge-forward rule. DATA-001/002/004/005 are built and carry forward as verify-only.
- **Pure transforms are the only unit-justified work** (archetype-map, state-normalize, length-clamp, score→%): zero I/O. Everything else is integration/E2E/human-gate against live Convex + real devices + live Open-Meteo, per `10-e2e-testing-criteria.md`.
- **Scope guardrails:** no dedicated Discover screen / filter-bar / sort-toggle / by-state picker (removed in v3.0.0); enrichment stays out (table empty); scores render as bars/% on the 0–1 scale (never "92"); the current RN look ships (no Copper Navigator redesign); no new runtime dependency (expo-linking + expo-location already installed). Chat is integral to the plan view, surfaced via the footer button.
- **Obsolete design scope** (dropped with the dedicated screen): DiscoveryFilterBar chips, DiscoverySortToggle, RoutePin browse pins, StateFilterSheet/StateListItem, the dedicated-screen loading/empty overlays, IntentSearchSheet/IntentSummaryPill.
