# Sprint 3: Auth and Discovery Shell

**Sequence:** 3
**Status:** Planned

## Overview

Wire the Sprint-2 component catalog into live rider-facing flows. This sprint does NOT build UI primitives — Sprint 2 already delivered the Discovery molecules, map organisms, and layout templates. Sprint 3 consumes them to deliver authenticated launch, themed app shells, the `RouteDiscoveryScreen` wired to Convex, and the ride-flow state machine (per `15-uc-ride-flow.md` UC-FLOW-01) with session hydration across app restarts.

## Human Testing Gate

**Gate:** A signed-in rider opens either native app, lands on the Sprint-2 `MapViewWrapper`-backed discovery shell populated with live Convex discovery results (routes, states, archetype counts), exercises the `IDLE → DISCOVERING` transition through `IntentSearchSheet`, persists filter + intent selections via `DiscoveryFilterBar` / `StateFilterSheet`, and on cold relaunch is restored to the exact ride-flow state (hydrated session + filters) — all using Sprint-2 components with zero new component code in this sprint.

## Human Test Deliverable

Both platforms wire the Sprint-2 catalog's Discovery + Map + Layout components into the Convex-backed discovery flow and the shared ride-flow state machine, producing a continuous signed-in rider journey whose visuals are byte-identical to the Sprint-2 sandbox captures.

## Human Test Steps

1. Confirm both app shells mount Sprint-2 `BaseViewLayout` + `MenuLayout` with zero new theme or layout code introduced in this sprint (grep for net-new component files should return none in discovery/layout/map dirs).
2. Sign in on Android and confirm the app lands on `MenuLayout` → `MapViewWrapper` (Sprint-2 `UI-045`) with live Clerk auth state wired into the shared ride-flow atoms.
3. Sign in on iOS and confirm the app lands on `MenuLayout` → `MapViewWrapper` (Sprint-2 `UI-046`) with live Clerk auth state wired into the shared ride-flow atoms.
4. On both platforms, open `IntentSearchSheet` (Sprint-2 `UI-047`/`UI-048`) and confirm it reads Convex-backed intent suggestions via the wiring added in this sprint.
5. Trigger `IDLE → DISCOVERING` by submitting an intent; confirm `DiscoveryLoadingOverlay` → `RoutePin` markers on `MapViewWrapper` → `DiscoveryFilterBar` + `DiscoverySortToggle` all populate from Convex discovery queries (not fixtures).
6. Apply a state filter via `StateFilterSheet` and an archetype filter via `DiscoveryFilterBar`; kill the app; relaunch; confirm both filters, the intent, and the ride-flow state restore exactly from local preferences + Convex hydration.

## Source Coverage

- `06-technical-requirements.md`
- `08-design-system.md`
- `08a-atomic-component-catalog.md`
- `08d-component-parity-spec.md`
- `15-uc-ride-flow.md`
- `17-state-convex-architecture.md`

## Dependencies

- Sprint 1: Repo Restructure and Server Frontload
- Sprint 2 UI tasks (specific component subsets required by this sprint):
  - `UI-001` — Shared token pipeline (both platforms consume)
  - `UI-013` / `UI-014` — Map polyline atoms (`RoutePolyline`, `RoutePolylineComponent`, `DeviationPolyline`)
  - `UI-021` / `UI-022` — Route card molecules incl. `RoutePin`
  - `UI-027` / `UI-028` — Discovery molecules (`DiscoveryFilterBar`, `DiscoverySortToggle`, `DiscoveryEmptyOverlay`, `DiscoveryLoadingOverlay`, `IntentSummaryPill`, `StateListItem`)
  - `UI-035` / `UI-036` — Auth molecules (`AuthCard`, `TopographicBackground`)
  - `UI-045` / `UI-046` — Map organisms (`MapViewWrapper`, `MapboxMapView`, `MapToastStack`)
  - `UI-047` / `UI-048` — Discovery sheets (`IntentSearchSheet`, `StateFilterSheet`)
  - `UI-053` / `UI-054` — Layout templates (`BaseViewLayout`, `MenuLayout`, `AuthScreenLayout`)
  - `UI-059` / `UI-060` — `RouteDiscoveryScreen` composition

## Blocks

- Sprint 4: Chat Planning and Comparison
- Sprint 5: Turn-by-Turn Navigation
- Sprint 7: Offline Maps and Cache Recovery
- Sprint 9: Gatekeeper and Platform Polish

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| ADS-001 | Wire Android app shell: mount Sprint-2 layout templates + Clerk bootstrap into token-driven theme provider | kotlin-implementer | 1 day |
| ADS-002 | Wire iOS app shell: mount Sprint-2 layout templates + Clerk bootstrap into token-driven theme provider | swift-implementer | 1 day |
| ADS-003 | Implement shared ride-flow state machine + hydration guards per UC-FLOW-01 (no UI) | worker | 0.5 day |
| ADS-004 | Wire Android `RouteDiscoveryScreen` composition to Convex discovery queries + ride-flow state machine | kotlin-implementer | 1 day |
| ADS-005 | Wire iOS `RouteDiscoveryScreen` composition to Convex discovery queries + ride-flow state machine | swift-implementer | 1 day |
| ADS-006 | Implement Convex discovery repositories, local preference persistence, and shared atoms feeding the Sprint-2 discovery components | convex-implementer | 0.5 day |

---

### ADS-001 — Wire Android app shell

Consume Sprint-2 (`UI-053`) layout templates and auth molecules to produce the signed-in launch surface. No new component code — only wiring: Clerk session → shared auth atoms → `MenuLayout` root; token pipeline from `UI-001` feeds the existing `SemanticTheme`.

#### Components Consumed
- `BaseViewLayout`
- `MenuLayout`
- `AuthScreenLayout`
- `AuthCard`
- `TopographicBackground`
- `LaneShadowLogo`

---

### ADS-002 — Wire iOS app shell

Mirror of ADS-001 using `UI-054` outputs. No new component code — only wiring: Clerk session → shared auth atoms → `MenuLayout` root; token pipeline feeds `semantic` environment.

#### Components Consumed
- `BaseViewLayout`
- `MenuLayout`
- `AuthScreenLayout`
- `AuthCard`
- `TopographicBackground`
- `LaneShadowLogo`

---

### ADS-003 — Shared ride-flow state machine + hydration

Implement the `IDLE | DISCOVERING | …` state contract from `15-uc-ride-flow.md` UC-FLOW-01 as shared atoms + a hydration guard that restores the last valid state from local preferences on cold start. No UI; consumed by ADS-004/005/006.

#### Components Consumed
_(none — pure state contract; this task produces the atoms the Sprint-2 components bind to downstream)_

---

### ADS-004 — Wire Android discovery screen to Convex + ride-flow state

Compose the Sprint-2 discovery catalog (`UI-027`, `UI-045`, `UI-047`, `UI-059`) into `RouteDiscoveryScreen`. Bind `IntentSearchSheet` submissions to the ADS-003 state machine, populate `MapViewWrapper` markers from Convex discovery queries (ADS-006), feed `DiscoveryFilterBar` + `DiscoverySortToggle` + `StateFilterSheet` selections back into Convex filter arguments, and surface `DiscoveryLoadingOverlay` / `DiscoveryEmptyOverlay` per state. No new component code.

#### Components Consumed
- `MapViewWrapper`
- `MapboxMapView`
- `MapToastStack`
- `RoutePin`
- `DiscoveryFilterBar`
- `DiscoverySortToggle`
- `DiscoveryLoadingOverlay`
- `DiscoveryEmptyOverlay`
- `IntentSearchSheet`
- `IntentSummaryPill`
- `StateFilterSheet`
- `StateListItem`
- `MenuLayout`
- `BaseViewLayout`

---

### ADS-005 — Wire iOS discovery screen to Convex + ride-flow state

Mirror of ADS-004 using `UI-028`, `UI-046`, `UI-048`, `UI-060`. No new component code.

#### Components Consumed
- `MapViewWrapper`
- `MapboxMapView`
- `MapToastStack`
- `RoutePin`
- `DiscoveryFilterBar`
- `DiscoverySortToggle`
- `DiscoveryLoadingOverlay`
- `DiscoveryEmptyOverlay`
- `IntentSearchSheet`
- `IntentSummaryPill`
- `StateFilterSheet`
- `StateListItem`
- `MenuLayout`
- `BaseViewLayout`

---

### ADS-006 — Convex discovery repositories + shared atoms + preference persistence

Implement the Convex queries/mutations that back discovery (routes, states, archetype counts, intent suggestions), the local-preference persistence for filters + intent, and the shared atoms that the Sprint-2 Discovery components read from. This is the data spine for ADS-004/005 — no UI, but the atom shapes must match the props declared on Sprint-2 components (`DiscoveryFilterBar.selectedArchetypes`/`counts`, `StateFilterSheet.selectedStates`, `IntentSearchSheet.query`, `RoutePin.route`, etc.) exactly.

#### Components Consumed
_(none rendered; task delivers the atom contracts + Convex endpoints that feed the components listed in ADS-004/005)_
