---
sprint: 1
title: Discovery on the Route Plan View
sequence: 1
timeline: Phase 1
status: Complete
---

# Sprint 1: Discovery on the Route Plan View

**Sequence:** 1
**Timeline:** Phase 1
**Status:** Complete
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

## Remedial Tasks — Sprint 1 Testing Feedback (added 2026-06-18)

Founder testing of the route plan view surfaced 7 UX defects. These remedial tasks were proposed by the same planning specialists (react-native-ui-planner · convex-planner · frontend-designer) and consolidated by the orchestrator; every FEATURE task passes the fakeability floor (`validate_scenario`, 0 CRITICAL/HIGH).

**What the human verifies after these land:** On a real device, planning a ride shows **one route at a time** — a single route-summary card above the chat input with `‹ ›` carousel arrows to page between *distinct* routes (no duplicate "efficient/balanced/scenic" cards for the same road); the map plots only the paged route, labelled by a small tappable **tag** on the line (not a floating button); **tapping the route line or its tag opens Route Details** (Save lives in the menu/details sheet, never on a line tap); the **Route Overview / details sheet expands fully** with Save/Ride It always reachable; and asking for a ride **without giving a start** plans from your **current location** instead of asking "where are you starting from?".

| ID | Title | Agent | Estimate | Feedback |
|----|-------|-------|----------|----------|
| DATA-009 | **(re-scoped 06-20)** plan a SINGLE route per OD — remove balanced/efficient variant generation | convex-implementer | 90 min | R1 #4 · R2 #5 |
| DATA-010 | Verify + harden the agent start-location default (plan from current/last-known; don't ask) | convex-implementer | 105 min | #3 |
| DESIGN-S01-005 | Route carousel + single route-summary-card-above-input visual/interaction spec | frontend-designer | 75 min | #1 |
| DESIGN-S01-006 | On-route map TAG/label spec (tappable polyline tag replacing the floating button) | frontend-designer | 60 min | #7 |
| DESIGN-S01-007 | Route Overview / details sheet expand spec (snap points + sticky action footer) | frontend-designer | 60 min | #2 |
| RUX-001 | Replace the bottom card stack with a single route-summary card + `‹ ROUTE DETAILS ›` carousel above the input | react-native-ui-implementer | 180 min | #1 |
| RUX-002 | Plot only the currently-paged route's polyline (one at a time); paging refits the camera | react-native-ui-implementer | 150 min | #6 |
| RUX-003 | Tapping the route polyline opens RouteDetailsSheet (details), not SaveRouteSheet | react-native-ui-implementer | 120 min | #5 |
| RUX-004 | On-route map TAG (tappable archetype + distance); tap opens Route Details | react-native-ui-implementer | 150 min | #7 |
| RUX-005 | Fix the Route Overview / details sheet so it expands fully and actions aren't cut off | react-native-ui-implementer | 120 min | #2 |

**Intra-batch ordering (waves):**
- Wave 0 (no remedial deps): `DESIGN-S01-005`, `DESIGN-S01-006`, `DESIGN-S01-007`, `DATA-009`, `DATA-010`, `RUX-003`
- Wave 1: `RUX-001` (after DESIGN-S01-005), `RUX-005` (after RUX-003 + DESIGN-S01-007)
- Wave 2: `RUX-002` (after RUX-001)
- Wave 3: `RUX-004` (after RUX-002 + RUX-003 + DESIGN-S01-006)

Design specs (`DESIGN-S01-005/006/007`) are written FIRST and each blocks its matching `RUX-*` impl task. `DATA-009`/`DATA-010` are independent backend work. `DATA-010` coordinates with the pending BOY-SCOUT migration of `ridePlanningAgent.test.ts` (land the location-prompt assertions consistent with the corrected builders).

---

## Remedial Round 2 — Sprint 1 Testing Feedback (added 2026-06-20)

A second founder testing pass surfaced 5 items. #4 (carousel/one-at-a-time) is already covered by R1 `RUX-001`/`RUX-002`/`DESIGN-S01-005`; #5 (duplicate routes) is covered by re-scoping `DATA-009` (dedup → **remove** balanced/efficient variant generation). Three genuine gaps are added below. Specialists: react-native-ui-planner + convex-planner; orchestrator-consolidated; root causes independently verified at file:line.

**What the human verifies after these land:** the app opens centered on **current location at a 3–5 mile radius** (not street-level, not whole-country); tapping a discovery route card shows the **existing map loading indicator** during resolution (reused from regular search), with no new chat message; a **finished route auto-plots and the camera frames the whole route** without a manual toggle (agent-planned routes show the full line immediately; curated routes show the real line once geometry is generated); and curated discovery routes have **real line geometry generated** into the data model (name-anchored, sample-validated before full backfill).

| ID | Title | Agent | Estimate | Feedback |
|----|-------|-------|----------|----------|
| RUX-006 | Open the map at current location, 3–5 mi radius (zoom ~11, not 14) + slot precedence | react-native-ui-implementer | 90 min | R2 #1 |
| RUX-007 | Show the existing map loading-state on a discovery card tap (reuse search mechanism) | react-native-ui-implementer | 90 min | R2 #2 |
| RUX-008 | Auto-plot + camera-fit a finished route to the whole route (reuse `doFit`); bonded to DATA-011 | react-native-ui-implementer | 150 min | R2 #3 |
| DATA-009 | **(re-scoped)** plan a SINGLE route per OD — remove balanced/efficient variant generation | convex-implementer | 90 min | R2 #5 |
| DATA-011 | Generate per-route line geometry for curated routes (name-anchored Nominatim→Google Routes), persist to the data model, sample-validate then backfill | convex-implementer | 300 min | R2 #3 |

**Coverage of the 5 R2 items:** #1 → RUX-006 · #2 → RUX-007 · #3 → RUX-008 (frontend auto-plot/fit) + DATA-011 (curated line geometry) · #4 → already R1 RUX-001/RUX-002/DESIGN-S01-005 · #5 → DATA-009 (re-scoped).

**R2 waves:**
- Wave R2-A (independent, pure frontend): `RUX-006`, `RUX-007` (after R1 DISC-016, which is Done)
- Wave R2-B (independent backend): `DATA-009` (re-scoped), `DATA-011` generation half (per-route action + schema + reader + 25-route sample gate)
- Wave R2-C (bonded): `RUX-008` + `DATA-011` `--all` backfill — integrate and verify the curated whole-route line end-to-end after both land. RUX-008's agent-route path can verify in R2-A; the curated-line human gate runs after DATA-011.

**Test tier (harness reality):** this repo's vitest aliases Convex `_generated/*` to `__mocks__/convex/*` and stubs `@rnmapbox/maps` without an imperative handle (`vitest.config.ts:150-162,195`), so the genuine real-service tier is **Maestro e2e against the dev client + live Convex dev**. Every R2 RUX task's PRIMARY AC is a Maestro flow; vitest is supplementary (asserting wiring via an additive camera/fit spy on the rnmapbox mock). DATA-009/DATA-011 PRIMARY ACs are Convex integration tests against live dev (and, for DATA-011, real Nominatim + real Google Routes). *(The inherited "live Convex via @testing-library" wording in R1 RUX-002/DISC-016 is aspirational — reconcile when those execute.)*

> **One-time cost flag:** DATA-011's full `--all` backfill is ~5,654 Google Routes calls — gated behind the 25-route sample fidelity review (founder authorizes `--all`).

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

**Remedial — Sprint 1 testing feedback** (added 2026-06-18 by /kb-sprint-tasks-plan; specialist-proposed, orchestrator-consolidated; every FEATURE task passes `validate_scenario` 0 CRITICAL/HIGH):

- DATA-009-planride-route-variant-dedup-no-duplicate-efficiency-cards.md
- DATA-010-verify-harden-agent-start-location-default-current-location.md
- DESIGN-S01-005-route-carousel-single-card-above-input-spec.md
- DESIGN-S01-006-on-route-map-tag-label-spec.md
- DESIGN-S01-007-route-overview-details-sheet-expand-spec.md
- RUX-001-replace-bottom-card-stack-with-route-carousel-above-input.md
- RUX-002-plot-only-currently-paged-route-one-at-a-time.md
- RUX-003-tap-route-line-opens-details-not-save.md
- RUX-004-on-route-tag-tappable-archetype-distance-opens-details.md
- RUX-005-route-overview-details-sheet-expand-actions-not-cut-off.md

**Remedial Round 2 — Sprint 1 testing feedback** (added 2026-06-20; react-native-ui-planner + convex-planner proposed, orchestrator-consolidated; root causes verified at file:line; PRIMARY ACs are Maestro e2e / live-Convex integration per the harness-reality note above):

- DATA-009-planride-route-variant-dedup-no-duplicate-efficiency-cards.md *(re-scoped: single route per OD)*
- RUX-006-open-map-at-current-location-3-5-mile-radius.md
- RUX-007-card-tap-map-loading-state-reuse-search-mechanism.md
- RUX-008-finished-route-auto-plot-and-camera-fit.md
- DATA-011-curated-route-geometry-generation-name-anchored.md

---

## Remedial Round 3 — Red-Hat Review Findings (cycle 1)

**Source:** [red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md](../../../reviews/red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md) (fresh independent review by `convex-reviewer` + `react-native-ui-reviewer`, 2026-07-03).
**Verdict:** `needs-revision` — 2 CRITICAL, 6 HIGH. These tasks close every CRITICAL/HIGH finding.

| ID | Severity | Title | Agent | Estimate |
|----|----------|-------|-------|----------|
| REDHAT-FIX-001 | CRITICAL | **DATA-008b:** fix `distanceMeters: 0` fabrication at `discoverCuratedRoutes.ts:151` (guard with `route.distanceMi != null`) AND create `discoverCuratedRoutes.scores.integration.test.ts` (`optionCarriesRealNonZeroScores` + `distanceGuardedToNearestSort`) | convex-implementer | 90 min |
| REDHAT-FIX-002 | HIGH | **DATA-002/004 AC-3:** add the two missing DB write-back purity tests — `listCuratedRoutes.archetype.integration.test.ts` (`gatePerformsNoDbWriteBack`) + `listCuratedRoutes.state.integration.test.ts` (`normalizeCanonicalAndNoWriteBack`) | convex-implementer | 90 min |
| REDHAT-FIX-003 | HIGH | **RUX-004/RUX-007/DISC-016/DISC-020:** create the four missing RN integration test files — `index.route-tag.integration.test.tsx`, `index.card-loading.integration.test.tsx`, `index.discovery.integration.test.tsx`, `curated-route-card.integration.test.tsx` (per each task's AC test names) | react-native-ui-implementer | 180 min |

**REDHAT-FIX task detail files** (expanded by /but-sprint-tasks-plan --only):

- REDHAT-FIX-001-data-008b-distance-meters-bug-and-scores-integration-test.md
- REDHAT-FIX-002-data-002-004-ac3-db-write-back-purity-tests.md
- REDHAT-FIX-003-rux-disc-missing-rn-integration-tests.md
