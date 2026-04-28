# Sprint 02: V2 Variants, Motion & Sandbox Coverage

**Sequence:** 2
**Timeline:** Phase 1 · Week 2
**Status:** In Progress (task expansion 2026-04-28)

## Overview

Sprint 02 closes the 42 MED-severity FID gaps that remain after Sprint 01 — wrong motion timings, missing screen variants (Idle V01–V03, Planning V01–V03, RouteResults S02/S04/V02/V03, RouteDetails S03/S04/S05/V01, Sessions S05 + date grouping, Error S04/V01/storm-gate), missing LSNavBar filter-chip + search-slot variants, and the sandbox story coverage deficit (iOS templates expose ≤2 of the 5–7 designed stories per screen; iOS LSRouteCard exposes 1 of 6 designed stories; cross-platform parity baselines and snapshot tests need to land for every newly added story).

This is still pure UI fidelity work — no Convex, no auth, no platform integration. Sprint 02 is the last sprint before V3 integration starts in Sprint 03; once it lands, every subsequent integration sprint binds real data into a sandbox that already matches `.spec/design/system/` and is regression-protected by snapshot tests on both platforms.

**Note on baseline:** during sprint-01 work the Android organism story files were already populated (LSNavigatorMessage 6, LSInlineErrorCallout 5, LSRouteSheet 5, LSRouteCard 6, LSSectionHeader 5). The remaining gap is iOS template/screen story coverage and iOS LSRouteCard story coverage, plus snapshot baseline capture and parity validation across both platforms. Tasks below are sized for the actual gap, not the originally reported "register 27 from zero" gap.

## Human Testing Gate

**Gate:** A reviewer can exercise every designed variant, animation, and motion recipe in the V2 native sandbox on both iOS and Android — including all previously empty Android organism stories — and confirm visual + motion parity with the `.spec/design/system/` HTML mockups, with `pnpm snapshots:check` reporting zero coverage gaps across atoms, molecules, organisms, and templates.

**Test Steps:**
1. Open the PlanningScreen story on iOS and Android; confirm the sketch polyline animates at the deliberate 1400ms linear loop (not the rushed 600ms) and the leading head dot breathes synchronously at 1400ms ease-in-out
2. Cycle through the new mock-provider variants — Idle V01 (no-location), V02 (first-ride), V03 (weather-advisory); Planning V01 (slow), V02 (cancel-confirm), V03 (single-candidate); RouteResults S02 (alt-selected), S04 (refining); RouteDetails S03 (dark), S04 (medium detent), S05 (dismissing), V01 (saved); Sessions S05 (new-confirm); Error S04 (recovered), V01 (offline), storm-gate variant — and confirm each renders the designed visual on both platforms
3. Open RouteResultsScreen S04 (refining) story; confirm the warm scrim overlays the map, polylines dim to 40%, the LSNavigatorMessage auto-dismisses, three primer chips appear, and a copper send button is revealed
4. Save a route from RouteDetails (V01 saved-state); confirm the toast slides in with copper check + the Save button flips to saved variant + a "Saved" pill appears beside the best badge
5. Open the LSNavBar story and toggle between basic, filter-chip-row, and search-slot variants; confirm horizontal scrolling chips and inset search field render on both platforms
6. Run `pnpm snapshots:check` and confirm zero coverage gaps across all tiers (atoms, molecules, organisms, templates) on both iOS and Android
7. Open the iOS sandbox story registry and confirm IdleScreen 7 stories, RouteResults 7 stories, RouteDetails 6 stories, Sessions 5 stories, Error 6 stories, LSRouteCard 6 stories — none are placeholders or empty
8. Run `pnpm snapshots:parity-coverage` and confirm cross-platform parity ≥95% per tier with all snapshot tests passing

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| FID-S02-T01 | iOS motion recipes wiring — sketchPolylineLoop 1400ms linear, breathing head dot 1400ms ease-in-out, LSBestBadge `bestBadgeEnter` 200ms scale+fade, record dot pulse 1400ms ease-in-out, chatOverlayEnter on suggestion chips | swift-implementer | 180 min |
| FID-S02-T02 | Android motion recipes wiring — sketch loop 1400ms, leading head dot composable + animation, drawer `spring(dampingRatio = 0.85, stiffness = StiffnessMedium)`, RouteResults polyline `Animatable.animateTo` (replacing manual coroutine loop), record dot pulse, suggestion chip enter | kotlin-implementer | 240 min |
| FID-S02-T03 | iOS Idle V01–V03 + Planning V01–V03 variants — no-location pill, first-ride no-pins, weather-advisory card; slow-planning apology, cancel-confirm sheet, single-candidate warning border + warning compass chip | swift-implementer | 240 min |
| FID-S02-T04 | Android Idle V01–V03 + Planning V01–V03 variants — parity with iOS, including header passing to LSPhaseIndicator | kotlin-implementer | 240 min |
| FID-S02-T05 | iOS RouteResults S02 (alt-selection re-promote) + S04 (refining scrim + primers + send) + V03 (Recall chip) + RouteDetails S03 (dark) / S04 (medium detent) / S05 (dismissing copper stripe) / V01 (saved-state toast + Save flip) + iOS mixed-weather story variant fix | swift-implementer | 360 min |
| FID-S02-T06 | Android RouteResults S02/S04/V03 + RouteDetails S03–S05/V01 + saved-state toast + Save button flip + Animatable.animateTo polyline replacement | kotlin-implementer | 360 min |
| FID-S02-T07 | iOS Sessions S05 (new-confirm dialog) + date grouping (TONIGHT / TODAY / THIS WEEK / LAST WEEK / EARLIER) + Error S04 (recovered fade-to-0.55) + V01 (offline wifi-off watermark) + suggestion chip wrap layout (FlowLayout) | swift-implementer | 240 min |
| FID-S02-T08 | Android Sessions S05 + date grouping + Error S04 (recovered) + V01 (offline) + storm-gate variant (`wx.storm` purple) + chip wrap (FlowRow) + suggestion chip primary/tertiary color distinction (warning-amber vs glass) | kotlin-implementer | 300 min |
| FID-S02-T09 | LSNavBar filter-chip row + search-slot variants — paired iOS + Android implementations | swift-implementer + kotlin-implementer | 240 min |
| FID-S02-T10 | Sandbox story coverage + snapshot baselines — iOS templates Idle 1→7, RouteResults 1→7, RouteDetails 2→6, Sessions 1→5, Error 1→6; iOS LSRouteCard 1→6; record snapshot baselines on both platforms; verify `pnpm snapshots:check` + `pnpm snapshots:parity-coverage` clean | swift-implementer + kotlin-implementer | 360 min |

## Dependencies

- Blocks: Sprint 03
- Dependent on: Sprint 01

## PRD Coverage

- UC-FID-01 (MED-severity AC subset — ~42 ACs + sandbox story coverage ACs)
- `remediations/00-summary.md` themes 5, 6, 8, 10 (motion, story coverage, missing variants, NavBar variants)
- `remediations/01-views-idle-planning.md` Gaps A-01, B-02..B-06, F-01, F-02, A-02, A-03, C-01, C-02
- `remediations/02-views-route.md` Gaps A1-01..A1-05, B1-06, A2-02..A2-04, F2-05, A2-03/H2-06
- `remediations/03-views-sessions-error.md` Gaps A1-01, A1-10, G1-07, F1-09, A2-07, B2-05, C2-08, D2-02, D2-03, F2-09, G2-04, H2-06
- `remediations/04-organisms-chrome.md` Gaps A-04, A-05, B-02, B-03, B-04, B-05
- `remediations/05-organisms-content.md` Gaps E2-02 (bestBadgeEnter)

## Task Detail Files

Generated by `/kb-sprint-tasks-plan` on 2026-04-28.

| Task | File | Agent | ACs |
|------|------|-------|-----|
| FID-S02-T01 | [FID-S02-T01-ios-motion-recipes-wiring.md](./FID-S02-T01-ios-motion-recipes-wiring.md) | swift-implementer | 5 |
| FID-S02-T02 | [FID-S02-T02-android-motion-recipes-wiring.md](./FID-S02-T02-android-motion-recipes-wiring.md) | kotlin-implementer | 6 |
| FID-S02-T03 | [FID-S02-T03-ios-idle-planning-variants.md](./FID-S02-T03-ios-idle-planning-variants.md) | swift-implementer | 6 |
| FID-S02-T04 | [FID-S02-T04-android-idle-planning-variants.md](./FID-S02-T04-android-idle-planning-variants.md) | kotlin-implementer | 6 |
| FID-S02-T05 | [FID-S02-T05-ios-route-results-details-variants.md](./FID-S02-T05-ios-route-results-details-variants.md) | swift-implementer | 8 |
| FID-S02-T06 | [FID-S02-T06-android-route-results-details-variants.md](./FID-S02-T06-android-route-results-details-variants.md) | kotlin-implementer | 7 |
| FID-S02-T07 | [FID-S02-T07-ios-sessions-error-variants.md](./FID-S02-T07-ios-sessions-error-variants.md) | swift-implementer | 6 |
| FID-S02-T08 | [FID-S02-T08-android-sessions-error-variants.md](./FID-S02-T08-android-sessions-error-variants.md) | kotlin-implementer | 7 |
| FID-S02-T09 | [FID-S02-T09-navbar-filter-search-variants.md](./FID-S02-T09-navbar-filter-search-variants.md) | swift-implementer + kotlin-implementer | 5 |
| FID-S02-T10 | [FID-S02-T10-sandbox-story-coverage-snapshot-baselines.md](./FID-S02-T10-sandbox-story-coverage-snapshot-baselines.md) | swift-implementer + kotlin-implementer | 7 |
