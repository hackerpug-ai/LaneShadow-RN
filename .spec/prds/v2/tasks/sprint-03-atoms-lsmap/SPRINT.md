# Sprint 3: Atoms — LSMap

**Sequence:** 3
**Timeline:** Phase 2 · Week 2–3 (parallel-capable with Sprint 4)
**Status:** Planned

---

## Overview

This sprint lands the Mapbox-backed `LSMap` atom as three carved-out UCs — a shared cross-platform contract (tokens, typed API, fixture polylines, stub fallback on both platforms) followed by two parallel production implementations. The contract ships first; iOS and Android implementations then proceed in parallel without drifting. SDK integration diverges materially per platform (SPM vs Gradle, `UIViewRepresentable` vs `AndroidView`, Mapbox Maps SDK surface differences) so separating the contract from the impls prevents one platform from reshaping the API unilaterally. The contract is multi-polyline (plural `polylines: [PolylineData]`) with `RouteVariant` coloring so downstream RouteResults can render three concurrent alt routes.

Per-platform split: this sprint is already platform-split at the UC level per the PRD (UC-ATM-11 contract / UC-ATM-12 iOS / UC-ATM-13 Android). No further split is needed — each UC maps 1:1 to a specialist.

---

## Package Boundaries (CONSTITUTION)

Inherited from Sprint 1; restated with map-specific constraints.

- **Theme package is the ONLY token source.** `LSMap` consumes `color.route.{best,alt1,alt2}`, `sizing.stroke.*`, `spacing.*`, and `map.style.{light,dark}` exclusively from the project-local theme package (`tokens/platforms/swift/Sources/LaneShadowTheme/` on iOS, `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` + `LaneShadowTheme` Compose wrapper on Android). Mapbox Studio style URLs come from the token pipeline, not from hardcoded strings. No `Color.red`, no raw hex, no inline stroke widths.
- **Sandbox runtime is the ONLY preview surface.** All nine `LSMap` stories register into `ios/LaneShadow/Sandbox/Stories/MapStories.swift` and `android/app/src/debug/java/com/laneshadow/sandbox/stories/MapStories.kt` via `Story`, `SandboxRoot`, `ThemeController`, `ArgValues` from `~/Projects/native-sandbox`.
- **Contract boundary is absolute.** UC-ATM-11 contract types (`PolylineData`, `RouteVariant`, `MapError`, `Annotation`) must not import or reference `MapboxMap`, `MapView`, `LineLayer`, `CircleAnnotation`, or any other Mapbox SDK symbol. Platform impls (UC-ATM-12 iOS, UC-ATM-13 Android) isolate SDK types behind the contract.
- **Story contract.** `LSMap` stories conform to the same native-sandbox Tier 1 shape as other atoms (dotted `atoms.map.{variant}` IDs, `ComponentTier.atom`, `component: "LSMap"`, `summary`, stateless render closure receiving `ArgValues`). Registered into `AtomStories.all` on both platforms. Android story file lives under `android/app/src/debug/java/com/laneshadow/sandbox/stories/MapStories.kt`.

---

## Human Test Deliverable

A reviewer can open the `LSMap` atom stories on iOS and Android, verify preview mode, interactive mode, multi-polyline rendering (best/alt1/alt2 with distinct stroke colors from `color.route.*`), annotation rendering (`start/end/waypoint`), camera-fit behavior (static / single polyline / multi-polyline union bounds), and graceful error fallback — all backed by the Copper Paper Light and Copper Paper Dark Mapbox Studio styles, with no Mapbox SDK symbols leaking through the shared contract.

**Test Steps:**
1. Open `tokens/api/LSMap.contract.md` and confirm the `LSMap` signature (`polylines: [PolylineData]`, `cameraFit: .static|.polyline|.polylines`, `annotations: [Annotation]`, `onTap`), the `RouteVariant` enum, and the `MapError` enum are defined with only cross-platform types — grep for `MapView`, `MapboxMap`, `LineLayer`, `CircleAnnotation` in that file and confirm zero matches.
2. Open `tokens/sandbox/fixtures/routes.fixtures.json` and confirm at least one fixture scenario (e.g., `route_results_three_alts`) contains three `PolylineData` entries with variants `.best`, `.alt1`, `.alt2`.
3. Open "Atoms / Map" on iOS and exercise stories for Preview (static), Interactive, One Polyline (best), Three Alt Polylines (best+alt1+alt2), Start+End Markers, Auto-fit to Multi-polyline, Dark Style, Error (no token), Error (no network). Verify the Copper Paper Light style loads; toggle dark and verify the Copper Paper Dark style reloads without unmounting.
4. Open the same nine stories on Android and confirm byte-identical behavior per the parity manifest; place an interactive `LSMap` inside a vertically scrolling parent on both platforms and confirm the map does not hijack outer scroll when the drag originates outside the map bounds.
5. Temporarily unset `MAPBOX_ACCESS_TOKEN`, rebuild, and confirm both platforms render the `LSGlassPanel` + caption fallback ("Map unavailable — missing access token") with no crash; then disable network on simulator/emulator and confirm the "Map unavailable — no network" variant renders.
6. Pass `cameraFit: .polylines(padding: .spacing4)` with a three-polyline set on both platforms and confirm the camera auto-frames the union bounds with `spacing.4` padding.
7. Run the iOS XCTest suite and Android JUnit + Compose UI suite for `LSMap` and confirm coverage of multi-polyline rendering, per-variant color resolution, style URL resolution per theme, annotation rendering, camera-fit-to-union-bounds, `onTap` invocation, scroll-isolation, and no-symbol-leak.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-ATM-11 | `LSMap` shared contract (multi-polyline, route variants, tokens, fixtures, stubs) — cross-platform | swift-planner + kotlin-planner (shared contract) | 240 min |
| UC-ATM-12-ios | `LSMap` iOS implementation (Mapbox Maps SDK for iOS, `UIViewRepresentable`) | swift-implementer | 960 min |
| UC-ATM-13-android | `LSMap` Android implementation (Mapbox Maps SDK for Android, `AndroidView`) | kotlin-implementer | 960 min |

---

## Human Testing Gate

**Gate:** The `LSMap` atom stories render on both iOS and Android — preview mode, interactive mode, multi-polyline (best/alt1/alt2 with `color.route.*` strokes), start/end/waypoint annotations, `.polylines` camera auto-fit to union bounds, and token-gated error fallback — all driven by the Copper Paper Light and Copper Paper Dark Mapbox Studio styles, with zero Mapbox SDK symbols leaking through the shared cross-platform contract at `tokens/api/LSMap.contract.md`.

---

## Source Coverage

- `.spec/prds/v2/05-uc-atm.md` — UC-ATM-11, UC-ATM-12, UC-ATM-13 acceptance criteria (the PRD's one exception where platform-split happens at the PRD level)
- `.spec/prds/v2/11-technical-requirements.md` — Mapbox Studio access-token loading conventions + `LSMap` contract summary
- Mapbox Maps SDK for iOS — https://docs.mapbox.com/ios/maps/guides/
- Mapbox Maps SDK for Android — https://docs.mapbox.com/android/maps/guides/
- `tokens/api/LSMap.contract.md` (emitted by UC-ATM-11)
- `tokens/sandbox/fixtures/routes.fixtures.json` (emitted by UC-ATM-11)

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-ATM-11 | [`concepts/uc-atm-11-map-contract.html`](../../concepts/uc-atm-11-map-contract.html) |
| UC-ATM-12-ios | [`concepts/uc-atm-12-map-ios.html`](../../concepts/uc-atm-12-map-ios.html) |
| UC-ATM-13-android | [`concepts/uc-atm-13-map-android.html`](../../concepts/uc-atm-13-map-android.html) |

---

## Blocks

- Sprint 5 (Organisms) — `LSMapLayer` (UC-ORG-02) and `LSRouteCard` (UC-ORG-06) both consume the `LSMap` atom and its multi-polyline contract.
- Sprint 6 (Screens) — every Navigator screen renders through `LSMapLayer` over `LSMap`.

**Parallelism note:** Sprint 3 and Sprint 4 can execute in parallel — molecules (Sprint 4) do not depend on `LSMap`. Sequencing here is presentational; implementers may start Sprint 4 as soon as UC-ATM-10 (Icon) lands from Sprint 2.
