# Sprint 01: V2 Critical Distortion Fixes

---
sequence: 1
timeline: "Phase 1 · Week 1"
status: Planned
sprint_id: sprint-01-v2-critical-distortion-fixes
---

## Overview

Sprint 01 closes the 36 HIGH-severity FID gaps that produce the most visible distortion in the V2 native sandbox — Newsreader serif typography, glass-panel container, iOS map placeholder, Android build blockers, and token errors. All work targets the existing sandbox/mock-provider surface; no live-data integration.

## Human Testing Gate

**Gate:** A reviewer can open the V2 native sandbox on iOS Simulator and Android Emulator and confirm that Newsreader serif typography renders correctly on all designated components, the iOS map slot shows a real Mapbox map (not a LinearGradient placeholder), the Sessions drawer is solid (not glass-blurred), and the Android app compiles without errors.

**Test Steps:**
1. Open the V2 sandbox on iOS Simulator and tap the IdleScreen `default` story; confirm the greeting headline reads in Newsreader italic serif at the opinion-xl size with the meta row ("FRIDAY · 68°F · CLEAR") rendered in copper signal color
2. Tap the SessionsScreen story on both iOS Simulator and Android Emulator; confirm the LSSessionsDrawer is opaque (solid `surface.card`) — no map content visible behind drawer text — and "Rides" header renders in Newsreader opinion-lg italic
3. Run `cd /Users/justinrich/Projects/LaneShadow/android && ./gradlew assembleDebug` and confirm the build completes with zero compilation errors (Session data class declared in LSSessionsDrawer.kt; RouteDetailsScreen.kt polyline decoded via `PolylineDecoder.decodeOrNull()`)
4. Open RouteDetailsScreen story on Android and confirm a real polyline renders on the map (not a blank slate from `emptyList()`)
5. Tap the LSRouteCard story on iOS and confirm the map preview fills the card edge-to-edge with no inner double-rounded corner artifacts
6. Tap the IdleScreen / PlanningScreen / ErrorScreen stories on iOS and confirm the map slot shows a real Mapbox map instead of a two-color `LinearGradient` placeholder
7. Open the LSInlineErrorCallout story on iOS and confirm the body text renders in Newsreader opinion-md (not Geist heading.md proxy)

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| FID-S01-T01 | iOS Newsreader serif typography rollout — IdleScreen greeting (opinion-xl), Sessions "Rides" (opinion-lg italic), Error callout body (opinion-md), NavigatorMessage body (opinion-md), TopBar centered title (opinion-md), SectionHeader caps variant (label-sm) | swift-implementer | 240 min |
| FID-S01-T02 | iOS map slot replacement — replace LinearGradient placeholders in IdleScreen / PlanningScreen / ErrorScreen with real LSMap (or paper substrate + contour SVGs) + favorite pin overlays | swift-implementer | 360 min |
| FID-S01-T03 | iOS LSRouteCard geometry fix — `LSCard(padding: .zero)`, remove inner `clipShape`, switch to `aspectRatio(9/4)`, re-apply padding inside `routeInfo` | swift-implementer | 90 min |
| FID-S01-T04 | iOS LSRouteSheet bottom-sheet shell — wrap in `LSBottomSheet(detent: .large, onDismiss:)`, add 5-dot scenic strip, fix via subtitle to `body.sm`, fix Save/Ride 1:2 button proportion | swift-implementer | 240 min |
| FID-S01-T05 | iOS Sessions drawer container fix (glass→solid `surface.card` + `--elev-overlay` shadow + border-right separator) + iOS token corrections (active stripe `strokeWidth.lg`, active row `signal.whisper`, hamburger 44pt hit target, drawer shadow tier) | swift-implementer | 240 min |
| FID-S01-T06 | Android Sessions drawer container fix (glass→solid) + Android token corrections (active stripe `stroke.lg`, active row `signal.whisper`, hamburger 48dp hit target, drawer shadow `2px 0 16px`) | kotlin-implementer | 240 min |
| FID-S01-T07 | Android critical build blockers — declare `Session` data class in LSSessionsDrawer.kt; decode `state.route.polyline` via `PolylineDecoder.decodeOrNull()` in RouteDetailsScreen.kt | kotlin-implementer | 60 min |
| FID-S01-T08 | Android remaining HIGH-severity token corrections — pinned indicator dot full-opacity `signal.default`, LSRouteCard heart `IconColor.Signal`, LSRouteCard map `aspectRatio(9f/4f)`, LSRouteSheet `timeRange: Pair<String, String>` prop, LSSectionHeader baseline alignment | kotlin-implementer | 180 min |
| FID-S01-T09 | Sprint 01 verification — capture screenshots of every modified component on both platforms; visually compare against `.spec/design/system/` HTML/PNG; record findings in sprint summary | qa-engineer | 60 min |

## Dependencies

- Blocks: Sprint 02
- Dependent on: None

## PRD Coverage

- UC-FID-01 (HIGH-severity AC subset — ~36 ACs)
- `remediations/00-summary.md` themes 1-3, 9 (typography, map slot, glass-panel container, build blockers)

## Human Signals

- HUMAN SIGNAL #1: "all the full views in sandbox mode are distorted, because they are not real implementations. Just doing the real feature in the app will fix it."
- HUMAN SIGNAL #4: "if cross platform testing is too burdensome then we might cut android"

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-04-27

- [FID-S01-T01-ios-newsreader-typography-rollout.md](./FID-S01-T01-ios-newsreader-typography-rollout.md)
- [FID-S01-T02-ios-map-slot-replacement.md](./FID-S01-T02-ios-map-slot-replacement.md)
- [FID-S01-T03-ios-route-card-geometry-fix.md](./FID-S01-T03-ios-route-card-geometry-fix.md)
- [FID-S01-T04-ios-route-sheet-bottom-sheet-shell.md](./FID-S01-T04-ios-route-sheet-bottom-sheet-shell.md)
- [FID-S01-T05-ios-sessions-drawer-container-fix.md](./FID-S01-T05-ios-sessions-drawer-container-fix.md)
- [FID-S01-T06-android-sessions-drawer-container-fix.md](./FID-S01-T06-android-sessions-drawer-container-fix.md)
- [FID-S01-T07-android-build-blockers.md](./FID-S01-T07-android-build-blockers.md)
- [FID-S01-T08-android-token-corrections.md](./FID-S01-T08-android-token-corrections.md)
- [FID-S01-T09-sprint-verification.md](./FID-S01-T09-sprint-verification.md)
