---
sprint: 1
title: Discovery on the Route Plan View
sequence: 1
timeline: Phase 1
status: In Progress
---

# Sprint 1: Discovery on the Route Plan View

**Sequence:** 1
**Timeline:** Phase 1
**Status:** In Progress
**Proposed by:** react-native-ui-planner + convex-planner + frontend-designer

> Generated JIT from [ROADMAP.md](../../ROADMAP.md) by /kb-sprint-tasks-plan (2026-06-15). Re-homed from the deprecated `sprint-01-live-discovery-home` (archived at `../_archived/`) after PRD v3.0.0 removed the separate discovery view.

---

## Overview

Discovery is the behavior of the app's single **route plan view** (the map + chat home, `app/(app)/(tabs)/index.tsx`). The backend gates (geospatial seed, archetype map, state/length normalize, `listCuratedRoutes`), the `useCuratedDiscovery` hook, and the agent `discoverCuratedRoutes` tool were BUILT in the deprecated sprint and carry forward (verify). The plan-view discovery UX was partly built and partly built poorly — this sprint FIXES the rough pieces (suggestion-card tap routing, the `IDLE_SUGGESTIONS` fallback, the agent tool's zero-score bug, the leftover "Plan a ride" drawer entry) and drops the dedicated-screen scope.

---

## Human Test Deliverable

On a real device, open the app to the route plan view (no separate Discover screen): with no route on the map, curated-route suggestion cards over the chat input plot a route directly on tap; chatting "twisties near Asheville" (or "scenic roads in North Carolina") returns curated routes as chat cards with real non-zero scores and plots the latest; tapping an earlier card re-renders it and returns to map view; clearing the route brings the cards back; the full chat view opens from the footer button right of the input.

**Test Steps:**
1. Launch the app on a real device and observe it open directly to the full-screen map + chat home (no separate Discover screen). Open the drawer and confirm its only navigation entries are the standard ones (e.g. Settings, Saved) — with NO "Plan a ride" entry and NO "Discover" entry — and confirm there is no filter-bar, sort-toggle, or state-picker control on the home. *(Run the full gate only after all sprint tasks, including DISC-021 quarantine, have landed.)*
2. With no route on the map, observe curated-route suggestion cards over the chat input showing a real curated road name and its mileage from the live catalog (styled distinct from generic planning prompts — copper accent + road icon), and observe the input placeholder read as a discovery invite, never the generic "Plan a scenic ride"/"Find coffee nearby" prompts.
3. Tap a suggestion card and observe that exact curated route plot on the map immediately, with no chat message sent, and observe the suggestion cards disappear once the route is shown.
4. Clear or dismiss the route on the map and observe the curated suggestion cards return.
5. Type "twisties near Asheville" and observe curated route card(s) appear in the chat history and the latest curated route plot on the map; observe the card shows a real composite score as a percentage/bars (never 0%, never a raw 0–1 decimal, never a raw 0–100 number).
6. Type "scenic roads in North Carolina" (no filter-bar or state picker) and observe matching curated routes returned for that state and plotted.
7. Scroll the chat history, tap an earlier curated-route card, and observe it re-render on the map and drop you back to map view.
8. Tap the footer button to the right of the chat input — confirm it is visually distinct from the send button — and observe the full chat view open; close it and observe the map return.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| DATA-001 | Geospatial points seeded from `curated_routes` centroids *(carried — built; verify idempotent + non-empty)* | convex-implementer | 30 min |
| DATA-002 | Archetype UI↔DB mapping in the read path *(carried — built; verify pure + applied)* | convex-implementer | 30 min |
| DATA-004 | State-normalize + length-clamp transforms in the read path *(carried — built; verify)* | convex-implementer | 30 min |
| DATA-005 | `listCuratedRoutes` public query (bbox/center/state/archetype/sort, Clerk-gated) *(carried — built; verify all 4 modes)* | convex-implementer | 45 min |
| DATA-008 | Verify the agent `discoverCuratedRoutes` tool maps NL intent → `listCuratedRoutes` → `routing_card` and is invoked by the ReAct loop (determinism seam) | convex-implementer | 90 min |
| DATA-008b | **FIX:** `discoverCuratedRoutes` reads nested `route.scores`/`route.score` but `listCuratedRoutes` returns flat `compositeScore`/`*Score` fields → chat cards show composite 0 / all-zero bars; map flat fields so surfaced scores are the route's real 0–1 values | convex-implementer | 90 min |
| OPS-001 | Guard against empty-Convex-deployment drift (combined dev script + loud health check; canary = `listCuratedRoutes`) *(carried; re-verify/harden)* | convex-implementer | 60 min |
| DISC-002 | Verify + harden `useCuratedDiscovery` against all five UC-DISC-04 ACs (row shape, center derivation, nearest/best, UI-enum archetypes, 0–1 scores, loading≠empty) *(carried — built; verify)* | react-native-ui-implementer | 60 min |
| DISC-016 | **FIX:** tapping a suggestion card plots the already-fetched curated route on the map directly (today `handleSelectCuratedRoute` sends a chat message to the NL agent) | react-native-ui-implementer | 150 min |
| DISC-017 | **FIX:** suggestion slot shows curated cards (or nothing while loading/empty) — never the generic `IDLE_SUGGESTIONS` planning prompts | react-native-ui-implementer | 90 min |
| DISC-018 | Verify/harden the footer "open full chat" button (distinct from send) + suggestion-card visibility keyed to "no active route on the map" | react-native-ui-implementer | 75 min |
| DISC-019 | **FIX:** remove the leftover "Plan a ride" drawer entry from `menu-layout.tsx` | react-native-ui-implementer | 30 min |
| DISC-020 | Render chat-driven curated routes as transcript cards (curated variant; score as %/bars) + verify the card→map→return-to-map loop with centroid fallback | react-native-ui-implementer | 120 min |
| DISC-021 | Quarantine the dropped dedicated-discovery components so none are imported by an active screen/hook (lands last) | react-native-ui-implementer | 60 min |
| DESIGN-S01-001 | Suggestion-card visual spec/audit (copper accent + road icon, `surface.glass` scrim @ 72%, ≥44pt, hidden when a route is shown) | frontend-designer | 60 min |
| DESIGN-S01-002 | Curated-route chat-card variant spec (composite score as %/bars on 0–1; distinct from a planned-trip routing card) | frontend-designer | 75 min |
| DESIGN-S01-003 | No-route empty/invite home-state spec (`home-empty-state`): discovery-invite copy + empty-catalog messaging over a `surface.glass` scrim | frontend-designer | 45 min |
| DESIGN-S01-004 | Footer full-chat button distinction spec (icon/shape vs send; ≥44pt; active-state) | frontend-designer | 30 min |

---

## Human Testing Gate

**Gate:** On a real device the app opens directly to the single route plan view (map + chat home — no dedicated Discover screen, no archetype filter-bar, no sort-toggle, no by-state picker, no "Plan a ride" drawer entry): with no route on the map, curated-route suggestion cards over the chat input offer whole curated roads from the live 5,654-route catalog and tapping one plots that route **directly** on the map (no chat round-trip); typing "twisties near Asheville" (or "scenic roads in North Carolina") returns curated routes as chat cards with real non-zero scores and plots the latest on the map; tapping an earlier card re-renders it and returns to map view; clearing the route brings the suggestion cards back; and the full chat view opens from the footer button right of the chat input, visually distinct from send.

---

## Source Coverage

- UC-DISC-09 (suggestion cards over the plan input → plot) → DISC-016, DISC-017, DESIGN-S01-001, DESIGN-S01-003
- UC-DISC-10 (chat-driven curated discovery via the card→map loop) → DATA-008, DATA-008b, DISC-020, DESIGN-S01-002
- UC-DISC-11 (discovery lives on the plan view; no separate screen; full chat from footer button) → DISC-018, DISC-019, DISC-021, DESIGN-S01-004
- UC-DISC-04 (`useCuratedDiscovery` hook) → DISC-002
- UC-DATA-01, UC-DATA-02, UC-DATA-04, UC-DATA-05 (backend gates) → DATA-001, DATA-002, DATA-004, DATA-005
- Sprint 01 app-live prerequisite + R-DATA-6 (empty-deployment / geospatial drift guard) → OPS-001
- e2e criteria: T-DISC-004, T-DISC-009, T-DISC-010, T-DISC-011 ([10-e2e-testing-criteria.md](../../10-e2e-testing-criteria.md))

## Capability Coverage

- SPATIAL-RESOLVE: geospatial points seeded from centroids (DATA-001) → consumed by `listCuratedRoutes`
- ARCHETYPE-ALIGN: pure UI↔DB archetype mapping in the read path (DATA-002)
- DATA-NORM: pure state-normalize + length-clamp in the read path (DATA-004)
- FEATURE(D2) listCuratedRoutes: net-new public browse query (DATA-005) — single data source for suggestion cards + chat discovery
- plan-view-discovery: discovery as the state of the route plan view (no route ⇒ cards over the input, tap → direct plot; route ⇒ rendered, cards hidden) riding the existing `routing_card` → `RouteAttachmentCard` → map → return-to-map machinery; NL discovery via the agent tool (DATA-008/008b) with the intent fixtured at the determinism seam
- dev-workflow-integrity: the Convex deployment every subscription depends on is never silently empty (OPS-001)

---

## Blocks

- Sprint 02 (Route Detail + Close the Loop)
- Sprint 03 (On-Device D9 Capstone)

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-06-16. Each carries a `<!-- REQUIREMENT-CONTRACT v1 -->` block with the flattened requirements[] + scenario fixtures. Every FEATURE task passes the fakeability floor (validate_scenario, 0 CRITICAL/HIGH); avg quality 108/115 (min 105). Proposed by react-native-ui-planner + convex-planner + frontend-designer; orchestrator consolidated.

- DATA-001-geospatial-points-seeded-from-curated-routes-centroids-carri.md
- DATA-002-archetype-ui-db-mapping-in-the-read-path-carried-verify-pure.md
- DATA-004-state-normalize-length-clamp-transforms-in-the-read-path-car.md
- DATA-005-listcuratedroutes-public-query-all-4-browse-modes-clerk-gate.md
- DATA-008-verify-discovercuratedroutes-maps-nl-intent-listcuratedroute.md
- DATA-008b-fix-discovercuratedroutes-reads-nested-route-scores-route-sc.md
- OPS-001-guard-against-empty-convex-deployment-drift-combined-dev-scr.md
- DISC-002-verify-harden-usecurateddiscovery-against-all-five-uc-disc-0.md
- DISC-016-fix-tapping-a-curated-suggestion-card-plots-the-already-fetc.md
- DISC-017-fix-discovery-slot-shows-curated-cards-only-never-the-generi.md
- DISC-018-verify-harden-the-footer-open-full-chat-button-distinct-from.md
- DISC-019-fix-remove-the-leftover-plan-a-ride-drawer-entry-from-menu-l.md
- DISC-020-render-chat-driven-curated-routes-as-transcript-cards-curate.md
- DISC-021-quarantine-the-dropped-dedicated-discovery-components-so-non.md
- DESIGN-S01-001-suggestion-card-visual-spec-audit-chip-variant-copper-accent.md
- DESIGN-S01-002-curated-route-chat-card-variant-spec-composite-score-as-bars.md
- DESIGN-S01-003-no-route-empty-invite-home-state-spec-testid-home-empty-stat.md
- DESIGN-S01-004-footer-full-chat-button-distinction-spec-icon-shape-vs-send-.md
