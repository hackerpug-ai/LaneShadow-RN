---
sprint: 2
title: Route Detail + Close the Loop
sequence: 2
timeline: Phase 2
status: Planned
---

# Sprint 2: Route Detail + Close the Loop

**Sequence:** 2
**Timeline:** Phase 2
**Status:** Planned
**Proposed by:** convex-planner + react-native-ui-planner + frontend-designer

> Generated JIT from [ROADMAP.md](../../ROADMAP.md) by /kb-sprint-tasks-plan (2026-07-02). Re-pointed for v3.0.0: detail is reached by tapping a curated route **on the plan view** (its chat card or its map pin), not from a dead Discover screen. The query/save/deep-link contracts are otherwise unchanged. All of this is net-new (the curated detail route, its hooks, `getCuratedRouteDetail`, and `curatedRouteRef` are not yet built).

> ✅ **EXPANSION COMPLETE (2026-07-02).** All 9 tasks expanded to `TASK-*.md` files. Specialist authorship: backend tasks (DATA-006, DATA-003) proposed by `convex-planner`; all 7 RN tasks (DTL-001, DESIGN-001..004, SAVE-001, SAVE-002) proposed by `react-native-ui-implementer` **standing in as the RN planning specialist** — the nominal `react-native-ui-planner` agent is non-responsive in this harness (3 consecutive empty `state:completed` bodies), so the RN domain implementer authored the task JSON per v4.6's domain-specialist rule (every task carries an honest `Proposed By:`). `frontend-designer` returned 5 design-enrichment sets merged into the RN task Design sections. Every FEATURE task passes the fakeability floor (`validate_scenario.py`, 0 CRITICAL/HIGH); all 9 are `tdd_mode: red_first`. ROADMAP.md Sprint 02 status → In Progress. Run with `/kb-run-sprint tasks/sprint-02-route-detail-close-the-loop`.

---

## Overview

From a curated route discovered on the Sprint 01 route plan view (tapping its chat card or its map pin), an honest, complete curated-route detail opens — summary/name headline, five score bars with a composite headline as %/bars on the 0–1 scale, a polyline-or-centroid map with an "Approximate location" badge for the ~45% lacking geometry, and basic current conditions. From there the rider can save the route via `curatedRouteRef`, find it again in the existing Saved screen, reopen it without error, and hand off to Apple/Google Maps to ride it (with a web fallback when the native maps app is absent).

Backend gates land first (`DATA-006` + `DATA-003`), then the detail route + hook + tap-wiring (`DTL-001`), then the score-bar primitive (`DESIGN-001`), the detail body (`DESIGN-002`), and geometry graceful degradation (`DESIGN-003`); `SAVE-001` consumes the new field, `SAVE-002` is the maps deep-link util, and `DESIGN-004` wires the Save + Ride It affordances onto the detail screen.

---

## Human Test Deliverable

From a curated route discovered on the route plan view (Sprint 01) — tapping its card or its map pin — an honest, complete curated-route detail opens (summary/name headline, five score bars with a composite headline as %/bars on the 0–1 scale, a polyline-or-centroid map with an "Approximate location" badge for the ~45% lacking geometry, and basic current conditions); from there the rider can save the route via `curatedRouteRef`, find it again in the existing Saved screen, reopen it without error, and hand off to Apple/Google Maps to ride it (with a web fallback when the native maps app is absent).

**Test Steps:**
1. On the plan view, tap a curated route (its chat card or its map pin) that HAS geometry and observe the detail open showing the route name, an archetype badge, the composite score headline above five score bars, and the route polyline on the map.
2. Tap a curated route with NO polyline and observe the detail show a single centroid marker plus an "Approximate location" badge — never a blank or crashed map; also open a route with no summary and observe a "No description yet" muted placeholder, not a blank gap.
3. Observe the detail show basic current weather conditions (or "conditions unavailable" on failure) without blocking the rest of the screen.
4. On a short detail page, observe both Save and Ride It are visible without scrolling; then open a route whose summary + conditions push content below the fold and observe Save/Ride It scroll with the body to the bottom (not pinned to the screen bottom).
5. Tap Save and observe a loading state resolve to a confirmed "Saved" state in place without leaving the screen.
6. Open the Saved screen, observe the route appear in the list, tap it and observe it reopen without an error (no legs/PlanInput crash).
7. Tap Ride It and observe Apple Maps open (iOS) / Google Maps open (Android) at the route with its name.
8. On Android with Google Maps uninstalled, tap Ride It and observe it fall back to opening maps in the browser rather than crashing.

---

## Tasks

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

---

## Human Testing Gate

**Gate:** From a curated route discovered on the route plan view (Sprint 01) — tapping its card or its map pin — an honest, complete curated-route detail opens (summary/name headline, five score bars with a composite headline as %/bars on the 0–1 scale, a polyline-or-centroid map with an "Approximate location" badge for the ~45% lacking geometry, and basic current conditions); from there the rider can save the route via `curatedRouteRef`, find it again in the existing Saved screen, reopen it without error, and hand off to Apple/Google Maps to ride it (with a web fallback when the native maps app is absent).

---

## Source Coverage

- UC-DATA-03 (curatedRouteRef bookmark field) → DATA-003
- UC-DATA-06 (getCuratedRouteDetail) → DATA-006
- UC-DTL-01 (lean detail layout) → DTL-001 + DESIGN-002
- UC-DTL-02 (score-bar visualization) → DESIGN-001
- UC-DTL-03 (geometry graceful degradation) → DESIGN-003
- UC-DTL-04 (detail actions affordance) → DESIGN-004
- UC-SAVE-01 (save + reopen) → SAVE-001
- UC-SAVE-02 (Ride-It deep-link) → SAVE-002
- e2e criteria: T-DATA-009, T-DATA-010, T-DTL-001..004, T-SAVE-001, T-SAVE-002 ([10-e2e-testing-criteria.md](../../10-e2e-testing-criteria.md))

## Capability Coverage

- FEATURE(D3) getCuratedRouteDetail: lean detail + 0–1 scores + `routePolyline: string|null` (55%/45% split) + centroid for weather; reads NO enrichment (DATA-006)
- SAVE-RESOLVE: additive optional `curatedRouteRef` bookmark with `curatedRouteRef XOR planned-payload` validation (DATA-003)
- score-bar-visualization-primitive: the single net-new UI primitive, display-only, pure score→% transform (DESIGN-001)
- geometry-fallback-ux: polyline-or-centroid with "Approximate location" badge (DESIGN-003)
- curated-bookmark-persistence: save via `curatedRouteRef` + `recordRouteFeedback('save')`, reopen without synthesized legs (SAVE-001)
- centroid→maps-deep-link: platform-correct handoff with web fallback, no new dependency (SAVE-002)

---

## Blocks

- Sprint 03 (On-Device D9 Capstone) — stitches the backend gates + plan-view discovery + detail + save into the one end-to-end arc

## Dependencies

- Dependent on: Sprint 01 (`getCuratedRouteDetail` reuses the archetype-map + state/length transforms; `SAVE-001` consumes the `curatedRouteRef` field; the detail is reached by tapping a curated route on the plan view)
- **Intra-sprint ordering:** `DATA-006` + `DATA-003` precede the client hooks/mutations; `DTL-001` (route + hook + tap-wiring) precedes `DESIGN-002` (body) and `SAVE-001`; `DESIGN-001` (ScoreDimensionBar) precedes `DESIGN-002`; `DESIGN-003` co-develops with the body's map section; `DESIGN-004` consumes `SAVE-001` + `SAVE-002`.

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-07-02

- DATA-006-getcuratedroutedetail-public-query-lean-fields-01-scores.md
- DATA-003-add-optional-curatedrouteref-to-saved-routes-additive-xor.md
- DTL-001-create-curated-route-id-route-usecuratedroutedetail-hook-wire.md
- DESIGN-001-build-scoredimensionbar-primitive-in-components-ui-labeled-percent-bar.md
- DESIGN-002-build-the-lean-curated-route-detail-screen-body-six-sections.md
- DESIGN-003-geometry-graceful-degradation-polyline-centroid-approximate-badge.md
- DESIGN-004-detail-actions-ux-save-loading-saved-in-place-ride-it.md
- SAVE-001-save-curated-route-via-curatedrouteref-usesavecuratedroute-saved.md
- SAVE-002-ride-it-maps-deep-link-util-lib-maps-deeplink-ts-apple-google.md
